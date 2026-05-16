# DropLinker — Implementation Plan (v2)

> **Temporary Name:** DropLinker (until domain is finalized)
> **Last Updated:** 2026-05-16 (Session 9 — Product Shipping Editor + Token Auto-Refresh)

## 1. Business Concept

A SaaS platform connecting **Saudi e-commerce merchants** (Salla & Zid) with global suppliers (**AliExpress** & **CJDropshipping**). Automates the full dropshipping lifecycle: product import → order fulfillment → tracking sync.

```mermaid
graph LR
    A["👤 Customer Orders\non Salla/Zid"] -->|Webhook| B["🔧 DropLinker"]
    B -->|Auto-Order| C["📦 AliExpress / CJ"]
    C -->|Ships Direct| A
    B -->|Deducts Cost| D["💰 Merchant Wallet"]
    B -->|Updates Tracking| E["🏪 Salla/Zid Store"]
```

**Revenue Model:** Admin-configurable — either commission per order (tier-based) OR subscription-only (no commission). Controlled from the admin panel.

---

## 2. Key Decisions (Confirmed)

| Decision | Answer |
|---|---|
| **Payment Gateways** | Moyasar + Stripe + Manual Bank Transfer |
| **Language** | Bilingual (Arabic + English) with switcher |
| **Target Market** | Saudi merchants initially, architecture ready for Gulf-wide expansion |
| **Supplier Priority** | AliExpress first (developer account exists), then CJDropshipping |
| **Commission** | Configurable from admin panel (commission % per tier OR subscription-only) |
| **Backend Logic** | n8n workflows (replaces BullMQ + Redis) |
| **AliExpress Status** | ✅ Developer account already exists |

---

## 3. Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) | Marketing pages (SSR) + Dashboard (CSR) |
| **Styling** | Tailwind CSS v4 | RTL-friendly, rapid development |
| **Database** | Supabase (PostgreSQL) | Auth, RLS, real-time, storage |
| **Backend Workflows** | n8n (self-hosted) | Webhooks, API orchestration, AI, retries |
| **Payments** | Moyasar + Stripe | Wallet top-ups |
| **i18n** | next-intl | Arabic/English bilingual |
| **Language** | TypeScript | End-to-end type safety |
| **Hosting** | Vercel (frontend) + VPS (n8n) | Scalable |

---

## 4. Architecture

```mermaid
graph TB
    subgraph "Frontend — Next.js 16"
        PUB["Public Site (Landing/Features/Pricing)"]
        DASH["Merchant Dashboard"]
        ADMIN["Admin Panel"]
    end

    subgraph "Database — Supabase"
        DB[("PostgreSQL")]
        AUTH["Supabase Auth"]
        STORE["File Storage"]
    end

    subgraph "Backend — n8n Workflows"
        W1["WF1: Order Received (webhook)"]
        W2["WF2: Auto-Fulfill Order"]
        W3["WF3: Tracking Sync"]
        W4["WF4: Stock Sync (cron)"]
        W5["WF5: AI Product Descriptions"]
        W6["WF6: Notifications"]
        W7["WF7: Bank Transfer Approval"]
    end

    subgraph "External APIs"
        AE["AliExpress API"]
        CJ["CJDropshipping API"]
        SALLA["Salla API"]
        ZID["Zid API"]
        GPT["OpenAI / Gemini"]
        MOY["Moyasar"]
        STR["Stripe"]
    end

    PUB --> AUTH
    DASH --> DB
    ADMIN --> DB

    SALLA -->|"order.created"| W1
    ZID -->|"order.create"| W1
    W1 --> W2
    W2 -->|"check wallet"| DB
    W2 -->|"place order"| AE & CJ
    W2 -->|"deduct balance"| DB
    AE & CJ -->|"tracking webhook"| W3
    W3 -->|"push tracking"| SALLA & ZID
    W4 -->|"check stock"| AE & CJ
    W5 --> GPT
    DASH -->|"top-up"| MOY & STR
```

---

## 5. Website Pages — Complete List

### Part A: Public Marketing Site (4 pages)

