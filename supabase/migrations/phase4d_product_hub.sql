-- ================================================================
-- Phase 4D: Product Management Hub
-- Salla category caching + multi-store support
-- ================================================================

-- ---------- Salla Categories Cache ----------
-- Caches categories from each merchant's Salla store
-- for category pickers in import wizard and product editor.

CREATE TABLE IF NOT EXISTS salla_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  salla_category_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  parent_id BIGINT DEFAULT 0,
  status TEXT DEFAULT 'active',
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, salla_category_id)
);

CREATE INDEX idx_salla_categories_store ON salla_categories(store_id);

-- RLS: merchants can only see categories for their own stores
ALTER TABLE salla_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salla_categories_select_via_store" ON salla_categories FOR
SELECT USING (
  store_id IN (
    SELECT id FROM stores WHERE merchant_id = auth.uid()
  )
);

-- Allow service role to INSERT/UPDATE/DELETE (used by API routes with adminClient)
-- No merchant-level write policies needed — only server writes to this table.

-- ---------- Products: add category_id for Salla category mapping ----------
-- Links a product to its Salla category ID (nullable — not all products have categories)
ALTER TABLE products ADD COLUMN IF NOT EXISTS salla_category_id BIGINT;

-- ---------- Products: add source tracking ----------
-- 'aliexpress' | 'cj' | 'makhazen' | 'direct' (merchant's own Salla product)
-- The existing 'supplier' column already handles this, but we need to allow 'direct'
-- NOTE: supplier column is TEXT type, no enum constraint — 'direct' works as-is.

-- ---------- Stores: ensure multi-store index ----------
CREATE INDEX IF NOT EXISTS idx_stores_merchant_platform 
  ON stores(merchant_id, platform);
