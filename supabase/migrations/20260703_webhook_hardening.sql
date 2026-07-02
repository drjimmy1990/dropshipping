-- ================================================================
-- DropLinker — Security Phase 4+5: webhook secret leak + replay
-- Run in the Supabase SQL editor.
--
-- HIGH-2: the GLOBAL Salla webhook secret (process.env.SALLA_WEBHOOK_SECRET) was
-- copied into every stores row, which merchants can read via RLS — so any
-- merchant learned the secret and could forge webhooks for others. The webhook
-- handler never actually read the per-store column (it verifies against the env
-- secret), so the stored copy was pure leak. Null it out; the app no longer
-- writes it (see auth/salla/callback).
-- ================================================================

BEGIN;

UPDATE stores SET webhook_secret = NULL WHERE webhook_secret IS NOT NULL;

-- HIGH-4: replay protection. The webhook handler records a hash of each body and
-- rejects exact duplicates. Only the service role writes here (RLS on, no
-- policies => anon/authenticated denied; service_role bypasses RLS).
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_key TEXT PRIMARY KEY,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_seen
  ON processed_webhook_events (seen_at);

COMMIT;
