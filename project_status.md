# DropLinker — Project Status

> **Last Updated:** 2026-05-20 (Session 17 — AI Content Engine + Admin Webhooks + Bugfixes)

## Executive Summary

**What exists:** A fully functional Next.js 16 platform with Supabase backend (21+ tables, RLS, wallet functions), Salla OAuth integration, **Zid OAuth integration**, order webhook processing, a complete AliExpress API integration with full Discovery UI, **CJDropshipping API integration with full search/import pipeline and SAR currency normalization**, a **production-ready push-to-store pipeline for both Salla and Zid**, **2-way Salla product/category sync**, a **full product management hub** with interactive image management, a **shipping-inclusive import wizard** with selectable shipping methods, an **interactive shipping editor on the product detail page**, **automatic AliExpress token refresh**, a **dual-supplier Product Discovery UI** with AliExpress/CJ dropdown switcher, **automated CI/CD via aaPanel webhook**, and a **complete AI Content Engine admin infrastructure** with webhook URL management, LLM API key storage, and content automation database schema. All prices across both suppliers are enforced in SAR.

**What's next:** Build & test the actual n8n WF5 workflow (AI product descriptions), social media post generation & scheduling, trending products & smart discovery, CJ order fulfillment engine, Zid webhooks. Payment gateways (Phase 5) are **blocked** pending Moyasar/Stripe access.

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
| Admin bank transfers → approve/reject | ✅ | Atomic `wallet_credit()` RPC + FK ambiguity fix |

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
| `ds.product.get` — product detail | ✅ | Nested DTO parsing fixed |
| `freight.calculate` — shipping estimate | ✅ | Returns methods + delivery time |
| Text.search normalizer | ✅ | Maps camelCase → NormalizedProduct |
| Feed normalizer | ✅ | Maps feed DTO → NormalizedProduct |
| Detail normalizer | ✅ | Maps nested DTOs → NormalizedProductDetail |

### ✅ Phase 4B — Product Discovery UI & Filters

| Task | Status | Notes |
|---|---|---|
| Keyword search + feed tabs | ✅ | 12 curated feeds with emoji icons |
| Sort dropdown (auto-triggers) | ✅ | ASC, DESC, LAST_VOLUME_DESC |
| Ship-To country selector (auto-triggers) | ✅ | SA, AE, KW, BH, QA, OM |
| Price range filter (min/max SAR) | ✅ | Inputs wired to API |
| Pagination controls | ✅ | Page numbers + prev/next |
| Product detail modal | ✅ | Gallery + variant selector + shipping |
| SAR currency enforcement | ✅ | All 3 normalizers hardcode SAR |
| Admin feed management | ✅ | `/admin/feeds` — 20 feeds, toggle, sync, emoji editor |
| Admin auth guard | ✅ | Login + `role='admin'` required |

### ✅ Phase 4C — Product Import & Push-to-Store

| Task | Status | Notes |
|---|---|---|
| Salla API client (OAuth2 auto-refresh) | ✅ | `lib/salla/client.ts` |
| Schema mapper (DropLinker → Salla) | ✅ | Images, options, pricing mapped |
| Product CRUD (PATCH/DELETE) | ✅ | With Salla cleanup |
| Push-to-Salla (manual + auto) | ✅ | Auto on import |
| My Products page rebuilt | ✅ | Inline edit, profit columns, sync badges |
| AI description generation (n8n WF5) | 🔨 | Infrastructure done, workflow needs build |

### ✅ Phase 4C-AI — AI Content Engine Infrastructure (Session 16-17)

| Task | Status | Notes |
|---|---|---|
| Content automation DB schema | ✅ | `phase_content_automation.sql` — 7 new tables |
| Image generation templates DB | ✅ | `phase_content_image_templates.sql` — prompt presets |
| Admin AI Content Engine card | ✅ | `AIContentEngineCard` in admin settings |
| n8n webhook URL management | ✅ | Editable, masked secret inputs |
| LLM API key management | ✅ | Gemini, OpenAI, Claude keys in admin |
| Config persistence | ✅ | `platform_config` upsert via `usePlatformConfig` |
| Supplier-aware prompt templates | ✅ | CJ vs AliExpress differences documented |
| SEO metadata generation logic | ✅ | meta_title, meta_description, url_slug |
| n8n workflow guide | ✅ | `n8n_content_workflows_guide.md` — full build spec |
| Product editor AI button | ✅ | "Generate with AI" UI ready |
| **Build n8n WF5 workflow** | 📋 | Next priority |
| **Social media generation** | 📋 | Instagram carousels, UGC content |
| **Social media scheduling** | 📋 | Blotato or direct API tokens |

