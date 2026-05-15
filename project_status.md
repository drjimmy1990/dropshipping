# DropLinker — Project Status

> **Last Updated:** 2026-05-15 (Session 6 — Salla Push-to-Store Pipeline + Inventory Management)

## Executive Summary

**What exists:** A fully functional Next.js 16 platform with Supabase backend (20 tables, RLS, wallet functions), Salla OAuth integration, order webhook processing, a complete AliExpress API integration with full Discovery UI, and a **production-ready Salla push-to-store pipeline**. Merchants can sign up, connect their Salla store, receive orders via webhooks, browse AliExpress products by feed category or keyword search, view product details with shipping estimates, **import products directly to their catalog, push them to Salla with one click, and manage inventory inline** (edit prices, toggle status, delete with Salla cleanup). The Salla API client includes auto-refresh OAuth2 token logic. All prices are enforced in SAR.

**What's next:** Build the AI content generation pipeline (bilingual descriptions via GPT/Gemini), the auto-fulfillment engine, and payment gateway integrations.

---

## What's Done

### ✅ Phase 1 — Foundation

| Task | Status | Notes |
|---|---|---|
| Supabase project + 19-table schema | ✅ | Full RLS, triggers, wallet functions |
| Supabase Auth (email/password) | ✅ | Signup → merchant + wallet creation |
| Salla OAuth integration | ✅ | Connect, disconnect, reconnect flow |
| n8n webhook scaffold | ✅ | Token validation, event routing |
| Frontend UI shell (22 routes) | ✅ | All pages built |

### ✅ Phase 2 — Live Data Migration

| Task | Status | Notes |
|---|---|---|
| Dashboard overview → real Supabase data | ✅ | Wallet, orders, products all live |
| Wallet page → real balance + transactions | ✅ | Bank transfer upload working |
| Settings page → persist to merchants table | ✅ | Profile + auto-fulfillment settings |
| Admin pages → real aggregate queries | ✅ | Merchants, transfers, orders |
| Admin bank transfers → approve/reject | ✅ | Atomic `wallet_credit()` RPC |

### ✅ Phase 3 — Order Processing Pipeline

| Task | Status | Notes |
|---|---|---|
| `order.created` webhook → Insert order | ✅ | With duplicate detection |
| `order.updated` webhook → Update status | ✅ | Full Salla slug mapping |
| Store lookup via `salla_merchant_id` | ✅ | Fixed for multi-merchant |
| HMAC-SHA256 signature verification | ✅ | Security validated |
| Orders page → live data | ✅ | Status filter tabs working |

### ✅ Phase 4A — AliExpress API Integration

| Task | Status | Notes |
|---|---|---|
| AliExpress OAuth (platform-level) | ✅ | Token stored in `platform_config` |
| API client with HMAC-SHA256 signing | ✅ | `lib/aliexpress/client.ts` |
| `ds.text.search` — keyword search | ✅ | 45K+ results for "phone" |
| `ds.recommend.feed.get` — feed browse | ✅ | 47 feeds, 500K+ products |
| `ds.feedname.get` — list feeds | ✅ | All 47 feeds enumerated |
| `ds.product.get` — product detail | ✅ | Nested DTO parsing fixed |
| `freight.calculate` — shipping estimate | ✅ | Returns methods + delivery time |
| Search API route | ✅ | `GET /api/suppliers/aliexpress/search` |
| Detail API route | ✅ | `GET /api/suppliers/aliexpress/product/:id` |
| Text.search normalizer | ✅ | Maps camelCase → NormalizedProduct |
| Feed normalizer | ✅ | Maps feed DTO → NormalizedProduct |
| Detail normalizer | ✅ | Maps nested DTOs → NormalizedProductDetail |

### ✅ Phase 4B — Product Discovery UI & Filters

| Task | Status | Notes |
|---|---|---|
| Keyword search bar with debounce | ✅ | Real-time `text.search` results |
| Feed category tabs (12 curated feeds) | ✅ | Emoji icons + product count badges |
| Sort dropdown (price, volume) | ✅ | ASC, DESC, LAST_VOLUME_DESC — **auto-triggers** |
| Ship-To country selector | ✅ | SA, AE, KW, BH, QA, OM — **auto-triggers** |
| Price range filter (min/max SAR) | ✅ | Inputs wired to API |
| Pagination controls | ✅ | Page numbers + prev/next |
| Product detail modal (images, variants) | ✅ | Gallery + variant selector + shipping |
| Shipping estimation in detail | ✅ | SAR-only pricing |
| SAR currency enforcement | ✅ | All 3 normalizers hardcode SAR |
| Admin feed management page | ✅ | `/admin/feeds` — 20 feeds, toggle enable/disable |
| **Admin feed sync from AliExpress** | ✅ | `POST /api/suppliers/aliexpress/feeds/sync` |
| **Inline emoji + name editor** | ✅ | Edit emoji, display name (EN/AR), category per feed |
| **Feed config persists to DB** | ✅ | `PUT /api/suppliers/aliexpress/feeds` → `platform_config` |
| **Feeds API reads from DB** | ✅ | `GET /api/suppliers/aliexpress/feeds` with fallback defaults |
| **Admin auth guard** | ✅ | Login + `role='admin'` required for `/admin/*` |
| **Role-based login redirect** | ✅ | Admin → `/admin`, merchant → `/dashboard` |
| **Sign Out fix** | ✅ | Full page reload clears auth state |
| **Landing page link fixes** | ✅ | All "Get Started" → `/auth/login` (was 404 `/auth/register`) |
| `platform_feeds` table SQL | ✅ | Migration in `supabase/migrations/` |
| `useProductSearch` + feedName | ✅ | Hook wired with feed browsing support |

