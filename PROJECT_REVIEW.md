# DropLinker — Full Project Review

> Generated 2026-07-03. Five parallel deep-reviews (backend/API+SDKs, Supabase schema, frontend/hooks, n8n+docs, Postman/docs-vs-implementation cross-check) plus repo-hygiene checks. Findings the agents independently corroborated are marked 🟰.

---

## 0. Project snapshot

**Stack:** Next.js 16 + React 19 + Supabase (Postgres + RLS + Auth) + n8n. Integrations: Salla, Zid (store platforms), AliExpress + CJDropshipping (suppliers). Multi-tenant, SAR-currency, admin panel + merchant dashboard. ~27 tables, ~25 API routes, 11 data hooks.

**Maturity:** Phase 1–4D + 7A/7B (CJ, Zid) are genuinely built and working. The "AI Content Engine" is infrastructure-only (DB + admin UI, no n8n workflow yet). Phase 5 (payments) and Phase 6 (auto-fulfillment) are not built.

**Structural warning from the repo itself:** `app/AGENTS.md` says *"This is NOT the Next.js you know"* — Next.js 16 has breaking changes. Any edits to app code should consult `node_modules/next/dist/docs/` first.

---

## 1. 🚨 CRITICAL — fix before any production traffic

### CRIT-1. Leaked Supabase service-role key committed to git
`check-search.js:5` (repo root) contains a hardcoded service-role JWT (`eyJhbGci...`). The service role bypasses all RLS — anyone with this key has full admin DB access.
→ **Rotate the key in Supabase dashboard immediately**, delete the file, and add `check-*.js`/`fix*.js` to `.gitignore`. Even after deletion it's in git history, so rotation is mandatory.

### CRIT-2. `wallet_credit` / `wallet_deduct` callable from the browser by any merchant — self-mint money 🟰
Found independently by 3 agents (backend-M2, schema-C2, frontend-C1). `useAdminTransfers.approve` calls `supabase.rpc("wallet_credit", …)` from the browser via the anon key. The function is plain `LANGUAGE plpgsql` (not `SECURITY DEFINER`, no `is_admin()` guard). A merchant opens the console and runs:
```js
supabase.rpc("wallet_credit", { p_merchant_id: ownId, p_amount: 999999, p_method:"bank_transfer", p_description:"x", p_reference:"x" })
```
→ Move the entire approve/reject flow into a server route using `createAdminClient` with a server-side `is_admin()` check. Add `IF NOT is_admin() THEN RAISE EXCEPTION 'admin only'; END IF;` inside `wallet_credit`/`wallet_deduct`, `REVOKE EXECUTE` from `anon`/`authenticated`.

### CRIT-3. `wallet_credit(amount := -N)` / `wallet_deduct(amount := -N)` invert the operation
No `p_amount > 0` check. `wallet_deduct(-100)` *increases* the balance by 100 (logged as a deduction). Lets a merchant inflate balance while mislabeling the ledger.
→ Add `IF p_amount <= 0 THEN RAISE EXCEPTION …` at the top of both functions.

### CRIT-4. Merchants can directly `UPDATE` their own wallet balance 🟰
`wallets_self` policy is `FOR ALL` with no `WITH CHECK` (`schema.sql:677`). A merchant runs `supabase.from('wallets').update({balance: 999999}).eq('merchant_id', myId)` — succeeds (only `CHECK (balance >= 0)` stops them).
→ Restrict merchants to `SELECT` only; make wallet functions `SECURITY DEFINER`; `REVOKE INSERT,UPDATE,DELETE ON wallets FROM anon, authenticated`. Make `create_merchant_wallet()` trigger `SECURITY DEFINER` so signup still works.

### CRIT-5. Merchants can self-approve their own bank transfers 🟰
`transfers_self` is `FOR ALL` (`schema.sql:733`) — a merchant can `update({status:'approved', approved_by: myId})` on their own row. Combined with CRIT-2 this is direct money printing; even without it, the admin audit trail is forgeable.
→ Merchants get `INSERT + SELECT` only; updates/deletes admin-only.

