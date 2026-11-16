import type { Collection } from '@/shared/api/adapters/collection/collection';
import type { AuditRepo } from '@/shared/api/ports/audit-repo';
import { newId } from '@/shared/lib/id';
import type { AuditLog } from '@/shared/types/checkin';

export function createCollectionAuditRepo(logs: Collection<AuditLog>, now: () => Date): AuditRepo {
  return {
    record: (input) =>
      logs.insert({
        id: newId(),
        entity: input.entity,
        entity_id: input.entity_id,
        action: input.action,
        before: input.before ?? null,
        after: input.after ?? null,
        actor_id: input.actor_id,
        at: now().toISOString(),
      }),
    async listFor(entity, entityId) {
      return (await logs.all())
        .filter((l) => l.entity === entity && l.entity_id === entityId)
        .sort((a, b) => b.at.localeCompare(a.at));
    },
  };
}
