import { createCollectionAuditRepo } from '@/shared/api/adapters/collection/audit-repo';
import { createCollectionCheckinRepo } from '@/shared/api/adapters/collection/checkin-repo';
import { Collection } from '@/shared/api/adapters/collection/collection';
import { MemoryStorage } from '@/shared/api/adapters/collection/memory-storage';
import { runCheckinRepoContract } from '@/shared/api/adapters/contracts/checkin-repo.contract';

runCheckinRepoContract(async () => {
  const storage = new MemoryStorage();
  let current = new Date('2026-11-21T06:00:00+09:00');
  let tick = 0;
  // 같은 시각에 쌓인 감사 로그도 순서가 안정적이도록 호출마다 1ms씩 흐른다
  const now = () => new Date(current.getTime() + tick++);
  const audit = createCollectionAuditRepo(new Collection(storage, 'audit_logs', () => []), now);
  const repo = createCollectionCheckinRepo({ checkins: new Collection(storage, 'checkins', () => []), audit, now });
  return { repo, audit, setNow: (kstIso: string) => { current = new Date(`${kstIso}:00+09:00`); tick = 0; } };
});
