-- ============================================================
-- Migration 011: Portfolio enhancements
-- - Tambah kolom is_public (default true) di student_portfolios
-- - Tambah kolom links JSONB (array of {label, url}) di student_portfolios
-- - Hapus kolom url_* yang fixed
-- ============================================================

-- Tambah kolom baru
ALTER TABLE student_portfolios
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS links JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Migrate data lama dari url_* ke links JSONB
UPDATE student_portfolios
SET links = (
  SELECT jsonb_agg(item)
  FROM (
    SELECT jsonb_build_object('label', 'GitHub', 'url', url_github) AS item WHERE url_github IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object('label', 'Behance', 'url', url_behance) WHERE url_behance IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object('label', 'LinkedIn', 'url', url_linkedin) WHERE url_linkedin IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object('label', 'YouTube', 'url', url_youtube) WHERE url_youtube IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object('label', 'Google Drive', 'url', url_gdrive) WHERE url_gdrive IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object('label', 'Website', 'url', url_website) WHERE url_website IS NOT NULL
  ) sub
)
WHERE url_github IS NOT NULL
   OR url_behance IS NOT NULL
   OR url_linkedin IS NOT NULL
   OR url_youtube IS NOT NULL
   OR url_gdrive IS NOT NULL
   OR url_website IS NOT NULL;

-- Update links ke empty array jika NULL
UPDATE student_portfolios SET links = '[]'::jsonb WHERE links IS NULL;

-- Hapus kolom lama
ALTER TABLE student_portfolios
  DROP COLUMN IF EXISTS url_gdrive,
  DROP COLUMN IF EXISTS url_github,
  DROP COLUMN IF EXISTS url_behance,
  DROP COLUMN IF EXISTS url_linkedin,
  DROP COLUMN IF EXISTS url_youtube,
  DROP COLUMN IF EXISTS url_website;
