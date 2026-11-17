import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { findForbidden, selectPending } from './migrate-lib';

// 사용법: tsx scripts/db/migrate.ts [--dry-run]
// 시크릿은 환경변수 SUPABASE_DB_URL로만 받는다. 출력에 값을 찍지 않는다.
const dryRun = process.argv.includes('--dry-run');
const dir = path.resolve(process.cwd(), 'supabase/migrations');
const url = process.env.SUPABASE_DB_URL;

function psql(args: string[], capture = false) {
  const r = spawnSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-q', ...args], {
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    env: { ...process.env, PGCONNECT_TIMEOUT: '15' },
  });
  if (r.status !== 0) {
    console.error('psql 실패 — 적용을 중단한다.');
    process.exit(r.status ?? 1);
  }
  return r.stdout ?? '';
}

const files = readdirSync(dir).filter((f) => f.endsWith('.sql'));

if (dryRun || !url) {
  if (!url && !dryRun) {
    console.error('SUPABASE_DB_URL이 없다. --dry-run으로만 실행할 수 있다.');
    process.exit(1);
  }
  const pending = selectPending(files, []);
  let bad = 0;
  for (const f of pending) {
    const hits = findForbidden(readFileSync(path.join(dir, f), 'utf8'));
    if (hits.length) {
      bad++;
      console.error(`금지 구문 ${f}: ${hits.join(', ')}`);
    }
  }
  console.log(`dry-run: 대상 ${pending.length}개, 금지 위반 ${bad}개`);
  process.exit(bad ? 1 : 0);
}

psql([
  url,
  '-c',
  'create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now()); alter table public.schema_migrations enable row level security;',
]);
const applied = psql([url, '-At', '-c', 'select name from public.schema_migrations'], true)
  .split('\n')
  .filter(Boolean);
const pending = selectPending(files, applied);

// 금지 구문은 하나라도 있으면 아무것도 적용하지 않는다(사람 확인 대상).
for (const f of pending) {
  const hits = findForbidden(readFileSync(path.join(dir, f), 'utf8'));
  if (hits.length) {
    console.error(`금지 구문 ${f}: ${hits.join(', ')} — 적용 중단, 사람 확인 필요(OPERATING.md 5장)`);
    process.exit(2);
  }
}

for (const f of pending) {
  console.log(`적용: ${f}`);
  // 한 파일 = 한 트랜잭션(-1). 적용 기록도 같은 트랜잭션에 넣는다.
  const file = path.join(dir, f);
  const wrapper = `${readFileSync(file, 'utf8')}\n;\ninsert into public.schema_migrations(name) values ('${f}');\n`;
  const r = spawnSync('psql', ['-X', '-1', '-v', 'ON_ERROR_STOP=1', '-q', url], {
    input: wrapper,
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (r.status !== 0) {
    console.error(`실패: ${f} — 롤백됨, 이후 파일은 적용하지 않는다.`);
    process.exit(r.status ?? 1);
  }
}
console.log(`완료: ${pending.length}개 적용`);
