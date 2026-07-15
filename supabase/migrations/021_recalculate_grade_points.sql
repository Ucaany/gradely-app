-- Migration 021: Recalculate grade_points for grades whose stored value
-- no longer matches the current grade_scale in academic_rules.
--
-- After migration 017, grade letters were renamed (BC→B-, AB→BA) but
-- grade_points were not recalculated. This migration fixes stale values
-- by joining student_grades with the effective grade_scale.

UPDATE student_grades sg
SET grade_points = (
  SELECT (ar.grade_scale ->> sg.grade::text)::numeric
  FROM users u
  JOIN academic_rules ar
    ON ar.university_id = u.university_id
    AND (
      ar.study_program_id = u.study_program_id
      OR ar.study_program_id IS NULL
    )
  WHERE u.id = sg.student_id
  ORDER BY ar.study_program_id NULLS LAST
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM users u
  JOIN academic_rules ar
    ON ar.university_id = u.university_id
    AND (
      ar.study_program_id = u.study_program_id
      OR ar.study_program_id IS NULL
    )
  WHERE u.id = sg.student_id
    AND (ar.grade_scale ->> sg.grade::text) IS NOT NULL
    AND (ar.grade_scale ->> sg.grade::text)::numeric <> sg.grade_points
  LIMIT 1
);