### CRIT-6. `platform_config` is world-readable — leaks all platform secrets 🟰
`config_read … USING (true)` (`schema.sql:780`). The anon key is public in the client bundle, so **any unauthenticated visitor** can `select('*')` and read: AliExpress access/refresh tokens, CJ access/refresh tokens + API key, n8n webhook URLs + HMAC secret, Moyasar/Stripe secret keys, and Gemini/OpenAI/Claude API keys (all stored in this one table).
→ Change policy to `USING (is_admin())` for secrets, or split into a public-settings table + an admin-only `platform_secrets` table. Rotate all leaked secrets after fixing.

### CRIT-7. OAuth callbacks attach stores without verifying the session
Salla/Zid callbacks (`auth/salla/callback`, `auth/zid/callback`) trust `state` (the merchant UUID) from the URL with no `getUser()` and no nonce. An attacker authorizes their own store, then hits `/api/auth/salla/callback?code=ATTACKER_CODE&state=VICTIM_UUID` → attaches their store to the victim's account via `createAdminClient` (bypasses RLS). Victim's product pushes and order webhooks then go to the attacker.
→ Verify `getUser()` in the callback and require `state === user.id`; better, use a random nonce stored in a signed cookie at initiation. AliExpress's platform-token callback (`auth/aliexpress/callback`) has **no auth check at all** — anyone can overwrite the master AliExpress tokens. Add an admin session requirement there too.

---

## 2. 🔴 HIGH

### HIGH-1. Salla webhook fails open when the secret is unset
`webhooks/salla/route.ts:35` — verification is wrapped in `if (webhookSecret)`. If the env var is empty, the route accepts forged `order.created` events for any guessable `salla_merchant_id` (a small sequential int). → Fail closed: return 500 if `!webhookSecret`.

### HIGH-2. Global webhook secret leaked to every merchant 🟰
The Salla callback writes `webhook_secret: process.env.SALLA_WEBHOOK_SECRET` into each merchant's `stores` row, and RLS lets merchants read their own row. Any merchant learns the global secret and can forge validly-sign webhooks for any other merchant. → Generate a unique random secret per store; verify against the per-store secret looked up by `salla_merchant_id`.

### HIGH-3. SSRF via user-controlled image URLs
`zid/client.ts:253` (`uploadProductImages`) does server-side `fetch(urls[i])`, and `products/[id] PATCH` accepts `images` with no validation. A merchant sets `images: ["http://169.254.169.254/latest/meta-data/..."]` → server-side request forgery against cloud metadata / internal services. → Allowlist supplier domains (alicdn, cjdropshipping), reject non-https / private-IP / loopback, DNS-resolve and block private ranges before fetching.

### HIGH-4. Webhook comparison is timing-unsafe + no replay protection
`!==` string compare on the HMAC (`webhooks/salla/route.ts:46`); no timestamp/event-id dedup. → `crypto.timingSafeEqual` + record processed `event_id` within a window.

### HIGH-5. `store/branding` POST IDOR
`store/branding/route.ts:41` upserts `store_id` from body without checking the store belongs to the caller. `UNIQUE(store_id)` lets an attacker claim a victim's branding slot first (DoS). → Verify `stores.merchant_id === user.id` before upsert.

### HIGH-6. n8n WF1 deactivates **all** Salla stores on any `app.uninstalled`
`n8n/wf1-salla-order-webhook.json:447` patches `platform=eq.salla&is_active=eq.true` — a blanket deactivation of every merchant's store on a single uninstall. The build guide documents the *correct* filter (`salla_merchant_id=eq.body.merchant`) but the shipped JSON disagrees. This is a multi-tenant data-loss bug. → Fix the filter expression in the workflow.

### HIGH-7. n8n WF1 has a hardcoded `merchant_id` UUID
`wf1-salla-order-webhook.json:206` bakes a literal merchant UUID into the store upsert — importing as-is binds every store to one merchant. → Parameterize.

