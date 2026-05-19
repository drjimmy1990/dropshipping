-- Phase 10: Add zid_category_id to products for platform-specific category management
-- Salla uses salla_category_id (BIGINT), Zid uses zid_category_id (TEXT/UUID)

ALTER TABLE products ADD COLUMN IF NOT EXISTS zid_category_id TEXT;
