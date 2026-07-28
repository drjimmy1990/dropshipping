# DropLinker — Security Remediation

**Branch:** `security-remediation` · **Status:** implemented, builds clean (`npm run build` ✅, `tsc` 0 errors) · **Not pushed, not merged.**
**Date:** 2026-07-03

This document explains **what was fixed** and **exactly what you must do now**, in order.

> ⚠️ **The code fixes alone do NOT fully close the holes.** You still have to (1) apply the SQL migrations to your database and (2) rotate the leaked secrets. Follow the steps in [Part 2](#part-2--what-you-must-do-now-in-order).

---

## Part 1 — What was fixed

13 phases, one git commit each. Each commit message has full detail (`git log security-remediation`).

| # | Area | Vulnerability | Fix |
|---|------|---------------|-----|
| 0 | Leaked secrets | Supabase **service-role key**, AliExpress **APP_SECRET + live token**, Salla webhook secret & OAuth tokens committed to git | Deleted 6 files (`check-search.js`, `app/src/test-aliexpress.ts`, `app/src/test-auth.ts`, `received-webhooks.txt`, `fix.js`, `fix2.js`, `supabase/Fix1.sql`), scrubbed 3 docs, hardened `.gitignore` |
| 1 | **Wallet fraud** | Any merchant could self-mint money (`wallet_credit` callable from browser), negative amounts inverted the operation, merchants could directly edit their own balance / self-approve bank transfers | `wallet_credit`/`wallet_deduct` → `SECURITY DEFINER` + `amount>0` guard + `REVOKE EXECUTE` from browser; `wallets`/`bank_transfers`/`transactions` made read-only for merchants; approve/reject moved to a new admin-only server route `/api/admin/transfers`; `is_admin()` hardened with `search_path` |
| 2 | **Secret exposure** | `platform_config` was world-readable via the public anon key (AliExpress/CJ tokens, n8n HMAC, LLM keys) | Read policy gated to `is_admin()` (11 public settings keys still readable); admin model unified |
| 3 | **Account takeover** | OAuth callbacks trusted `state` with no session check → attacker attaches their store to a victim; AliExpress callback had no auth at all | Callbacks now require `getUser()` + `state === user.id` + a CSRF nonce cookie; AliExpress callback is admin-only; `redirect_uri` pinned to `PUBLIC_BASE_URL` |
| 4+5 | **Webhook forgery** | Global webhook secret leaked into every merchant-readable store row; verification failed-open when unset; timing-unsafe compare; no replay protection | Stop persisting the secret; **fail-closed**; constant-time compare; replay-dedup table |
| 6 | n8n WF1 | `app.uninstalled` deactivated **all** merchants' stores | Scoped to the correct store; marked "not import-ready" (use the in-app route) |
| 7 | Zid push | Categories silently never assigned; product update body dropped | Categories assigned after create via correct endpoint; PATCH/DELETE trailing slashes |
| 8 | **SSRF** | Server fetched merchant-controlled image URLs (could hit `169.254.169.254` / internal hosts) | Allow-list (supplier CDNs, https-only, block private IPs) before fetching |
| 9 | Quota abuse | No per-merchant limit on the shared supplier API keys | Postgres rate limiter on all 6 supplier routes (429 over limit) |
| 10 | **Admin gate + IDOR** | `/admin` gated only client-side; several routes accepted another merchant's foreign IDs | Server-side admin gate (redirects before render); ownership checks on `store/branding`, `content/schedule`, `content/assets`, `social/accounts`; stripped raw error messages |
| 11 | Data integrity | Duplicate orders (webhook replay) / duplicate imports; negative money; store delete wiped order history | Uniqueness constraints, non-negative money CHECKs, order-history FK protection |
| 12 | Money/label UI | "Available Balance" showed reserved funds as spendable; product profit ignored shipping; admin search crashed on null name; stale error banners | Corrected all four |
| 13 | Docs | `schema.sql` had drifted from the live DB | Marked non-authoritative; corrected table count |

### Deliberate changes vs the original plan (so you're not surprised)
- **No `OAUTH_STATE_SECRET` env var needed** — used a double-submit cookie instead of signed state.
- **`FORCE ROW LEVEL SECURITY` was intentionally NOT used** — it would break the wallet functions and cause recursion.
- **Webhook fix = stop storing the secret** (Salla uses one global app webhook, so real per-store secrets don't apply).
- **Zid variant creation is only partially fixed** — see [Known limitations](#known-limitations--deferred).

---

## Part 2 — What you must do now (in order)

> Do these on the branch **before** merging. Steps 1–2 are the important ones.

### Step 0 — Review the changes
```bash
cd "C:/Users/LOQ/Desktop/CLI/emirates mostafa/dropshipping"
git checkout security-remediation
git log --oneline main..HEAD          # 13 commits
git diff main..HEAD                    # full diff if you want to read it
```

### Step 1 — 🔑 Rotate the Supabase service-role key FIRST
This key is in git history and bypasses all security. Rotate it **before** deploying the new code.
1. Supabase Dashboard → **Project Settings → API → `service_role` → Reset/Rotate**.
2. Update `SUPABASE_SERVICE_ROLE_KEY` in:
   - `app/.env.local` (local)
   - the VPS `.env`
3. On the VPS, restart: `pm2 restart <app>` (stop → build → start, per your deploy guide).

### Step 2 — Apply the 5 SQL migrations (Supabase → SQL Editor)
Run these **in this exact order**. Each is wrapped in a transaction.

1. `supabase/migrations/20260703_security_wallet_rls.sql`
2. `supabase/migrations/20260703_platform_config_secrets_rls.sql`
3. `supabase/migrations/20260703_webhook_hardening.sql`
4. `supabase/migrations/20260703_rate_limits.sql`
5. `supabase/migrations/20260703_db_integrity.sql`  ← **read the `DELETE` statements at the top first** (they remove duplicate orders/products). If you're unsure whether you have duplicates, run the `SELECT` version first (see note inside the file).

> If migration #5 fails on the `orders_store_id_fkey` line, your FK has a different name — run `\d orders` (or check the table in the dashboard) to find it and adjust that one line.

### Step 3 — Set the new environment variable
Add to `app/.env.local` **and** the VPS `.env`:
```
PUBLIC_BASE_URL=https://droplinker.asra3.com
```
(Use your real production URL. This pins the OAuth redirect origin.)
**You do NOT need `OAUTH_STATE_SECRET`** — the design doesn't use it.

### Step 4 — 🔑 Rotate the remaining leaked secrets
These were all exposed (in git history and/or world-readable). Rotate each, then update env/config:

| Secret | Where to rotate | Update |
|--------|-----------------|--------|
| **AliExpress `APP_SECRET`** + access token | AliExpress Open Platform console; then re-run **Admin → Settings → AliExpress → Connect** (now admin-only) | `ALIEXPRESS_APP_SECRET` in env |
| **CJ** access/refresh token + API key | CJ dashboard; then re-run `POST /api/auth/cj/connect` (Admin → Settings) | stored in `platform_config` (now admin-only) |
| **Salla webhook secret** | Generate `openssl rand -hex 32`; set it in the Salla Partner dashboard webhook config | `SALLA_WEBHOOK_SECRET` in env |
| **n8n webhook URLs + HMAC** | Rotate in n8n; re-enter via Admin → Settings | `platform_config` |
| **LLM keys** (Gemini/OpenAI/Claude) | Each provider dashboard; re-enter via Admin → Settings | `platform_config` |

> Moyasar/Stripe keys were **not** actually stored anywhere — no rotation needed (only placeholder text in the UI).

### Step 5 — Deploy the branch
Merge or deploy `security-remediation` using your normal flow (stop → `npm install` → `npm run build` → start). No new npm dependencies were added.

### Step 6 — Verify it worked
Run these checks after deploy:

1. **Wallet fraud closed** — as a normal merchant, open the browser console on the dashboard and run:
   ```js
   // all three should be denied / error:
   supabase.rpc('wallet_credit', { p_merchant_id: '<your-id>', p_amount: 999999, p_method: 'bank_transfer' })
   supabase.from('wallets').update({ balance: 999999 }).eq('merchant_id', '<your-id>')
   supabase.from('bank_transfers').update({ status: 'approved' }).eq('merchant_id', '<your-id>')
   ```
2. **Secrets hidden** — unauthenticated:
   ```bash
   curl "https://<project>.supabase.co/rest/v1/platform_config?select=*" -H "apikey: <ANON_KEY>"
   ```
   Should return **only** the 11 public rows (currency, rate, feature flags…) — **no tokens**.
3. **Old key dead** — the old `check-search.js` service key should return `401 Invalid JWT`.
4. **Admin gate** — as a non-admin merchant, `curl -I https://<site>/admin` → **302 → /dashboard**.
5. **Rate limit** — hit `GET /api/suppliers/aliexpress/search` ~41×/min as one merchant → **429** after 40.
6. **Admin approve still works** — log in as admin, approve a pending bank transfer → wallet is credited.
7. **OAuth still works** — connect a Salla/Zid store normally (should succeed for you); a tampered `state` should be rejected.

### Step 7 — Clean up
- `PROJECT_REVIEW.md` (the full audit) is still in the repo untracked — keep it as reference or delete it.
- **Strongly recommended:** rewrite git history (`git filter-repo` or BFG) to purge the leaked secret blobs. Rotation (Steps 1 & 4) is mandatory regardless, but history rewrite removes the old values entirely.

---

## Known limitations & deferred

These were intentionally **not** completed (documented so nothing is a surprise). None are security-critical.

- **Zid variants** — only the URL was corrected; full variant creation needs Zid's `{variants:[…]}` body + the attributes/presets flow, which requires testing against a live Zid store. Products still push fine; variants just aren't created (same as before, now non-silent).
- **Supplier re-import** — with the new uniqueness constraint, re-importing an already-imported product now returns an error instead of silently duplicating. Consider switching the import routes to `onConflict` upsert for a nicer UX.
- **Phase 12 leftovers** — low-balance alert reading the wrong column, commission transaction badge label, admin Branding/Payment fields not persisting, admin feeds saving to localStorage instead of DB, signup-failure retry path, and `useOrders` counting only the first 100 rows.
- **Phase 13 docs** — `ARCHITECTURE.md` regeneration, `walkthrough.md` stale PM2 deploy pattern, and archiving old session snapshots.
- **n8n WF1** — the hardcoded `merchant_id` can't be parameterized from the webhook; the workflow is marked "not import-ready" and the in-app `/api/webhooks/salla` route is the supported handler.

---

## Appendix — files added/changed

**New SQL migrations** (`supabase/migrations/`): `20260703_security_wallet_rls.sql`, `20260703_platform_config_secrets_rls.sql`, `20260703_webhook_hardening.sql`, `20260703_rate_limits.sql`, `20260703_db_integrity.sql`

**New app files:** `app/src/app/api/admin/transfers/route.ts`, `app/src/app/admin/AdminShell.tsx`, `app/src/lib/oauth/state.ts`, `app/src/lib/net/validateImageUrl.ts`, `app/src/lib/rateLimit.ts`

**Env vars:** add `PUBLIC_BASE_URL`. Rotate `SUPABASE_SERVICE_ROLE_KEY`, `ALIEXPRESS_APP_SECRET`, `SALLA_WEBHOOK_SECRET`.

---

## Part 3 — Deploy to the VPS (exact commands)

Your setup (from `deployment_guide.md`): VPS `root@82.208.21.164`, repo `/www/wwwroot/dropshipping`, app `/www/wwwroot/dropshipping/app`, PM2 process **`droplinker`** on port **4000**, auto-deploy webhook on `git push origin main`. **No new npm packages were added**, so `npm install` is optional.

### Recommended order
`rotate Supabase key → update VPS .env.local → apply the 5 migrations (Supabase web) → deploy code → rotate remaining secrets → verify`

The new code works against both the old and new DB (the admin route uses the service role), so deploying code and applying migrations in the same window is safe. Do the Supabase key rotation **first**.

### Step A — Update env on the VPS (do before deploying)
```bash
ssh root@82.208.21.164
nano /www/wwwroot/dropshipping/app/.env.local
```
In that file:
- set `SUPABASE_SERVICE_ROLE_KEY=` to the **newly rotated** key (Step 1),
- set `ALIEXPRESS_APP_SECRET=` to the rotated value (Step 4),
- set `SALLA_WEBHOOK_SECRET=` to the rotated value (Step 4),
- add a new line: `PUBLIC_BASE_URL=https://droplinker.asra3.com`

Save (Ctrl+O, Enter, Ctrl+X). `PUBLIC_BASE_URL` is read at runtime, so a PM2 restart picks it up.

### Step B — Apply the 5 migrations
Run them in the **Supabase Dashboard → SQL Editor** (not on the VPS), in the order listed in [Step 2](#step-2--apply-the-5-sql-migrations-supabase--sql-editor).

### Step C — Deploy the code

**Option 1 — Merge to `main` and let the auto-deploy webhook run (your normal flow):**
```bash
# On your local machine:
git checkout main
git merge security-remediation
git push origin main          # aaPanel webhook: pull → pm2 stop → build → pm2 start → clear cache
```
Then watch the deploy log in aaPanel (WebHook → Log) for `Deployment Successful!`.

**Option 2 — Deploy manually on the VPS (e.g. to test the branch before merging):**
```bash
ssh root@82.208.21.164
cd /www/wwwroot/dropshipping
git fetch origin
git checkout security-remediation
git pull origin security-remediation

pm2 stop droplinker
cd app
npm install            # optional — no new deps, safe to skip
npm run build
pm2 start droplinker
pm2 save

# clear the Nginx proxy cache
rm -rf /www/server/nginx/proxy_cache_dir/*
```
> If you deploy the branch manually, remember the auto-deploy webhook still targets `main`. Merge to `main` once you're happy, or the next push could fight your checkout.

### Step D — Watch logs / confirm it's up
```bash
pm2 logs droplinker --lines 50
pm2 status
curl -I https://droplinker.asra3.com        # expect 200/redirect, app responding
```

### Step E — Roll back if needed
```bash
ssh root@82.208.21.164
cd /www/wwwroot/dropshipping
git checkout main            # or the previous known-good commit
pm2 stop droplinker
cd app && npm run build
pm2 start droplinker
rm -rf /www/server/nginx/proxy_cache_dir/*
```
> Note: the DB migrations are not auto-reverted by a code rollback. They are backward-compatible with the old code except that browser-side `wallet_credit` / direct wallet edits stay blocked (which is the fix). If you must fully revert the DB, restore from a Supabase backup taken before Step B.
