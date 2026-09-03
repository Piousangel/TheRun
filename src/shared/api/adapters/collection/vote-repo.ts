import type { Collection } from '@/shared/api/adapters/collection/collection';
import { newId } from '@/shared/api/adapters/collection/member-repo';
import type { VoteRepo, VoteResponseWithMember } from '@/shared/api/ports/vote-repo';
import type { Member } from '@/shared/types/member';
import type { VoteResponse, VoteSession } from '@/shared/types/vote';

interface Deps {
  sessions: Collection<VoteSession>;
  responses: Collection<VoteResponse>;
  members: Collection<Member>;
  now: () => Date;
}

export function createCollectionVoteRepo({ sessions, responses, members, now }: Deps): VoteRepo {
  return {
    async listSessions() {
      return (await sessions.all()).sort((a, b) => b.event_date.localeCompare(a.event_date));
    },
    async listActiveSessions() {
      return (await sessions.all())
        .filter((s) => s.is_active)
        .sort((a, b) => a.event_date.localeCompare(b.event_date));
    },
    getSession(id) {
      return sessions.get(id);
    },
    async createSession(data) {
      const at = now().toISOString();
      return sessions.insert({
        id: newId(),
        title: data.title,
        description: data.description ?? null,
        type: data.type,
        event_date: data.event_date,
        deadline: data.deadline,
        is_active: true,
        created_at: at,
        updated_at: at,
      });
    },
    updateSession(id, data) {
      return sessions.update(id, { ...data, updated_at: now().toISOString() });
    },
    async removeSession(id) {
      await sessions.remove(id);
      const rest = (await responses.all()).filter((r) => r.session_id !== id);
      await responses.replaceAll(rest);
    },
    async listResponses(sessionId) {
      const [rows, memberRows] = await Promise.all([responses.all(), members.all()]);
      const byId = new Map(memberRows.map((m) => [m.id, m]));
      return rows
        .filter((r) => r.session_id === sessionId)
        .map<VoteResponseWithMember>((r) => ({ ...r, members: byId.get(r.member_id) ?? null }));
    },
    async respond({ sessionId, memberId, status }) {
      const at = now().toISOString();
      const existing = (await responses.all()).find((r) => r.session_id === sessionId && r.member_id === memberId);
      if (existing) {
        return responses.update(existing.id, { status, updated_at: at });
      }
      return responses.insert({ id: newId(), session_id: sessionId, member_id: memberId, status, created_at: at, updated_at: at });
    },
  };
}
