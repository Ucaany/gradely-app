-- Migration 020: Add `enabled` field to sks_rules_by_ipk JSONB
-- Sets enabled=true on all existing rows that have sks_rules_by_ipk but no `enabled` key

UPDATE academic_rules
SET sks_rules_by_ipk = sks_rules_by_ipk || '{"enabled": true}'::jsonb
WHERE sks_rules_by_ipk IS NOT NULL
  AND NOT (sks_rules_by_ipk ? 'enabled');
