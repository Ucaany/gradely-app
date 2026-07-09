-- Migration 010: Add graduation achievements to student_targets
-- Mahasiswa bisa menambahkan capaian target kelulusan

ALTER TABLE student_targets
  ADD COLUMN IF NOT EXISTS achievement_title        TEXT,
  ADD COLUMN IF NOT EXISTS achievement_description  TEXT,
  ADD COLUMN IF NOT EXISTS achievement_ipk_target   NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS achievement_sks_target   INTEGER,
  ADD COLUMN IF NOT EXISTS achievement_semester_target INTEGER,
  ADD COLUMN IF NOT EXISTS achievement_skills       TEXT[],
  ADD COLUMN IF NOT EXISTS achievement_certificates TEXT[],
  ADD COLUMN IF NOT EXISTS achievement_internship   TEXT,
  ADD COLUMN IF NOT EXISTS achievement_thesis_topic TEXT,
  ADD COLUMN IF NOT EXISTS achievement_updated_at   TIMESTAMPTZ DEFAULT NOW();
