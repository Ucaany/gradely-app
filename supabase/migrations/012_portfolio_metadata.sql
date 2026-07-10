-- Migration 012: tambah kolom metadata JSONB di student_portfolios
ALTER TABLE student_portfolios
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
