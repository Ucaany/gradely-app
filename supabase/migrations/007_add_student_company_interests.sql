-- ============================================================
-- Migration 007: student_company_interests
-- Menyimpan perusahaan yang diminati mahasiswa saat onboarding
-- ============================================================

CREATE TABLE IF NOT EXISTS student_company_interests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_student_company_interests_student ON student_company_interests(student_id);
CREATE INDEX IF NOT EXISTS idx_student_company_interests_company ON student_company_interests(company_id);

ALTER TABLE student_company_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sci_student_own" ON student_company_interests
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "sci_admin_all" ON student_company_interests
  FOR ALL USING (auth_user_role() = 'admin');

CREATE POLICY "sci_lecturer_read" ON student_company_interests
  FOR SELECT USING (
    auth_user_role() = 'lecturer'
    AND student_id IN (
      SELECT student_id FROM advisor_students WHERE lecturer_id = auth.uid()
    )
  );