#### 1. Landing Page (`/`)
Hero section selling the automation concept. "How it works" 3-step flow. Supplier & platform logos. Live stats. CTA to register. Bilingual toggle.

#### 2. Features (`/features`)
Detailed breakdown: Product Discovery, One-Click Import, Auto-Fulfillment, Wallet, Tracking Sync, Multi-Store. Each with icon + description + visual.

#### 3. Pricing (`/pricing`)
Subscription tiers with comparison table. Shows whether commission applies (depends on admin config). Toggle monthly/yearly. CTA to start free trial.

#### 4. Auth (`/login`, `/register`, `/forgot-password`)
Email/password registration. Collects: business name, email, phone, preferred platform (Salla/Zid). Google OAuth optional.

---

### Part B: Merchant Dashboard (9 pages)

#### 5. Dashboard Overview (`/dashboard`)
Command center with widgets:
- Wallet balance + quick top-up
- Orders: new / processing / shipped / delivered
- Products: total imported, active, out-of-stock
- Recent activity feed
- Revenue chart
- Alerts (low balance, failed orders)

#### 6. Product Discovery (`/dashboard/discover`)
Search engine for AliExpress & CJ products:
- Keyword search bar
- Filters: supplier, category, price, shipping country, rating
- Product cards: image, title, supplier cost, shipping time
- Detail modal: variants, full images, description
- "Import to Store" button → opens import wizard

#### 7. Import Wizard (`/dashboard/discover/import/:id`)
Multi-step product import:
1. Select variants (size/color)
2. Set retail price (profit margin calculator: `retail - cost - commission = profit`)
3. Edit title/description (AI rewrite button via n8n → GPT-4o)
4. Choose target store (Salla/Zid)
5. Confirm & publish → product goes live on store

#### 8. My Products (`/dashboard/products`)
Imported products management:
- Table/grid: image, title, retail price, cost, margin, stock, store
- Filters: by store, supplier, status
- Actions: edit price, re-sync stock, pause, delete
- Stock sync indicator (last synced time)

#### 9. Orders (`/dashboard/orders`)
Fulfillment operations center:
- Table: order #, customer, products, total, cost, profit, status, date
- Status pipeline: `New → Processing → Ordered → Shipped → Delivered`
- Detail view: customer info, supplier order link, wallet receipt, tracking
- Filters: status, store, supplier, date
- Bulk: retry failed, mark fulfilled

#### 10. Wallet (`/dashboard/wallet`)
Financial center:
- Balance card (large, prominent)
- **Top-up methods:**
  - Credit/Debit via Moyasar (Mada/Visa/MC)
  - Credit/Debit via Stripe
  - Manual bank transfer (upload receipt → admin approves via n8n workflow)
- Transaction history: type (deposit/deduction/refund/commission), amount, date, order ref, running balance
- Auto top-up toggle (charge card when balance < threshold)
- Low balance alert config

#### 11. Store Connections (`/dashboard/integrations/stores`)
- Connect Salla (OAuth 2.0 flow)
- Connect Zid (API key / OAuth)
- Connected stores list: name, platform, status, last sync
- Webhook health status
- Disconnect / re-sync buttons

#### 12. Supplier Accounts (`/dashboard/integrations/suppliers`)
- Connect AliExpress (OAuth via Open Platform — developer account ready)
- Connect CJDropshipping (API key)
- Connection health indicator
- Default supplier preference

#### 13. Settings (`/dashboard/settings`)
- **Profile:** business name, email, phone, password
- **Billing:** current plan, upgrade/downgrade, invoices
- **Auto-Fulfillment Rules:** enable/disable, min wallet balance, preferred shipping method, fallback supplier
- **Notifications:** email/SMS for orders, low balance, shipping
- **Team:** invite members with roles (Owner/Manager/Viewer)
- **Language:** switch AR/EN

---

### Part C: Admin Panel (6 pages)

> [!IMPORTANT]
> The admin panel is where the platform owner (you) manages merchants, controls monetization, and approves bank transfers.

#### 14. Admin Dashboard (`/admin`)
Platform-wide stats: total merchants, active orders, revenue, wallet deposits, failed orders.

