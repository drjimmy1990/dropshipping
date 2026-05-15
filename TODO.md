# DropLinker — Development TODO

> **Last Updated:** 2026-05-15
> **Current Phase:** Phase 4 (AliExpress Product Discovery & Import)

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

## ✅ Phase 2 — Live Data Migration (COMPLETED)

> **Discovery:** All 11 hooks already query real Supabase tables. All dashboard/admin pages already consume hooks — zero mock data imports on data pages. `mockData.ts` only contains static marketing content (correct usage).

### Dashboard Overview (`/dashboard`)
- [x] Dashboard widgets wired to real hooks: `useWallet`, `useOrders`, `useProducts`
- [x] Wallet balance, order counts, product stats — all live
- [x] Revenue overview chart (computed from transactions)
- [x] Recent orders panel (live from `useOrders`)
- [x] Alerts widget (low balance warning from live data)

### Wallet Page (`/dashboard/wallet`)
- [x] Real balance card from `useWallet` → `wallets` table
- [x] Real transaction history table from `useWallet` → `transactions` table
- [x] Bank transfer upload form (modal) — receipt image → Supabase Storage
- [x] Insert into `bank_transfers` table with status `pending`

### Settings Page (`/dashboard/settings`)
- [x] Profile tab: business_name, email, phone → `useMerchant` → `merchants` table
- [x] Auto-Fulfillment tab: settings persisted via `useMerchant`
- [x] Plan info displayed from merchant record

### Admin Dashboard (`/admin`)
- [x] `useAdminMerchants` → total merchants, active count
- [x] `useAdminOrders` → total orders, status breakdown
- [x] `useAdminTransfers` → pending transfers count

### Admin Merchants (`/admin/merchants`)
- [x] Real merchant table from `useAdminMerchants`
- [x] Status badges (active/suspended)

### Admin Bank Transfers (`/admin/transfers`)
- [x] Approve button → calls `wallet_credit()` RPC (atomic balance + transaction)
- [x] Reject button → updates transfer status + admin notes
- [x] Rollback on RPC failure (reverts to `pending`)

---

## ✅ Phase 3 — Order Processing Pipeline (COMPLETED)

> **Discovery:** `/api/webhooks/salla/route.ts` already had full `handleOrderEvent` implementation. Only needed store lookup fix + status mapping expansion.

### Webhook Handler (`/api/webhooks/salla`)
- [x] `order.created` → INSERT into `orders` with duplicate detection
- [x] `order.updated` → UPDATE order status with full Salla slug mapping
- [x] Extract merchant ID, order data, customer info, amounts
- [x] **Fixed:** Store lookup now uses `salla_merchant_id` (was broken for multi-merchant)
- [x] **Expanded:** Status mapping covers all Salla slugs (under_review, delivering, in_transit, restored, etc.)
- [x] Security: Token + HMAC-SHA256 signature verification
- [x] Responds 200 even on internal errors (prevents Salla retries)

### Dashboard
- [x] Orders page → live data from `useOrders` hook
- [x] Status filter tabs (new, processing, shipped, delivered, failed)
- [ ] Order detail view (customer info, items, status timeline) — **Phase 5 enhancement**
- [ ] Date range filter — **Phase 5 enhancement**

---

## ✅ Phase 4A — AliExpress API Integration (COMPLETED)

> **Goal:** Connect to AliExpress, search products, fetch details

### API Setup
- [x] AliExpress developer account enrolled in DS program (`dr.gimy@gmail.com`)
- [x] Account propagation completed (was pending 24-48h, now done)
- [x] Build "Connect AliExpress" button in `app/admin/settings/page.tsx`
- [x] Implement OAuth callback → store `access_token` + `refresh_token` in `platform_config`
- [x] API client created (`lib/aliexpress/client.ts`) with HMAC-SHA256 signing
- [x] Both `session` and `access_token` sent on all API calls (compatibility fix)