### HIGH-8. Zid product push silently fails categories and variants
- **Z-1:** `zid/client.ts:242` sends `categories` in the create-product payload, but Zid docs explicitly forbid this ("Categories cannot be added during product creation"). Category assignment silently never happens. → Remove from create payload; call `POST /products/{id}/categories/` after creation.
- **Z-2:** `zid/client.ts:470` calls `/products/{id}/variants` **without trailing slash**. Zid (Django `APPEND_SLASH`) 301-redirects, `fetch` converts POST→GET, the body is dropped → **variants are never created** (caught and logged as a warning). → Add the trailing slash. Same issue on DELETE/PATCH product (Z-3, MEDIUM) — may no-op.

### HIGH-9. No rate limiting on shared-quota supplier routes
AliExpress + CJ use one platform-level API key for all merchants. No per-merchant limiting on search/detail/import → a single merchant can exhaust the platform quota. → Add a token-bucket limiter (e.g. Upstash) keyed on `user.id` + route, plus a daily import cap.

---

## 3. 🟠 MEDIUM (selection)

- **Admin role gate is client-side only.** `admin/layout.tsx` checks role in `useEffect`; middleware only checks login, not role. Any logged-in merchant reaches `/admin/*`. RLS currently backstops data, but any future admin-only route without an explicit server-side role check will be wide open. → Enforce role in `middleware.ts` for `/admin/*`.
- **`signUp` silently creates an auth user with no `merchants` row** if the insert fails, then redirects to `/dashboard` where every RLS-scoped query returns nothing — unrecoverable without DB intervention. → Surface a retry path; don't redirect on insert failure.
- **Admin hooks never clear `error` on success** → stale error banners persist (`use-admin.ts` fetches). → `setError(null)` at fetch start.
- **`useOrders` caps at 100 rows but presents the count as the total** → dashboard "orders today / revenue this month" and "Showing X of Y" are wrong for merchants >100 orders. → Use a server-side count/aggregate.
- **`wallet_credit` failure rollback is unchecked** — if the credit fails, the status revert isn't awaited; transfer can end up `approved` with no credit and no clear signal.
- **CJ refresh-token endpoint uses POST, docs say GET** (`cj/client.ts:77`). If CJ enforces GET, refresh fails and falls through to an *also undocumented* POST+apiKey `getAccessToken` path. → Verify live; align to docs (`GET …?refreshToken=…` and `GET …?email=…&password=…`).
- **AliExpress token-refresh response logged in full** (`aliexpress/client.ts:127`) — new access/refresh tokens written to server logs. → Redact.
- **Routes leak `error.message` to clients** (cj/import, aliexpress/import, feeds, cj/connect, cj/search) — may expose Postgres errors / internal paths. → Generic client message + server-side log.
- **No input validation (zod) anywhere** — `retail_price: -100`, huge margins, arbitrary `platform` strings reach DB + external APIs. → Add schema validation at route boundaries.
- **`orders.store_id` cascades on store delete** + merchants can DELETE their own store → a merchant can wipe their own order history (and products orphan on supplier-account delete). → Soft-delete (`is_active=false`) or `ON DELETE RESTRICT`.
- **`FOR ALL` policies without `WITH CHECK`** let merchants rewrite financial fields on their own rows (`orders.total_cost`, `transactions.balance_after`, `fulfillments.cost`). → Tighten per-command policies; make `transactions.balance_after` generated/admin-only.
- **RLS not `FORCE`d** — table owner / `BYPASSRLS` roles skip policies silently if anything ever connects as `postgres`. → `ALTER TABLE … FORCE ROW LEVEL SECURITY`.
- **No uniqueness on `(store_id, store_order_id)`** → webhook replays create duplicate orders. Same for `(merchant_id, supplier, supplier_product_id)` → duplicate product imports. → Add constraints.
- **Two divergent admin models** (`is_admin()` checks `merchants.role='admin'`; `platform_feeds` policy checks `raw_user_meta_data->>'role'='super_admin'`) with no bridge. → Unify.
- **Tokens stored in plaintext** despite `schema.sql:106` comment "encrypted at app level" — no encryption is applied. Anyone with DB-read access gets all merchant OAuth tokens. → pgcrypto or a secrets manager; at minimum remove the misleading comment.
- **`BankTransferForm` stores a fake receipt path on upload failure** (`wallet/page.tsx:43`) — admins approving transfers see a dead URL. → Fail the submission or flag `receipt_pending`.
- **Admin "Branding" + Payment Gateway fields are display-only** — no save action wired (`admin/settings/page.tsx`). An admin edits, navigates away, nothing persists. → Wire to `updateConfig` or mark read-only.
- **`useProductSearch` debounce timer never cleared on unmount** + wrong `NodeJS.Timeout` ref type. → Cleanup effect + `ReturnType<typeof setTimeout>`.
- **`store_branding`/`content_assets`/`social_accounts`/`scheduled_posts` (AI Content phase tables)** — verify they have `*_self` RLS policies before committing the staged +306-line schema.

