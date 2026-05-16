-- ================================================================
-- Phase 7B — Zid Platform Integration
-- Run in Supabase SQL Editor
-- ================================================================

-- Add a generic platform_store_id column
-- Zid needs Store-Id header, Salla uses salla_merchant_id
ALTER TABLE stores ADD COLUMN IF NOT EXISTS platform_store_id TEXT;

-- Backfill existing Salla stores
UPDATE stores
SET platform_store_id = salla_merchant_id
WHERE platform = 'salla'
  AND salla_merchant_id IS NOT NULL
  AND platform_store_id IS NULL;

-- Add partner_token column (Zid's partner-level Authorization JWT)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS partner_token TEXT;