#### 15. Merchant Management (`/admin/merchants`)
List all merchants. View/edit each merchant: profile, stores, products, orders, wallet. Suspend/activate accounts.

#### 16. Revenue & Commission Config (`/admin/revenue`)
**The monetization control center:**
- Toggle mode: commission-based vs subscription-only
- Set commission % per subscription tier
- Define subscription tiers (name, price, limits, features)
- View revenue breakdown (commissions collected, subscriptions, total)

#### 17. Bank Transfer Approvals (`/admin/transfers`)
Queue of pending bank transfer top-ups:
- Merchant name, amount, receipt image, date
- Approve / reject buttons (triggers n8n workflow → credits wallet)

#### 18. Order Monitor (`/admin/orders`)
Global view of all orders across all merchants. Filter by status, supplier, merchant. Investigate failed orders.

#### 19. Platform Settings (`/admin/settings`)
- Payment gateway config (Moyasar keys, Stripe keys)
- Supplier API keys (platform-level defaults)
- Email/SMS templates
- Platform name, logo, support email

---

## 6. n8n Workflows — Detailed

### WF1: Order Webhook Receiver
```
Trigger: Webhook (POST /webhook/salla-order, /webhook/zid-order)
Steps:
1. Validate webhook signature (Salla secret / Zid basic auth)
2. Parse order payload → extract: customer info, products, store ID
3. Match order items → find linked products in Supabase
4. Insert order record in Supabase (status: "new")
5. Trigger WF2 (Auto-Fulfill)
```

### WF2: Auto-Fulfill Order
```
Trigger: Called by WF1
Steps:
1. Check merchant's auto-fulfill setting (enabled?)
2. Query wallet balance from Supabase
3. Calculate total: supplier_cost + commission (if applicable)
4. IF balance >= total:
   a. Reserve amount (update wallet.reserved)
   b. Call AliExpress API → place order (or CJ API)
   c. IF success: deduct from wallet, save supplier_order_id, update status → "ordered"
   d. IF fail: release reservation, update status → "failed", trigger WF6
5. IF balance < total:
   a. Update status → "held"
   b. Trigger WF6 (low balance notification)
```

### WF3: Tracking Sync
```
Trigger: Webhook from AliExpress/CJ (tracking update) OR Cron (poll every 2h)
Steps:
1. Receive tracking number + carrier from supplier
2. Update fulfillment record in Supabase
3. Push tracking to Salla/Zid store via API
4. Update order status → "shipped"
5. Notify merchant (optional)
```

### WF4: Stock Sync (Scheduled)
```
Trigger: Cron (every 6 hours)
Steps:
1. Query all active products from Supabase
2. Batch check stock on AliExpress / CJ APIs
3. Update stock status in Supabase
4. If product went out-of-stock → mark inactive + notify merchant
5. Optionally update store listing via Salla/Zid API
```

### WF5: AI Product Description
```
Trigger: HTTP Request from Next.js (POST /n8n/ai-describe)
Steps:
1. Receive product title, images, category
2. Call GPT-4o / Gemini with prompt: "Write SEO product description in [AR/EN]"
3. Return generated title + description
4. (Optional) Also generate SEO keywords
```

### WF6: Notification Dispatcher
```
Trigger: Called by other workflows
Steps:
1. Receive: merchant_id, event_type, data
2. Query merchant notification preferences from Supabase
3. Send via configured channel:
   - Email (SMTP / SendGrid)
   - SMS (Twilio / local provider)
   - In-app notification (insert into Supabase notifications table)
```

### WF7: Bank Transfer Approval
```
Trigger: Called when admin approves transfer in admin panel
Steps:
1. Receive: transfer_id, approved_amount
2. Credit merchant wallet in Supabase
3. Insert transaction record (type: "deposit", method: "bank_transfer")
4. Update transfer status → "approved"
5. Notify merchant via WF6
```

---

## 7. Database Schema

> ✅ **IMPLEMENTED** — 20 tables deployed to Supabase (including `platform_feeds`)

