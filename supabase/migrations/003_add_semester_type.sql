-- ============================================================
-- Migration 003: Tambah semester_type dan academic_year
-- ke tabel student_grades
-- ============================================================

-- Tambah kolom semester_type (ganjil/genap)
ALTER TABLE student_grades
  ADD COLUMN IF NOT EXISTS semester_type TEXT CHECK (semester_type IN ('ganjil', 'genap')) DEFAULT 'ganjil';

-- Tambah kolom academic_year (contoh: '2023/2024')
ALTER TABLE student_grades
  ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '';

-- Set nilai default untuk data yang sudah ada berdasarkan semester_number
-- Ganjil = semester ganjil (1,3,5,7,...), Genap = semester genap (2,4,6,8,...)
UPDATE student_grades
  SET semester_type = CASE WHEN semester_number % 2 = 1 THEN 'ganjil' ELSE 'genap' END
  WHERE semester_type IS NULL OR semester_type = 'ganjil';

-- Buat index untuk query per tahun ajaran
CREATE INDEX IF NOT EXISTS idx_student_grades_academic_year
  ON student_grades(student_id, academic_year);
