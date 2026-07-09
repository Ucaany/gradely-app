-- Migration 006: Add onboarding_completed to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_semester_type TEXT CHECK (current_semester_type IN ('ganjil', 'genap'));

-- Index for fast onboarding check
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed) WHERE onboarding_completed = FALSE;