### Search APIs — All Working
- [x] `aliexpress.ds.text.search` — keyword search (45,000+ results for "phone")
- [x] `aliexpress.ds.recommend.feed.get` — feed-based browsing (47 feeds, 500K+ products)
- [x] `aliexpress.ds.feedname.get` — list all available feeds
- [x] `aliexpress.ds.product.get` — full product detail with nested DTO parsing
- [x] `aliexpress.logistics.buyer.freight.calculate` — shipping cost/time estimation

### API Endpoints
- [x] Product search: `GET /api/suppliers/aliexpress/search`
- [x] Product detail: `GET /api/suppliers/aliexpress/product/:id`

### Normalizers
- [x] `normalizeSearchProduct()` — maps text.search camelCase fields (itemId, targetSalePrice, etc.)
- [x] `normalizeFeedProduct()` — maps feed response fields (product_id, product_title, etc.)
- [x] `normalizeProductDetail()` — parses nested DTOs (ae_item_base_info_dto, ae_multimedia_info_dto, ae_item_sku_info_dtos)
- [x] Price conversion to SAR via `target_currency` parameter

### Tested Filters
- [x] `keyWord` — keyword search (required)
- [x] `countryCode` — target country (required, e.g. "SA")
- [x] `sort` — SALE_PRICE_ASC, SALE_PRICE_DESC, LAST_VOLUME_DESC
- [x] `minPrice` / `maxPrice` — price range filter
- [x] `shipToCountry` — ensures pricing for target country
- [x] `categoryId` — category filter (limited support)

---

## 📋 Phase 4B — Product Discovery UI & Filters (NEXT)

> **Goal:** Wire the Discovery page to use all search/filter options and feeds

### Discovery Page Enhancements
- [ ] Keyword search bar → calls `text.search` with real-time results
- [ ] Feed category browser → dropdown/tabs showing enabled feeds
- [ ] Sort dropdown (Cheapest, Most Expensive, Best Selling)
- [ ] Price range filter (min/max SAR inputs)
- [ ] Country/region selector (SA default, with other Gulf options)
- [ ] Pagination (page_no, page_size)
- [ ] Product card: image, title, sale price, original price, discount %, orders count
- [ ] Click product → detail modal with variants, images, shipping info

### Admin Feed Management
- [ ] Admin page to list all 47 available feeds
- [ ] Toggle enable/disable per feed
- [ ] Set display name (EN/AR) for merchant-facing labels
- [ ] Set minimum subscription tier required per feed
- [ ] Sort order for feed display priority
- [ ] `platform_feeds` table in Supabase

### Shipping Estimation
- [ ] Call `freight.calculate` on product detail view
- [ ] Show estimated delivery time + shipping cost per method
- [ ] Display fastest vs cheapest shipping options
- [ ] Highlight local warehouse products (faster delivery)

### Product Detail Modal
- [ ] Full image gallery (from `ae_multimedia_info_dto`)
- [ ] Variant selector (color, size from `ae_item_sku_info_dtos`)
- [ ] Price per variant display
- [ ] Product properties/specs table
- [ ] Shipping options with delivery estimates
- [ ] "Import to Store" button → opens Import Wizard

---

## 📋 Phase 4C — Product Import & My Products

> **Goal:** Import products to merchant stores

### Import Flow
- [ ] Import wizard: select variants → set retail price → generate description
- [ ] Profit margin calculator (retail - cost - commission = profit)
- [ ] Save product to `products` table in Supabase
- [ ] Push product to connected Salla store via API (`POST /products`)
- [ ] Save `store_product_id` after Salla confirms

### AI Content (n8n WF5)
- [ ] Product title + images → GPT/Gemini → bilingual description
- [ ] Product inbox: AI-generated → pending_review → approved → published
- [ ] Unit conversion (inch → cm, lb → kg)
- [ ] SEO tag generation

### My Products Page
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
> **AliExpress API fully operational.** 47 feeds available with 500K+ products. Text search, feed browse, product detail, and freight calculation all tested and working. See `aliexpress_api_reference.md` for full filter/feed documentation.
