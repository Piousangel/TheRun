-- Migration: Add vote_session_id and match_number to matches table
-- This allows matches to be linked to vote sessions and numbered within a session

-- Add vote_session_id column (nullable, references vote_sessions)
ALTER TABLE matches
ADD COLUMN vote_session_id UUID REFERENCES vote_sessions(id) ON DELETE SET NULL;

-- Add match_number column (nullable, for ordering matches within a session)
ALTER TABLE matches
ADD COLUMN match_number INTEGER;

-- Create index for faster queries by vote_session_id
CREATE INDEX idx_matches_vote_session_id ON matches(vote_session_id);

-- Create composite index for vote_session_id and match_number
CREATE INDEX idx_matches_vote_session_match_number ON matches(vote_session_id, match_number);

-- Add comment to table
COMMENT ON COLUMN matches.vote_session_id IS 'Links the match to a specific vote session (schedule)';
COMMENT ON COLUMN matches.match_number IS 'Sequential number of the match within a vote session (1st game, 2nd game, etc.)';
