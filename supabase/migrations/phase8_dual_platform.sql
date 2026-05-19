-- Phase 8: Dual-platform sync support
-- Adds platform-specific product IDs so a product can be synced to BOTH Salla and Zid simultaneously

-- Add platform-specific columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS salla_product_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS salla_store_id UUID REFERENCES stores(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS zid_product_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS zid_store_id UUID REFERENCES stores(id);

-- Backfill from existing store_product_id + store_id based on store platform
UPDATE products p
SET salla_product_id = p.store_product_id,
    salla_store_id = p.store_id
FROM stores s
WHERE p.store_id = s.id
  AND s.platform = 'salla'
  AND p.store_product_id IS NOT NULL
  AND p.salla_product_id IS NULL;

UPDATE products p
SET zid_product_id = p.store_product_id,
    zid_store_id = p.store_id
FROM stores s
WHERE p.store_id = s.id
  AND s.platform = 'zid'
  AND p.store_product_id IS NOT NULL
  AND p.zid_product_id IS NULL;
