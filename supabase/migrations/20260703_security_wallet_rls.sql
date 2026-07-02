-- ================================================================
-- DropLinker — Security hardening: wallet fraud + RLS write-lockdown
-- Phase 1 of the security remediation. Run in the Supabase SQL editor.
--
-- Closes: CRIT-2 (browser self-mint via wallet_credit),
--         CRIT-3 (negative amount inverts the operation),
--         CRIT-4 (merchant UPDATEs own wallet balance),
--         CRIT-5 (merchant self-approves own bank transfer),
--         + is_admin() search_path privesc, + content-table WITH CHECK gaps.
--
-- NOTE on FORCE ROW LEVEL SECURITY: intentionally NOT applied. It would make
-- is_admin() recurse on `merchants` and would subject the SECURITY DEFINER
-- wallet functions (owner) to RLS, denying their cross-merchant writes. It does
-- not constrain service_role (BYPASSRLS) anyway. ENABLE + REVOKE + per-command
-- policies below are the real gate.
-- ================================================================

BEGIN;

-- ---------------------------------------------------------------
-- 1. Harden the gate function FIRST (governs every policy below)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM merchants WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------
-- 2. Wallet functions: positive-amount guard + SECURITY DEFINER
--    + pinned search_path. Bodies otherwise unchanged.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION wallet_credit(
  p_merchant_id UUID,
  p_amount NUMERIC,
  p_method payment_method,
  p_description TEXT DEFAULT NULL,
  p_reference TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet_id UUID;
  v_new_balance NUMERIC;
  v_txn_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'wallet_credit: amount must be positive (got %)', p_amount;
  END IF;

  SELECT id, balance + p_amount INTO v_wallet_id, v_new_balance
  FROM wallets WHERE merchant_id = p_merchant_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'wallet_credit: no wallet for merchant %', p_merchant_id;
  END IF;

  UPDATE wallets SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO transactions (wallet_id, merchant_id, type, method, amount, balance_after, description, reference_id)
  VALUES (v_wallet_id, p_merchant_id, 'deposit', p_method, p_amount, v_new_balance, p_description, p_reference)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;

CREATE OR REPLACE FUNCTION wallet_deduct(
  p_merchant_id UUID,
  p_amount NUMERIC,
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_new_balance NUMERIC;
  v_txn_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'wallet_deduct: amount must be positive (got %)', p_amount;
  END IF;

  SELECT id, balance INTO v_wallet_id, v_balance
  FROM wallets WHERE merchant_id = p_merchant_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'wallet_deduct: no wallet for merchant %', p_merchant_id;
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance: % < %', v_balance, p_amount;
  END IF;

  v_new_balance := v_balance - p_amount;

  UPDATE wallets SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO transactions (wallet_id, merchant_id, type, method, amount, balance_after, order_id, description)
  VALUES (v_wallet_id, p_merchant_id, 'deduction', 'system', -p_amount, v_new_balance, p_order_id, p_description)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;

-- ---------------------------------------------------------------
-- 3. Signup wallet trigger must be DEFINER so auto-create still
--    works after the wallets DML revoke below.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_merchant_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO wallets (merchant_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------
-- 4. Lock EXECUTE so the browser (anon/authenticated) cannot call
--    the money functions. Only service_role (server routes) may.
-- ---------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION wallet_credit(UUID, NUMERIC, payment_method, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION wallet_deduct(UUID, NUMERIC, UUID, TEXT)                 FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION wallet_credit(UUID, NUMERIC, payment_method, TEXT, TEXT) TO service_role;
GRANT  EXECUTE ON FUNCTION wallet_deduct(UUID, NUMERIC, UUID, TEXT)                 TO service_role;

-- ---------------------------------------------------------------
-- 5. wallets: merchants read-only; no direct DML from the browser.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS wallets_self ON wallets;
CREATE POLICY wallets_select ON wallets FOR SELECT
  USING (merchant_id = auth.uid() OR is_admin());
CREATE POLICY wallets_admin ON wallets FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
REVOKE INSERT, UPDATE, DELETE ON wallets FROM anon, authenticated;

-- ---------------------------------------------------------------
-- 6. bank_transfers: merchants may request (INSERT pending) + read;
--    approve/reject (UPDATE) and DELETE are admin/server-only.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS transfers_self ON bank_transfers;
CREATE POLICY transfers_select ON bank_transfers FOR SELECT
  USING (merchant_id = auth.uid() OR is_admin());
CREATE POLICY transfers_insert ON bank_transfers FOR INSERT
  WITH CHECK (merchant_id = auth.uid() AND status = 'pending');
CREATE POLICY transfers_admin ON bank_transfers FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
REVOKE UPDATE, DELETE ON bank_transfers FROM anon, authenticated;

-- ---------------------------------------------------------------
-- 7. transactions: merchants read-only ledger. Inserts happen only
--    inside the DEFINER wallet functions (run as owner, unaffected).
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS txn_self ON transactions;
CREATE POLICY txn_select ON transactions FOR SELECT
  USING (merchant_id = auth.uid() OR is_admin());
CREATE POLICY txn_admin ON transactions FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
REVOKE INSERT, UPDATE, DELETE ON transactions FROM anon, authenticated;

-- ---------------------------------------------------------------
-- 8. Content tables: add WITH CHECK so a merchant cannot INSERT/UPDATE
--    rows under another merchant (social_accounts holds OAuth tokens).
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS branding_self ON store_branding;
CREATE POLICY branding_self ON store_branding FOR ALL
  USING (merchant_id = auth.uid() OR is_admin())
  WITH CHECK (merchant_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS content_self ON content_assets;
CREATE POLICY content_self ON content_assets FOR ALL
  USING (merchant_id = auth.uid() OR is_admin())
  WITH CHECK (merchant_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS social_self ON social_accounts;
CREATE POLICY social_self ON social_accounts FOR ALL
  USING (merchant_id = auth.uid() OR is_admin())
  WITH CHECK (merchant_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS schedule_self ON scheduled_posts;
CREATE POLICY schedule_self ON scheduled_posts FOR ALL
  USING (merchant_id = auth.uid() OR is_admin())
  WITH CHECK (merchant_id = auth.uid() OR is_admin());

COMMIT;
