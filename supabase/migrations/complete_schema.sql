-- ============================================
-- The Run - Complete Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Members Table
-- ============================================
CREATE TABLE IF NOT EXISTS members (
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

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Allow all for members" ON members;
CREATE POLICY "Allow all for members"
  ON members FOR ALL USING (true);

-- ============================================
-- Storage Bucket for Profile Photos
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR ALL
  USING (bucket_id = 'member-photos');

-- ============================================
-- Attendance Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_date TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for attendance_sessions" ON attendance_sessions;
CREATE POLICY "Allow all for attendance_sessions"
  ON attendance_sessions FOR ALL USING (true);

-- ============================================
-- Attendance Votes Table
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('attending', 'absent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, member_id)
);

-- Enable RLS
ALTER TABLE attendance_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for attendance_votes" ON attendance_votes;
CREATE POLICY "Allow all for attendance_votes"
  ON attendance_votes FOR ALL USING (true);

-- ============================================
-- Vote Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS vote_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('match', 'dining', 'outing', 'other')),
  event_date TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vote_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for vote_sessions" ON vote_sessions;
CREATE POLICY "Allow all for vote_sessions"
  ON vote_sessions FOR ALL USING (true);

-- ============================================
-- Vote Responses Table
-- ============================================
CREATE TABLE IF NOT EXISTS vote_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES vote_sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('attending', 'absent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, member_id)
);

-- Enable RLS
ALTER TABLE vote_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for vote_responses" ON vote_responses;
CREATE POLICY "Allow all for vote_responses"
  ON vote_responses FOR ALL USING (true);

-- ============================================
-- Matches Table
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMPTZ NOT NULL,
  location VARCHAR(200) NOT NULL,
  team_a JSONB NOT NULL,
  team_b JSONB NOT NULL,
  notes TEXT,
  vote_session_id UUID REFERENCES vote_sessions(id) ON DELETE SET NULL,
  match_number INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
  -- Add vote_session_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'vote_session_id'
  ) THEN
    ALTER TABLE matches ADD COLUMN vote_session_id UUID REFERENCES vote_sessions(id) ON DELETE SET NULL;
  END IF;

  -- Add match_number if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'match_number'
  ) THEN
    ALTER TABLE matches ADD COLUMN match_number INTEGER;
  END IF;

  -- Add status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'status'
  ) THEN
    ALTER TABLE matches ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished'));
  END IF;

  -- Add start_time if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE matches ADD COLUMN start_time TIMESTAMPTZ;
  END IF;

  -- Add end_time if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE matches ADD COLUMN end_time TIMESTAMPTZ;
  END IF;

  -- Add duration if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'duration'
  ) THEN
    ALTER TABLE matches ADD COLUMN duration INTEGER;
  END IF;
END $$;

-- Update existing records to have pending status
UPDATE matches
SET status = 'pending'
WHERE status IS NULL;

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for matches" ON matches;
CREATE POLICY "Allow all for matches"
  ON matches FOR ALL USING (true);

-- Add comments
COMMENT ON COLUMN matches.status IS 'Match status: pending, in_progress, or finished';
COMMENT ON COLUMN matches.start_time IS 'When the match started';
COMMENT ON COLUMN matches.end_time IS 'When the match ended';
COMMENT ON COLUMN matches.duration IS 'Match duration in seconds';
COMMENT ON COLUMN matches.vote_session_id IS 'Reference to the vote session that created this match';
COMMENT ON COLUMN matches.match_number IS 'Match number from the vote session (1, 2, 3, etc.)';

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attendance_votes_session ON attendance_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_votes_member ON attendance_votes(member_id);
CREATE INDEX IF NOT EXISTS idx_vote_responses_session ON vote_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_vote_responses_member ON vote_responses(member_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_vote_session ON matches(vote_session_id);

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Database schema setup completed successfully!';
END $$;
