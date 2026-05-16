-- ================================================================
-- DropLinker — Full Supabase Schema
-- Run this in Supabase SQL Editor (in order)
-- ================================================================

-- ======================== ENUMS ========================

CREATE TYPE merchant_role AS ENUM ('merchant', 'admin');

CREATE TYPE merchant_plan AS ENUM ('free', 'starter', 'growth', 'pro');

CREATE TYPE store_platform AS ENUM ('salla', 'zid');

CREATE TYPE supplier_type AS ENUM ('aliexpress', 'cj', 'makhazen');

CREATE TYPE margin_type AS ENUM ('percentage', 'fixed');

CREATE TYPE transaction_type AS ENUM ('deposit', 'deduction', 'refund', 'commission');

CREATE TYPE payment_method AS ENUM ('moyasar', 'stripe', 'bank_transfer', 'auto', 'system');

CREATE TYPE order_status AS ENUM ('new', 'processing', 'ordered', 'shipped', 'delivered', 'failed', 'held', 'cancelled');

CREATE TYPE fulfillment_status AS ENUM ('pending', 'placed', 'shipped', 'delivered', 'failed', 'cancelled');

CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE inbox_status AS ENUM ('draft', 'ai_generated', 'pending_review', 'approved', 'rejected', 'published');

CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms');

CREATE TYPE sync_action AS ENUM ('price_updated', 'stock_updated', 'hidden', 'restored', 'no_change');

-- ======================== 1. MERCHANTS ========================

CREATE TABLE merchants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT,
  role merchant_role NOT NULL DEFAULT 'merchant',
  plan merchant_plan NOT NULL DEFAULT 'free',
  locale TEXT NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  is_active BOOLEAN NOT NULL DEFAULT true,

-- Default pricing rules
default_margin_type margin_type NOT NULL DEFAULT 'percentage',
default_margin_value NUMERIC(10, 2) NOT NULL DEFAULT 30.00,

-- Fulfillment preferences
auto_fulfill_enabled BOOLEAN NOT NULL DEFAULT false,
min_wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
preferred_shipping TEXT DEFAULT 'standard',
fallback_supplier supplier_type,

-- Sync preferences


