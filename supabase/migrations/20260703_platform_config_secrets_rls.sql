-- ================================================================
-- DropLinker — Security Phase 2: gate platform_config secrets (CRIT-6)
-- Run in the Supabase SQL editor.
--
-- Before: config_read USING (true) → the public anon key could read every row,
-- including aliexpress/cj tokens, n8n webhook HMAC, and LLM API keys.
-- After: only admins read secret rows; the 11 seeded PUBLIC settings keys stay
-- readable by anon/merchant (pricing page, currency rate, feature flags).
--
-- Safe because every secret CONSUMER already reads via the service-role client
-- (aliexpress/client.ts, cj/client.ts, ai-generate + feeds routes all use
-- createAdminClient, which bypasses RLS). The only browser reader is the admin
-- settings page, which passes is_admin().
-- ================================================================

BEGIN;

DROP POLICY IF EXISTS config_read ON platform_config;
CREATE POLICY config_read ON platform_config FOR SELECT USING (
  is_admin() OR key IN (
    'commission_mode',
    'default_currency',
    'usd_to_sar_rate',
    'moyasar_enabled',
    'stripe_enabled',
    'bank_transfer_enabled',
    'ai_descriptions_enabled',
    'price_sync_global_interval',
    'stock_sync_global_interval',
    'platform_name',
    'support_email'
  )
);

-- Unify the divergent admin model: platform_feeds gated on
-- raw_user_meta_data->>'role'='super_admin' (a role nothing ever sets), which
-- locked feed management out for everyone. Use is_admin() like every other table.
DROP POLICY IF EXISTS "Super admins can manage feeds" ON platform_feeds;
CREATE POLICY feeds_admin ON platform_feeds FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

COMMIT;
