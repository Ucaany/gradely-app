-- Migration 016: Add university_id to whatsapp_logs for multi-tenant isolation
-- [M-7] Fixes: admin from university A could see logs from university B

ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_university_id ON whatsapp_logs(university_id);

-- Update RLS policies to scope by university_id
DROP POLICY IF EXISTS "wlog_admin_all" ON whatsapp_logs;
DROP POLICY IF EXISTS "wlog_lecturer_read" ON whatsapp_logs;

-- Admin can only see logs from their own university
CREATE POLICY "wlog_admin_university" ON whatsapp_logs
  FOR ALL USING (
    auth_user_role() = 'admin'
    AND (
      university_id IS NULL
      OR university_id = (
        SELECT university_id FROM users WHERE id = auth.uid() LIMIT 1
      )
    )
  );

-- Lecturer can only see logs for their own advisees
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
