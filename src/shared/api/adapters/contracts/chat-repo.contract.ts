import type { AuditRepo } from '@/shared/api/ports/audit-repo';
import type { ChatRepo } from '@/shared/api/ports/chat-repo';
import type { LeagueRepo } from '@/shared/api/ports/league-repo';
import { CLUB_CHANNEL_ID, type ChatViewer } from '@/shared/types/chat';

/** 채팅 v1 계약(스펙 §4): 클럽 채널 + 팀원만 보는 팀 채널, 멱등 전송, 이전 메시지 페이지, 안 읽음 수, 지우기 권한. */
export function runChatRepoContract(makeRepo: () => Promise<{ repo: ChatRepo; league: LeagueRepo; audit: AuditRepo }>) {
  const me: ChatViewer = { member_id: 'm1', is_admin: false };
  const other: ChatViewer = { member_id: 'm2', is_admin: false };
  const admin: ChatViewer = { member_id: 'm9', is_admin: true };
  let seq = 0;
  const send = (repo: ChatRepo, viewer: ChatViewer, body: string, channel_id = CLUB_CHANNEL_ID) =>
    repo.sendMessage(viewer, { channel_id, body, client_msg_id: `c-${seq++}` });

  /** 팀 2개 시즌: 팀1 팀장 m1, 팀2 팀장 m3. 드래프트로 m2를 팀2가 뽑는다(1라운드 순서 팀1 → 팀2). */
  async function seasonWithTeams(league: LeagueRepo) {
    const season = await league.createSeason({ name: '2026 하반기', starts_on: '2026-12-05', ends_on: '2026-12-26' });
    const t1 = await league.createTeam({ season_id: season.id, name: '레드', color: '#dc2626', captain_member_id: 'm1' });
    const t2 = await league.createTeam({ season_id: season.id, name: '블루', color: '#2563eb', captain_member_id: 'm3' });
    await league.startDraft({ season_id: season.id, order: [t1.id, t2.id] });
    await league.makeDraftPick({ season_id: season.id, team_id: t1.id, member_id: 'm4' });
    await league.makeDraftPick({ season_id: season.id, team_id: t2.id, member_id: 'm2' });
    return { season, t1, t2 };
  }

  describe('ChatRepo contract', () => {
    it('클럽 채널은 누구나 보고, 팀 채널은 팀장·드래프트 팀원과 운영진만 본다', async () => {
      const { repo, league } = await makeRepo();
      expect((await repo.listChannels(me)).map((c) => c.channel.id)).toEqual([CLUB_CHANNEL_ID]);

      const { t1, t2 } = await seasonWithTeams(league);
      expect((await repo.listChannels(me)).map((c) => c.channel.id)).toEqual([CLUB_CHANNEL_ID, `team:${t1.id}`]);
      expect((await repo.listChannels(other)).map((c) => c.channel.id)).toEqual([CLUB_CHANNEL_ID, `team:${t2.id}`]);
      expect((await repo.listChannels(admin)).map((c) => c.channel.id)).toEqual([CLUB_CHANNEL_ID, `team:${t1.id}`, `team:${t2.id}`]);
      expect((await repo.listChannels(me))[1].channel).toMatchObject({ kind: 'team', name: '레드', subtitle: '2026 하반기', color: '#dc2626' });

      // 남의 팀 채널은 읽기·쓰기 모두 거부
      await expect(repo.listMessages(me, `team:${t2.id}`)).rejects.toThrow();
      await expect(send(repo, me, '몰래', `team:${t2.id}`)).rejects.toThrow();
      await send(repo, other, '블루 화이팅', `team:${t2.id}`);
      expect((await repo.listMessages(admin, `team:${t2.id}`)).messages.map((m) => m.body)).toEqual(['블루 화이팅']);
    });

    it('끝난 시즌의 팀 채널은 목록에서 빠진다', async () => {
      const { repo, league } = await makeRepo();
      const { season } = await seasonWithTeams(league);
      await league.updateSeason(season.id, { status: 'done' });
      expect((await repo.listChannels(me)).map((c) => c.channel.id)).toEqual([CLUB_CHANNEL_ID]);
    });

    it('같은 client_msg_id로 다시 보내면 새로 만들지 않는다. 빈 글·1000자 초과는 거부', async () => {
      const { repo } = await makeRepo();
      const input = { channel_id: CLUB_CHANNEL_ID, body: '  내일 6시 봬요  ', client_msg_id: 'same' };
      const first = await repo.sendMessage(me, input);
      const again = await repo.sendMessage(me, input);
      expect(again.id).toBe(first.id);
      expect(first.body).toBe('내일 6시 봬요');
      await expect(repo.sendMessage(me, { ...input, client_msg_id: 'empty', body: '   ' })).rejects.toThrow();
      await expect(repo.sendMessage(me, { ...input, client_msg_id: 'long', body: 'a'.repeat(1001) })).rejects.toThrow();
      expect((await repo.listMessages(me, CLUB_CHANNEL_ID)).messages).toHaveLength(1);
    });

    it('최신 limit개를 시간순으로, before로 그 이전 페이지를 준다', async () => {
      const { repo } = await makeRepo();
      for (let i = 1; i <= 5; i += 1) await send(repo, me, `#${i}`);
      const page1 = await repo.listMessages(me, CLUB_CHANNEL_ID, { limit: 2 });
      expect(page1.messages.map((m) => m.body)).toEqual(['#4', '#5']);
      expect(page1.has_more).toBe(true);
      const page2 = await repo.listMessages(me, CLUB_CHANNEL_ID, { limit: 2, before: page1.messages[0].id });
      expect(page2.messages.map((m) => m.body)).toEqual(['#2', '#3']);
      const page3 = await repo.listMessages(me, CLUB_CHANNEL_ID, { limit: 2, before: page2.messages[0].id });
      expect(page3).toEqual({ messages: [expect.objectContaining({ body: '#1' })], has_more: false });
    });

    it('안 읽음 수는 다른 사람이 내 마지막 읽음 뒤에 쓴 것만 센다', async () => {
      const { repo } = await makeRepo();
      await send(repo, other, '하나');
      await send(repo, other, '둘');
      await send(repo, me, '내 글');
      // 내가 보내면 그 시점까지 읽은 것으로 본다
      expect((await repo.listChannels(me))[0].unread).toBe(0);
      await send(repo, other, '셋');
      const [club] = await repo.listChannels(me);
      expect(club.unread).toBe(1);
      expect(club.last_message?.body).toBe('셋');
      await repo.markRead(me, CLUB_CHANNEL_ID);
      expect((await repo.listChannels(me))[0].unread).toBe(0);
      // 한 번도 읽지 않은 사람은 남이 쓴 것 전부
      expect((await repo.listChannels({ member_id: 'm5', is_admin: false }))[0].unread).toBe(4);
    });

    it('답장은 같은 채널 메시지에만 걸 수 있다', async () => {
      const { repo } = await makeRepo();
      const q = await send(repo, other, '공 누가 챙겨요?');
      const a = await repo.sendMessage(me, { channel_id: CLUB_CHANNEL_ID, body: '제가요', client_msg_id: 'r1', reply_to_id: q.id });
      expect(a.reply_to_id).toBe(q.id);
      await expect(repo.sendMessage(me, { channel_id: CLUB_CHANNEL_ID, body: 'x', client_msg_id: 'r2', reply_to_id: 'nope' })).rejects.toThrow();
    });

    it('지우기는 작성자나 운영진만, 본문을 비우고 감사 로그를 남긴다. 지운 글은 안 읽음에서 빠진다', async () => {
      const { repo, audit } = await makeRepo();
      const msg = await send(repo, other, '실수로 보낸 글');
      expect((await repo.listChannels(me))[0].unread).toBe(1);
      await expect(repo.deleteMessage(me, msg.id)).rejects.toThrow();
      const deleted = await repo.deleteMessage(admin, msg.id);
      expect(deleted).toMatchObject({ body: '', deleted_by: 'm9' });
      expect(deleted.deleted_at).not.toBeNull();
      expect((await repo.listChannels(me))[0].unread).toBe(0);
      expect((await audit.listFor('chat_message', msg.id))[0]).toMatchObject({ action: 'delete', actor_id: 'm9', before: { body: '실수로 보낸 글' } });
      const own = await send(repo, me, '내 글');
      expect((await repo.deleteMessage(me, own.id)).body).toBe('');
    });
  });
}