```mermaid
erDiagram
    MERCHANT ||--|| WALLET : "has"
    MERCHANT ||--o{ STORE : "connects"
    MERCHANT ||--o{ SUPPLIER_ACCOUNT : "links"
    MERCHANT ||--o{ PRODUCT : "imports"
    WALLET ||--o{ TRANSACTION : "records"
    STORE ||--o{ ORDER : "receives"
    ORDER ||--o{ ORDER_ITEM : "contains"
    ORDER_ITEM }o--|| PRODUCT : "refs"
    ORDER ||--o| FULFILLMENT : "triggers"
    FULFILLMENT ||--|| TRANSACTION : "deducts"
```

### Tables (19)

| # | Table | Purpose | Status |
|---|---|---|---|
| 1 | `merchants` | User accounts with plan, locale, fulfillment preferences | ✅ |
| 2 | `wallets` | Balance + reserved + auto-topup config | ✅ |
| 3 | `transactions` | Every money movement (audit trail) | ✅ |
| 4 | `stores` | Connected Salla/Zid stores with tokens + `salla_merchant_id` | ✅ |
| 5 | `supplier_accounts` | Connected AliExpress/CJ accounts | ✅ |
| 6 | `products` | Imported products (bilingual, pricing, stock) | ✅ |
| 7 | `orders` | Customer orders from webhooks | ✅ |
| 8 | `order_items` | Line items per order | ✅ |
| 9 | `fulfillments` | Supplier order tracking | ✅ |
| 10 | `bank_transfers` | Manual transfer approval queue | ✅ |
| 11 | `subscription_tiers` | Admin-managed pricing tiers | ✅ |
| 12 | `platform_config` | Global settings (commission mode, keys) | ✅ |
| 13 | `pricing_rules` | Per-product or merchant-wide margin rules | ✅ |
| 14 | `price_sync_logs` | Price change audit trail | ✅ |
| 15 | `stock_sync_logs` | Stock change audit trail | ✅ |
| 16 | `product_inbox` | AI quality gate for content review | ✅ |
| 17 | `analytics_daily` | Daily merchant metrics for P&L | ✅ |
| 18 | `trend_reports` | Weekly niche/category trend analysis | ✅ |
| 19 | `notifications` | In-app, email, SMS notification records | ✅ |
| 20 | `platform_feeds` | Curated AliExpress feeds with enable/disable + bilingual names | ✅ |

### Key Functions

| Function | Purpose |
|---|---|
| `wallet_credit()` | Atomic deposit with transaction logging |
| `wallet_deduct()` | Atomic deduction with insufficient balance check |
| `calculate_retail_price()` | Margin calculator (percentage or fixed) |
| `is_admin()` | RLS helper — checks merchant role |
| `create_merchant_wallet()` | Trigger — auto-create wallet on signup |
| `update_timestamp()` | Trigger — auto-update `updated_at` |

---

## 8. Auto-Fulfillment Flow (Core)

```mermaid
sequenceDiagram
    participant C as Customer
    participant S as Salla/Zid
    participant N as n8n (WF1+WF2)
    participant DB as Supabase
    participant AE as AliExpress/CJ

    C->>S: Places order
    S->>N: Webhook (order.created)
    N->>N: Validate signature
    N->>DB: Match items → products
    N->>DB: Insert order (status: new)
    N->>DB: Check wallet balance
    alt Balance OK
        N->>DB: Reserve amount
        N->>AE: Place order via API
        AE-->>N: Order confirmed
        N->>DB: Deduct wallet + save supplier_order_id
        N->>DB: Status → "ordered"
    else Low Balance
        N->>DB: Status → "held"
        N->>N: Trigger notification
    end
    Note over AE: Later...
    AE->>N: Tracking webhook
    N->>S: Push tracking number
    N->>DB: Status → "shipped"
```

---

## 9. Salla Webhook Payload Reference

> Verified against `Merchant APIs V2.7.6.postman_collection.json`

### Order Created (`order.created`) — Key Fields

