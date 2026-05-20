# DropLinker — Development TODO

> **Last Updated:** 2026-05-20 (Session 17)
> **Current Phase:** Phase 4C-AI ✅ (AI Content Engine — Admin UI ✅, Webhook Config ✅, Content Automation DB ✅, n8n Guide ✅) + Bugfixes (Zid Categories ✅, Bank Transfers FK ✅, Deploy Script ✅)

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
- [x] **Fixed FK ambiguity** — separate query pattern instead of merchants join (Session 17)

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

## ✅ Phase 4B — Product Discovery UI & Filters (COMPLETED)

> **Goal:** Wire the Discovery page to use all search/filter options and feeds

### Discovery Page
- [x] Keyword search bar → calls `text.search` with real-time results
- [x] Feed category tabs (12 curated feeds with emoji icons + product counts)
- [x] Sort dropdown (Cheapest, Most Expensive, Best Selling)
- [x] **Sort auto-triggers search on change** (no need to click Search button)
- [x] **Ship-To auto-triggers search on change** (immediate re-fetch)
- [x] Price range filter (min/max SAR inputs)
- [x] Country/region selector (SA, AE, KW, BH, QA, OM)
- [x] Pagination (page numbers + prev/next)
- [x] Product card: image, title, sale price, original price, discount %, orders count
- [x] Click product → detail modal with variants, images, shipping info
- [x] Results count with active feed name indicator
- [x] Skeleton loading states + empty state

### Currency Normalization
- [x] All prices forced to SAR (no USD/CNY leaking through)
- [x] `normalizeSearchProduct` — uses only `target_sale_price` (SAR)
- [x] `normalizeFeedProduct` — hardcoded SAR currency
- [x] `normalizeProductDetail` — hardcoded SAR currency
- [x] Shipping display always shows `SAR X.XX`

### Admin Feed Management
- [x] Admin page `/admin/feeds` with toggle enable/disable per feed
- [x] 20 feeds listed (10 enabled by default, 10 disabled)
- [x] Category filter tabs (trending, electronics, home, sports, fashion, etc.)
- [x] Bilingual display names (English + Arabic)
- [x] Product count per feed
- [x] "Feeds" nav item in admin sidebar
- [x] `platform_feeds` table SQL migration created (`supabase/migrations/platform_feeds.sql`)
- [x] **Live sync from AliExpress API** (`POST /api/suppliers/aliexpress/feeds/sync`)
- [x] **Inline emoji editor** per feed (39 emoji options in dropdown)
- [x] **Editable display names** (English + Arabic) + category per feed
- [x] **Enable All / Disable All** quick action buttons
- [x] **Search bar** to filter admin feed table
- [x] **Save to database** — admin saves persist to `platform_config` table (key: `feed_config`)

### Auth & Security
- [x] **Admin auth guard** on `/admin/*` layout
- [x] **Role-based login redirect** (admin → `/admin`, merchant → `/dashboard`)
- [x] **Feed sync route protected** — requires `role = 'admin'`
- [x] **Sign Out** uses `window.location.href` (full page reload clears Supabase client state)

### Landing Page Fixes
- [x] **Fixed "Get Started" 404** — all buttons linked to `/auth/login`

### API Routes
- [x] `GET /api/suppliers/aliexpress/feeds` — returns admin-configured feeds from DB
- [x] `PUT /api/suppliers/aliexpress/feeds` — admin saves feed config to `platform_config`
- [x] `POST /api/suppliers/aliexpress/feeds/sync` — admin-only sync from AliExpress API
- [x] `GET /api/suppliers/aliexpress/search` — enhanced with `feedName` param
- [x] `useProductSearch` hook — wired with `feedName` support

### Product Detail Modal
- [x] Full image gallery (thumbnails + main image)
- [x] Variant selector (color, size from `ae_item_sku_info_dtos`)
- [x] Price per variant display (SAR)
- [x] Shipping options with delivery estimates (SAR)
- [x] Profit margin calculator (retail - cost)
- [x] "Import to My Products" button

---

## ✅/📋 Phase 4C — Product Import & My Products

> **Goal:** Import products to merchant stores — Salla pipeline complete, AI content partially done

### Salla Push-to-Store Pipeline ✅
- [x] Salla API client (`lib/salla/client.ts`) with OAuth2 auto-refresh
- [x] Schema mapper: DropLinker product → Salla `POST /products` payload
- [x] Product CRUD API: `PATCH /api/products/:id` (inline editing)
- [x] Product CRUD API: `DELETE /api/products/:id` (with Salla cleanup)
- [x] Push-to-Salla endpoint: `POST /api/products/:id/push`
- [x] Import route enhanced: auto-push to Salla after DB save
- [x] Profit margin calculator in detail modal (retail - cost = profit %)
- [x] Save product to `products` table in Supabase
- [x] Push product to connected Salla store via API (`POST /products`)
- [x] Save `store_product_id` after Salla confirms
- [x] Import success UX with "Manage Products" + "Keep Browsing" CTAs

