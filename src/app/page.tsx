import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Users, Calendar, Trophy, ClipboardList } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold">
            <span className="text-primary">The Run</span> 풋살 클럽
          </h1>
          <p className="text-lg text-muted-foreground">
            우리 동호회를 위한 통합 관리 시스템
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/members">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>멤버 관리</CardTitle>
                <CardDescription>팀 멤버 등록 및 관리</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/attendance">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>출석 투표</CardTitle>
                <CardDescription>주간 경기 출석 확인</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/matches">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Trophy className="h-10 w-10 text-primary mb-2" />
                <CardTitle>경기 기록</CardTitle>
                <CardDescription>경기 결과 및 개인 기록</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full opacity-50">
            <CardHeader>
              <ClipboardList className="h-10 w-10 text-primary mb-2" />
              <CardTitle>전술 보드</CardTitle>
              <CardDescription>팀 구성 및 포지션 설정</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supabase 데이터베이스 설정</CardTitle>
            <CardDescription>
              아래 SQL을 Supabase의 SQL Editor에서 실행해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-secondary p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  profile_photo TEXT,
  stats JSONB NOT NULL DEFAULT '{
    "speed": 50,
    "shooting": 50,
    "passing": 50,
    "dribbling": 50,
    "stamina": 50,
    "defense": 50
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth)
CREATE POLICY "Allow all for members"
  ON members FOR ALL USING (true);

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true);

-- Allow public access to storage
CREATE POLICY "Public Access"
ON storage.objects FOR ALL
USING (bucket_id = 'member-photos');

-- Attendance sessions table
CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_date TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance votes table
CREATE TABLE attendance_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('attending', 'absent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, member_id)
);

-- Enable RLS
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_votes ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all for attendance_sessions"
  ON attendance_sessions FOR ALL USING (true);

CREATE POLICY "Allow all for attendance_votes"
  ON attendance_votes FOR ALL USING (true);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMPTZ NOT NULL,
  location VARCHAR(200) NOT NULL,
  team_a JSONB NOT NULL,
  team_b JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all for matches"
  ON matches FOR ALL USING (true);`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
