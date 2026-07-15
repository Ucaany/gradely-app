-- Migration 022: RLS for skill/industry options + skill_industry_map
-- Ensures students can read active options; admin manages all.

ALTER TABLE skill_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_industry_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill_options_read_active" ON skill_options;
CREATE POLICY "skill_options_read_active" ON skill_options
  FOR SELECT USING (
    is_active = TRUE
    OR auth_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "skill_options_admin_all" ON skill_options;
CREATE POLICY "skill_options_admin_all" ON skill_options
  FOR ALL USING (auth_user_role() = 'admin');

DROP POLICY IF EXISTS "industry_options_read_active" ON industry_options;
CREATE POLICY "industry_options_read_active" ON industry_options
  FOR SELECT USING (
    is_active = TRUE
    OR auth_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "industry_options_admin_all" ON industry_options;
CREATE POLICY "industry_options_admin_all" ON industry_options
  FOR ALL USING (auth_user_role() = 'admin');

DROP POLICY IF EXISTS "skill_industry_map_read" ON skill_industry_map;
CREATE POLICY "skill_industry_map_read" ON skill_industry_map
  FOR SELECT USING (
    auth_user_role() IN ('student', 'lecturer', 'admin', 'company')
  );

DROP POLICY IF EXISTS "skill_industry_map_admin_all" ON skill_industry_map;
CREATE POLICY "skill_industry_map_admin_all" ON skill_industry_map
  FOR ALL USING (auth_user_role() = 'admin');
