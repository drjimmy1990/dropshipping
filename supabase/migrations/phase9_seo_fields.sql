-- Phase 9: SEO & Store Settings fields
-- Adds metadata_title, metadata_description for Salla SEO
-- Adds zid_keywords for Zid search optimization

-- SEO fields for Salla
ALTER TABLE products ADD COLUMN IF NOT EXISTS metadata_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS metadata_description TEXT;

-- Zid-specific keywords (separate from Salla tags)
ALTER TABLE products ADD COLUMN IF NOT EXISTS zid_keywords TEXT[];

-- Backfill metadata from existing titles/descriptions
UPDATE products 
SET metadata_title = LEFT(title_en, 70) 
WHERE metadata_title IS NULL AND title_en IS NOT NULL;

UPDATE products 
SET metadata_description = LEFT(description_en, 160) 
WHERE metadata_description IS NULL AND description_en IS NOT NULL;