### Import Wizard (Future Enhancement)
- [ ] Multi-step import wizard: select variants → set retail price → generate description
- [ ] Choose target store (multi-store support)

### AI Content Engine (Session 16-17) ✅ Infrastructure
- [x] Content automation DB schema (`phase_content_automation.sql`) — 7 new tables
- [x] Image generation templates DB (`phase_content_image_templates.sql`)
- [x] Admin AI Content Engine settings card (`AIContentEngineCard` in admin settings)
- [x] Editable n8n webhook URLs (masked secret inputs) stored in `platform_config`
- [x] LLM API key management (Gemini, OpenAI, Claude) in admin panel
- [x] n8n workflow guide for content generation (`n8n_content_workflows_guide.md`)
- [x] Supplier-aware prompt templates (CJ vs AliExpress differences)
- [x] SEO metadata generation logic (meta_title, meta_description, url_slug)
- [x] Product editor "Generate with AI" button (UI ready, needs n8n WF backend)
- [ ] **n8n WF5 build & test** — product → GPT/Gemini → bilingual AR/EN descriptions
- [ ] **Social media post generation** — Instagram carousels, UGC-style content
- [ ] **Auto-scheduling to social media** — Blotato or direct API tokens
- [ ] Product inbox: AI-generated → pending_review → approved → published
- [ ] Unit conversion (inch → cm, lb → kg)

### My Products Page ✅
- [x] List products from `products` table with images
- [x] Edit retail price inline (click → edit → Enter/Escape)
- [x] Toggle active/inactive
- [x] Sync status indicators (Synced to Salla / Not Synced)
- [x] Push-to-Salla button for unsynced products
- [x] Delete product (remove from Supabase + Salla store) with confirmation
- [x] Profit/margin column with percentage
- [x] Search + status filter (All/Active/Inactive/Out of Stock/Synced/Not Synced)
- [x] Toast notifications for all actions
- [x] Empty state with link to Product Discovery
- [ ] Manual re-sync stock button — **Phase 6 (Stock Sync)**

---

## ✅ Phase 4D — Product Management Hub (COMPLETED)

> **Goal:** Full product lifecycle management — edit everything, image management, Salla 2-way sync, import wizard with shipping
> **Completed:** All sub-items done. Shipping cost integration fully wired from UI → API → DB.

### Salla 2-Way Sync ✅
- [x] Salla category sync: `GET /api/salla/categories` → fetches all store categories
- [x] Salla product sync: `GET /api/salla/products` → imports native Salla products to DB
- [x] `supplier_type` enum fixed: added `'direct'` for native Salla products
- [x] Idempotent sync: handles both insert (new) and update (existing) operations
- [x] Safe number parsing for price, cost_price, quantity during import
- [x] Error counting + detailed toast feedback on sync completion
- [x] `salla_category_id` column added to products table

### Product Editor ✅
- [x] Full product editor page (`/dashboard/products/[id]`)
- [x] Tabs: General, Images, Pricing, SEO
- [x] Edit title (EN/AR), description (EN/AR), category picker
- [x] Salla category dropdown (fetched from `GET /api/salla/categories`)
- [x] Retail price, stock quantity editing
- [x] Active/inactive toggle
- [x] Auto-sync edits to Salla when product has `store_product_id`
- [x] Push-to-Salla button for unsynced products
- [x] Delete with Salla cleanup

### Image Management ✅
- [x] Full interactive Images tab
- [x] Delete individual images with hover overlay
- [x] Set any image as main (move to position [0])
- [x] Reorder images (move left/right buttons)
- [x] Add new image by URL input
- [x] `localImages` state tracks edits before save
- [x] Images array included in PATCH payload → saved to DB + synced to Salla
- [x] Unsaved changes indicator (pulsing dot on Save button)
- [x] Sidebar enhancements: AliExpress source link, image count

### Import Wizard with Shipping ✅
- [x] DB columns added: `shipping_cost`, `shipping_method`, `estimated_delivery`
- [x] AliExpress shipping options displayed as selectable radio buttons
- [x] Merchant selects shipping method before import
- [x] Cost summary breakdown: product cost + shipping = total landed cost
- [x] Shipping cost saved to DB via import API route
- [x] Profit calculation includes shipping cost
- [x] Retail price auto-suggestion factors in shipping (30% markup)
- [x] "Below cost" warning when retail price < landed cost

