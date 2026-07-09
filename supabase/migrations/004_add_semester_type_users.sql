-- ============================================================
-- Migration 004: Tambah current_semester_type ke tabel users
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS current_semester_type TEXT
    CHECK (current_semester_type IN ('ganjil', 'genap'))
    DEFAULT 'ganjil';
