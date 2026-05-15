-- Add shipping columns to products table for import wizard
-- Run this in Supabase SQL editor

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_method TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery TEXT;

-- Comment on columns for documentation
COMMENT ON COLUMN products.shipping_cost IS 'AliExpress shipping cost selected during import (SAR)';
COMMENT ON COLUMN products.shipping_method IS 'Selected shipping carrier name (e.g. "AliExpress Standard Shipping")';
COMMENT ON COLUMN products.estimated_delivery IS 'Estimated delivery timeframe (e.g. "15-30 days")';
