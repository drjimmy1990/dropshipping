/* ================================================================
   DropLinker — Supabase Database Types
   Mirrors the schema in supabase/schema.sql
   ================================================================ */

// ---------- Enums ----------

export type MerchantRole = "merchant" | "admin";
export type MerchantPlan = "free" | "starter" | "growth" | "pro";
export type StorePlatform = "salla" | "zid";
export type SupplierType = "aliexpress" | "cj" | "makhazen" | "direct";
export type MarginType = "percentage" | "fixed";
export type TransactionType = "deposit" | "deduction" | "refund" | "commission";
export type PaymentMethod = "moyasar" | "stripe" | "bank_transfer" | "auto" | "system";
export type OrderStatus = "new" | "processing" | "ordered" | "shipped" | "delivered" | "failed" | "held" | "cancelled";
export type FulfillmentStatus = "pending" | "placed" | "shipped" | "delivered" | "failed" | "cancelled";
export type TransferStatus = "pending" | "approved" | "rejected";
export type InboxStatus = "draft" | "ai_generated" | "pending_review" | "approved" | "rejected" | "published";

// ---------- Tables ----------

export interface Merchant {
  id: string;
  email: string;
  business_name: string;
  phone: string | null;
  role: MerchantRole;
  plan: MerchantPlan;
  locale: string;
  is_active: boolean;
  default_margin_type: MarginType;
  default_margin_value: number;
  auto_fulfill_enabled: boolean;
  min_wallet_balance: number;
  preferred_shipping: string | null;
  fallback_supplier: SupplierType | null;
  price_sync_interval_hours: number;
  stock_min_threshold: number;
  stock_auto_hide: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  merchant_id: string;
  balance: number;
  reserved: number;
  auto_topup_enabled: boolean;
  auto_topup_threshold: number | null;
  auto_topup_amount: number | null;
  low_balance_alert: number | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  merchant_id: string;
  type: TransactionType;
  method: PaymentMethod;
  amount: number;
  balance_after: number;
  order_id: string | null;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface Store {
  id: string;
  merchant_id: string;
  platform: StorePlatform;
  store_name: string;
  store_url: string | null;
  is_active: boolean;
  last_sync: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierAccount {
  id: string;
  merchant_id: string;
  supplier: SupplierType;
  is_active: boolean;
  is_default: boolean;
  last_health_check: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  merchant_id: string;
  supplier_account_id: string | null;
  store_id: string | null;
  supplier: SupplierType;
  supplier_product_id: string;
  supplier_url: string | null;
  title_en: string | null;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  supplier_cost: number;
  supplier_currency: string;
  retail_price: number;
  margin_type: MarginType;
  margin_value: number;
  stock_quantity: number;
  min_stock_threshold: number;
  auto_hide_when_low: boolean;
  in_stock: boolean;
  is_active: boolean;
  images: string[];
  variants: Record<string, unknown>[];
  category: string | null;
  salla_category_id: number | null;
  tags: string[] | null;
  store_product_id: string | null;
  last_price_check: string | null;
  last_stock_check: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  merchant_id: string;
  store_order_id: string;
  customer_info: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  total_amount: number;
  total_cost: number;
  commission_amount: number;
  ad_cost: number;
  net_profit: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  order_items?: OrderItem[];
  fulfillment?: Fulfillment | null;
  store?: Store | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  supplier_cost: number;
  variant_info: Record<string, unknown> | null;
  created_at: string;
  // Joined
  product?: Product | null;
}

export interface Fulfillment {
  id: string;
  order_id: string;
  merchant_id: string;
  supplier: SupplierType;
  supplier_order_id: string | null;
  tracking_number: string | null;
  carrier: string | null;
  cost: number;
  commission: number;
  status: FulfillmentStatus;
  error_message: string | null;
  placed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankTransfer {
  id: string;
  merchant_id: string;
  amount: number;
  receipt_url: string;
  bank_name: string | null;
  sender_name: string | null;
  reference_number: string | null;
  status: TransferStatus;
  admin_notes: string | null;
  approved_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Joined
  merchant?: Merchant | null;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  name_ar: string | null;
  monthly_price: number;
  yearly_price: number;
  max_stores: number;
  max_products: number;
  commission_pct: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface PlatformConfig {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

export interface Notification {
  id: string;
  merchant_id: string;
  channel: "in_app" | "email" | "sms";
  title: string;
  body: string;
  type: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ---------- Aggregated View Types ----------

export interface DashboardStats {
  walletBalance: number;
  ordersToday: number;
  ordersByStatus: Record<OrderStatus, number>;
  activeProducts: number;
  outOfStockProducts: number;
  revenueThisMonth: number;
}
