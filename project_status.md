# DropLinker — Project Status

> **Last Updated:** 2026-05-15

## Executive Summary

**What exists:** A polished frontend shell (Next.js 16 + Tailwind) with 22 routes, plus a fully working backend foundation — Supabase database (19 tables, RLS, triggers, wallet functions), Supabase Auth (email/password signup + protected routes), and a production Salla OAuth integration. Merchants can sign up, connect their Salla store, and see the connection status live. An n8n webhook workflow is partially built (token validation, event routing, app.uninstalled handler).

**What's next:** Replace all remaining mock data with live Supabase queries, complete the n8n order processing workflow, integrate AliExpress product search, build the wallet top-up flow, and add i18n.

---

## What's Done

### ✅ Infrastructure & Database

| Task | Status | Notes |
|---|---|---|
| Supabase project created | ✅ | URL + keys in `.env.local` |
| Database schema (19 tables) | ✅ | `schema.sql` — merchants, wallets, stores, orders, products, fulfillments, etc. |
| Enums (11 types) | ✅ | order_status, store_platform, supplier_type, etc. |
| RLS policies (all tables) | ✅ | `is_admin()` helper + per-table self-or-admin policies |
| Wallet functions (atomic) | ✅ | `wallet_credit()`, `wallet_deduct()` with transaction logging |
| Auto-create wallet trigger | ✅ | `trg_merchant_wallet` — wallet created on merchant signup |
| Updated_at triggers | ✅ | Auto-timestamp on 7 tables |
| Indexes (20+) | ✅ | On all foreign keys + frequently queried columns |
| Seed data | ✅ | 4 subscription tiers + 11 platform config entries |
| `salla_merchant_id` column | ✅ | Added to `stores` table for webhook matching |

### ✅ Authentication

| Task | Status | Notes |
|---|---|---|
| Supabase Auth (email/password) | ✅ | Working signup + login |
| Server-side auth client | ✅ | `createClient()` + `createAdminClient()` in `lib/supabase/server.ts` |
| Client-side auth client | ✅ | `createClient()` in `lib/supabase/client.ts` |
| Auth middleware | ✅ | `middleware.ts` guards `/dashboard/*` routes |
| Signup → merchant + wallet creation | ✅ | Uses admin client to bypass RLS during signup |
| Login flow | ✅ | Redirects to `/dashboard` on success |

### ✅ Salla Integration

| Task | Status | Notes |
|---|---|---|
| Salla Partner Portal app | ✅ | `droplinker` private app created |
| OAuth initiation (`/api/auth/salla`) | ✅ | Redirects to Salla with correct scopes |
| OAuth callback (`/api/auth/salla/callback`) | ✅ | Token exchange (form-urlencoded) + user info fetch |
| Store upsert to Supabase | ✅ | Insert or update store with tokens, salla_merchant_id |
| `app.installed` webhook | ✅ | n8n receives + responds 200 |
| `app.uninstalled` webhook | ✅ | n8n updates `is_active = false` via Supabase node |
| Disconnect button (dashboard) | ✅ | API route `/api/stores/[id]/disconnect` + UI button |
| Reconnect flow | ✅ | "Reconnect" button triggers OAuth again |
| Integration status display | ✅ | Live query — shows "connected" / "not connected" |

### ✅ n8n Workflow (Partial)

| Task | Status | Notes |
|---|---|---|
| Webhook endpoint | ✅ | `POST https://n8n.asra3.com/webhook/salla-webhook` |
| Token validation | ✅ | Checks `authorization` header against webhook secret |
| Event router (Switch) | ✅ | Routes: order.created, order.updated, app.installed, app.uninstalled, fallback |
| `app.installed` handler | ✅ | Responds 200 (logged) |
| `app.uninstalled` handler | ✅ | Supabase update → `is_active = false` by `salla_merchant_id` |
| `order.created` handler | ❌ | **DEFERRED** — needs Find Store → Insert Order → Respond |
| `order.updated` handler | ❌ | **DEFERRED** — needs Find Store → PATCH Order → Respond |
| Fallback handler | ❌ | Needs: Respond 200 |

### ✅ Frontend UI Shell (All Mock Data)

| Task | Status |
|---|---|
| Landing page | ✅ |
| Features page | ✅ |
| Pricing page | ✅ |
| Auth pages (Login/Register) | ✅ |
| Dashboard overview | ✅ |
| Product Discovery | ✅ |
| Import Wizard | ✅ |
| My Products | ✅ |
| Orders page + pipeline | ✅ |
| Wallet page | ✅ |
| Integrations page | ✅ |
| Settings (5 tabs) | ✅ |
| Admin Dashboard | ✅ |
| Admin Merchants | ✅ |
| Admin Revenue/Commission | ✅ |
| Admin Bank Transfers | ✅ |
| Admin Order Monitor | ✅ |
| Admin Platform Settings | ✅ |

---

## What's NOT Done — Upcoming Phases

### 🔴 Phase 2: Live Data Migration (Replace Mock Data)

> Priority: **HIGH** — The dashboard currently shows fake data everywhere

