-- ============================================================
-- Gradely MVP — Seed Data (ISI Yogyakarta)
-- Jalankan SETELAH migration 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- 1. University: ISI Yogyakarta
-- ============================================================
INSERT INTO universities (id, name, short_name, city, province, website)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Institut Seni Indonesia Yogyakarta',
  'ISI Yogyakarta',
  'Yogyakarta',
  'Daerah Istimewa Yogyakarta',
  'https://isi.ac.id'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Study Programs
-- ============================================================
INSERT INTO study_programs (id, university_id, name, short_name, degree_level) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Desain Komunikasi Visual', 'DKV', 'S1'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Animasi', 'Animasi', 'S1'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Film dan Televisi', 'Film', 'S1'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Fotografi', 'Foto', 'S1'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Seni Musik', 'Musik', 'S1'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Seni Tari', 'Tari', 'S1'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Teater', 'Teater', 'S1'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Desain Interior', 'DI', 'S1'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Kriya', 'Kriya', 'S1')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Academic Rules — Default ISI Yogyakarta
-- ============================================================
INSERT INTO academic_rules (
  id, university_id, study_program_id,
  total_sks_graduation, normal_semester, max_semester,
  min_gpa, max_sks_per_semester, min_sks_per_semester,
  passing_grade, grade_scale
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  NULL, -- default rule
  144, 8, 14,
  2.00, 24, 12,
  'D',
  '{"A":4.0,"AB":3.5,"B":3.0,"BC":2.5,"C":2.0,"D":1.0,"E":0.0}'
) ON CONFLICT (id) DO NOTHING;

-- Academic Rules per program studi (override)
INSERT INTO academic_rules (
  id, university_id, study_program_id,
  total_sks_graduation, normal_semester, max_semester,
  min_gpa, max_sks_per_semester, min_sks_per_semester,
  passing_grade, grade_scale
) VALUES
  -- Musik: 148 SKS
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000005', 148, 8, 14, 2.00, 24, 12, 'D',
   '{"A":4.0,"AB":3.5,"B":3.0,"BC":2.5,"C":2.0,"D":1.0,"E":0.0}'),
  -- Tari: 148 SKS
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000006', 148, 8, 14, 2.00, 24, 12, 'D',
   '{"A":4.0,"AB":3.5,"B":3.0,"BC":2.5,"C":2.0,"D":1.0,"E":0.0}'),
  -- Teater: 146 SKS
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000007', 146, 8, 14, 2.00, 24, 12, 'D',
   '{"A":4.0,"AB":3.5,"B":3.0,"BC":2.5,"C":2.0,"D":1.0,"E":0.0}'),
  -- Kriya: 146 SKS
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000009', 146, 8, 14, 2.00, 24, 12, 'D',
   '{"A":4.0,"AB":3.5,"B":3.0,"BC":2.5,"C":2.0,"D":1.0,"E":0.0}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Portfolio Categories
-- ============================================================
INSERT INTO portfolio_categories (id, code, name) VALUES
  ('30000000-0000-0000-0000-000000000001', 'certificate',   'Sertifikat'),
  ('30000000-0000-0000-0000-000000000002', 'internship',    'Magang'),
  ('30000000-0000-0000-0000-000000000003', 'project',       'Proyek'),
  ('30000000-0000-0000-0000-000000000004', 'competition',   'Kompetisi'),
  ('30000000-0000-0000-0000-000000000005', 'publication',   'Publikasi'),
  ('30000000-0000-0000-0000-000000000006', 'organization',  'Organisasi'),
  ('30000000-0000-0000-0000-000000000007', 'artwork',       'Karya Seni'),
  ('30000000-0000-0000-0000-000000000008', 'thesis',        'Tugas Akhir')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CATATAN: User accounts dibuat melalui Supabase Auth
-- Gunakan Admin panel atau script berikut di Supabase Dashboard:
--
-- Admin:   admin@isi.ac.id        / Admin@Gradely2024
-- Dosen 1: rini.wulandari@isi.ac.id / Dosen@Gradely2024
-- Dosen 2: ahmad.fauzi@isi.ac.id    / Dosen@Gradely2024
-- Dosen 3: sari.dewi@isi.ac.id      / Dosen@Gradely2024
--
-- Setelah create auth user, jalankan INSERT ke tabel users
-- dengan ID yang sama dari auth.users
-- ============================================================