```json
{
  "event": "order.created",
  "merchant": 964562487,
  "data": {
    "id": 418149270,
    "reference_id": 3879219,
    "status": {
      "id": 1298199463,
      "name": "بإنتظار المراجعة",
      "slug": "under_review"
    },
    "payment_method": "mada",
    "currency": "SAR",
    "amounts": {
      "sub_total": { "amount": 250, "currency": "SAR" },
      "shipping_cost": { "amount": 13.04, "currency": "SAR" },
      "tax": { "percent": "15.00", "amount": { "amount": 39.46, "currency": "SAR" } },
      "total": { "amount": 302.5, "currency": "SAR" }
    },
    "customer": {
      "id": 1473353380,
      "first_name": "أحمد",
      "last_name": "Conn",
      "mobile": 501724227,
      "mobile_code": "+966",
      "email": "demo@demo.com"
    },
    "items": [
      {
        "id": 951850235,
        "name": "فحم سداسي",
        "sku": "6285579005111",
        "quantity": 1,
        "amounts": {
          "total": { "amount": 45.22, "currency": "SAR" }
        },
        "product": { "id": 268564496, "type": "product" }
      }
    ]
  }
}
```

### Salla Order Status Slugs

| Slug | Meaning |
|---|---|
| `under_review` | New, pending review |
| `in_progress` | Being processed |
| `completed` | Fulfilled/completed |
| `canceled` | Cancelled by merchant/customer |
| `payment_pending` | Awaiting payment |
| `delivering` | In transit |
| `delivered` | Delivered to customer |
| `restoring` | Return in progress |
| `restored` | Returned |

---

## 10. Bilingual (i18n) Strategy

| Content Type | Strategy |
|---|---|
| **UI labels** | `next-intl` with `ar.json` / `en.json` dictionaries |
| **Product content** | Dual columns in DB: `title_en`/`title_ar`, `description_en`/`description_ar` |
| **Layout direction** | `dir="rtl"` for Arabic, `dir="ltr"` for English (Tailwind RTL plugin) |
| **AI descriptions** | n8n WF5 generates in both languages |
| **Admin panel** | English-only (internal tool) |

---

## 11. Execution Roadmap

### Phase 1 — Foundation ✅ DONE
> Project setup, database, auth, Salla OAuth

- [x] Project setup: Next.js 16 + Tailwind + Supabase
- [x] Public site: Landing page, Features, Pricing, Auth UI
- [x] Supabase: Full schema (19 tables), RLS policies, triggers, functions
- [x] Auth: Email/password signup + login + protected routes
- [x] Admin client pattern for RLS bypass (signup, webhooks)
- [x] Salla OAuth: Initiate → callback → store upsert → salla_merchant_id
- [x] Dashboard integrations: Live status, disconnect/reconnect
- [x] n8n webhook scaffold: Token validation, event router, app.uninstalled handler
- [x] Frontend UI shell: All 22 routes (mock data)

### Phase 2 — Live Data Migration ✅ DONE
> All dashboard/admin pages wired to real Supabase queries

- [x] Dashboard overview → real stats (order count, wallet balance, products)
- [x] Wallet page → real balance + transaction history + bank transfer upload
- [x] Settings page → persist profile to `merchants` table
- [x] Admin dashboard → real cross-merchant aggregate stats
- [x] Admin merchants → list/search real merchants
- [x] Admin bank transfers → approve/reject with atomic `wallet_credit()`

### Phase 3 — Order Processing Pipeline ✅ DONE
> Salla order.created + order.updated webhook handlers

- [x] `order.created` → INSERT order with duplicate detection
- [x] `order.updated` → UPDATE order status (full Salla slug mapping)
- [x] Store lookup via `salla_merchant_id` (multi-merchant fix)
- [x] HMAC-SHA256 signature verification
- [x] Orders page → live data with status filter tabs

### Phase 4A — AliExpress API Integration ✅ DONE
> API client, search, detail, feeds — all operational

