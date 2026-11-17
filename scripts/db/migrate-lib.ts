// 마이그레이션 적용 워크플로의 순수 로직(OPERATING.md 5장 가드).
// 자동 적용 대상은 14자리 타임스탬프 파일(YYYYMMDDHHMMSS_name.sql)뿐이다.
// 기존 8자리 날짜 파일과 complete_schema.sql은 낡은 스키마라 자동 적용하지 않는다.

export const AUTO_APPLY_PATTERN = /^\d{14}_[a-z0-9_]+\.sql$/;

export function selectPending(files: string[], applied: Iterable<string>): string[] {
  const done = new Set(applied);
  return files
    .filter((f) => AUTO_APPLY_PATTERN.test(f) && !done.has(f))
    .sort();
}

/** 주석과 문자열 리터럴을 지운 SQL. 가드가 주석 속 단어에 속지 않게 한다. */
export function stripSql(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/'(?:[^']|'')*'/g, "''");
}

/** 5장 금지 항목을 찾는다. 비어 있으면 통과. */
export function findForbidden(sql: string): string[] {
  const found: string[] = [];
  const stripped = stripSql(sql);
  if (/\bdrop\s+table\b/i.test(stripped)) found.push('DROP TABLE');
  if (/\balter\s+table\b[^;]*\bdrop\s+column\b/i.test(stripped)) found.push('DROP COLUMN');
  if (/\btruncate\b/i.test(stripped)) found.push('TRUNCATE');
  for (const stmt of stripped.split(';')) {
    const s = stmt.trim();
    // 함수·트리거 본문 안의 문장은 CREATE 문 한 덩어리로 보고 건너뛴다(본문은 $$ 로 감싸 한 문장이 아님)
    if (/^(update|delete\s+from)\b/i.test(s) && !/\bwhere\b/i.test(s)) {
      found.push(/^update/i.test(s) ? '조건 없는 UPDATE' : '조건 없는 DELETE');
    }
    if (/\bset\s+role\b|\balter\s+role\b|\bupdate\s+\S*app_profiles\b[^;]*\bset\s+role\b/i.test(s)) {
      found.push('역할(role) 변경');
    }
  }
  return [...new Set(found)];
}
