-- Stores: merchants can see their own stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores_select_own" ON stores FOR
SELECT USING (merchant_id = auth.uid ());

CREATE POLICY "stores_insert_own" ON stores FOR
INSERT
WITH
    CHECK (merchant_id = auth.uid ());

CREATE POLICY "stores_update_own" ON stores FOR
UPDATE USING (merchant_id = auth.uid ());

-- Supplier Accounts: merchants can see their own
ALTER TABLE supplier_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select_own" ON supplier_accounts FOR
SELECT USING (merchant_id = auth.uid ());