# DropLinker — Development TODO

> **Last Updated:** 2026-05-15
> **Current Phase:** Phase 2 (Live Data Migration)

---

## ✅ Phase 1 — Foundation (COMPLETED)

- [x] Next.js 16 + Tailwind project setup
- [x] 22-route frontend UI shell (all mock data)
- [x] Supabase project created + `.env.local` configured
- [x] Database schema deployed (19 tables, 11 enums)
- [x] RLS policies on all tables + `is_admin()` helper
- [x] Wallet functions: `wallet_credit()`, `wallet_deduct()`
- [x] Auto-create wallet trigger on merchant signup
- [x] Updated_at triggers on 7 tables
- [x] 20+ indexes on frequently queried columns
- [x] Seed data: 4 subscription tiers + 11 platform config entries
- [x] Supabase Auth (email/password)
- [x] Server client (`createClient()`) + admin client (`createAdminClient()`)
- [x] Auth middleware protecting `/dashboard/*`
- [x] Signup action → merchant + wallet creation (admin client bypass)
- [x] Login → redirect to dashboard
- [x] Salla Partner Portal app configured (`droplinker`)
- [x] OAuth initiation (`/api/auth/salla`) with scopes
- [x] OAuth callback → token exchange (form-urlencoded fix)
- [x] Store upsert with `salla_merchant_id` for webhook matching
- [x] Dashboard integrations: live status, disconnect, reconnect
- [x] API route: `/api/stores/[id]/disconnect`
- [x] n8n webhook endpoint: `POST /webhook/salla-webhook`
- [x] n8n token validation (authorization header check)
- [x] n8n event router (Switch node: order.created, order.updated, app.installed, app.uninstalled)
- [x] n8n `app.uninstalled` → Supabase update `is_active = false`
- [x] n8n `app.installed` → Respond 200

---

## 🔄 Phase 2 — Live Data Migration (IN PROGRESS)

> **Goal:** Replace ALL mock data with live Supabase queries

### Dashboard Overview (`/dashboard`)
- [ ] Create server action: `getDashboardStats(merchantId)`
  - [ ] Query wallet balance from `wallets`
  - [ ] Query order counts by status from `orders`
  - [ ] Query product counts (active, out-of-stock) from `products`
  - [ ] Query recent activity from `notifications` or `orders`
- [ ] Wire dashboard widgets to real data
- [ ] Add "quick top-up" CTA linking to wallet page
- [ ] Add alerts widget (low balance, failed orders)

### Wallet Page (`/dashboard/wallet`)
- [ ] Create server action: `getWalletData(merchantId)`
  - [ ] Fetch wallet balance + reserved from `wallets`
  - [ ] Fetch transactions (paginated) from `transactions`
- [ ] Display real balance card
- [ ] Display real transaction history table
- [ ] Add bank transfer upload form (receipt image → Supabase Storage)
- [ ] Create server action: `submitBankTransfer(data)` → insert into `bank_transfers`

### Settings Page (`/dashboard/settings`)
- [ ] Create server action: `getMerchantProfile(merchantId)`
- [ ] Create server action: `updateMerchantProfile(merchantId, data)`
- [ ] Wire Profile tab: business_name, email, phone → persist to `merchants`
- [ ] Wire Auto-Fulfillment tab: auto_fulfill_enabled, min_wallet_balance, preferred_shipping → persist
- [ ] Wire Notification preferences tab
- [ ] Display current plan info from `subscription_tiers`

### Admin Dashboard (`/admin`)
- [ ] Create admin server action: `getAdminDashboardStats()`
  - [ ] Total merchants count
  - [ ] Active orders count
  - [ ] Total wallet deposits today
  - [ ] Failed orders count
  - [ ] Revenue (commissions collected)
- [ ] Wire admin dashboard widgets to real data

### Admin Merchants (`/admin/merchants`)
- [ ] Create admin server action: `listMerchants(filters, pagination)`
- [ ] Display real merchant table with search/filter
- [ ] Merchant detail: profile, stores, wallet balance
- [ ] Suspend/activate merchant toggle