---

## 4. n8n reality vs documentation

- **Only WF1 exists as a file.** WF2–WF10 are prose/diagrams only. `implementation_plan2.md`'s architecture diagram presents W1–W7 as if live — misleading. The actual order/fulfillment/tracking/stock/notification workflows (Phase 6) are **not built**.
- **n8n WF1 is weaker than the in-app route** it supposedly backs: it does static-token auth only, **no HMAC signature verification**, despite `ARCHITECTURE.md:279` claiming HMAC verification for `/api/webhooks/salla` (true for the Next.js route, false for the n8n path). Hardcoded merchant_id (HIGH-7) and blanket-deactivation bug (HIGH-6) above.
- **`BUILD_WORKFLOW_GUIDE.md:31` commits a real-looking webhook secret in plaintext**, while `SALLA_SETUP_GUIDE.md:130` gives a placeholder — two onboarding docs disagree. Rotate and replace with a placeholder.
- **`implementation_plan2.md:355-385` lists 28 tables incl. 6 "content automation" tables that don't exist** by those names (`content_generation_queue`, `social_media_posts`, `seo_metadata`, `image_generation_templates`, `content_schedules`…). The plan's schema section is partly fictional vs the actual `phase_content_automation.sql` (5 tables: `store_branding`, `content_assets`, `social_accounts`, `scheduled_posts`, `content_templates`).

---

## 5. Documentation health

- **Table counts disagree everywhere** and all are wrong: TODO says 19, ARCHITECTURE says 20/21, project_status says 21+, plan2 says 28. Actual = ~27 (incl. a duplicated `salla_categories` definition at `schema.sql:1109` and `:1156`). GitNexus metrics also disagree (CLAUDE.md: 2348 symbols / 120 flows vs ARCHITECTURE.md: 1908 / 100).
- **`ARCHITECTURE.md` is a Session-14 snapshot mislabeled "Session 17"** (date bumped, content not). It omits ~11 live routes (`/api/auth/zid*`, `/api/zid/*`, `/api/content/*`, `/api/social/*`, `/api/store/branding`, `/api/products/[id]/ai-generate`), still calls the product editor "SEO" tab (replaced by "Store Settings" in Session 12), and lists "21 tables."
- **`walkthrough.md` is frozen at Session 9** and teaches the **old broken PM2 deploy pattern** (`pm2 restart`) that Session 17 explicitly fixed (stop-before-build). It contradicts `deployment_guide.md`.
- **Four docs maintain parallel phase-status / API-route tables that all disagree** (TODO, project_status, ARCHITECTURE, implementation_plan2). Three claim to be the authoritative API-route list; each is a different subset.
- **`prd.txt` (original Arabic PRD) drift:** proposes FastAPI/Django + MongoDB + a "Makhzan/M5azn" supplier and HeyGen/Runway/Leonardo AI tools — none of which are in the actual Next.js+Supabase+n8n stack. Keep as history, not as current spec.
- **`app/README.md`** is the untouched `create-next-app` default (mentions Geist font, Vercel). **`app/CLAUDE.md`** is a one-line `@AGENTS.md` include. Both boilerplate.
- **`what to test.md`** is a session-by-session append log that stopped at Session 13 (no tests for CJ/AI-content/deploy-fix sessions 14–17) but is named like a general test plan.

