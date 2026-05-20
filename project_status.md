# DropLinker — Project Status

> **Last Updated:** 2026-05-20 (Session 15 — CJ SAR Normalization + Auto-Deployment)

## Executive Summary

**What exists:** A fully functional Next.js 16 platform with Supabase backend (21 tables, RLS, wallet functions), Salla OAuth integration, **Zid OAuth integration**, order webhook processing, a complete AliExpress API integration with full Discovery UI, **CJDropshipping API integration with full search/import pipeline and SAR currency normalization**, a **production-ready push-to-store pipeline for both Salla and Zid**, **2-way Salla product/category sync**, a **full product management hub** with interactive image management, a **shipping-inclusive import wizard** with selectable shipping methods, an **interactive shipping editor on the product detail page** for post-import carrier changes, **automatic AliExpress token refresh** when tokens expire, a **dual-supplier Product Discovery UI** with an AliExpress/CJ dropdown switcher with CJ-specific feed tabs, categories, and sorting, and **automated CI/CD via aaPanel webhook** triggered on every `git push`. All prices across both suppliers are enforced in SAR.

**What's next:** AI content generation (bilingual descriptions), trending products & smart discovery, CJ order fulfillment engine, Zid webhooks. Payment gateways (Phase 5) are **blocked** pending Moyasar/Stripe access — all other phases proceed in parallel.

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

### ✅ Phase 7A: CJDropshipping Integration (Session 14 + 15)

| Task | Status | Notes |
|---|---|---|
| CJ API v2.0 documentation scraping | ✅ | Full endpoint reference in `lib/cj/API_REFERENCE.md` |
| CJ TypeScript types | ✅ | `lib/cj/types.ts` — products, variants, categories, freight |
| CJ API client | ✅ | `lib/cj/client.ts` — token mgmt, search, detail, freight, categories, normalization |
| CJ product search API | ✅ | `GET /api/suppliers/cj/search` |
| CJ product detail API | ✅ | `GET /api/suppliers/cj/product` |
| CJ product import | ✅ | `POST /api/suppliers/cj/import` — mirrors AliExpress pattern, pushes to Salla/Zid |
| CJ categories API | ✅ | `GET /api/suppliers/cj/categories` — 3-level tree with 24h cache |
| CJ feed tabs API | ✅ | `GET /api/suppliers/cj/feeds` — Trending, New, Video + category tabs |
| CJ freight calculator | ✅ | `POST /api/suppliers/cj/freight` |
| CJ auth connect endpoint | ✅ | `POST /api/auth/cj/connect` — validates token, saves to supplier_accounts |
| `NormalizedProduct.supplier` widened | ✅ | Now supports `"aliexpress" \| "cj"` |
| `useProductSearch` supplier routing | ✅ | Routes search/detail/import to correct supplier API |
| Discovery page supplier dropdown | ✅ | AliExpress/CJ switcher with independent search flows |
| CJ-specific sort options | ✅ | Best Match, Most Popular, Price ASC/DESC, Newest, Most Stock |
| CJ feed tabs in Discovery | ✅ | Trending, New Arrivals, Video, category-based |
| Product card dynamic badge | ✅ | Shows "AliExpress" or "CJDropshipping" per product |
| Integrations page CJ connect card | ✅ | CJ account connection modal with token validation |
| **USD → SAR normalization** | ✅ | All CJ prices ×3.75 at normalization layer |
| **Search filter SAR→USD conversion** | ✅ | Min/max inputs (SAR) ÷3.75 before CJ API call |
| **Shipping in SAR** | ✅ | `getCJFreight` returns SAR-converted values |
| **Import stores SAR** | ✅ | `supplier_currency: "SAR"` in CJ import route |
| CJ order creation API | 📋 | Phase 3 — order fulfillment engine |
| CJ webhooks | 📋 | Phase 4 — webhook event listener |

### ✅ Phase 7B: Zid Platform Integration (Session 10 & 12)

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
| **Zid category sync API** | ✅ | `GET /api/zid/categories` — fetches store categories |
| **useZidCategories hook** | ✅ | Flattens category hierarchy with indent prefixes |
| Zid webhooks | ⏸️ | Blocked: app not selectable in Zid partner dashboard |
| Tracking push to Zid | ⏸️ | Pending webhook setup |

### ✅ Phase 4E-Store: Platform-Aware Store Settings & Categories (Session 12)

