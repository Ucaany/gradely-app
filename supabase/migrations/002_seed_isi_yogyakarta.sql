-- ============================================================
-- Gradely — Seed Data ISI Yogyakarta
-- Jalankan SETELAH 001_initial_schema.sql
-- ============================================================

-- Insert universitas ISI Yogyakarta
INSERT INTO universities (id, name, short_name, city, province, website)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Institut Seni Indonesia Yogyakarta',
  'ISI Yogyakarta',
  'Yogyakarta',
  'Daerah Istimewa Yogyakarta',
  'https://isi.ac.id'
) ON CONFLICT (id) DO NOTHING;

-- Insert program studi ISI Yogyakarta
INSERT INTO study_programs (id, university_id, name, short_name, degree_level, is_active)
VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Desain Komunikasi Visual', 'DKV', 'S1', true),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Desain Interior', 'DI', 'S1', true),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Seni Murni', 'SM', 'S1', true),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Seni Kriya', 'SK', 'S1', true),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Televisi dan Film', 'TV&Film', 'S1', true),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'Fotografi', 'Foto', 'S1', true),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'Musik', 'Musik', 'S1', true),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'Tari', 'Tari', 'S1', true),
  ('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000001', 'Teater', 'Teater', 'S1', true),
  ('00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0000-000000000001', 'Animasi', 'Animasi', 'S1', true)
ON CONFLICT (id) DO NOTHING;

-- Insert aturan akademik default ISI Yogyakarta
INSERT INTO academic_rules (
  id, university_id, study_program_id,
  total_sks_graduation, normal_semester, max_semester,
  min_gpa, max_sks_per_semester, min_sks_per_semester,
  passing_grade, grade_scale
)
VALUES (
  '00000000-0000-0000-0002-000000000001',
  '00000000-0000-0000-0000-000000000001',
  NULL,
  144, 8, 14,
  2.00, 24, 12,
  'D',
  '{"A":4.0,"AB":3.5,"B":3.0,"BC":2.5,"C":2.0,"D":1.0,"E":0.0}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert portfolio categories
INSERT INTO portfolio_categories (id, code, name)
VALUES
  ('00000000-0000-0000-0003-000000000001', 'certificate', 'Sertifikat'),
  ('00000000-0000-0000-0003-000000000002', 'internship', 'Magang'),
  ('00000000-0000-0000-0003-000000000003', 'volunteer', 'Volunteer'),
  ('00000000-0000-0000-0003-000000000004', 'organization', 'Organisasi'),
  ('00000000-0000-0000-0003-000000000005', 'achievement', 'Prestasi'),
  ('00000000-0000-0000-0003-000000000006', 'competition', 'Kompetisi'),
  ('00000000-0000-0000-0003-000000000007', 'workshop', 'Workshop'),
  ('00000000-0000-0000-0003-000000000008', 'training', 'Pelatihan'),
  ('00000000-0000-0000-0003-000000000009', 'project', 'Proyek'),
  ('00000000-0000-0000-0003-000000000010', 'work', 'Karya'),
  ('00000000-0000-0000-0003-000000000011', 'experience', 'Pengalaman')
ON CONFLICT (id) DO NOTHING;