---

## 6. Cleanup candidates (repo root)

| File | Action | Why |
|---|---|---|
| `check-search.js` | **Delete + rotate Supabase service key** | Leaked service-role JWT (CRIT-1) |
| `fix.js`, `fix2.js` | Delete | One-off regex patchers, already applied |
| `received-webhooks.txt` | Delete / gitignore | Debug payload dump with real headers/IPs |
| `ali.txt` | Delete | Superseded by `aliexpress_api_reference.md` |
| `aliexpress docs.txt` (78KB) | Move to `app/src/lib/aliexpress/` or delete | Raw scrape, not a project doc |
| `droplinker_logo.png` (269KB) | Move to `app/public/` or delete | Binary asset in repo root |
| `supabase/Fix1.sql` | Fold into a named migration or delete | Stray unnamed RLS snippet |
| `walkthrough.md`, `what to test.md`, `setting salla app.md`, `prd.txt` | Move to `docs/history/` | Frozen/contradictory snapshots |
| `*.postman_collection.json` + `Zid_Docs.postman.json` (~5.5MB) | Move to `references/` | Large, retrievable from providers |
| `.gitignore` | Add `fix*.js`, `check-*.js`, `received-webhooks.txt` | Prevent recurrence |

The uncommitted `supabase/schema.sql` (+306 lines) is the **AI Content phase** (7 new tables/enums) — legitimate staged work, not leaked content. Worth committing in its own migration once RLS is added to the new tables.

---

## 7. What's genuinely solid (don't break these)

- AliExpress HMAC-SHA256 signing + SAR enforcement via `target_sale_price` (correct, no USD/CNY leak).
- CJ USD→SAR ×3.75 fixed multiplier — correct, SAR is pegged to USD at exactly 3.75; conversion correctly applied in normalizers, *not* before sending USD to CJ.
- Salla/Zid OAuth auto-refresh: single-retry `withAutoRefresh`, no refresh-loop risk.
- Product/order/store ownership in API routes uses explicit `.eq("merchant_id", user.id)` even with the admin client — RLS not relied upon for these (good defense-in-depth).
- Admin-only routes that *do* check roles correctly: `cj/connect`, `feeds` PUT, `feeds/sync` POST.
- `orders.net_profit GENERATED ALWAYS AS` — can't be forged. Wallet `CHECK (balance >= 0)`. `create_merchant_wallet` trigger is idempotent (UNIQUE merchant_id) and rolls back on failure.
- No XSS: supplier descriptions rendered as text (React-escaped); the one `dangerouslySetInnerHTML` is a static no-flash theme script.
- Sign-out via `window.location.href` is *correct* (tears down client state) — not a bug despite looking unusual.

---

## 8. Recommended fix order

1. **Rotate the leaked Supabase service key** (CRIT-1) — do this first, it's independent and urgent.
2. **Wallet fraud hole** as one migration: CRIT-2/3/4/5 — `SECURITY DEFINER` + `is_admin()` guard + amount>0 check + revoke merchant DML on `wallets`/`bank_transfers` + move approve to a server route.
3. **Secret exfiltration**: CRIT-6 (`platform_config` policy) + HIGH-2 (per-store webhook secrets) — then rotate all leaked platform tokens/keys.
4. **OAuth callback session checks** (CRIT-7) — `getUser()` + nonce `state`.
5. **Webhook hardening**: HIGH-1 (fail closed) + HIGH-4 (timing-safe + replay).
6. **Zid push bugs** HIGH-8 (trailing slash + post-create categories) — silent functional failures in a live feature.
7. **n8n WF1 fixes** HIGH-6/7 before importing anywhere real.
8. SSRF allowlist (HIGH-3), rate limiting (HIGH-9), admin middleware role gate, input validation (zod).
9. Docs consolidation: regenerate ARCHITECTURE.md, kill the 4-way phase/table-count contradiction, archive Session-9/13 snapshots, fix `walkthrough.md` deploy pattern.