| Task | Status | Notes |
|---|---|---|
| **Store Settings tab** | ✅ | Replaces SEO tab, conditionally renders panel based on connected stores |
| **Platform-Aware panels** | ✅ | Salla panel shows Category picker + SEO. Zid panel shows Category picker + Keywords. |
| **Dual-platform category dropdowns** | ✅ | Salla uses `useSallaCategories` hook; Zid uses `useZidCategories` hook. |
| **Database extension** | ✅ | Added `zid_category_id` (TEXT) to the `products` table |
| **PATCH route whitelisting** | ✅ | Allows editing of `zid_category_id`, `zid_keywords`, `metadata_title`, etc. |
| **Platform synchronization** | ✅ | Syncs category and SEO inputs to Salla & Zid on save and push |
| **Migration SQL script** | ✅ | `phase10_zid_category.sql` |

### ✅ Phase 13: Multi-Store Support (Session 13)

| Task | Status | Notes |
|---|---|---|
| **Multi-Store Architecture** | ✅ | Migrated to 1:N `product_listings` table |
| **Store-Specific Pricing** | ✅ | Default price in `products`, store overrides in `product_listings` |
| **API Refactoring** | ✅ | Push, Edit, Delete ops iterate over `product_listings` |
| **Frontend Updates** | ✅ | Product list and details use `product_listings` for sync status |
| **Database Migration** | ✅ | `phase13_multi_store.sql` executed |

### ✅ DevOps: Auto-Deployment (Session 15)

| Task | Status | Notes |
|---|---|---|
| aaPanel WebHook plugin | ✅ | Installed and configured for `Deploy_Dropshipping` hook |
| GitHub Webhook | ✅ | `drjimmy1990/dropshipping` → triggers aaPanel on push |
| Deployment script | ✅ | `git pull` → `npm run build` → `pm2 restart` → clear Nginx cache |
| PM2 environment fix | ✅ | `HOME=/root` + `PM2_HOME=/root/.pm2` in webhook script |

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
| `GET` | `/api/zid/categories` | Auth | Fetch Zid store categories |
| `GET` | `/api/suppliers/cj/search` | Auth | CJ product keyword search |
| `GET` | `/api/suppliers/cj/product` | Auth | CJ product detail by PID |
| `POST` | `/api/suppliers/cj/import` | Auth | Import CJ product + auto-push to Salla/Zid |
| `GET` | `/api/suppliers/cj/categories` | Auth | CJ category tree |
| `POST` | `/api/suppliers/cj/freight` | Auth | CJ shipping cost calculator |
| `POST` | `/api/auth/cj/connect` | Auth | Connect CJ account (validate + save token) |

---

## 🧪 The E2E Test User Flow (Verification Checklist)

The following E2E checklist covers the entire merchant workflow across Salla & Zid platforms:

### 1. Store Connections & Authentication
* **Connect Salla Store:** Initiate OAuth via `/api/auth/salla`. Confirm callback exchanges tokens and creates active store with `salla_merchant_id`.
* **Connect Zid Store:** Click "Connect Zid Store" under `/dashboard/integrations`. Complete OAuth flow. Verify `platform = 'zid'` store is inserted with `partner_token` and `platform_store_id`.

### 2. Product Discovery & Curation
* Browse feeds and search for products in AliExpress catalog. Check pagination and price range filters. Verify all pricing is displayed strictly in Saudi Riyal (SAR).

### 3. Shipping-Inclusive Product Import
* Click a product → Select an AliExpress shipping option (e.g. AliExpress Direct) using the radio selector.
* Verify total landed cost (`product_cost + shipping_cost`) and profit margins are calculated accurately.
* Click "Import to My Store". Verify product is saved to Supabase `products` and auto-pushed to active connected store.
* Verify `store_product_id` is successfully retrieved and stored back in the DB.

### 4. Inventory & Pricing Management (`/dashboard/products`)
* Verify imported products appear with accurate prices, stock counts, and platforms.
* Edit retail price inline (Click -> edit -> Enter). Verify immediate persistence.
* Click product -> **Store Settings** tab. Verify meta title, description, and platform-specific categories (dropdowns for Salla/Zid categories loaded via hooks) are editable and sync to platforms on save.
* Change shipping carrier in the product's Pricing tab via live freight estimate refresh. Save and check updating landed costs.
* Delete a product. Verify deletion from Supabase and the respective store dashboard.

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
| `deployment_guide.md` | VPS deployment + auto-deploy webhook instructions |
| `supabase/schema.sql` | Complete database schema (21 tables) |
| `app/src/lib/cj/API_REFERENCE.md` | CJ API v2.0 endpoint reference |
