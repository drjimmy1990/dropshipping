-- ================================================================
-- SEED TEST DATA: Fake Salla store for development
-- Run this in Supabase SQL Editor to simulate a connected store
-- so you can continue building dashboard features.
-- 
-- ⚠️ Replace 'YOUR_MERCHANT_UUID' with your actual user ID
--    from Supabase → Authentication → Users → copy the UUID
-- ================================================================

-- 1. Insert a fake Salla store (simulates a successful OAuth connection)
INSERT INTO stores (
  merchant_id,
  platform,
  store_name,
  store_url,
  access_token,
  refresh_token,
  is_active
) VALUES (
  'YOUR_MERCHANT_UUID',  -- ← Replace this with your real user UUID from Supabase Auth
  'salla',
  'Test Store (Development)',
  'https://test-store.salla.sa',
  'fake_access_token_for_development',
  'fake_refresh_token_for_development',
  true
);

-- 2. Insert a fake test order (simulates an order received via webhook)
INSERT INTO orders (
  store_id,
  merchant_id,
  store_order_id,
  customer_info,
  total_amount,
  total_cost,
  commission_amount,
  status,
  notes
) VALUES (
  (SELECT id FROM stores WHERE platform = 'salla' LIMIT 1),
  'YOUR_MERCHANT_UUID',  -- ← Same UUID as above
  'SALLA-TEST-001',
  '{"name": "عميل تجريبي", "email": "test@example.com", "phone": "+966501234567", "address": "الرياض، السعودية"}',
  150.00,
  80.00,
  20.00,
  'new',
  'Test order for development'
);

-- 3. Verify
SELECT * FROM stores WHERE platform = 'salla';
SELECT * FROM orders WHERE store_order_id = 'SALLA-TEST-001';