---

## 9. Secret Rotation Checklist (user performs in dashboards)

> The code side of these fixes is done in the workstreams above. Rotating the secrets themselves is **your** action — they live in provider dashboards we cannot reach. Do each item after the corresponding workstream lands. Order matters: rotate the Supabase key first.

| # | Secret | Where to rotate | What to update after | Why |
|---|---|---|---|---|
| 1 | **Supabase service-role key** | Supabase Dashboard → Project Settings → API → `service_role` → rotate | `.env.local` + VPS `.env` → `SUPABASE_SERVICE_ROLE_KEY`; restart PM2 | Leaked in `check-search.js:5` and present in **git history** → rotation is mandatory even after the file is deleted (CRIT-1). Anyone with the old JWT has full admin DB access bypassing RLS. |
| 2 | **`SALLA_WEBHOOK_SECRET`** | Generate a new strong random value (`openssl rand -hex 32`); update the Salla partner-app webhook config | `.env.local` + VPS → `SALLA_WEBHOOK_SECRET`; Salla partner dashboard webhook secret | Committed in plaintext at `BUILD_WORKFLOW_GUIDE.md:31` (HIGH-2). After WS4 ships, each store gets its own per-store secret and this env var becomes a legacy fallback only. |
| 3 | **AliExpress access + refresh tokens** | Re-run the admin OAuth connect flow (`/admin/settings` → AliExpress → Connect) **after** CRIT-6 + CRIT-7 land | Stored in `platform_config` (now admin-only) | Old tokens were world-readable via `platform_config` (CRIT-6) and the callback had no auth check (CRIT-7). Reconnecting rotates them. |
| 4 | **CJ access/refresh token + API key** | Re-issue in the CJDropshipping dashboard; re-run `POST /api/auth/cj/connect` | `supplier_accounts` (per-merchant) | The CJ tokens were in world-readable `platform_config`/`supplier_accounts`. Re-connect rotates them. |
| 5 | **LLM API keys** (Gemini / OpenAI / Claude) | Rotate at each provider's dashboard | Re-enter via `/admin/settings` → AI Content Engine (stored in `platform_config`, now admin-only) | Were world-readable (CRIT-6). |
| 6 | **Moyasar / Stripe secret keys** | Rotate at Moyasar / Stripe dashboards | Re-enter via `/admin/settings` (Payment Gateway section) | Were world-readable (CRIT-6). Marked read-only in WS11 — these are env/provider-managed. |
| 7 | **n8n webhook URLs + HMAC secrets** | Rotate webhook URLs in n8n; generate new HMAC secrets | `platform_config` → `n8n_webhooks` via admin settings | Were world-readable (CRIT-6). |
| 8 | **`OAUTH_STATE_SECRET`** (new, WS3) | Generate a strong random value (`openssl rand -hex 32`) | `.env.local` + VPS → `OAUTH_STATE_SECRET` | New env var used to sign OAuth state cookies. Without it OAuth state verification degrades. |
| 9 | **`PUBLIC_BASE_URL`** (new, WS3) | n/a — just set it | `.env.local` + VPS → `PUBLIC_BASE_URL` (e.g. `https://droplinker.asra3.com`) | New env var pinning the OAuth `redirect_uri` origin so `x-forwarded-host` spoofing can't redirect OAuth codes elsewhere. |

**After rotation, verify:**
- `curl https://<project>.supabase.co/rest/v1/platform_config?select=* -H "apikey: <anon-key>"` returns **only** the public-key rows (`commission_mode`, `default_currency`, `usd_to_sar_rate`, `*_enabled`, `*_interval`, `platform_name`, `support_email`) — **not** any tokens. (WS2 verification.)
- A merchant signed in cannot run `supabase.rpc('wallet_credit', …)` from the browser console (expect `admin only` / permission-denied). (WS1 verification.)
- Old `check-search.js` committed key returns 401 / "Invalid JWT" against the Supabase REST API.