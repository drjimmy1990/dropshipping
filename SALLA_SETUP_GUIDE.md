# 🔗 Salla Integration — Step-by-Step Guide

> **Read this from top to bottom. Do each step in order. Don't skip anything.**

---

## What You're Building

```
Your Customer clicks "Connect Salla" in DropLinker
        │
        ▼
Browser redirects to Salla → Customer logs in → Authorizes
        │
        ▼
Salla redirects back to DropLinker → Tokens saved in database ✅
        │
        ▼
Now, whenever a customer places an order on the Salla store:
        │
        ▼
Salla sends the order data to → n8n (your automation server)
        │
        ▼
n8n validates it → saves the order in Supabase → appears in DropLinker dashboard ✅
```

---

## PHASE 1: Create Your Salla App (5 minutes)

### Step 1.1 — Go to Salla Partners Portal

1. Open: **https://partners.salla.sa**
2. Login (or create an account if you don't have one)
3. Click **"Create App"**

### Step 1.2 — Fill in App Details

| Field | What to enter |
|-------|---------------|
| App Name | `DropLinker` |
| App Type | `Custom App` |

### Step 1.3 — Set Authentication Mode

Go to the **Authentication** section of your app:

| Setting | Value |
|---------|-------|
| **Mode** | `Custom` (NOT Easy Mode) |
| **Callback URL** | `http://localhost:3000/api/auth/salla/callback` |

> ⚠️ When you deploy to production later, you'll change this to `https://yourdomain.com/api/auth/salla/callback`

### Step 1.4 — Enable Scopes (Permissions)

Go to the **Permissions** section. Enable ALL of these:

```
✅ offline_access
✅ orders.read_write
✅ products.read_write
✅ customers.read_write
✅ settings.read
✅ shippings.read_write
✅ webhooks.read_write
✅ categories.read_write
✅ brands.read_write
```

### Step 1.5 — Copy Your Credentials

You should now see 2 values on your app dashboard:
- **Client ID** (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- **Client Secret** (looks like: a long random string)

**Write them down — you'll need them in Step 3.**

---

## PHASE 2: Set Up the n8n Workflow (10 minutes)

### Step 2.1 — Add Supabase Credentials to n8n

1. Open your n8n dashboard
2. Go to **Credentials** (in the left sidebar or settings)
3. Click **"Add Credential"**
4. Search for **"Supabase"**
5. Fill in:

| Field | Value |
|-------|-------|
| **Host** | `https://cqvkzakyztxknihifqlh.supabase.co` |
| **Service Role Key** | Copy from your `app/.env.local` file → the `SUPABASE_SERVICE_ROLE_KEY` value |

6. Name it: **`DropLinker Supabase`**
7. Click **Save**

### Step 2.2 — Import the Workflow

1. In n8n, click **"Add workflow"** (the + button)
2. Click the **three dots menu (⋮)** → **"Import from File"**
3. Navigate to and select: **`n8n/wf1-salla-order-webhook.json`** (in your project folder)
4. The workflow will appear with all the nodes and connections

### Step 2.3 — Connect Supabase to the Nodes

After importing, you'll see **3 orange/yellow Supabase nodes** that need your credential:

1. **Double-click** on `Find Salla Store` node
   - Under **Credential**, select **`DropLinker Supabase`**
   - Click **Save**

2. **Double-click** on `Insert Order` node
   - Under **Credential**, select **`DropLinker Supabase`**
   - Click **Save**

3. **Double-click** on `Update Order` node
   - Under **Credential**, select **`DropLinker Supabase`**
   - Click **Save**

### Step 2.4 — Set the Webhook Secret Variable

1. In n8n, go to **Settings** → **Variables**
2. Add a new variable:

| Variable Name | Value |
|---------------|-------|
| `SALLA_WEBHOOK_SECRET` | Make up a strong password, e.g. `droplinker_wh_secret_2026_xyz` |

> ⚠️ **Write this value down** — you'll use the SAME value in Salla AND in your `.env.local`

### Step 2.5 — Activate the Workflow & Get the Webhook URL

1. Click the **"Active"** toggle at the top right to turn the workflow ON
2. Now click on the **"Salla Webhook"** node (the first blue node)
3. Look at the **"Production URL"** — it will look something like:

```
https://your-n8n-domain.com/webhook/salla-webhook
```

### 📋 THIS IS YOUR WEBHOOK URL

**Copy this URL.** You'll paste it into Salla in the next step.

> If your n8n is running locally, the URL might be `http://localhost:5678/webhook/salla-webhook`. For Salla to reach it, you'll need a tunnel tool like ngrok:
> ```bash
> ngrok http 5678
> ```
> Then use the ngrok URL: `https://xxxx.ngrok.io/webhook/salla-webhook`

---

## PHASE 3: Configure Salla Webhooks (2 minutes)

### Step 3.1 — Go Back to Salla Partner Portal

1. Open your app on **partners.salla.sa**
2. Go to the **Webhooks / Notifications** section

### Step 3.2 — Set the Webhook URL

| Setting | What to enter |
|---------|---------------|
| **Webhook URL** | The n8n URL you copied in Step 2.5 (e.g. `https://your-n8n.com/webhook/salla-webhook`) |
| **Security Strategy** | `Token` |
| **Token** | The SAME secret from Step 2.4 (e.g. `droplinker_wh_secret_2026_xyz`) |

### Step 3.3 — Subscribe to Events

Check these event boxes:

```
✅ order.created
✅ order.updated
✅ app.installed
✅ app.uninstalled
```

Click **Save**.

---

## PHASE 4: Configure Your App (2 minutes)

### Step 4.1 — Add Credentials to `.env.local`

Open `app/.env.local` and fill in the 3 Salla values:

```env
# ========================
# Supabase
# ========================
NEXT_PUBLIC_SUPABASE_URL=https://cqvkzakyztxknihifqlh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your existing key>
SUPABASE_SERVICE_ROLE_KEY=<your existing key>

# ========================
# Salla OAuth
# ========================
SALLA_CLIENT_ID=<paste Client ID from Step 1.5>
SALLA_CLIENT_SECRET=<paste Client Secret from Step 1.5>
SALLA_WEBHOOK_SECRET=<paste the SAME secret from Step 2.4>
```

### Step 4.2 — Restart the Dev Server

```bash
# Stop the current server (Ctrl+C) then:
cd app
npm run dev
```

---

## PHASE 5: Test Everything (5 minutes)

### Test 1: OAuth Flow

1. Open **http://localhost:3000/auth/login** — login to DropLinker
2. Go to **Dashboard → Integrations**
3. Click **"Connect Salla"**
4. You should be redirected to Salla's authorization page
5. Login to your Salla store and click "Authorize"
6. You should be redirected back to DropLinker with a green success message: **"✅ Salla store connected successfully!"**

### Test 2: Verify in Supabase

1. Open your Supabase Dashboard → **Table Editor** → `stores`
2. You should see a new row:
   - `platform` = `salla`
   - `store_name` = Your Salla store name
   - `access_token` = A long token string
   - `is_active` = `true`

### Test 3: Webhook (Order Sync)

1. Create a test order in your Salla store
2. Open n8n → go to the "WF1: Salla Order Webhook" workflow
3. Check the **Executions** tab — you should see a successful execution
4. Open Supabase → `orders` table — the test order should appear

---

## Quick Reference Card

| What | Where |
|------|-------|
| Salla App Dashboard | https://partners.salla.sa |
| OAuth Callback URL | `http://localhost:3000/api/auth/salla/callback` |
| Webhook URL (n8n) | `https://your-n8n.com/webhook/salla-webhook` |
| Security Strategy | Token |
| Token/Secret | Same value in Salla + n8n variable + `.env.local` |

## Files in This Project

| File | What it does |
|------|-------------|
| `app/src/app/api/auth/salla/route.ts` | Redirects user to Salla login |
| `app/src/app/api/auth/salla/callback/route.ts` | Receives tokens from Salla after login |
| `app/src/app/api/webhooks/salla/route.ts` | Backup webhook handler (not used when n8n is primary) |
| `app/src/app/dashboard/integrations/page.tsx` | The "Connect Salla" button lives here |
| `n8n/wf1-salla-order-webhook.json` | Import this into n8n |
| `app/.env.local` | Your secrets go here |
