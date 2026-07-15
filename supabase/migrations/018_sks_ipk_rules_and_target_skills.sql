-- ============================================================
-- Migration 018: Aturan SKS berdasarkan IPK (Pasal 26) +
--               Kolom skill & industri di student_targets
-- ============================================================

-- Tambah kolom sks_rules_by_ipk ke academic_rules
-- Format JSONB:
-- {
--   "semester_1_2_max": 20,        -- Sem 1 & 2 (paket, maks)
--   "tiers": [
--     { "ipk_min": 3.00, "ipk_max": 4.00, "sks_min": 22, "sks_max": 24 },
--     { "ipk_min": 2.50, "ipk_max": 2.99, "sks_min": 20, "sks_max": 22 },
--     { "ipk_min": 2.00, "ipk_max": 2.49, "sks_min": 16, "sks_max": 20 },
--     { "ipk_min": 1.50, "ipk_max": 1.99, "sks_min": 12, "sks_max": 16 },
--     { "ipk_min": 0.00, "ipk_max": 1.49, "sks_min": 2,  "sks_max": 12 }
--   ]
-- }
ALTER TABLE academic_rules
  ADD COLUMN IF NOT EXISTS sks_rules_by_ipk JSONB NOT NULL DEFAULT '{
    "semester_1_2_max": 20,
    "tiers": [
      { "ipk_min": 3.00, "ipk_max": 4.00, "sks_min": 22, "sks_max": 24 },
      { "ipk_min": 2.50, "ipk_max": 2.99, "sks_min": 20, "sks_max": 22 },
      { "ipk_min": 2.00, "ipk_max": 2.49, "sks_min": 16, "sks_max": 20 },
      { "ipk_min": 1.50, "ipk_max": 1.99, "sks_min": 12, "sks_max": 16 },
      { "ipk_min": 0.00, "ipk_max": 1.49, "sks_min": 2,  "sks_max": 12 }
    ]
  }';

-- Tambah kolom skill & industri yang diminati ke student_targets
ALTER TABLE student_targets
  ADD COLUMN IF NOT EXISTS target_skills    TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_industries TEXT[] DEFAULT '{}';
