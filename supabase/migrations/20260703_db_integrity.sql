-- ================================================================
-- DropLinker — Security/correctness Phase 11: DB integrity
-- Run in the Supabase SQL editor. REVIEW the dedup DELETEs first.
--
-- - Uniqueness: prevent webhook-replay duplicate orders + double-import
--   duplicate products (MED-4).
-- - Money non-negativity via NOT VALID checks (apply to new/updated rows;
--   existing rows are not scanned, so this can't fail on legacy data).
-- - Protect order history from a store hard-delete cascade.
-- - Drop the redundant duplicate salla_categories SELECT policy.
-- ================================================================

BEGIN;

-- 1. Remove duplicate orders (same store + store_order_id), keeping the earliest,
--    then enforce uniqueness. Order_items of the removed dup rows cascade away.
DELETE FROM orders o
USING orders keep
WHERE o.store_id = keep.store_id
  AND o.store_order_id = keep.store_order_id
  AND (o.created_at > keep.created_at
       OR (o.created_at = keep.created_at AND o.id > keep.id));

ALTER TABLE orders
  ADD CONSTRAINT uq_orders_store_order UNIQUE (store_id, store_order_id);

-- 2. Remove duplicate product imports, keeping the earliest, then enforce.
DELETE FROM products p
USING products keep
WHERE p.merchant_id = keep.merchant_id
  AND p.supplier = keep.supplier
  AND p.supplier_product_id = keep.supplier_product_id
  AND (p.created_at > keep.created_at
       OR (p.created_at = keep.created_at AND p.id > keep.id));

ALTER TABLE products
  ADD CONSTRAINT uq_products_supplier UNIQUE (merchant_id, supplier, supplier_product_id);

-- 3. Money non-negativity (NOT VALID: enforced on new/updated rows only).
ALTER TABLE products
  ADD CONSTRAINT chk_products_supplier_cost_nonneg CHECK (supplier_cost >= 0) NOT VALID,
  ADD CONSTRAINT chk_products_retail_price_nonneg  CHECK (retail_price  >= 0) NOT VALID,
  ADD CONSTRAINT chk_products_margin_value_nonneg  CHECK (margin_value  >= 0) NOT VALID;

ALTER TABLE product_listings
  ADD CONSTRAINT chk_listings_retail_price_nonneg CHECK (retail_price >= 0) NOT VALID,
  ADD CONSTRAINT chk_listings_margin_value_nonneg CHECK (margin_value >= 0) NOT VALID;

ALTER TABLE orders
  ADD CONSTRAINT chk_orders_total_amount_nonneg CHECK (total_amount >= 0) NOT VALID,
  ADD CONSTRAINT chk_orders_total_cost_nonneg   CHECK (total_cost   >= 0) NOT VALID;

-- 4. Protect order history: block hard-deleting a store that still has orders
--    (the app disconnects via is_active). Default FK name shown — verify with
--    \d orders if your DB named it differently.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_store_id_fkey;
ALTER TABLE orders
  ADD CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id)
  REFERENCES stores(id) ON DELETE RESTRICT;

-- 5. Remove the redundant duplicate salla_categories SELECT policy (the table is
--    defined twice in schema.sql; both policies are identical).
DROP POLICY IF EXISTS "Merchants see own store categories" ON salla_categories;

COMMIT;
