-- Migration 014: Add unique constraint on companies.user_id for upsert support
ALTER TABLE companies
  ADD CONSTRAINT companies_user_id_unique UNIQUE (user_id);
