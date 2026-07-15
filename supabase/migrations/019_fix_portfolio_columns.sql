-- ============================================================
-- Migration 019: Ensure portfolio enhancement columns exist
-- Fixes "Could not find the 'is_public' column" schema cache error
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS
-- ============================================================

ALTER TABLE student_portfolios
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS links JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE student_portfolios SET links = '[]'::jsonb WHERE links IS NULL;
UPDATE student_portfolios SET metadata = '{}'::jsonb WHERE metadata IS NULL;