### AliExpress Token Auto-Refresh ✅
- [x] Automatic token refresh when `IllegalAccessToken` error detected
- [x] `refreshAccessToken()` function in `lib/aliexpress/client.ts`
- [x] Retry logic in `apiRequest()` — transparent single retry on token expiry
- [ ] Local-first import (save as draft, push to Salla later) — **Phase 5 enhancement**

---

## ✅ Phase 4E-Store — Platform-Aware Store Settings & Categories (Session 12)

- [x] Store Settings tab UI implementation (replaces SEO tab)
- [x] Connected platform checking logic for Salla & Zid
- [x] Conditional display of settings panels: Salla panel / Zid panel
- [x] Fetch Zid categories from `/api/zid/categories` via client-side hook
- [x] Flat category list formatting with hierarchical indent prefixes for dropdowns
- [x] Expand Supabase `products` schema with `zid_category_id TEXT` migration
- [x] Extend whitelisted fields list in PATCH API router
- [x] Salla update synchronization: categories, SEO title & description, status
- [x] Zid update synchronization: categories, keywords, stock, status

---

## 📋 Phase 4E — Trending Products & Smart Discovery

> **Goal:** Help merchants answer "what should I sell?" with data-driven product recommendations

### Trending Products Page (`/dashboard/products/trending`)
- [ ] Dedicated page showing hot/viral products from AliExpress + CJ
- [ ] Cards with: product image, title, price, order volume, trend score, supplier badge
- [ ] Category tabs (Electronics, Fashion, Home, Beauty, etc.)
- [ ] Time filter: trending this week / this month
- [ ] One-click import from trending page (reuses existing import flow)
- [ ] "Why it's trending" indicator (volume spike, price drop, seasonal)

### Auto-Curated Trending Feed
- [ ] n8n cron job (daily): query AliExpress `DS_BestSelling` + `DS_HotProduct` feeds
- [ ] Track order volume changes day-over-day for trend detection
- [ ] Store curated products in `trend_reports` table with trend metadata
- [ ] CJDropshipping bestseller integration
- [ ] Combine data from multiple suppliers for cross-supplier trending

### Weekly Trend Reports
- [ ] n8n cron job (weekly): compile trending categories + products → `trend_reports`
- [ ] Dashboard widget: "This Week's Top Categories" with trend arrows
- [ ] Email digest: weekly trending products summary to merchants (opt-in)
- [ ] Admin view: platform-wide trending analytics

### SA Market Intelligence
- [ ] Track which products Saudi merchants import most → feed recommendations
- [ ] Category performance by country (SA focus)
- [ ] Seasonal trend detection (Ramadan, Eid, Saudi National Day, Back-to-School)

---

## 📋 Phase 5 — Wallet & Payments

> **Goal:** Real money flow

### Bank Transfer
- [x] Upload receipt to Supabase Storage
- [x] Insert `bank_transfers` record (status: pending)
- [x] Admin approval → `wallet_credit()` call
- [x] Admin rejection → update status + notes
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
- [ ] Push tracking to Salla/Zid store via API
- [ ] Update order status → "shipped"

### Stock Sync (n8n WF4)
- [ ] Cron: check stock every 6h
- [ ] Batch query all active products → AliExpress stock API
- [ ] Update `products.stock_quantity` + `in_stock`
- [ ] If out-of-stock + `auto_hide_when_low`: mark inactive
- [ ] Update Salla store listing (hide/show)
- [ ] Log to `stock_sync_logs`

---

## 📋 Phase 7 — Expand (CJ + Zid)

