-- Migration 015: Fix RLS Security Issues
-- [C-3] Fix whatsapp_logs lecturer policy - scope to advisees only
-- [C-4] Fix settings table - require authentication
-- [H-5] Add companies read policy for students and lecturers

-- ============================================================
-- [C-3] Fix whatsapp_logs: lecturers should only read logs
--       for their own advisees, not all logs
-- ============================================================
DROP POLICY IF EXISTS "wlog_lecturer_read" ON whatsapp_logs;

CREATE POLICY "wlog_lecturer_read" ON whatsapp_logs
  FOR SELECT USING (
    auth_user_role() = 'lecturer'
    AND (
      recipient_id IS NULL
      OR EXISTS (
        SELECT 1 FROM advisor_students
        WHERE advisor_students.lecturer_id = auth.uid()
          AND advisor_students.student_id = whatsapp_logs.recipient_id
      )
    )
  );

-- ============================================================
-- [C-4] Fix settings table: require authentication to read
--       (was USING (TRUE) = publicly readable without auth)
-- ============================================================
DROP POLICY IF EXISTS "settings_read_all" ON settings;

CREATE POLICY "settings_read_authenticated" ON settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- [H-5] Add read policy for companies + company_categories
--       so students and lecturers can browse company profiles
-- ============================================================
DROP POLICY IF EXISTS "companies_student_read_active" ON companies;
DROP POLICY IF EXISTS "company_categories_student_read" ON company_categories;

CREATE POLICY "companies_student_read_active" ON companies
  FOR SELECT USING (
    auth_user_role() IN ('student', 'lecturer')
    AND is_active = TRUE
  );

CREATE POLICY "company_categories_student_read" ON company_categories
  FOR SELECT USING (
    auth_user_role() IN ('student', 'lecturer')
    AND EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_categories.company_id
        AND companies.is_active = TRUE
    )
  );

-- ============================================================
-- Ensure student_target_analyses has RLS enabled [M-4]
-- ============================================================
ALTER TABLE IF EXISTS student_target_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analyses_own_read" ON student_target_analyses;
DROP POLICY IF EXISTS "analyses_own_insert" ON student_target_analyses;
DROP POLICY IF EXISTS "analyses_admin_all" ON student_target_analyses;
DROP POLICY IF EXISTS "analyses_lecturer_read" ON student_target_analyses;

CREATE POLICY "analyses_own_read" ON student_target_analyses
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "analyses_own_insert" ON student_target_analyses
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "analyses_admin_all" ON student_target_analyses
  FOR ALL USING (auth_user_role() = 'admin');

CREATE POLICY "analyses_lecturer_read" ON student_target_analyses
  FOR SELECT USING (
    auth_user_role() = 'lecturer'
    AND EXISTS (
      SELECT 1 FROM advisor_students
      WHERE advisor_students.lecturer_id = auth.uid()
        AND advisor_students.student_id = student_target_analyses.student_id
    )
  );
