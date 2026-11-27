import type { Collection } from '@/shared/api/adapters/collection/collection';
import type { AuditRepo } from '@/shared/api/ports/audit-repo';
import type { ChatRepo } from '@/shared/api/ports/chat-repo';
import type { LeagueRepo } from '@/shared/api/ports/league-repo';
import { newId } from '@/shared/lib/id';
import { CHAT_MESSAGE_MAX, CLUB_CHANNEL_ID, type ChatChannel, type ChatMessage, type ChatRead, type ChatViewer } from '@/shared/types/chat';

interface Deps {
  messages: Collection<ChatMessage>;
  reads: Collection<ChatRead>;
  league: Pick<LeagueRepo, 'listSeasons' | 'listTeams' | 'getDraft'>;
  audit: AuditRepo;
  now: () => Date;
}

const CLUB_CHANNEL: ChatChannel = { id: CLUB_CHANNEL_ID, kind: 'club', name: '더런 전체', subtitle: null, team_id: null, color: null };
const DEFAULT_LIMIT = 30;

/** 시간순. 같은 밀리초는 저장 순서를 지킨다(Array.prototype.sort는 안정 정렬). */
const byTime = (a: ChatMessage, b: ChatMessage) => a.created_at.localeCompare(b.created_at);

export function createCollectionChatRepo({ messages, reads, league, audit, now }: Deps): ChatRepo {
  /** 진행 중·준비 중 시즌의 팀 채널 중 viewer가 볼 수 있는 것 */
  const teamChannels = async (viewer: ChatViewer): Promise<ChatChannel[]> => {
    const seasons = (await league.listSeasons()).filter((s) => s.status !== 'done');
    const channels: ChatChannel[] = [];
    for (const season of seasons) {
      const [teams, draft] = await Promise.all([league.listTeams(season.id), league.getDraft(season.id)]);
      for (const team of teams) {
        const isMember =
          team.captain_member_id === viewer.member_id ||
          (draft?.picks ?? []).some((p) => p.team_id === team.id && p.member_id === viewer.member_id);
        if (!isMember && !viewer.is_admin) continue;
        channels.push({ id: `team:${team.id}`, kind: 'team', name: team.name, subtitle: season.name, team_id: team.id, color: team.color });
      }
    }
    return channels;
  };

  const visibleChannels = async (viewer: ChatViewer) => [CLUB_CHANNEL, ...(await teamChannels(viewer))];

  const assertAccess = async (viewer: ChatViewer, channelId: string) => {
    if (channelId === CLUB_CHANNEL_ID) return;
    if (!(await teamChannels(viewer)).some((c) => c.id === channelId)) {
      throw new Error('이 채널은 팀원만 볼 수 있어요.');
    }
  };

  const inChannel = async (channelId: string) => (await messages.all()).filter((m) => m.channel_id === channelId).sort(byTime);

  return {
    async listChannels(viewer) {
      const channels = await visibleChannels(viewer);
      const all = await messages.all();
      const myReads = (await reads.all()).filter((r) => r.member_id === viewer.member_id);
      return channels.map((channel) => {
        const list = all.filter((m) => m.channel_id === channel.id).sort(byTime);
        const lastRead = myReads.find((r) => r.channel_id === channel.id)?.last_read_at ?? '';
        const unread = list.filter((m) => !m.deleted_at && m.author_member_id !== viewer.member_id && m.created_at > lastRead).length;
        return { channel, unread, last_message: list.at(-1) ?? null };
      });
    },

    async listMessages(viewer, channelId, opts = {}) {
      await assertAccess(viewer, channelId);
      const limit = opts.limit ?? DEFAULT_LIMIT;
      const list = await inChannel(channelId);
      const end = opts.before ? list.findIndex((m) => m.id === opts.before) : list.length;
      const upto = end < 0 ? list.length : end;
      const start = Math.max(0, upto - limit);
      return { messages: list.slice(start, upto), has_more: start > 0 };
    },

    async sendMessage(viewer, { channel_id, body, client_msg_id, reply_to_id = null }) {
      await assertAccess(viewer, channel_id);
      const existing = (await messages.all()).find((m) => m.client_msg_id === client_msg_id && m.author_member_id === viewer.member_id);
      if (existing) return existing;
      const text = body.trim();
      if (!text) throw new Error('메시지를 입력해 주세요.');
      if (text.length > CHAT_MESSAGE_MAX) throw new Error(`메시지는 ${CHAT_MESSAGE_MAX}자까지 보낼 수 있어요.`);
      if (reply_to_id) {
        const target = await messages.get(reply_to_id);
        if (!target || target.channel_id !== channel_id) throw new Error('답장할 메시지를 찾지 못했어요.');
      }
      const at = now().toISOString();
      const row = await messages.insert({
        id: newId(),
        channel_id,
        author_member_id: viewer.member_id,
        body: text,
        client_msg_id,
        reply_to_id,
        created_at: at,
        deleted_at: null,
        deleted_by: null,
      });
      // 내가 보낸 메시지까지는 읽은 것이다
      await upsertRead(viewer.member_id, channel_id, at);
      return row;
    },

    async deleteMessage(viewer, messageId) {
      const target = await messages.get(messageId);
      if (!target) throw new Error('메시지를 찾지 못했어요.');
      if (target.author_member_id !== viewer.member_id && !viewer.is_admin) throw new Error('내 메시지나 운영진만 지울 수 있어요.');
      if (target.deleted_at) return target;
      const next = await messages.update(messageId, { body: '', deleted_at: now().toISOString(), deleted_by: viewer.member_id });
      await audit.record({ entity: 'chat_message', entity_id: messageId, action: 'delete', before: target, after: next, actor_id: viewer.member_id });
      return next;
    },

    async markRead(viewer, channelId) {
      await assertAccess(viewer, channelId);
      await upsertRead(viewer.member_id, channelId, now().toISOString());
    },
  };

  async function upsertRead(memberId: string, channelId: string, at: string) {
    const id = `${channelId}:${memberId}`;
    const existing = await reads.get(id);
    if (!existing) await reads.insert({ id, channel_id: channelId, member_id: memberId, last_read_at: at });
    else if (existing.last_read_at < at) await reads.update(id, { last_read_at: at });
  }
}
