# 데이터베이스 마이그레이션 가이드

## Supabase에서 SQL 실행하기

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. 아래 SQL 복사 후 붙여넣기
6. **Run** 버튼 클릭

```sql
-- Add status, timing fields to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished')),
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration INTEGER; -- in seconds

-- Update existing records to have pending status
UPDATE matches
SET status = 'pending'
WHERE status IS NULL;

-- Add comment
COMMENT ON COLUMN matches.status IS 'Match status: pending, in_progress, or finished';
COMMENT ON COLUMN matches.start_time IS 'When the match started';
COMMENT ON COLUMN matches.end_time IS 'When the match ended';
COMMENT ON COLUMN matches.duration IS 'Match duration in seconds';
```

## 확인

실행 후 다음과 같이 확인:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'matches'
AND column_name IN ('status', 'start_time', 'end_time', 'duration');
```

4개의 새 컬럼이 보이면 성공입니다!
