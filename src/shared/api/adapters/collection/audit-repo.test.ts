import { createCollectionAuditRepo } from '@/shared/api/adapters/collection/audit-repo';
import { Collection } from '@/shared/api/adapters/collection/collection';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { runAuditRepoContract } from '@/shared/api/adapters/contracts/audit-repo.contract';

runAuditRepoContract(async () => {
  let tick = 0;
  const now = () => new Date(Date.UTC(2026, 10, 16, 0, 0, tick++));
  return { repo: createCollectionAuditRepo(new Collection(new MemoryStorage(), 'audit_logs', () => []), now) };
});
