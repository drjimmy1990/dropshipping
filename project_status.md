# DropLinker — Project Status

> **Last Updated:** 2026-05-17 (Session 10 — Zid Platform Integration)

## Executive Summary

**What exists:** A fully functional Next.js 16 platform with Supabase backend (20 tables, RLS, wallet functions), Salla OAuth integration, **Zid OAuth integration**, order webhook processing, a complete AliExpress API integration with full Discovery UI, a **production-ready push-to-store pipeline for both Salla and Zid**, **2-way Salla product/category sync**, a **full product management hub** with interactive image management, a **shipping-inclusive import wizard** with selectable shipping methods, an **interactive shipping editor on the product detail page** for post-import carrier changes, and **automatic AliExpress token refresh** when tokens expire. Merchants can sign up, connect their Salla or Zid store, receive orders via webhooks, browse AliExpress products, **select shipping methods, import products with accurate cost tracking, change shipping carriers post-import, push them to Salla or Zid, and manage everything including images and pricing**. All prices are enforced in SAR.

**What's next:** AI content generation (bilingual descriptions), trending products & smart discovery, CJDropshipping integration, Zid webhooks, auto-fulfillment engine. Payment gateways (Phase 5) are **blocked** pending Moyasar/Stripe access — all other phases proceed in parallel.

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

### ✅ Phase 4D — Product Management Hub (COMPLETED)

| Task | Status | Notes |
|---|---|---|
| Salla category sync API | ✅ | `GET /api/salla/categories` |
| Salla product sync (2-way) | ✅ | `GET /api/salla/products` with `direct` supplier type |
| `supplier_type` enum fix | ✅ | Added `'direct'` value for native Salla products |
| `salla_category_id` column | ✅ | DB migration applied |
| Product editor page | ✅ | `/dashboard/products/[id]` — General, Images, Pricing, SEO tabs |
| Image management (interactive) | ✅ | Delete, reorder, set main, add by URL |
| Unsaved changes indicator | ✅ | Pulsing dot on Save button |
| Images in save payload | ✅ | PATCH now includes `images` array |
| Sidebar enhancements | ✅ | AliExpress source link, image count |
| **Import wizard — shipping selection** | ✅ | Selectable radio buttons for AliExpress shipping methods |
| **Shipping cost DB columns** | ✅ | `shipping_cost`, `shipping_method`, `estimated_delivery` added |
| **Landed cost calculation** | ✅ | Product + shipping = total cost breakdown |
| **Profit includes shipping** | ✅ | Retail − supplier − shipping = accurate profit |
| **Below-cost warning** | ✅ | Error when retail < landed cost |
| **Editor pricing tab** | ✅ | Shows supplier cost, shipping cost, total landed cost |
| **Shipping editor in product page** | ✅ | "AliExpress Shipping Options" section with Refresh + radio selector |
| **Shipping API route** | ✅ | `GET /api/products/[id]/shipping` — live AliExpress freight |
| **Shipping fields in PATCH** | ✅ | `shipping_cost`, `shipping_method`, `estimated_delivery` whitelisted |
| **AliExpress token auto-refresh** | ✅ | `refreshAccessToken()` retries on `IllegalAccessToken` error |
| **Token refresh persistence** | ✅ | New tokens auto-saved to `platform_config` table |

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

### 📋 Phase 4E: Trending Products & Smart Discovery

| Task | Priority | Depends On |
|---|---|---|
| Trending Products page (`/dashboard/products/trending`) | 🔴 P0 | Discovery UI ✅ |
| n8n daily cron: query AliExpress bestseller + hot product feeds | 🔴 P0 | AliExpress API ✅ |
| Trend detection (order volume day-over-day tracking) | 🟡 P1 | Trending cron |
| Cross-supplier trending (AliExpress + CJ bestsellers) | 🟠 P2 | CJ integration |
| Trending/Rising badges in Discovery page | 🟡 P1 | Trending cron |
| Weekly trend reports → `trend_reports` table + dashboard widget | 🟡 P1 | Trending cron |
| SA Market Intelligence (seasonal trends, category performance) | 🟠 P2 | Trend data |
| One-click import from trending page | 🟡 P1 | Import ✅ |

