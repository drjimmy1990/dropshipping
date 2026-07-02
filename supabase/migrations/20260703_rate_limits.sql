-- ================================================================
-- DropLinker — Security Phase 9: per-merchant rate limiting (HIGH-9)
-- Run in the Supabase SQL editor.
--
-- AliExpress + CJ use ONE shared platform API key for all merchants, so a single
-- merchant could exhaust the quota. This fixed-window counter caps calls per
-- merchant per route. Postgres-based (no new infra; survives restarts; shared
-- across PM2 workers). Only the service role touches it (RLS on, no policies).
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID NOT NULL,
  bucket TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, bucket, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);

-- Atomic increment-and-check. Returns TRUE when the call is allowed (count <=
-- limit for the current fixed window), FALSE when the limit is exceeded.
CREATE OR REPLACE FUNCTION rl_hit(
  p_user UUID,
  p_bucket TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO rate_limits (user_id, bucket, window_start, count)
  VALUES (p_user, p_bucket, v_window_start, 1)
  ON CONFLICT (user_id, bucket, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION rl_hit(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rl_hit(UUID, TEXT, INTEGER, INTEGER) TO service_role;

-- Old windows can be pruned by a periodic job:
--   DELETE FROM rate_limits WHERE window_start < now() - interval '1 day';

COMMIT;
