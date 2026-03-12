# The Run - 풋살 클럽 관리 시스템

The Run 축구 동호회를 위한 모바일 중심 웹 애플리케이션

## 🏆 주요 기능

### ✅ 구현 완료
- **회원 관리**: 멤버 등록, 수정, 삭제 및 6각형 스탯 차트
- **출석 투표**: 주간 경기 참석/불참 투표 (금요일 자정 마감)
- **경기 기록**: 경기 결과 및 팀 점수 기록
- **팀 나누기**: 자동 밸런싱 알고리즘으로 공정한 팀 구성
- **모바일 네비게이션**: 터치 최적화된 하단 네비게이션 바

### 🚧 추후 추가 예정
- 전술 대시보드 (드래그 앤 드롭 포지션 배치)
- 경기 상세 기록 (개인 골/어시스트/MVP)
- 수동 팀 나누기 (드래그 앤 드롭)

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui (화이트/블랙/골드 테마)
- **State**: TanStack Query, Zustand
- **Forms**: React Hook Form + Zod
- **Database**: Supabase (PostgreSQL + Storage)
- **Charts**: Recharts
- **Architecture**: FSD (Feature-Sliced Design)

## 📁 프로젝트 구조 (FSD)

```
src/
├── app/              # Next.js App Router
├── shared/           # 공유 레이어 (UI, API, types, utils)
├── entities/         # 엔티티 레이어 (member, match, attendance)
├── features/         # 기능 레이어 (create, edit, delete, vote)
├── widgets/          # 위젯 레이어 (복합 컴포넌트)
└── providers/        # 글로벌 프로바이더
```

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. Supabase 설정
1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 아래 스크립트 실행:

```sql
-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  profile_photo TEXT,
  stats JSONB NOT NULL DEFAULT '{
    "speed": 50, "shooting": 50, "passing": 50,
    "dribbling": 50, "stamina": 50, "defense": 50
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for members" ON members FOR ALL USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true);

CREATE POLICY "Public Access"
  ON storage.objects FOR ALL
  USING (bucket_id = 'member-photos');

-- Attendance tables
CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_date TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('attending', 'absent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, member_id)
);

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for attendance_sessions" ON attendance_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for attendance_votes" ON attendance_votes FOR ALL USING (true);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMPTZ NOT NULL,
  location VARCHAR(200) NOT NULL,
  team_a JSONB NOT NULL,
  team_b JSONB NOT NULL,
  notes TEXT,
  vote_session_id UUID REFERENCES vote_sessions(id) ON DELETE SET NULL,
  match_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for matches" ON matches FOR ALL USING (true);

-- Create indexes for matches
CREATE INDEX idx_matches_vote_session_id ON matches(vote_session_id);
CREATE INDEX idx_matches_vote_session_match_number ON matches(vote_session_id, match_number);
```

### 3. 환경 변수 설정
`.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3-1. 인증/권한 전환 적용

실사용 모드로 전환하려면 아래 마이그레이션도 함께 적용하세요.

- `supabase/migrations/20260311_add_app_profiles.sql`
- `supabase/migrations/20260311_harden_rls.sql`

적용 후 첫 관리자 계정은 Supabase SQL Editor에서 직접 지정합니다.

```sql
update public.app_profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```

권장 순서:

1. 앱에서 관리자 이메일로 한 번 로그인
2. `app_profiles` row 생성 확인
3. 위 SQL로 `admin` 승격
4. 이후부터 멤버/투표/경기 운영 기능 사용

### 4. 개발 서버 실행
```bash
npm run dev
```

http://localhost:3000 에서 확인

## 📱 모바일 최적화

- 모바일 우선 반응형 디자인
- 터치 최적화 (최소 44x44px 터치 영역)
- 하단 네비게이션 바 (모바일)
- 반응형 그리드 레이아웃

## 🎨 디자인 시스템

### 브랜드 컬러
- **Primary**: Gold (#FFD700) - 팀 컬러
- **Secondary**: Black/Near Black - 강조 요소
- **Background**: White - 깔끔한 배경

### 컴포넌트
- shadcn/ui 기반 커스터마이징
- 모던하고 깔끔한 UI
- 일관된 간격 및 타이포그래피

## 🔒 코드 컨벤션

✅ **필수**:
- 컴포넌트가 직접 hook 호출
- 컴포넌트 내부에서 handler 선언

❌ **금지**:
- handler를 props로 전달
- 데이터 재가공 후 손자에게 전달

## 📦 배포

### Vercel 배포
```bash
# GitHub 연동 후 자동 배포
# 또는 수동 배포:
vercel
```

## 📝 라이선스

Private - The Run 풋살 클럽 전용

## 👥 기여자

- 초기 개발: Claude Sonnet 4.5

---

Made with ⚽ for The Run Futsal Club
