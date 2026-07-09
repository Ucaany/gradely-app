-- Migration 005: Add join_code to users table for lecturer join code feature
ALTER TABLE users ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- Index for fast lookup by join_code
CREATE INDEX IF NOT EXISTS idx_users_join_code ON users(join_code) WHERE join_code IS NOT NULL;

-- RLS: anyone authenticated can read join_code to look up a lecturer (for join flow)
-- Students need to SELECT users where join_code = ? to find the lecturer
-- We allow authenticated users to read join_code column via existing user policies
-- No extra policy needed since users table already has read policies for authenticated users
