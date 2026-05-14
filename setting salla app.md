# Salla Integration — Complete Setup Guide

---

## Easy Mode vs Custom Callback — Which One?

### 🏆 Recommendation: **Custom Callback** (what we already built)

Here's why:

| Feature | Easy Mode | Custom Callback ✅ |
|---------|-----------|-------------------|
| **How it works** | Salla sends the access token to your webhook URL automatically when a merchant installs the app | Merchant clicks "Connect Salla" button → redirected to Salla → authorizes → redirected back with code → you exchange for token |
| **User experience** | Merchant must install your app from the Salla App Store first | Merchant clicks a button in YOUR dashboard — no Salla App Store needed |
| **"Connect Salla" button** | ❌ Not possible — flow starts from Salla's side | ✅ Perfect — button lives in your dashboard |
| **Control** | Salla handles everything — you just receive a webhook | You control the redirect, scopes, error handling, and UX |
| **Requires App Store listing** | Yes — merchant installs from Salla marketplace | No — works with private/custom apps |
| **Token delivery** | Via `app.store.authorize` webhook event | Via direct HTTP exchange in your callback |

> [!IMPORTANT]
> Since you want a **"Connect Salla" button** in the DropLinker dashboard, **Custom Callback is the only option**. Easy Mode requires the merchant to install the app from the Salla App Store, which means the flow starts from Salla — not from your platform.

**Our current implementation already uses Custom Callback** ✅

---

## Complete Scopes List

Here are ALL the scopes you should request. I've marked which ones DropLinker needs:

### ✅ Required Scopes (select these in your Salla App settings)