### ✅ Phase 4D — Product Management Hub (COMPLETED)

| Task | Status | Notes |
|---|---|---|
| Salla category sync + 2-way product sync | ✅ | `GET /api/salla/categories`, `GET /api/salla/products` |
| Product editor (4 tabs) | ✅ | General, Images, Pricing, Store Settings |
| Image management (interactive) | ✅ | Delete, reorder, set main, add by URL |
| Import wizard — shipping selection | ✅ | Radio buttons, landed cost, profit calc |
| Shipping editor in product page | ✅ | Refresh + radio selector for post-import changes |
| AliExpress token auto-refresh | ✅ | Transparent retry on expired token |

### ✅ Phase 7A: CJDropshipping Integration (Session 14-15)

| Task | Status | Notes |
|---|---|---|
| CJ API client | ✅ | Token mgmt, search, detail, freight, normalization |
| CJ product search/detail/import | ✅ | Mirrors AliExpress pattern |
| CJ categories + feed tabs | ✅ | 3-level tree, Trending/New/Video tabs |
| CJ freight calculator | ✅ | `POST /api/suppliers/cj/freight` |
| CJ auth connect | ✅ | `POST /api/auth/cj/connect` — validates + saves |
| Dual-supplier Discovery UI | ✅ | AliExpress/CJ dropdown with independent flows |
| USD → SAR normalization | ✅ | All CJ prices ×3.75 at normalization layer |
| CJ order creation API | 📋 | Phase 6 — order fulfillment engine |

### ✅ Phase 7B: Zid Platform Integration (Session 10, 12, 17)

| Task | Status | Notes |
|---|---|---|
| Zid OAuth 2.0 flow | ✅ | `/api/auth/zid` + callback |
| Zid API client | ✅ | Dual-header auth, auto-refresh, bilingual mapper |
| Product push to Zid store | ✅ | 3-step: create → images → variants |
| Import route — dual-platform | ✅ | Auto-detects store platform |
| Zid category sync | ✅ | Fixed endpoint `/managers/store/categories` (Session 17) |
| Zid webhooks | ⏸️ | Blocked: app not selectable in partner dashboard |

### ✅ DevOps: Auto-Deployment (Session 15 + 17)

| Task | Status | Notes |
|---|---|---|
| aaPanel WebHook plugin | ✅ | `Deploy_Dropshipping` hook |
| GitHub Webhook | ✅ | Triggers on push |
| Deployment script | ✅ | Stop PM2 → build → start PM2 (race condition fixed) |
| PM2 environment fix | ✅ | `HOME=/root` + `PM2_HOME=/root/.pm2` |

---

## Session 17 Bugfixes

| Bug | Fix | Commit |
|---|---|---|
| Zid categories 404 (`/products/categories`) | Changed to `/managers/store/categories` per Postman docs | `38fb713` |
| Bank transfers FK ambiguity error | Removed merchants FK join, uses separate query pattern | `8129f44` |
| PM2 race condition (middleware-manifest.json) | Stop PM2 before build, start after | `deployment_guide.md` |

---

## What's NOT Done — Upcoming

### 📋 Next Priority: Build n8n WF5 (AI Content Generation)

> Infrastructure is ready. Need to build the actual n8n workflow.

| Task | Priority | Status |
|---|---|---|
| n8n WF5: Product → GPT/Gemini → bilingual desc | 🔴 P0 | DB + admin + guide ready |
| Social media post generation | 🔴 P0 | Templates defined |
| Social media auto-scheduling | 🟡 P1 | Planning done |
| Product inbox / quality gate | 🟡 P1 | Schema ready |

### 📋 Phase 4E: Trending Products & Smart Discovery

