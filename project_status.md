# DropLinker — Project Status vs. Implementation Plan

## Executive Summary

**What exists today:** A polished, production-quality **frontend shell** (Next.js 16 + Tailwind) with 22 routes, all running on mock data from `mockData.ts`. Zero backend integration.

**What's missing:** Everything under the hood — database, auth, APIs, n8n workflows, payment gateways, i18n. The car looks beautiful, but there's no engine.

---

## Phase 1 Checklist — Status Audit

### ✅ DONE — Frontend UI Shell

| Task | Status | Notes |
|---|---|---|
| Next.js project setup | ✅ Done | Next.js 16.2.6 + Turbopack |
| Landing page | ✅ Done | Quiet Commerce design |
| Features page | ✅ Done | |
| Pricing page | ✅ Done | Static tiers from mockData |
| Auth pages (Login/Register) | ✅ Done | UI only — no actual auth |
| Merchant Dashboard overview | ✅ Done | Mock KPIs |
| Product Discovery page | ✅ Done | Mock product cards |
| Import Wizard page | ✅ Done | UI only — no import logic |
| My Products page | ✅ Done | Mock product list |
| Orders page + pipeline | ✅ Done | Mock order data |
| Wallet page | ✅ Done | Mock balance/transactions |
| Integrations page | ✅ Done | Mock connection cards |
| Settings page (5 tabs) | ✅ Done | UI forms, no persistence |
| Admin Dashboard | ✅ Done | Mock platform stats |
| Admin Merchants | ✅ Done | Mock merchant table |
| Admin Revenue/Commission | ✅ Done | UI only — no config logic |
| Admin Bank Transfers | ✅ Done | Mock approval queue |
| Admin Order Monitor | ✅ Done | Mock order table |
| Admin Platform Settings | ✅ Done | UI forms, no persistence |
| Design system (OKLCH, dual-theme) | ✅ Done | `globals.css` + shared components |

### ❌ NOT STARTED — Backend & Integration

| Task | Status | Priority | What's Needed |
|---|---|---|---|
| **Supabase project setup** | ❌ | 🔴 P0 | Create project, configure env vars |
| **Database schema** | ❌ | 🔴 P0 | Apply the 11-table schema from plan §7 |
| **Supabase Auth** | ❌ | 🔴 P0 | Email/password + RLS policies |
| **Connect Auth to Login/Register** | ❌ | 🔴 P0 | Replace mock forms with real auth |
| **Protected routes** | ❌ | 🔴 P0 | Middleware guarding `/dashboard` and `/admin` |
| **Merchant CRUD** | ❌ | 🟡 P1 | Real settings persistence to Supabase |
| **Wallet system** | ❌ | 🟡 P1 | Balance tracking, transaction records |
| **AliExpress API integration** | ❌ | 🟡 P1 | Product search + detail fetch |
| **Salla OAuth + webhooks** | ❌ | 🟡 P1 | Store connection, order.created webhook |
| **n8n WF1: Order Webhook** | ❌ | 🟡 P1 | Receive + validate + insert order |
| **n8n WF2: Auto-Fulfill** | ❌ | 🟡 P1 | Wallet check → supplier order |
| **n8n WF3: Tracking Sync** | ❌ | 🟡 P1 | Poll or webhook → push to store |
| **Bank Transfer flow** | ❌ | 🟠 P2 | Upload receipt → admin approval → wallet credit |
| **i18n (next-intl)** | ❌ | 🟠 P2 | Arabic/English with RTL support |
| **Moyasar / Stripe** | ❌ | 🟠 P2 | Online wallet top-up |

---

## GitNexus Analysis

The knowledge graph confirms the codebase is **100% UI rendering** — all 27 execution flows trace from Page → Component (Card, Icon, Button, Badge). There are:

- **0 API calls** (no `fetch`, no Supabase client)
- **0 auth flows** (no session, no middleware)
- **0 database operations** (everything reads from `mockData.ts`)
- **0 n8n webhook handlers**

---

## What to Do Next — Recommended Order

### 🔴 Step 1: Supabase Foundation (do this first)

1. **Create Supabase project** → get URL + anon key + service role key
2. **Install dependencies**: `@supabase/supabase-js`, `@supabase/ssr`
3. **Create `.env.local`** with Supabase credentials
4. **Apply database schema** — the 11 tables from plan §7 (merchants, wallets, transactions, stores, products, orders, etc.)
5. **Set up RLS policies** — merchants can only see their own data
6. **Create Supabase client utilities** (`lib/supabase/client.ts`, `lib/supabase/server.ts`)

### 🔴 Step 2: Authentication

1. **Enable Supabase Auth** (email/password)
2. **Wire up Login/Register pages** to real auth
3. **Create auth middleware** (`middleware.ts`) to protect `/dashboard/*` and `/admin/*`
4. **Add role-based access** — `role` column on merchants table (merchant vs admin)
5. **Build session provider** — `useUser()` hook for client components

### 🟡 Step 3: Replace Mock Data with Live Queries

1. **Dashboard stats** → real queries (order count, product count, wallet balance)
2. **Products page** → CRUD against `products` table
3. **Orders page** → real orders from Supabase
4. **Wallet page** → real transactions + balance
5. **Settings page** → persist to `merchants` table
6. **Admin pages** → query across all merchants (admin RLS)

### 🟡 Step 4: External API Integrations

1. **Salla OAuth** — store connection flow
2. **AliExpress API** — product search endpoint
3. **Product import** — write to Supabase + push to connected store

### 🟡 Step 5: n8n Workflows

1. **WF1** — Order webhook receiver
2. **WF2** — Auto-fulfill (wallet check → supplier API)
3. **WF7** — Bank transfer approval

### 🟠 Step 6: Payments & i18n

1. **Moyasar integration** — wallet top-up
2. **next-intl setup** — AR/EN dictionaries + RTL layout

---

## Decision Needed

> [!IMPORTANT]
> **Before we start coding Step 1, I need your Supabase project credentials.** Have you already created a Supabase project for DropLinker? If not, should I walk you through creating one?

> [!IMPORTANT]
> **Do you have your Salla developer account and AliExpress API credentials ready?** This determines whether we can do Step 4 in parallel or need to defer it.