| Scope | Purpose for DropLinker |
|-------|----------------------|
| `offline_access` | **CRITICAL** — needed to get a refresh token (otherwise tokens expire in 14 days and can't be renewed) |
| `orders.read_write` | Read incoming orders + update order status after fulfillment |
| `products.read_write` | Sync products from suppliers TO the Salla store, update prices and stock |
| `customers.read_write` | Access customer shipping info for order fulfillment |
| `settings.read` | Read store settings (currency, locale, shipping zones) |
| `shippings.read_write` | Manage shipping methods and update tracking numbers |
| `webhooks.read_write` | Register/manage webhooks programmatically |
| `categories.read_write` | Organize imported products into categories |
| `brands.read_write` | Assign brands to imported products |

### ⚪ Optional Scopes (enable if you plan to use later)

| Scope | Purpose |
|-------|---------|
| `payments.read` | View payment methods configured on the store |
| `taxes.read_write` | Manage tax rules |
| `marketing.read_write` | Coupons, discounts, campaigns |
| `metadata.read_write` | Custom metadata on orders/products |
| `specialoffers.read_write` | Flash sales, bundle deals |
| `carts.read` | View abandoned carts |
| `branches.read_write` | Multi-branch store management |

---

## Complete Salla Partner Portal Settings

### Step 1: Create Your App

1. Go to **[partners.salla.sa](https://partners.salla.sa)**
2. Login / Create account
3. Click **"Create App"**
4. Fill in:
   - **App Name:** `DropLinker`
   - **App Type:** `Custom App`

### Step 2: OAuth Settings

In your app's **Authentication** tab:

| Setting | Value |
|---------|-------|
| **Authorization Mode** | `Custom` (NOT Easy Mode) |
| **Callback URL (Development)** | `http://localhost:3000/api/auth/salla/callback` |
| **Callback URL (Production)** | `https://yourdomain.com/api/auth/salla/callback` |

### Step 3: Scopes / Permissions

In your app's **Permissions** tab, enable these scopes:

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

### Step 4: Webhook Settings

In your app's **Webhooks/Notifications** tab:

| Setting | Value |
|---------|-------|
| **Webhook URL** | `https://yourdomain.com/api/webhooks/salla` (or ngrok for local dev) |
| **Security Strategy** | `Signature` |
| **Secret Key** | Generate one and save it as `SALLA_WEBHOOK_SECRET` in `.env.local` |

**Subscribe to these events:**

| Event | Why |
|-------|-----|
| `order.created` | New order comes in → DropLinker syncs it |
| `order.updated` | Order status changes → DropLinker updates it |
| `product.updated` | Product price/stock changes on Salla → track sync |
| `product.deleted` | Product removed from Salla → deactivate in DropLinker |
| `app.installed` | Know when a new merchant installs the app |
| `app.uninstalled` | Know when a merchant removes the app |

### Step 5: Copy Your Credentials

From the app dashboard, copy these 3 values:

| From Salla | Into `.env.local` |
|------------|-------------------|
| Client ID | `SALLA_CLIENT_ID=` |
| Client Secret | `SALLA_CLIENT_SECRET=` |
| Webhook Secret | `SALLA_WEBHOOK_SECRET=` |

Your `.env.local` should look like:

```env
# ========================
# Supabase
# ========================
NEXT_PUBLIC_SUPABASE_URL=https://cqvkzakyztxknihifqlh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ========================
# Salla OAuth
# ========================
SALLA_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
SALLA_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SALLA_WEBHOOK_SECRET=your_webhook_signing_secret
```

### Step 6: Test Locally

1. Restart dev server: `npm run dev`
2. Go to `http://localhost:3000/dashboard/integrations`
3. Click **"Connect Salla"**
4. Authorize on Salla
5. Get redirected back → see success toast ✅
6. Check Supabase `stores` table → new row appears

### Step 7: Webhook Testing (requires ngrok)

```bash
# Install ngrok if you haven't
npm install -g ngrok

# Start a tunnel
ngrok http 3000

# Copy the https URL and paste it in Salla webhook settings
# e.g. https://abc123.ngrok.io/api/webhooks/salla
```

Then create a test order in your Salla store → check DropLinker's `orders` table.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                    DropLinker                          │
│                                                       │
│  Dashboard                   API Routes               │
│  ┌───────────────┐          ┌─────────────────────┐   │
│  │ Integrations  │──click──►│ /api/auth/salla     │   │
│  │ "Connect      │          │ (redirect to Salla) │   │
│  │  Salla" btn   │          └─────────────────────┘   │
│  └───────────────┘                                    │
│                                                       │
│  ┌───────────────┐          ┌─────────────────────┐   │
│  │ Orders        │◄─reads───│ /api/auth/salla/    │   │
│  │ Dashboard     │          │ callback             │   │
│  └───────────────┘          │ (exchange code →     │   │
│                             │  tokens → save)      │   │
│                             └─────────────────────┘   │
│                                                       │
│                             ┌─────────────────────┐   │
│                             │ /api/webhooks/salla  │   │
│                             │ (verify signature    │   │
│                             │  → insert order)     │   │
│                             └─────────┬───────────┘   │
│                                       │               │
│                                       ▼               │
│                             ┌─────────────────────┐   │
│                             │     Supabase         │   │
│                             │  stores | orders     │   │
│                             └─────────────────────┘   │
└──────────────────────────────────────────────────────┘
         ▲                              ▲
         │ OAuth redirect               │ Webhook POST
         ▼                              │
┌──────────────────┐          ┌─────────┴──────────┐
│  Salla OAuth     │          │  Salla Store        │
│  accounts.       │          │  (sends order       │
│  salla.sa        │          │   events)           │
└──────────────────┘          └────────────────────┘
```

---

## Files Reference

| File | Purpose |
|------|---------|
| [route.ts](file:///c:/Users/LOQ/Desktop/CLI/emirates%20mostafa/dropshipping/app/src/app/api/auth/salla/route.ts) | OAuth initiation — redirects to Salla |
| [callback/route.ts](file:///c:/Users/LOQ/Desktop/CLI/emirates%20mostafa/dropshipping/app/src/app/api/auth/salla/callback/route.ts) | OAuth callback — exchanges code for tokens |
| [webhooks/salla/route.ts](file:///c:/Users/LOQ/Desktop/CLI/emirates%20mostafa/dropshipping/app/src/app/api/webhooks/salla/route.ts) | Webhook receiver — processes order events |
| [integrations/page.tsx](file:///c:/Users/LOQ/Desktop/CLI/emirates%20mostafa/dropshipping/app/src/app/dashboard/integrations/page.tsx) | Updated UI with Connect Salla button |
| [.env.local](file:///c:/Users/LOQ/Desktop/CLI/emirates%20mostafa/dropshipping/app/.env.local) | Salla credential placeholders |