### Admin Bank Transfers (`/admin/transfers`)
- [ ] Create admin server action: `listPendingTransfers()`
- [ ] Display real transfer queue (merchant name, amount, receipt, date)
- [ ] Approve button → calls `wallet_credit()` + updates transfer status
- [ ] Reject button → updates transfer status + admin notes
- [ ] View receipt image in modal

---

## 📋 Phase 3 — Order Processing Pipeline

> **Goal:** Complete n8n order webhook handling + live order display

### n8n Workflow
- [ ] `order.created` branch:
  - [ ] Extract `merchant` (salla_merchant_id), `data.id`, `data.status.slug`
  - [ ] Supabase: Find store by `salla_merchant_id`
  - [ ] Extract customer info: `data.customer.first_name`, `last_name`, `email`, `mobile`
  - [ ] Extract amounts: `data.amounts.total.amount`
  - [ ] Supabase: INSERT into `orders` table
  - [ ] Respond 200
- [ ] `order.updated` branch:
  - [ ] Extract `merchant` + `data.id` + `data.status.slug`
  - [ ] Map Salla status slugs → DropLinker order_status enum:
    - `under_review` → `new`
    - `in_progress` → `processing`
    - `completed` → `delivered`
    - `canceled` → `cancelled`
    - `delivering` → `shipped`
    - `delivered` → `delivered`
  - [ ] Supabase: UPDATE order status by `store_order_id`
  - [ ] Respond 200
- [ ] Fallback branch → Respond 200

### Dashboard
- [ ] Orders page → live data from `orders` table
- [ ] Order detail view (customer info, items, status timeline)
- [ ] Status filter (new, processing, shipped, delivered, failed)
- [ ] Date range filter

---

## 📋 Phase 4 — AliExpress Integration

> **Goal:** Product search, detail fetch, import to store

### API Setup
- [ ] Configure AliExpress Open Platform credentials
- [ ] Create API client (`lib/aliexpress/client.ts`)
- [ ] Product search endpoint: `GET /api/suppliers/aliexpress/search`
- [ ] Product detail endpoint: `GET /api/suppliers/aliexpress/product/:id`

### Product Discovery
- [ ] Wire Discovery page to real AliExpress search
- [ ] Implement filters: category, price range, shipping, rating
- [ ] Product detail modal with variants, images, shipping info
- [ ] Price conversion (USD → SAR)

### Import Flow
- [ ] Import wizard: select variants → set retail price → generate description
- [ ] Save product to `products` table in Supabase
- [ ] Push product to connected Salla store via API (`POST /products`)
- [ ] Save `store_product_id` after Salla confirms

### AI Content
- [ ] n8n WF5: Product title + images → GPT/Gemini → bilingual description
- [ ] Product inbox: AI-generated → pending_review → approved → published
- [ ] Unit conversion (inch → cm, lb → kg)
- [ ] SEO tag generation

### My Products
- [ ] List products from `products` table (paginated)
- [ ] Edit retail price inline
- [ ] Toggle active/inactive
- [ ] Manual re-sync stock button
- [ ] Delete product (remove from Supabase + Salla store)

---

## 📋 Phase 5 — Wallet & Payments

> **Goal:** Real money flow

### Bank Transfer
- [ ] Upload receipt to Supabase Storage
- [ ] Insert `bank_transfers` record (status: pending)
- [ ] Admin approval → `wallet_credit()` call
- [ ] Admin rejection → update status + notes
- [ ] n8n WF7: Notify merchant on approval/rejection

### Moyasar Integration
- [ ] Create Moyasar account + get API keys
- [ ] Payment initiation endpoint: `POST /api/payments/moyasar/initiate`
- [ ] Payment callback handler: `POST /api/payments/moyasar/callback`
- [ ] On success → `wallet_credit()`
- [ ] Supported methods: Mada, Visa, Mastercard

### Stripe Integration
- [ ] Create Stripe account + get API keys
- [ ] Checkout Session creation: `POST /api/payments/stripe/checkout`
- [ ] Webhook handler: `POST /api/payments/stripe/webhook`
- [ ] On success → `wallet_credit()`

### Auto Top-up
- [ ] Save default payment method (Stripe Customer)
- [ ] Check balance on every wallet deduction
- [ ] If balance < threshold → auto-charge saved card
- [ ] Log auto top-up transaction

