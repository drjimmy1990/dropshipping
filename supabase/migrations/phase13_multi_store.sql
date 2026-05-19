-- Phase 13: Multi-Store per Platform Architecture
-- Replaces single-store columns in products table with a many-to-many product_listings table.

-- 1. Create the product_listings table
CREATE TABLE IF NOT EXISTS product_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  store_product_id TEXT NOT NULL,
  
  -- Store-Specific Pricing (Overrides global product pricing)
  margin_type margin_type NOT NULL DEFAULT 'percentage',
  margin_value NUMERIC(10, 2) NOT NULL,
  retail_price NUMERIC(10, 2) NOT NULL,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ DEFAULT now(),
  sync_error TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent syncing the same product to the same store multiple times
  UNIQUE(product_id, store_id)
);

-- 2. Setup RLS for product_listings
ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_self" ON product_listings FOR ALL USING (
    merchant_id = auth.uid() OR is_admin()
);

-- 3. Add updated_at trigger
CREATE TRIGGER trg_product_listings_updated 
BEFORE UPDATE ON product_listings 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 4. Migrate existing Salla products to product_listings
INSERT INTO product_listings (product_id, store_id, merchant_id, store_product_id, margin_type, margin_value, retail_price, is_active)
SELECT 
  p.id,
  p.salla_store_id,
  p.merchant_id,
  p.salla_product_id,
  p.margin_type,
  p.margin_value,
  p.retail_price,
  p.is_active
FROM products p
WHERE p.salla_product_id IS NOT NULL AND p.salla_store_id IS NOT NULL
ON CONFLICT (product_id, store_id) DO NOTHING;

-- 5. Migrate existing Zid products to product_listings
INSERT INTO product_listings (product_id, store_id, merchant_id, store_product_id, margin_type, margin_value, retail_price, is_active)
SELECT 
  p.id,
  p.zid_store_id,
  p.merchant_id,
  p.zid_product_id,
  p.margin_type,
  p.margin_value,
  p.retail_price,
  p.is_active
FROM products p
WHERE p.zid_product_id IS NOT NULL AND p.zid_store_id IS NOT NULL
ON CONFLICT (product_id, store_id) DO NOTHING;

-- 6. Migrate legacy store_product_id (just in case they weren't caught by Phase 8)
INSERT INTO product_listings (product_id, store_id, merchant_id, store_product_id, margin_type, margin_value, retail_price, is_active)
SELECT 
  p.id,
  p.store_id,
  p.merchant_id,
  p.store_product_id,
  p.margin_type,
  p.margin_value,
  p.retail_price,
  p.is_active
FROM products p
WHERE p.store_product_id IS NOT NULL AND p.store_id IS NOT NULL
ON CONFLICT (product_id, store_id) DO NOTHING;

-- 7. Drop legacy columns from products table
ALTER TABLE products 
DROP COLUMN IF EXISTS salla_product_id,
DROP COLUMN IF EXISTS salla_store_id,
DROP COLUMN IF EXISTS zid_product_id,
DROP COLUMN IF EXISTS zid_store_id,
DROP COLUMN IF EXISTS store_product_id,
DROP COLUMN IF EXISTS store_id;