price_sync_interval_hours INTEGER NOT NULL DEFAULT 4,
  stock_min_threshold INTEGER NOT NULL DEFAULT 5,
  stock_auto_hide BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 2. WALLETS ========================

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    merchant_id UUID NOT NULL UNIQUE REFERENCES merchants (id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    reserved NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (reserved >= 0),
    auto_topup_enabled BOOLEAN NOT NULL DEFAULT false,
    auto_topup_threshold NUMERIC(10, 2) DEFAULT 100.00,
    auto_topup_amount NUMERIC(10, 2) DEFAULT 500.00,
    low_balance_alert NUMERIC(10, 2) DEFAULT 50.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 3. TRANSACTIONS ========================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    wallet_id UUID NOT NULL REFERENCES wallets (id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    method payment_method NOT NULL DEFAULT 'system',
    amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    order_id UUID, -- FK added after orders table
    description TEXT,
    reference_id TEXT, -- external payment ref
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 4. STORES ========================

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    merchant_id UUID NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
    platform store_platform NOT NULL,
    store_name TEXT NOT NULL,
    store_url TEXT,
    access_token TEXT, -- encrypted at app level
    refresh_token TEXT,
    webhook_secret TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 5. SUPPLIER ACCOUNTS ========================

CREATE TABLE supplier_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    merchant_id UUID NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
    supplier supplier_type NOT NULL,
    api_key TEXT,
    access_token TEXT,
    refresh_token TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    last_health_check TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 6. PRODUCTS ========================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  supplier_account_id UUID REFERENCES supplier_accounts(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,

-- Supplier info
supplier supplier_type NOT NULL,
supplier_product_id TEXT NOT NULL,
supplier_url TEXT,

-- Bilingual content
title_en TEXT,
title_ar TEXT,
description_en TEXT,
description_ar TEXT,

-- Pricing
supplier_cost NUMERIC(10, 2) NOT NULL,
supplier_currency TEXT NOT NULL DEFAULT 'SAR',
retail_price NUMERIC(10, 2) NOT NULL,
margin_type margin_type NOT NULL DEFAULT 'percentage',
margin_value NUMERIC(10, 2) NOT NULL DEFAULT 30.00,

-- Stock
stock_quantity INTEGER NOT NULL DEFAULT 0,
min_stock_threshold INTEGER NOT NULL DEFAULT 5,
auto_hide_when_low BOOLEAN NOT NULL DEFAULT true,
in_stock BOOLEAN NOT NULL DEFAULT true,
is_active BOOLEAN NOT NULL DEFAULT true,

-- Media & variants
images JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  tags TEXT[],

-- Store sync
store_product_id TEXT, -- ID on Salla/Zid after publishing

-- Shipping (from AliExpress import wizard)
shipping_cost NUMERIC(10, 2) DEFAULT 0,
shipping_method TEXT,
estimated_delivery TEXT,

-- Sync timestamps


last_price_check TIMESTAMPTZ,
  last_stock_check TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 7. ORDERS ========================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  store_order_id TEXT NOT NULL,
  customer_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_amount NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ad_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(10,2) GENERATED ALWAYS AS (total_amount - total_cost - commission_amount - ad_cost) STORED,
  status order_status NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK on transactions
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL;

-- ======================== 8. ORDER ITEMS ========================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id UUID REFERENCES products (id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    supplier_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    variant_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 9. FULFILLMENTS ========================

CREATE TABLE fulfillments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
    supplier supplier_type NOT NULL,
    supplier_order_id TEXT,
    tracking_number TEXT,
    carrier TEXT,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    commission NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status fulfillment_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    placed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 10. BANK TRANSFERS ========================

CREATE TABLE bank_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    merchant_id UUID NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    receipt_url TEXT NOT NULL,
    bank_name TEXT,
    sender_name TEXT,
    reference_number TEXT,
    status transfer_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    approved_by UUID REFERENCES merchants (id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 11. SUBSCRIPTION TIERS ========================

CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  monthly_price NUMERIC(10,2) NOT NULL,
  yearly_price NUMERIC(10,2) NOT NULL,
  max_stores INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER NOT NULL DEFAULT 50,
  commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 12. PLATFORM CONFIG ========================

CREATE TABLE platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 13. PRICING RULES ========================
-- Automated Pricing Engine — per-product or merchant-wide rules

CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    merchant_id UUID NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
    product_id UUID REFERENCES products (id) ON DELETE CASCADE, -- NULL = default rule
    margin_type margin_type NOT NULL DEFAULT 'percentage',
    margin_value NUMERIC(10, 2) NOT NULL,
    min_retail_price NUMERIC(10, 2), -- floor price
    max_retail_price NUMERIC(10, 2), -- ceiling price
    auto_sync_enabled BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (merchant_id, product_id)
);

-- ======================== 14. PRICE SYNC LOGS ========================

CREATE TABLE price_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
    old_supplier_cost NUMERIC(10, 2) NOT NULL,
    new_supplier_cost NUMERIC(10, 2) NOT NULL,
    old_retail_price NUMERIC(10, 2) NOT NULL,
    new_retail_price NUMERIC(10, 2) NOT NULL,
    margin_applied margin_type NOT NULL,
    margin_value NUMERIC(10, 2) NOT NULL,
    store_updated BOOLEAN NOT NULL DEFAULT false,
    action sync_action NOT NULL DEFAULT 'no_change',
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 15. STOCK SYNC LOGS ========================

CREATE TABLE stock_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
    old_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    action sync_action NOT NULL,
    store_updated BOOLEAN NOT NULL DEFAULT false,
    reason TEXT, -- e.g. "Below threshold (5)", "Out of stock"
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 16. PRODUCT INBOX ========================
-- AI Quality Gate — review AI-generated content before publishing

CREATE TABLE product_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,

-- Source product data (from supplier)
source_title TEXT NOT NULL,
  source_description TEXT,
  source_images JSONB DEFAULT '[]'::jsonb,
  source_price NUMERIC(10,2),
  source_currency TEXT DEFAULT 'USD',
  source_url TEXT,
  supplier supplier_type NOT NULL,
  supplier_product_id TEXT NOT NULL,

-- AI-generated content
ai_title_en TEXT,
  ai_title_ar TEXT,
  ai_description_en TEXT,
  ai_description_ar TEXT,
  ai_images JSONB DEFAULT '[]'::jsonb, -- processed/enhanced images
  ai_tags TEXT[],
  ai_category TEXT,

-- Conversion data
converted_price_sar NUMERIC(10, 2), -- USD→SAR converted
measurements_converted BOOLEAN NOT NULL DEFAULT false, -- inch→cm done?

-- Review workflow


status inbox_status NOT NULL DEFAULT 'draft',
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 17. ANALYTICS DAILY ========================
-- Daily merchant metrics for profit calc + trend analysis

CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  orders_count INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  ad_spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(12,2) NOT NULL DEFAULT 0,
  products_imported INTEGER NOT NULL DEFAULT 0,
  products_sold INTEGER NOT NULL DEFAULT 0,
  top_products JSONB DEFAULT '[]'::jsonb,
  top_categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, date)
);

-- ======================== 18. TREND REPORTS ========================
-- Weekly niche/category trend analysis

CREATE TABLE trend_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE, -- NULL = global
  week_start DATE NOT NULL,
  category TEXT NOT NULL,
  niche TEXT,
  orders_this_week INTEGER NOT NULL DEFAULT 0,
  orders_prev_week INTEGER NOT NULL DEFAULT 0,
  growth_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  revenue_this_week NUMERIC(12,2) NOT NULL DEFAULT 0,
  recommendation TEXT, -- AI-generated suggestion
  recommended_products JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== 19. NOTIFICATIONS ========================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL, -- 'low_balance', 'order_failed', 'stock_alert', etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== INDEXES ========================

-- Merchants
CREATE INDEX idx_merchants_role ON merchants (role);

CREATE INDEX idx_merchants_plan ON merchants (plan);

-- Wallets
CREATE INDEX idx_wallets_merchant ON wallets (merchant_id);

-- Transactions
CREATE INDEX idx_transactions_wallet ON transactions (wallet_id);

CREATE INDEX idx_transactions_merchant ON transactions (merchant_id);

CREATE INDEX idx_transactions_type ON transactions(type);

CREATE INDEX idx_transactions_created ON transactions (created_at DESC);

-- Stores
CREATE INDEX idx_stores_merchant ON stores (merchant_id);

CREATE INDEX idx_stores_platform ON stores (platform);

-- Products
CREATE INDEX idx_products_merchant ON products (merchant_id);

CREATE INDEX idx_products_supplier ON products (supplier);

CREATE INDEX idx_products_store ON products (store_id);

CREATE INDEX idx_products_active ON products (is_active, in_stock);

CREATE INDEX idx_products_category ON products (category);

CREATE INDEX idx_products_last_price ON products (last_price_check);

CREATE INDEX idx_products_last_stock ON products (last_stock_check);

-- Orders
CREATE INDEX idx_orders_merchant ON orders (merchant_id);

CREATE INDEX idx_orders_store ON orders (store_id);

CREATE INDEX idx_orders_status ON orders (status);

CREATE INDEX idx_orders_created ON orders (created_at DESC);

-- Fulfillments
CREATE INDEX idx_fulfillments_order ON fulfillments (order_id);

CREATE INDEX idx_fulfillments_status ON fulfillments (status);

-- Bank Transfers
CREATE INDEX idx_transfers_merchant ON bank_transfers (merchant_id);

CREATE INDEX idx_transfers_status ON bank_transfers (status);

-- Product Inbox
CREATE INDEX idx_inbox_merchant ON product_inbox (merchant_id);

CREATE INDEX idx_inbox_status ON product_inbox (status);

-- Analytics
CREATE INDEX idx_analytics_merchant_date ON analytics_daily (merchant_id, date DESC);

-- Notifications
CREATE INDEX idx_notifications_merchant ON notifications (merchant_id);

CREATE INDEX idx_notifications_unread ON notifications (merchant_id, is_read)
WHERE
    NOT is_read;

-- Sync logs
CREATE INDEX idx_price_sync_product ON price_sync_logs (product_id);

CREATE INDEX idx_stock_sync_product ON stock_sync_logs (product_id);

-- ======================== FUNCTIONS ========================

-- Auto-calculate retail price from supplier cost + margin
CREATE OR REPLACE FUNCTION calculate_retail_price(
  p_supplier_cost NUMERIC,
  p_margin_type margin_type,
  p_margin_value NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF p_margin_type = 'percentage' THEN
    RETURN ROUND(p_supplier_cost * (1 + p_margin_value / 100), 2);
  ELSE
    RETURN ROUND(p_supplier_cost + p_margin_value, 2);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Wallet credit (atomic)
CREATE OR REPLACE FUNCTION wallet_credit(
  p_merchant_id UUID,
  p_amount NUMERIC,
  p_method payment_method,
  p_description TEXT DEFAULT NULL,
  p_reference TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_new_balance NUMERIC;
  v_txn_id UUID;
BEGIN
  SELECT id, balance + p_amount INTO v_wallet_id, v_new_balance
  FROM wallets WHERE merchant_id = p_merchant_id FOR UPDATE;

  UPDATE wallets SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO transactions (wallet_id, merchant_id, type, method, amount, balance_after, description, reference_id)
  VALUES (v_wallet_id, p_merchant_id, 'deposit', p_method, p_amount, v_new_balance, p_description, p_reference)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$ LANGUAGE plpgsql;

-- Wallet deduct (atomic, fails if insufficient)
CREATE OR REPLACE FUNCTION wallet_deduct(
  p_merchant_id UUID,
  p_amount NUMERIC,
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_new_balance NUMERIC;
  v_txn_id UUID;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM wallets WHERE merchant_id = p_merchant_id FOR UPDATE;

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
$$ LANGUAGE plpgsql;

-- Auto-create wallet when merchant is inserted
CREATE OR REPLACE FUNCTION create_merchant_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (merchant_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_merchant_wallet
  AFTER INSERT ON merchants
  FOR EACH ROW EXECUTE FUNCTION create_merchant_wallet();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_merchants_updated BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_fulfillments_updated BEFORE UPDATE ON fulfillments FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_inbox_updated BEFORE UPDATE ON product_inbox FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ======================== RLS POLICIES ========================

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

ALTER TABLE supplier_accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;

ALTER TABLE bank_transfers ENABLE ROW LEVEL SECURITY;

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE price_sync_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE stock_sync_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE product_inbox ENABLE ROW LEVEL SECURITY;

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

ALTER TABLE trend_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM merchants WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Merchants: own row or admin
CREATE POLICY merchants_self ON merchants FOR ALL USING (
    id = auth.uid ()
    OR is_admin ()
);

-- Wallets: own or admin
CREATE POLICY wallets_self ON wallets FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Transactions: own or admin
CREATE POLICY txn_self ON transactions FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Stores: own or admin
CREATE POLICY stores_self ON stores FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Supplier accounts: own or admin
CREATE POLICY suppliers_self ON supplier_accounts FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Products: own or admin
CREATE POLICY products_self ON products FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Orders: own or admin
CREATE POLICY orders_self ON orders FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Order items: via order ownership
CREATE POLICY items_self ON order_items FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM orders
        WHERE
            orders.id = order_items.order_id
            AND (
                orders.merchant_id = auth.uid ()
                OR is_admin ()
            )
    )
);

-- Fulfillments: own or admin
CREATE POLICY fulfill_self ON fulfillments FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Bank transfers: own or admin
CREATE POLICY transfers_self ON bank_transfers FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Pricing rules: own or admin
CREATE POLICY pricing_self ON pricing_rules FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Sync logs: own or admin
CREATE POLICY price_logs_self ON price_sync_logs FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

CREATE POLICY stock_logs_self ON stock_sync_logs FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Product inbox: own or admin
CREATE POLICY inbox_self ON product_inbox FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Analytics: own or admin
CREATE POLICY analytics_self ON analytics_daily FOR ALL USING (
    merchant_id = auth.uid ()
    OR is_admin ()
);

-- Trends: own, global, or admin
CREATE POLICY trends_self ON trend_reports FOR ALL USING (
    merchant_id = auth.uid ()
    OR merchant_id IS NULL
    OR is_admin ()
);

-- Notifications: own only
CREATE POLICY notif_self ON notifications FOR ALL USING (merchant_id = auth.uid ());

-- Platform config: read all, write admin only
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_read ON platform_config FOR SELECT USING (true);

CREATE POLICY config_write ON platform_config FOR ALL USING (is_admin ());

-- Subscription tiers: read all, write admin only
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tiers_read ON subscription_tiers FOR
SELECT USING (true);

CREATE POLICY tiers_write ON subscription_tiers FOR ALL USING (is_admin ());

-- ======================== SEED DATA ========================

-- Default subscription tiers
INSERT INTO subscription_tiers (name, name_ar, monthly_price, yearly_price, max_stores, max_products, commission_pct, sort_order, features) VALUES
  ('Free', 'مجاني', 0, 0, 1, 25, 8.0, 0, '["Basic product import", "Manual fulfillment"]'::jsonb),
  ('Starter', 'المبتدئ', 49, 470, 2, 100, 5.0, 1, '["Auto-fulfillment", "AI descriptions", "Email support"]'::jsonb),
  ('Growth', 'النمو', 129, 1240, 5, 500, 3.0, 2, '["Priority fulfillment", "Advanced analytics", "Trend reports", "Priority support"]'::jsonb),
  ('Pro', 'الاحترافي', 299, 2870, 999, 9999, 1.0, 3, '["Unlimited everything", "Custom margin rules", "API access", "Dedicated support"]'::jsonb);

-- Default platform config
INSERT INTO platform_config (key, value, description) VALUES
  ('commission_mode', '"commission"'::jsonb, 'commission or subscription_only'),
  ('default_currency', '"SAR"'::jsonb, 'Platform default currency'),
  ('usd_to_sar_rate', '3.75'::jsonb, 'USD to SAR exchange rate'),
  ('moyasar_enabled', 'true'::jsonb, 'Enable Moyasar payments'),
  ('stripe_enabled', 'true'::jsonb, 'Enable Stripe payments'),
  ('bank_transfer_enabled', 'true'::jsonb, 'Enable bank transfer top-ups'),
  ('ai_descriptions_enabled', 'true'::jsonb, 'Enable AI product descriptions'),
  ('price_sync_global_interval', '4'::jsonb, 'Default hours between price syncs'),
  ('stock_sync_global_interval', '1'::jsonb, 'Default hours between stock syncs'),
  ('platform_name', '"DropLinker"'::jsonb, 'Platform display name'),
  ('support_email', '"support@droplinker.com"'::jsonb, 'Support email');

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchants_insert_own" ON merchants FOR INSERT

WITH CHECK (id = auth.uid ());

CREATE POLICY "merchants_select_own" ON merchants FOR
SELECT USING (id = auth.uid ());

CREATE POLICY "merchants_update_own" ON merchants FOR
UPDATE USING (id = auth.uid ())
WITH
    CHECK (id = auth.uid ());

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

ALTER TABLE stores ADD COLUMN salla_merchant_id TEXT;

-- ============================================================
-- Platform Feeds Table — Stores curated AliExpress feed configs
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    feed_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    display_name_ar TEXT,
    category TEXT DEFAULT 'general',
    icon TEXT DEFAULT '📦',
    product_count INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE platform_feeds ENABLE ROW LEVEL SECURITY;

-- Everyone can read enabled feeds (merchants need to see them)
CREATE POLICY "Anyone can read enabled feeds" ON platform_feeds FOR
SELECT USING (is_enabled = true);

-- Only super admins can manage feeds
CREATE POLICY "Super admins can manage feeds" ON platform_feeds FOR ALL USING (
    auth.uid () IN (
        SELECT id
        FROM auth.users
        WHERE
            raw_user_meta_data ->> 'role' = 'super_admin'
    )
);

-- Seed the top curated feeds
INSERT INTO
    platform_feeds (
        feed_name,
        display_name,
        display_name_ar,
        category,
        icon,
        product_count,
        is_enabled,
        sort_order
    )
VALUES (
        'DS_NewArrivals',
        'New Arrivals',
        'وصل حديثاً',
        'trending',
        '🆕',
        14010,
        true,
        1
    ),
    (
        'Bestseller 2024',
        'Bestsellers 2024',
        'الأكثر مبيعاً',
        'trending',
        '🏆',
        201065,
        true,
        2
    ),
    (
        'DS_ConsumerElectronics_bestsellers',
        'Consumer Electronics',
        'إلكترونيات',
        'electronics',
        '📱',
        19470,
        true,
        3
    ),
    (
        'DS_Home&Kitchen_bestsellers',
        'Home & Kitchen',
        'المنزل والمطبخ',
        'home',
        '🏠',
        12300,
        true,
        4
    ),
    (
        'DS_Sports&Outdoors_bestsellers',
        'Sports & Outdoors',
        'رياضة',
        'sports',
        '⚽',
        27495,
        true,
        5
    ),
    (
        'SA_Clothing&Shoes',
        'Fashion (SA)',
        'أزياء',
        'fashion',
        '👗',
        13050,
        true,
        6
    ),
    (
        'DS_Beauty_bestsellers',
        'Beauty',
        'جمال',
        'beauty',
        '💄',
        2594,
        true,
        7
    ),
    (
        'DS_Automobile&Accessories_bestsellers',
        'Auto & Accessories',
        'سيارات',
        'auto',
        '🚗',
        20340,
        true,
        8
    ),
    (
        'DS_ElectronicComponents_bestsellers',
        'Electronic Components',
        'مكونات إلكترونية',
        'electronics',
        '🔌',
        2580,
        true,
        9
    ),
    (
        'DS_Sports-Clothing&Shoes',
        'Sportswear',
        'ملابس رياضية',
        'fashion',
        '🏃',
        7990,
        true,
        10
    ),
    (
        'DS_Christmas-Decor',
        'Seasonal / Christmas',
        'موسمي',
        'seasonal',
        '🎄',
        6840,
        false,
        11
    ),
    (
        'DS center',
        'DS Center (General)',
        'مركز دروبشيبنج',
        'general',
        '📦',
        0,
        false,
        12
    ),
    (
        'DS_HealthAndBeauty',
        'Health & Beauty',
        'صحة وجمال',
        'beauty',
        '💊',
        0,
        false,
        13
    ),
    (
        'DS_Toys&Games_bestsellers',
        'Toys & Games',
        'ألعاب',
        'toys',
        '🎮',
        0,
        false,
        14
    ),
    (
        'DS_Jewelry&Watches_bestsellers',
        'Jewelry & Watches',
        'مجوهرات وساعات',
        'fashion',
        '💎',
        0,
        false,
        15
    ),
    (
        'DS_Home-Textile_bestsellers',
        'Home Textile',
        'مفروشات',
        'home',
        '🛏️',
        0,
        false,
        16
    ),
    (
        'DS_Home-Improvement_bestsellers',
        'Home Improvement',
        'تحسين المنزل',
        'home',
        '🔨',
        0,
        false,
        17
    ),
    (
        'DS_Security&Protection_bestsellers',
        'Security & Protection',
        'أمن وحماية',
        'electronics',
        '🔒',
        0,
        false,
        18
    ),
    (
        'DS_Tools_bestsellers',
        'Tools',
        'أدوات',
        'tools',
        '🔧',
        0,
        false,
        19
    ),
    (
        'DS_Office&School-Supplies_bestsellers',
        'Office & School',
        'مكتبية ومدرسية',
        'office',
        '📚',
        0,
        false,
        20
    ) ON CONFLICT (feed_name) DO NOTHING;

-- ================================================================
-- Phase 4D: Product Management Hub
-- Salla category caching + multi-store support
-- ================================================================

-- ---------- Salla Categories Cache ----------
-- Caches categories from each merchant's Salla store
-- for category pickers in import wizard and product editor.

CREATE TABLE IF NOT EXISTS salla_categories (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
    salla_category_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    parent_id BIGINT DEFAULT 0,
    status TEXT DEFAULT 'active',
    synced_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (store_id, salla_category_id)
);

CREATE INDEX idx_salla_categories_store ON salla_categories (store_id);

-- RLS: merchants can only see categories for their own stores
ALTER TABLE salla_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salla_categories_select_via_store" ON salla_categories FOR
SELECT USING (
        store_id IN (
            SELECT id
            FROM stores
            WHERE
                merchant_id = auth.uid ()
        )
    );

-- Allow service role to INSERT/UPDATE/DELETE (used by API routes with adminClient)
-- No merchant-level write policies needed — only server writes to this table.

-- ---------- Products: add category_id for Salla category mapping ----------
-- Links a product to its Salla category ID (nullable — not all products have categories)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS salla_category_id BIGINT;

-- ---------- Products: add source tracking ----------
-- 'aliexpress' | 'cj' | 'makhazen' | 'direct' (merchant's own Salla product)
-- The existing 'supplier' column already handles this, but we need to allow 'direct'
-- NOTE: supplier column is TEXT type, no enum constraint — 'direct' works as-is.

-- ---------- Stores: ensure multi-store index ----------
CREATE INDEX IF NOT EXISTS idx_stores_merchant_platform ON stores (merchant_id, platform);

-- Add the missing column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS salla_category_id BIGINT DEFAULT NULL;

-- Create the categories cache table
CREATE TABLE IF NOT EXISTS salla_categories (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
    salla_category_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    parent_id BIGINT DEFAULT 0,
    status TEXT DEFAULT 'active',
    synced_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (store_id, salla_category_id)
);

CREATE INDEX IF NOT EXISTS idx_salla_categories_store ON salla_categories (store_id);

ALTER TABLE salla_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants see own store categories" ON salla_categories FOR
SELECT USING (
        store_id IN (
            SELECT id
            FROM stores
            WHERE
                merchant_id = auth.uid ()
        )
    );

ALTER TYPE supplier_type ADD VALUE IF NOT EXISTS 'direct';

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

-- ================================================================
-- Phase 7B — Zid Platform Integration
-- Run in Supabase SQL Editor
-- ================================================================

-- Add a generic platform_store_id column
-- Zid needs Store-Id header, Salla uses salla_merchant_id
ALTER TABLE stores ADD COLUMN IF NOT EXISTS platform_store_id TEXT;

-- Backfill existing Salla stores
UPDATE stores
SET
    platform_store_id = salla_merchant_id
WHERE
    platform = 'salla'
    AND salla_merchant_id IS NOT NULL
    AND platform_store_id IS NULL;

-- Add partner_token column (Zid's partner-level Authorization JWT)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS partner_token TEXT;