### 📋 Phase 5: Wallet & Payments ⏸️ (Blocked — awaiting gateway access)

| Task | Priority | Status |
|---|---|---|
| Bank transfer upload + admin approval | 🟡 P1 | **Can build now** |
| Moyasar integration (Mada/Visa) | 🟡 P1 | 🔒 Blocked — no API keys |
| Stripe integration (card top-up) | 🟠 P2 | 🔒 Blocked — no API keys |
| Auto top-up (charge on low balance) | 🟠 P2 | 🔒 Blocked — needs Stripe |

### 📋 Phase 6: Auto-Fulfillment Engine

| Task | Priority |
|---|---|
| n8n WF2: Order → wallet check → AliExpress order → deduct | 🔴 P0 |
| n8n WF3: Tracking sync (poll → push to Salla) | 🟡 P1 |
| n8n WF4: Stock sync (cron every 6h) | 🟡 P1 |

### 📋 Phase 7A: CJDropshipping Integration

| Task | Priority |
|---|---|
| Register CJ API account + get API keys | 🔴 P0 |
| CJ product search integration | 🔴 P0 |
| CJ product detail + import flow | 🟡 P1 |
| CJ auto-order integration | 🟡 P1 |
| CJ tracking sync | 🟠 P2 |
| Supplier fallback logic (AliExpress → CJ) | 🟠 P2 |

### ✅ Phase 7B: Zid Platform Integration (Session 10)

| Task | Status | Notes |
|---|---|---|
| Zid OAuth 2.0 flow | ✅ | `/api/auth/zid` + `/api/auth/zid/callback` |
| Zid API client (`lib/zid/client.ts`) | ✅ | Dual-header auth, auto-refresh, bilingual mapper |
| Zid TypeScript types | ✅ | `lib/zid/types.ts` — products, categories, orders |
| Product push to Zid store | ✅ | 3-step: create → images → variants |
| Import route — dual-platform push | ✅ | Auto-detects store platform (Salla/Zid) |
| Manual push route — dual-platform | ✅ | `targetStoreId` / `targetPlatform` params |
| Integrations page — Zid button | ✅ | "Connect Zid Store" replaces "Coming Soon" |
| DB migration | ✅ | `platform_store_id` + `partner_token` columns |
| `.env.local` config | ✅ | ZID_CLIENT_ID, ZID_CLIENT_SECRET, ZID_OAUTH_URL |
| Zid webhooks | ⏸️ | Blocked: app not selectable in Zid partner dashboard |
| Tracking push to Zid | ⏸️ | Pending webhook setup |

---

## What's NOT Done — Upcoming

- i18n (Arabic/English full RTL)
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
| `POST` | `/api/suppliers/aliexpress/import` | Auth | Import product + auto-push to Salla/Zid |
| `PATCH` | `/api/products/:id` | Auth | Inline edit (price, status, titles, shipping) |
| `DELETE` | `/api/products/:id` | Auth | Delete product + cleanup from Salla |
| `POST` | `/api/products/:id/push` | Auth | Manual push to Salla or Zid store |
| `GET` | `/api/products/:id/shipping` | Auth | Fetch live AliExpress shipping options |
| `GET` | `/api/auth/salla` | Auth | Initiate Salla OAuth |
| `GET` | `/api/auth/salla/callback` | Public | Salla OAuth callback |
| `GET` | `/api/auth/zid` | Auth | Initiate Zid OAuth |
| `GET` | `/api/auth/zid/callback` | Public | Zid OAuth callback |
| `GET` | `/api/auth/aliexpress/callback` | Public | AliExpress OAuth callback |
| `POST` | `/api/webhooks/salla` | HMAC | Salla order webhooks |
| `DELETE` | `/api/stores/:id/disconnect` | Auth | Disconnect Salla store |
| `GET` | `/api/salla/categories` | Auth | Fetch Salla store categories |
| `GET` | `/api/salla/products` | Auth | Sync native Salla products to DB |

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
