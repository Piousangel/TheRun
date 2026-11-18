# 마이그레이션 로컬 검증(psql)
Supabase 대신 로컬 Postgres 16에 `supabase-stub.sql`(auth 스키마·역할 스텁)을 올리고, 마이그레이션을 `psql -1`로 순서대로 적용한 뒤 `*.check.sql`을 실행한다.
출력의 `(0 기대)` 같은 표기와 ERROR 줄(예상된 거부)을 눈으로 대조한다. CI에는 넣지 않았다(Postgres 서비스 필요) — 다음 정책 마이그레이션부터 자동화 검토.