| Task | Priority | Depends On |
|---|---|---|
| Dashboard stats → real Supabase queries | 🔴 P0 | — |
| Orders page → live orders from Supabase | 🔴 P0 | n8n order.created |
| Wallet page → real balance + transactions | 🔴 P0 | — |
| My Products → CRUD against `products` table | 🟡 P1 | Supplier integration |
| Settings page → persist to `merchants` table | 🟡 P1 | — |
| Admin pages → real cross-merchant queries | 🟡 P1 | — |

### 🟡 Phase 3: Order Processing Pipeline

> Priority: **HIGH** — Core business logic

| Task | Priority | Depends On |
|---|---|---|
| n8n: `order.created` → Find Store → Insert Order | 🔴 P0 | salla_merchant_id working |
| n8n: `order.updated` → Find Store → PATCH Order status | 🔴 P0 | order.created done |
| n8n: Fallback → Respond 200 | 🟢 P3 | — |
| Order detail view (dashboard) | 🟡 P1 | Orders in DB |
| Order status pipeline visualization | 🟡 P1 | Orders in DB |

### 🟡 Phase 4: AliExpress Integration

> Priority: **MEDIUM** — Product discovery is the merchant's primary action

| Task | Priority | Depends On |
|---|---|---|
| AliExpress API setup (developer account exists) | 🔴 P0 | API credentials |
| Product search endpoint (`/api/suppliers/aliexpress/search`) | 🔴 P0 | API setup |
| Product detail fetch | 🟡 P1 | Search working |
| Import wizard → write to Supabase + push to Salla store | 🟡 P1 | Salla API + AE API |
| AI product descriptions (n8n WF5 → GPT/Gemini) | 🟠 P2 | Import flow working |
| Product inbox / quality gate | 🟠 P2 | AI descriptions |

### 🟡 Phase 5: Wallet & Payments

> Priority: **MEDIUM** — Required before auto-fulfillment goes live

| Task | Priority | Depends On |
|---|---|---|
| Wallet balance display (real data) | 🔴 P0 | — |
| Bank transfer upload + admin approval flow | 🟡 P1 | Admin panel wired |
| Moyasar integration (Mada/Visa top-up) | 🟡 P1 | Moyasar account |
| Stripe integration (card top-up) | 🟠 P2 | Stripe account |
| Transaction history (real data) | 🟡 P1 | — |
| Auto top-up (charge card when balance < threshold) | 🟠 P2 | Stripe/Moyasar |

### 🟠 Phase 6: Auto-Fulfillment Engine

> Priority: **MEDIUM** — The killer feature, depends on Phases 3-5

| Task | Priority | Depends On |
|---|---|---|
| n8n WF2: Order received → check wallet → place supplier order | 🔴 P0 | AE API + Wallet |
| n8n WF3: Tracking sync (poll supplier → push to Salla) | 🟡 P1 | WF2 |
| n8n WF4: Stock sync (cron every 6h) | 🟡 P1 | AE API |
| Supplier fallback (AE out of stock → try CJ) | 🟠 P2 | CJ integration |
| Auto-fulfill toggle in merchant settings | 🟡 P1 | WF2 |

### 🟠 Phase 7: CJDropshipping + Zid

> Priority: **LOW** — Expansion after core is stable

| Task | Priority |
|---|---|
| CJ API integration (product search + auto-order) | 🟠 P2 |
| Zid OAuth + webhook integration | 🟠 P2 |
| Multi-store support (multiple Salla/Zid stores) | 🟠 P2 |

### 🟠 Phase 8: i18n + Polish

> Priority: **LOW** — Important but not blocking

| Task | Priority |
|---|---|
| `next-intl` setup (AR/EN dictionaries) | 🟠 P2 |
| RTL layout system (Tailwind RTL plugin) | 🟠 P2 |
| Mobile-responsive dashboard optimization | 🟠 P2 |
| Email/SMS notifications (n8n WF6) | 🟠 P2 |
| Performance optimization + caching | 🟠 P2 |

### 🟠 Phase 9: Scale & Advanced

> Priority: **FUTURE** — After launch

| Task | Priority |
|---|---|
| Subscription billing automation (Stripe recurring) | 🟠 |
| Team member access with roles | 🟠 |
| Advanced analytics dashboard | 🟠 |
| Gulf-wide expansion (multi-currency) | 🟠 |

---

## Reference Documents

| Document | Purpose |
|---|---|
| `implementation_plan2.md` | Full architecture, schema, workflow specs |
| `PRODUCT.md` | Brand personality, design principles, user profiles |
| `DESIGN.md` | Design system tokens (colors, typography, spacing) |
| `supabase/schema.sql` | Complete database schema (19 tables) |
| `n8n/BUILD_WORKFLOW_GUIDE.md` | Step-by-step n8n workflow construction guide |
| `SALLA_SETUP_GUIDE.md` | Salla Partner Portal configuration |
| `Merchant APIs V2.7.6.postman_collection.json` | Salla Merchant API reference |
| `Store APIs 1.0.postman_collection.json` | Salla Store API reference |
| `Shipments APIs V2.0.6.postman_collection.json` | Salla Shipments API reference |
