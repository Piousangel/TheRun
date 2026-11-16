import type { Collection } from '@/shared/api/adapters/collection/collection';
import type { AuditRepo } from '@/shared/api/ports/audit-repo';
import type { CheckinRepo } from '@/shared/api/ports/checkin-repo';
import { classifyCheckin, isCheckinWindowOpen } from '@/shared/lib/checkin-time';
import { newId } from '@/shared/lib/id';
import type { Checkin } from '@/shared/types/checkin';

interface Deps {
  checkins: Collection<Checkin>;
  audit: AuditRepo;
  now: () => Date;
}

export function createCollectionCheckinRepo({ checkins, audit, now }: Deps): CheckinRepo {
  const find = async (date: string, memberId: string) =>
    (await checkins.all()).find((c) => c.date === date && c.member_id === memberId) ?? null;

  return {
    async listByDate(date) {
      return (await checkins.all())
        .filter((c) => c.date === date)
        .sort((a, b) => (a.checked_in_at ?? '￿').localeCompare(b.checked_in_at ?? '￿'));
    },
    async listByMember(memberId) {
      return (await checkins.all()).filter((c) => c.member_id === memberId).sort((a, b) => b.date.localeCompare(a.date));
    },
    async checkIn({ date, member_id }) {
      const existing = await find(date, member_id);
      if (existing) return existing;
      const at = now();
      if (!isCheckinWindowOpen(date, at)) {
        throw new Error('체크인은 경기일 05:30~08:00에만 할 수 있습니다.');
      }
      const row = await checkins.insert({
        id: newId(),
        date,
        member_id,
        status: classifyCheckin(at),
        checked_in_at: at.toISOString(),
        confirmed_by: null,
        updated_at: at.toISOString(),
      });
      await audit.record({ entity: 'checkin', entity_id: row.id, action: 'create', after: row, actor_id: member_id });
      return row;
    },
    async confirm({ date, member_id, status, actor_id }) {
      const existing = await find(date, member_id);
      const at = now().toISOString();
      if (existing) {
        const next = await checkins.update(existing.id, { status, confirmed_by: actor_id, updated_at: at });
        await audit.record({ entity: 'checkin', entity_id: next.id, action: 'update', before: existing, after: next, actor_id });
        return next;
      }
      const row = await checkins.insert({
        id: newId(), date, member_id, status, checked_in_at: null, confirmed_by: actor_id, updated_at: at,
      });
      await audit.record({ entity: 'checkin', entity_id: row.id, action: 'create', after: row, actor_id });
      return row;
    },
  };
}