| Task | Priority |
|---|---|
| Trending Products page | 🔴 P0 |
| n8n daily cron: bestseller feeds | 🔴 P0 |
| Cross-supplier trending (AliExpress + CJ) | 🟠 P2 |
| Weekly trend reports | 🟡 P1 |
| SA Market Intelligence | 🟠 P2 |

### 📋 Phase 5: Wallet & Payments ⏸️ (Partially blocked)

| Task | Priority | Status |
|---|---|---|
| Bank transfer upload + admin approval | ✅ | **Done** |
| Moyasar integration (Mada/Visa) | 🟡 P1 | 🔒 Blocked — no API keys |
| Stripe integration (card top-up) | 🟠 P2 | 🔒 Blocked — no API keys |
| Auto top-up | 🟠 P2 | 🔒 Blocked — needs Stripe |

### 📋 Phase 6: Auto-Fulfillment Engine

| Task | Priority |
|---|---|
| n8n WF2: Order → wallet check → supplier order | 🔴 P0 |
| n8n WF3: Tracking sync | 🟡 P1 |
| n8n WF4: Stock sync (cron every 6h) | 🟡 P1 |

---

## API Routes Summary (Current)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/suppliers/aliexpress/feeds` | Public | Admin-configured feed list |
| `PUT` | `/api/suppliers/aliexpress/feeds` | Admin | Save feed config |
| `POST` | `/api/suppliers/aliexpress/feeds/sync` | Admin | Sync from AliExpress API |
| `GET` | `/api/suppliers/aliexpress/search` | Auth | Keyword + feed search |
| `GET` | `/api/suppliers/aliexpress/product/:id` | Auth | Product detail |
| `POST` | `/api/suppliers/aliexpress/import` | Auth | Import + auto-push |
| `GET` | `/api/suppliers/cj/search` | Auth | CJ product search |
| `GET` | `/api/suppliers/cj/product` | Auth | CJ product detail |
| `POST` | `/api/suppliers/cj/import` | Auth | CJ import + auto-push |
| `GET` | `/api/suppliers/cj/categories` | Auth | CJ category tree |
| `POST` | `/api/suppliers/cj/freight` | Auth | CJ shipping calculator |
| `GET` | `/api/suppliers/cj/feeds` | Auth | CJ feed tabs |
| `POST` | `/api/auth/cj/connect` | Auth | Connect CJ account |
| `PATCH` | `/api/products/:id` | Auth | Edit product |
| `DELETE` | `/api/products/:id` | Auth | Delete product |
| `POST` | `/api/products/:id/push` | Auth | Push to store |
| `GET` | `/api/products/:id/shipping` | Auth | Live shipping options |
| `GET` | `/api/auth/salla` | Auth | Salla OAuth |
| `GET` | `/api/auth/salla/callback` | Public | Salla callback |
| `GET` | `/api/auth/zid` | Auth | Zid OAuth |
| `GET` | `/api/auth/zid/callback` | Public | Zid callback |
| `POST` | `/api/webhooks/salla` | HMAC | Salla order webhooks |
| `DELETE` | `/api/stores/:id/disconnect` | Auth | Disconnect store |
| `GET` | `/api/salla/categories` | Auth | Salla categories |
| `GET` | `/api/salla/products` | Auth | Sync Salla products |
| `GET` | `/api/zid/categories` | Auth | Zid categories |

---

## Reference Documents

| Document | Purpose |
|---|---|
| `TODO.md` | Development checklist with progress tracking |
| `implementation_plan2.md` | Full architecture, schema, workflow specs |
| `dropshipping_full_plan.md` | Business logic: ordering, shipping, curation |
| `aliexpress_api_reference.md` | All 47 feeds, tested filters, field mappings |
| `n8n_content_workflows_guide.md` | AI content generation n8n workflow guide |
| `deployment_guide.md` | VPS deployment + auto-deploy webhook |
| `supabase/schema.sql` | Complete database schema |
| `app/src/lib/cj/API_REFERENCE.md` | CJ API v2.0 endpoint reference |
| `PRODUCT.md` | Brand personality, design principles |
| `DESIGN.md` | Design system tokens |