- [x] AliExpress OAuth + token storage in `platform_config`
- [x] API client (`lib/aliexpress/client.ts`) with HMAC-SHA256 signing
- [x] `ds.text.search` — keyword search (45K+ results)
- [x] `ds.recommend.feed.get` — feed browsing (47 feeds, 500K+ products)
- [x] `ds.feedname.get` — enumerate all feeds
- [x] `ds.product.get` — product detail with nested DTO parsing
- [x] `freight.calculate` — shipping cost/time estimation
- [x] Search API route: `GET /api/suppliers/aliexpress/search`
- [x] Detail API route: `GET /api/suppliers/aliexpress/product/:id`
- [x] Normalizers: text.search, feed, product detail (3 separate mappers)
- [x] Tested filters: sort, minPrice/maxPrice, shipToCountry, countryCode

### Phase 4B — Discovery UI & Filters ✅ DONE
> Feed tabs, search filters, admin feed management, SAR enforcement, admin security

- [x] Keyword search bar → `text.search` with debounce
- [x] Feed category tabs (12 curated feeds with emoji icons + product counts)
- [x] Sort dropdown (price ASC/DESC, best selling) — **auto-triggers search on change**
- [x] Ship-To country selector (SA, AE, KW, BH, QA, OM) — **auto-triggers search on change**
- [x] Price range filter (min/max SAR inputs)
- [x] Pagination controls (page numbers + prev/next)
- [x] Product detail modal (images, variants, shipping estimate)
- [x] SAR currency enforcement (all 3 normalizers hardcode SAR)
- [x] Admin feed management page `/admin/feeds` (20 feeds, toggle on/off)
- [x] Admin feed sync from AliExpress API (`POST /api/suppliers/aliexpress/feeds/sync`)
- [x] Inline emoji editor + editable display names (EN/AR) + category per feed
- [x] Enable All / Disable All quick action buttons + search bar in feed table
- [x] Feed config persists to `platform_config` DB table (`PUT /api/suppliers/aliexpress/feeds`)
- [x] Feeds API reads from DB with fallback to defaults (`GET /api/suppliers/aliexpress/feeds`)
- [x] Admin auth guard on `/admin/*` — requires login + `merchants.role = 'admin'`
- [x] Role-based login redirect — admin → `/admin`, merchant → `/dashboard`
- [x] Feed sync API protected — requires admin role
- [x] Sign Out uses `window.location.href` (full page reload clears Supabase client state)
- [x] Fixed "Get Started" 404 — all buttons → `/auth/login` (was broken `/auth/register`)
- [x] `platform_feeds` table SQL migration
- [x] `useProductSearch` hook wired with `feedName` support

### Phase 4C — Product Import & My Products (PARTIAL ✅)
> Import products from AliExpress to merchant Salla stores — Salla pipeline done

- [x] Salla API client (`lib/salla/client.ts`) with OAuth2 auto-refresh
- [x] Schema mapper: DropLinker → Salla `POST /products` payload
- [x] Product CRUD API: `PATCH /api/products/:id` (inline editing)
- [x] Product CRUD API: `DELETE /api/products/:id` (with Salla cleanup)
- [x] Push-to-Salla endpoint: `POST /api/products/:id/push`
- [x] Import route enhanced with auto-push to Salla after DB save
- [x] Save to `products` table + push to Salla store API
- [x] My Products page (list, edit price, toggle status, delete, sync badges)
- [x] `useProducts` hook with full CRUD mutations
- [ ] Multi-step import wizard (variant selection, pricing, description editor)
- [ ] AI product descriptions (n8n WF5 → GPT/Gemini) — **next priority**
- [ ] Product inbox / quality gate workflow

### Phase 4D — Product Management Hub (✅ COMPLETE)
> Salla 2-way sync, full product editor, image management, import wizard with shipping, post-import shipping editor, token auto-refresh

