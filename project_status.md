# DropLinker — Project Status

> **Last Updated:** 2026-05-15

## Executive Summary

**What exists:** A fully functional Next.js 16 platform with Supabase backend (19 tables, RLS, wallet functions), Salla OAuth integration, order webhook processing, and a complete AliExpress API integration. Merchants can sign up, connect their Salla store, receive orders via webhooks, and the admin can manage merchants and approve bank transfers. The AliExpress API is fully operational with text search (45K+ results), feed browsing (47 feeds, 500K+ products), product detail fetching, and shipping estimation.

**What's next:** Wire the Discovery page UI to use all available AliExpress search filters and feeds, build the product import wizard, and complete the auto-fulfillment engine.

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

#### Tested & Working Filters

| Filter | Status | Notes |
|---|---|---|
| `keyWord` (keyword search) | ✅ | Required for text.search |
| `countryCode` (target country) | ✅ | Required — "SA" |
| `sort` (price/volume) | ✅ | ASC, DESC, LAST_VOLUME_DESC |
| `minPrice` / `maxPrice` | ✅ | Price range in target currency |
| `shipToCountry` | ✅ | Ensures SA pricing |
| `searchExtend` | ❌ | Not supported in DS API |
| `categoryId` | ⚠️ | Limited — most IDs return 0 |

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

## What's NOT Done — Upcoming

### 📋 Phase 4B: Discovery UI & Filters (NEXT)

> Priority: **HIGH** — Wire the UI to use all tested filters

| Task | Priority | Depends On |
|---|---|---|
| Keyword search bar → text.search | 🔴 P0 | — |
| Feed category browser (tabs/dropdown) | 🔴 P0 | — |
| Sort dropdown (price, volume) | 🔴 P0 | — |
| Price range filter (min/max inputs) | 🟡 P1 | — |
| Pagination controls | 🟡 P1 | — |
| Product detail modal (images, variants, shipping) | 🔴 P0 | — |
| Admin feed management page | 🟡 P1 | `platform_feeds` table |
| Shipping estimation in product detail | 🟡 P1 | freight.calculate |

### 📋 Phase 4C: Product Import & My Products

> Priority: **HIGH** — Core merchant workflow

| Task | Priority | Depends On |
|---|---|---|
| Import wizard (variants, pricing, description) | 🔴 P0 | Discovery working |
| Save product to `products` table | 🔴 P0 | Import wizard |
| Push product to Salla store API | 🔴 P0 | Salla API |
| My Products page (list, edit, delete) | 🟡 P1 | Products in DB |
| AI description generation (n8n WF5) | 🟠 P2 | Import working |

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