#### Available Feeds (47 — Key Ones)

| Feed | Products | Category |
|---|---|---|
| `Bestseller 2024` | 201,065 | All categories |
| `DS_Sports&Outdoors_bestsellers` | 27,495 | Sports |
| `DS_DentalEquipment&Supplies` | 25,343 | Dental |
| `DS_Automobile&Accessories_bestsellers` | 20,340 | Auto |
| `DS_ConsumerElectronics_bestsellers` | 19,470 | Electronics |
| `DS_NewArrivals` | 14,010 | New products |
| `SA_Clothing&Shoes` | 13,050 | Fashion (SA) |
| `DS_Home&Kitchen_bestsellers` | 12,300 | Home & Kitchen |

---

### ✅ Phase 4C — Product Import & Salla Push-to-Store (PARTIAL)

| Task | Status | Notes |
|---|---|---|
| Salla API client (`lib/salla/client.ts`) | ✅ | OAuth2 auto-refresh on 401 |
| Schema mapper (DropLinker → Salla payload) | ✅ | Images, options, pricing mapped |
| `PATCH /api/products/:id` | ✅ | Inline editing (price, status, titles) |
| `DELETE /api/products/:id` | ✅ | With automatic Salla cleanup |
| `POST /api/products/:id/push` | ✅ | Manual push-to-Salla |
| Import route + auto-push | ✅ | `POST /api/suppliers/aliexpress/import` enhanced |
| My Products page rebuilt | ✅ | Inline edit, profit columns, sync badges |
| `useProducts` hook + mutations | ✅ | update, delete, toggle, push |
| Import success UX | ✅ | "Manage Products" + "Keep Browsing" CTAs |
| AI description generation (n8n WF5) | 📋 | Next priority |
| Import wizard (multi-step) | 📋 | Future enhancement |

---

## What's NOT Done — Upcoming

### 📋 Phase 4C Remaining: AI Content Generation (NEXT)

> Priority: **HIGH** — Bilingual product descriptions

| Task | Priority | Depends On |
|---|---|---|
| n8n WF5: Product → GPT/Gemini → bilingual desc | 🔴 P0 | Import working ✅ |
| Product inbox / quality gate workflow | 🟡 P1 | AI generation |
| Unit conversion (inch → cm, lb → kg) | 🟠 P2 | AI pipeline |
| SEO tag generation | 🟠 P2 | AI pipeline |

### 📋 Phase 5: Wallet & Payments

| Task | Priority |
|---|---|
| Bank transfer upload + admin approval | 🟡 P1 |
| Moyasar integration (Mada/Visa) | 🟡 P1 |
| Stripe integration (card top-up) | 🟠 P2 |
| Auto top-up (charge on low balance) | 🟠 P2 |

### 📋 Phase 6: Auto-Fulfillment Engine

| Task | Priority |
|---|---|
| n8n WF2: Order → wallet check → AliExpress order → deduct | 🔴 P0 |
| n8n WF3: Tracking sync (poll → push to Salla) | 🟡 P1 |
| n8n WF4: Stock sync (cron every 6h) | 🟡 P1 |

### 📋 Phase 7+: Future

- CJDropshipping integration
- Zid platform integration
- i18n (Arabic/English)
- Mobile optimization
- Subscription billing
- Team member roles

---

## API Routes Summary (Current)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/suppliers/aliexpress/feeds` | Public | Returns admin-configured feed list from DB |
| `PUT` | `/api/suppliers/aliexpress/feeds` | Admin | Saves feed config to `platform_config` |
| `POST` | `/api/suppliers/aliexpress/feeds/sync` | Admin | Syncs live feeds from AliExpress API |
| `GET` | `/api/suppliers/aliexpress/search` | Auth | Keyword + feed search |
| `GET` | `/api/suppliers/aliexpress/product/:id` | Auth | Product detail with nested DTOs |
| `POST` | `/api/suppliers/aliexpress/import` | Auth | Import product + auto-push to Salla |
| `PATCH` | `/api/products/:id` | Auth | Inline edit (price, status, titles) |
| `DELETE` | `/api/products/:id` | Auth | Delete product + cleanup from Salla |
| `POST` | `/api/products/:id/push` | Auth | Manual push to Salla store |
| `GET` | `/api/auth/salla` | Auth | Initiate Salla OAuth |
| `GET` | `/api/auth/salla/callback` | Public | Salla OAuth callback |
| `GET` | `/api/auth/aliexpress/callback` | Public | AliExpress OAuth callback |
| `POST` | `/api/webhooks/salla` | HMAC | Salla order webhooks |
| `DELETE` | `/api/stores/:id/disconnect` | Auth | Disconnect Salla store |

---

## Reference Documents

| Document | Purpose |
|---|---|
| `TODO.md` | Development checklist with progress tracking |
| `implementation_plan2.md` | Full architecture, schema, workflow specs |
| `dropshipping_full_plan.md` | Business logic: ordering, shipping, curation |
| `aliexpress_api_reference.md` | All 47 feeds, tested filters, field mappings |
| `PRODUCT.md` | Brand personality, design principles |
| `DESIGN.md` | Design system tokens |
| `deployment_guide.md` | VPS deployment instructions |
| `supabase/schema.sql` | Complete database schema (19 tables) |