- [x] Salla category sync: `GET /api/salla/categories`
- [x] Salla product sync: `GET /api/salla/products` (imports native Salla products with `direct` type)
- [x] `supplier_type` enum fix: added `'direct'` value
- [x] `salla_category_id` DB column added
- [x] Full product editor page (`/dashboard/products/[id]`) with 4 tabs
- [x] Interactive image management (delete, reorder, set main, add by URL)
- [x] Unsaved changes detection + indicator
- [x] Images included in PATCH save payload
- [x] Sidebar: AliExpress source link, image count
- [x] Import wizard with shipping: selectable radio buttons for AliExpress shipping methods
- [x] AliExpress shipping options displayed with costs + delivery times
- [x] Shipping cost factored into profit calculation
- [x] **Product editor shipping selector** — "Refresh Options" fetches live freight, radio buttons to change carrier
- [x] **Shipping API route:** `GET /api/products/[id]/shipping` — live AliExpress freight data
- [x] **Shipping fields in PATCH whitelist:** `shipping_cost`, `shipping_method`, `estimated_delivery`
- [x] **AliExpress token auto-refresh** — `refreshAccessToken()` with retry logic in `apiRequest()`
- [x] **Token refresh persistence** — new tokens auto-saved to `platform_config`

### Phase 4E — Trending Products & Smart Discovery
> Data-driven product recommendations for merchants

- [ ] **Trending Products page** (`/dashboard/products/trending`) — curated hot/viral products
- [ ] **Auto-curated trending feed** — n8n cron queries AliExpress bestseller + hot product feeds daily
- [ ] **Trend detection** — track order volume changes day-over-day, identify rising products
- [ ] **Cross-supplier trending** — combine AliExpress + CJDropshipping bestsellers
- [ ] **Trending badges** in Discovery page (🔥 Trending, 📈 Rising)
- [ ] **Weekly trend reports** — compiled into `trend_reports` table + dashboard widget
- [ ] **SA Market Intelligence** — seasonal trends (Ramadan, Eid), category performance
- [ ] **One-click import** from trending page (reuses existing import wizard)

### Phase 5 — Wallet & Payments
> Top-up flow + financial operations

- [ ] Bank transfer: upload receipt → admin approval → wallet_credit()
- [ ] Moyasar integration (Mada/Visa/MC wallet top-up)
- [ ] Stripe integration (card top-up)
- [ ] Transaction history with running balance
- [ ] Auto top-up (charge when balance < threshold)

### Phase 6 — Auto-Fulfillment Engine
> The core value proposition

- [ ] n8n WF2: Order → wallet check → AliExpress order → deduct
- [ ] n8n WF3: Tracking sync (poll → push to Salla)
- [ ] n8n WF4: Stock sync (cron every 6h → Supabase + Salla)
- [ ] Auto-fulfill toggle + min balance config in settings
- [ ] Order status pipeline with fulfillment details

### Phase 7 — Expand (CJ + Zid)
> Second supplier + second platform

- [ ] CJDropshipping integration (search + auto-order)
- [x] Zid OAuth 2.0 flow + dual-header API client ✅ (Session 10)
- [x] Product push to Zid (bilingual name, images, variants) ✅
- [x] Import + push routes updated for dual-platform support ✅
- [ ] Zid webhook integration (blocked: app not selectable in dashboard)
- [ ] Multi-store selector UI
- [ ] Supplier fallback logic (AE → CJ)

### Phase 8 — i18n + Polish
> Bilingual + production readiness

- [ ] next-intl setup with AR/EN dictionaries
- [ ] RTL layout (Tailwind RTL plugin)
- [ ] Mobile-responsive dashboard
- [ ] Email/SMS notifications (n8n WF6)
- [ ] Performance optimization + caching

### Phase 9 — Scale
> Post-launch features

- [ ] Subscription billing automation (Stripe recurring)
- [ ] Team member access with roles
- [ ] Advanced analytics + trend reports
- [ ] Gulf-wide expansion (multi-currency, additional gateways)

---

## 12. Verification Plan

### Automated
- Unit tests: wallet logic (deposit, deduct, insufficient balance, concurrent)
- Integration tests: webhook signature validation (Salla/Zid)
- E2E: mock webhook → n8n processes → order in DB → supplier API called → wallet deducted

### Manual
- Connect test Salla store → place order → verify auto-fulfill on AliExpress
- Bank transfer flow: upload receipt → admin approves → wallet credited
- Test held orders (low balance) → top up → retry → order placed
- Bilingual: switch AR↔EN, verify all UI + product content
- Admin panel: change commission mode → verify it applies to next order