### CJDropshipping ✅ (Session 14 + 15)
- [x] CJ API v2.0 documentation scraped and saved (`lib/cj/API_REFERENCE.md`)
- [x] CJ TypeScript type definitions (`lib/cj/types.ts`)
- [x] CJ API client with token management, search, detail, freight, normalization (`lib/cj/client.ts`)
- [x] CJ product search route (`GET /api/suppliers/cj/search`)
- [x] CJ product detail route (`GET /api/suppliers/cj/product`)
- [x] CJ product import route (`POST /api/suppliers/cj/import`) — mirrors AliExpress pattern
- [x] CJ categories route (`GET /api/suppliers/cj/categories`) — 3-level tree with 24h cache
- [x] CJ feed tabs route (`GET /api/suppliers/cj/feeds`) — Trending, New, Video + API-derived category tabs
- [x] CJ freight calculator route (`POST /api/suppliers/cj/freight`)
- [x] CJ auth connect endpoint (`POST /api/auth/cj/connect`) — validates token + saves to supplier_accounts
- [x] `NormalizedProduct.supplier` widened to `"aliexpress" | "cj"`
- [x] `useProductSearch` hook updated with supplier-aware routing + CJ-specific params
- [x] Discovery page supplier dropdown (AliExpress / CJDropshipping toggle)
- [x] CJ-specific sort dropdown (Best Match, Most Popular, Price ASC/DESC, Newest, Most Stock)
- [x] Product cards show dynamic supplier badge
- [x] AliExpress feed tabs only show when AliExpress selected
- [x] CJ feed tabs show when CJ selected (Trending, New Arrivals, Video, category-based)
- [x] Integrations page CJ connect card + modal
- [x] **USD → SAR price normalization** — All CJ prices multiplied by 3.75 at the normalization layer
- [x] **Search filter conversion** — Min/max price inputs (SAR) divided by 3.75 before CJ API call
- [x] **Shipping costs in SAR** — `getCJFreight` returns SAR values
- [x] **Import stores SAR** — `supplier_currency: "SAR"` in CJ import route
- [ ] CJ order creation API (Phase 6 — auto-fulfillment engine)
- [ ] CJ webhook listener
- [ ] Supplier fallback logic (AliExpress → CJ)

### Zid Platform ✅ (Session 10)
- [x] Zid OAuth 2.0 flow (`/api/auth/zid` + `/api/auth/zid/callback`)
- [x] Zid API client (`lib/zid/client.ts` — dual-header auth, bilingual product mapper)
- [x] Zid TypeScript types (`lib/zid/types.ts`)
- [x] Product push to Zid store (`pushProductToZid` + image upload + variants)
- [x] Import route updated — platform-aware push (Salla or Zid)
- [x] Manual push route updated — auto-detects store platform
- [x] Integrations page — "Connect Zid Store" button activated
- [x] DB migration: `platform_store_id` + `partner_token` columns
- [x] `.env.local` — ZID_CLIENT_ID, ZID_CLIENT_SECRET, ZID_OAUTH_URL
- [x] Zid category sync route (`GET /api/zid/categories` + `useZidCategories`)
- [x] **Fixed:** Zid categories endpoint `/products/categories` → `/managers/store/categories` (Session 17)
- [ ] Webhook registration (order.created, order.updated) — ⏸️ blocked: app not selectable in Zid partner dashboard
- [ ] Tracking push to Zid

### Multi-Store
- [x] Import route supports `targetStoreId` / `targetPlatform` params
- [x] Push route supports `targetStoreId` / `targetPlatform` params
- [ ] Store selector UI in import wizard
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

## ✅ DevOps — Auto-Deployment (Session 15 + 17)

- [x] **aaPanel WebHook plugin** installed and configured for auto-deployment
- [x] **GitHub Webhook** configured on `drjimmy1990/dropshipping` repo → triggers aaPanel hook on push
- [x] **Deployment script** pulls latest code, builds Next.js, restarts PM2, clears Nginx cache
- [x] **PM2 environment fix** — `HOME=/root` + `PM2_HOME=/root/.pm2` added to webhook script
- [x] **Fixed race condition** — PM2 now stops before build, starts after (prevents middleware-manifest.json crash) (Session 17)

---

## Blockers & Notes

> [!WARNING]
> **Cannot test `order.created` webhooks from Salla test store.** The test store doesn't trigger real order webhooks. Build the n8n branches with pinned test data and validate when a real merchant installs the app.

> [!NOTE]
> **AliExpress API fully operational.** 47 feeds available with 500K+ products. Text search, feed browse, product detail, and freight calculation all tested and working. Auto-refresh on token expiry is now built-in.

> [!NOTE]
> **CJDropshipping fully integrated.** API client supports product search, detail, import, categories, and freight calculation. All CJ prices are normalized to SAR (×3.75) at the client layer. See `app/src/lib/cj/API_REFERENCE.md` for full endpoint documentation.

> [!NOTE]
> **Admin Panel Security:** All `/admin/*` routes protected by auth guard (checks login + `merchants.role = 'admin'`). Feed sync API requires admin role.

> [!NOTE]
> **AI Content Engine Infrastructure:** Admin panel has full webhook URL + API key management. DB schema supports content automation (7 tables), image templates, social media scheduling. n8n workflow guide written (`n8n_content_workflows_guide.md`). Actual n8n WF5 workflow still needs to be built and tested.

> [!NOTE]
> **Auto-Deployment:** Every `git push origin main` triggers an aaPanel webhook. Deploy script now uses stop-before-build pattern to prevent PM2 race conditions. See `deployment_guide.md` for setup.
