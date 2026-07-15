-- Migration 017: Update grade scale from A/AB/B/BC/C/D/E to A/A-/BA/B+/B/B-/C/D/E

-- Step 1: Drop defaults that depend on the enum so we can drop it
ALTER TABLE academic_rules ALTER COLUMN passing_grade DROP DEFAULT;

-- Step 2: Convert enum columns to TEXT
ALTER TABLE student_grades ALTER COLUMN grade         TYPE TEXT;
ALTER TABLE academic_rules ALTER COLUMN passing_grade TYPE TEXT;

-- Step 3: Drop old enum
DROP TYPE grade_value;

-- Step 4: Create new enum with all 9 values
CREATE TYPE grade_value AS ENUM ('A', 'A-', 'BA', 'B+', 'B', 'B-', 'C', 'D', 'E');

-- Step 5: Migrate old grade letters to new equivalents
UPDATE student_grades SET grade         = 'BA' WHERE grade         = 'AB';
UPDATE student_grades SET grade         = 'B-' WHERE grade         = 'BC';
UPDATE academic_rules SET passing_grade = 'BA' WHERE passing_grade = 'AB';
UPDATE academic_rules SET passing_grade = 'B-' WHERE passing_grade = 'BC';

-- Step 6: Cast columns back to new enum type
ALTER TABLE student_grades ALTER COLUMN grade         TYPE grade_value USING grade::grade_value;
ALTER TABLE academic_rules ALTER COLUMN passing_grade TYPE grade_value USING passing_grade::grade_value;

-- Step 7: Restore default for passing_grade
ALTER TABLE academic_rules ALTER COLUMN passing_grade SET DEFAULT 'D';

-- Step 8: Update grade_scale column default
ALTER TABLE academic_rules
  ALTER COLUMN grade_scale
  SET DEFAULT '{"A":4.0,"A-":3.75,"BA":3.5,"B+":3.25,"B":3.0,"B-":2.75,"C":2.0,"D":1.0,"E":0.0}';

-- Step 9: Migrate existing grade_scale JSONB rows that use old keys (AB / BC)
UPDATE academic_rules
SET grade_scale = jsonb_build_object(
  'A',   COALESCE((grade_scale->>'A')::numeric,   4.0),
  'A-',  3.75,
  'BA',  COALESCE((grade_scale->>'AB')::numeric,  (grade_scale->>'BA')::numeric,  3.5),
  'B+',  3.25,
  'B',   COALESCE((grade_scale->>'B')::numeric,   3.0),
  'B-',  COALESCE((grade_scale->>'BC')::numeric,  (grade_scale->>'B-')::numeric,  2.75),
  'C',   COALESCE((grade_scale->>'C')::numeric,   2.0),
  'D',   COALESCE((grade_scale->>'D')::numeric,   1.0),
  'E',   COALESCE((grade_scale->>'E')::numeric,   0.0)
)
WHERE grade_scale ? 'AB' OR grade_scale ? 'BC';