---

## 📋 Phase 6 — Auto-Fulfillment Engine

> **Goal:** The killer feature — customer orders → auto-placed on AliExpress

### Core Workflow (n8n WF2)
- [ ] Trigger: Called after order.created is processed
- [ ] Check merchant `auto_fulfill_enabled` flag
- [ ] Query wallet balance
- [ ] Calculate total: supplier_cost + commission (if applicable)
- [ ] If balance >= total:
  - [ ] Reserve amount in wallet
  - [ ] Call AliExpress Place Order API
  - [ ] On success: deduct wallet, save `supplier_order_id`, status → "ordered"
  - [ ] On failure: release reservation, status → "failed", notify merchant
- [ ] If balance < total:
  - [ ] Status → "held"
  - [ ] Notify merchant (low balance)

### Tracking Sync (n8n WF3)
- [ ] Cron: poll AliExpress for tracking updates every 2h
- [ ] Update `fulfillments` table with tracking_number + carrier
- [ ] Push tracking to Salla store via API
- [ ] Update order status → "shipped"
- [ ] Notify merchant (optional)

### Stock Sync (n8n WF4)
- [ ] Cron: check stock every 6h
- [ ] Batch query all active products → AliExpress stock API
- [ ] Update `products.stock_quantity` + `in_stock`
- [ ] If out-of-stock + `auto_hide_when_low`: mark inactive
- [ ] Update Salla store listing (hide/show)
- [ ] Log to `stock_sync_logs`
- [ ] Notify merchant on stock alerts

---

## 📋 Phase 7 — Expand (CJ + Zid)

### CJDropshipping
- [ ] Register CJ API account
- [ ] Product search integration
- [ ] Auto-order integration
- [ ] Tracking sync

### Zid Platform
- [ ] Zid OAuth / API key integration
- [ ] Webhook registration (order.created, order.updated)
- [ ] Product push to Zid store
- [ ] Tracking push to Zid

### Multi-Store
- [ ] Support multiple Salla/Zid stores per merchant
- [ ] Store selector in import wizard
- [ ] Per-store order filtering

---

## 📋 Phase 8 — i18n + Polish

### Internationalization
- [ ] Install + configure `next-intl`
- [ ] Extract all UI labels to `ar.json` / `en.json` dictionaries
- [ ] Language switcher component (header)
- [ ] RTL layout with Tailwind RTL plugin
- [ ] Persist locale preference to `merchants.locale`

### Notifications (n8n WF6)
- [ ] In-app notifications (insert into `notifications` table)
- [ ] Email notifications (SMTP/SendGrid)
- [ ] SMS notifications (Twilio / local provider)
- [ ] Notification preferences per merchant

### Performance
- [ ] Optimize server components vs client components
- [ ] Add React Query/SWR for client-side caching
- [ ] Implement pagination on all list pages
- [ ] Image optimization (next/image for product images)

### Mobile
- [ ] Responsive dashboard (tablet + phone)
- [ ] Touch-friendly tables (swipe actions)
- [ ] Collapsible sidebar on mobile

---

## 📋 Phase 9 — Scale

- [ ] Stripe subscription billing (recurring monthly/yearly)
- [ ] Team member invitations with roles (Owner/Manager/Viewer)
- [ ] Advanced analytics dashboard (revenue charts, order trends)
- [ ] Trend reports with AI recommendations
- [ ] Gulf-wide expansion (multi-currency support)
- [ ] Additional payment gateways per region
- [ ] Custom domain support for white-label

---

## Blockers & Notes

> [!WARNING]
> **Cannot test `order.created` webhooks from Salla test store.** The test store doesn't trigger real order webhooks. Build the n8n branches with pinned test data and validate when a real merchant installs the app.

> [!NOTE]
> **Salla Postman collections available** for API reference:
> - `Merchant APIs V2.7.6.postman_collection.json`
> - `Store APIs 1.0.postman_collection.json`
> - `Shipments APIs V2.0.6.postman_collection.json`

> [!NOTE]
> **AliExpress developer account exists** but API credentials need to be configured for product search + auto-order endpoints.
