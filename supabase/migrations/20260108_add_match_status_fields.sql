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
