-- ================================================================
-- 20260728a — merchants privilege lockdown
-- ================================================================
-- CLOSES: any merchant could promote themselves to platform admin by running
--   await supabase.from('merchants').update({role:'admin'}).eq('id', myUserId)
-- in the browser console with the public anon key.
--
-- Two policies both permit the row owner to update their own row —
--   schema.sql:682  merchants_self       FOR ALL    USING (id = auth.uid() OR is_admin())
--   schema.sql:835  merchants_update_own FOR UPDATE USING (id = auth.uid()) WITH CHECK (...)
-- and `role` / `plan` are plain columns on that same row (schema.sql:52-53).
-- RLS cannot express "these columns are read-only". Column GRANTs can.
--
-- Confirmed 2026-07-28: no REVOKE has ever been applied to `merchants` — the only
-- REVOKEs in this repo are on wallets / bank_transfers / transactions and the
-- wallet + rate-limit functions (20260703_security_wallet_rls.sql:136-173,
-- 20260703_rate_limits.sql:54-55).
--
-- BACKWARD-COMPATIBLE — safe to run before any code deploy:
--   `merchants` is written from exactly ONE place through a session client:
--   use-merchant.ts:53, called only from dashboard/settings/page.tsx:72 and :163.
--   Those two forms post exactly 5 fields, all granted below. Nothing else in
--   app/src updates this table with the anon key.
--
-- SELECT is deliberately NOT touched: use-auth.ts:39 and use-merchant.ts:35 both
-- do select("*"), so revoking it would log every user out. It is also required
-- for the UPDATE's own `.eq("id", ...)` filter to have privilege.
--
-- Run as `postgres` in the Supabase SQL editor. Safe to re-run.
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 0. Pre-flight. A GRANT naming a column that does not exist aborts the whole
--    transaction with a bare "column does not exist". This fails first, loudly,
--    naming the offender — so a schema drift is diagnosable instead of cryptic.
-- ----------------------------------------------------------------
DO $$
DECLARE missing TEXT;
BEGIN
  SELECT string_agg(c, ', ') INTO missing
  FROM unnest(ARRAY['role','plan','is_active','business_name','phone','locale',
                    'auto_fulfill_enabled','min_wallet_balance','preferred_shipping']) AS c
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = c
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'merchants is missing expected column(s): % — reconcile the schema before applying this migration', missing;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- 1. Column-level UPDATE. The browser may write only what the settings form posts.
--    NOT granted, deliberately: role, plan, is_active (privilege), id, email
--    (identity), created_at, and updated_at (set by trg_merchants_updated,
--    schema.sql:625 — a BEFORE trigger's assignment to NEW does not require the
--    caller to hold a column privilege, so granting it is unnecessary).
-- ----------------------------------------------------------------
REVOKE UPDATE ON public.merchants FROM anon, authenticated;

GRANT UPDATE (
  business_name,          -- dashboard/settings/page.tsx:73
  phone,                  -- dashboard/settings/page.tsx:74
  locale,                 -- no UI today; reserved for the planned language switcher
  auto_fulfill_enabled,   -- dashboard/settings/page.tsx:164
  min_wallet_balance,     -- dashboard/settings/page.tsx:165
  preferred_shipping      -- dashboard/settings/page.tsx:166
) ON public.merchants TO authenticated;

-- ----------------------------------------------------------------
-- 2. Defence in depth. Even if a future migration re-grants UPDATE too broadly,
--    role / plan / is_active still cannot be flipped by a browser session.
--    service_role, postgres and supabase_admin are exempt so that server routes
--    (/api/admin/*) and the SQL editor can still administer accounts.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_merchant_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'merchants.role may only be changed server-side';
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'merchants.plan may only be changed server-side';
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'merchants.is_active may only be changed server-side';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_merchants_guard ON public.merchants;
CREATE TRIGGER trg_merchants_guard
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION guard_merchant_privileges();

COMMIT;

-- ================================================================
-- VERIFY (run after COMMIT; expect exactly the 6 granted columns)
-- ================================================================
-- SELECT column_name FROM information_schema.column_privileges
-- WHERE table_schema='public' AND table_name='merchants'
--   AND grantee='authenticated' AND privilege_type='UPDATE'
-- ORDER BY column_name;
--
-- ================================================================
-- ROLLBACK (if this breaks something unexpected)
-- ================================================================
-- DROP TRIGGER IF EXISTS trg_merchants_guard ON public.merchants;
-- GRANT UPDATE ON public.merchants TO authenticated;
