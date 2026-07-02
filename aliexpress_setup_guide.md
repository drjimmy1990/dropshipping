# AliExpress Integration — Complete Setup & Testing Guide

## Your Current Status

| Item | Value |
|------|-------|
| **App Key** | `534306` |
| **App Secret** | `<ROTATED — stored in .env, never commit>` |
| **App Status** | `Test` ⚠️ |
| **API Permissions** | `System Tool` ✅ + `AliExpress-dropship` ✅ |
| **Code Status** | All routes built, TypeScript clean ✅ |

> [!IMPORTANT]
> Your app is in **Test** mode. This means the API works but with **limited rate limits** and only for your own test account. You must apply for production access to go live.

---

## Step 1: Apply for Production Access (on AliExpress)

Your app needs to move from **Test → Online** status to work with real data.

1. Go to: https://openservice.aliexpress.com/
2. Click **App Console** → Select your `droplinker` app
3. Click the **"Apply Online"** button (blue button, top right of App Overview)
4. Fill in the required business information:
   - **Business Type**: Dropshipping platform
   - **Target Market**: Saudi Arabia / Middle East
   - **Description**: "DropLinker is a SaaS platform that enables Saudi merchants to source products from AliExpress and sell them through Salla e-commerce stores."
   - Upload any required documents (business license if available)
5. Click **Submit** and wait for approval (typically 1-5 business days)

> [!NOTE]
> While waiting for approval, you CAN still test the API in sandbox/test mode. Some endpoints may return limited or sample data.

---

## Step 2: Test the API (Right Now)

Your dev server is already running. Let's test each endpoint:

### Test 1: Product Search API

Open your browser or use Postman:

```
GET http://localhost:3000/api/suppliers/aliexpress/search?keyword=phone+case&shipTo=SA
```

> ⚠️ You must be logged in to DropLinker for this to work (it checks auth).
> Easiest way: Open the Product Discovery page in the dashboard.

### Test 2: Product Detail API

```
GET http://localhost:3000/api/suppliers/aliexpress/product/1005006123456789
```

Replace `1005006123456789` with a real AliExpress product ID from the search results.

### Test 3: Product Import API

```
POST http://localhost:3000/api/suppliers/aliexpress/import
Content-Type: application/json

{
  "productId": 1005006123456789,
  "marginType": "percentage",
  "marginValue": 30
}
```

---

## Step 3: Test via the Dashboard UI

This is the easiest way to test everything end-to-end:

1. Open: `http://localhost:3000`
2. Log in with your test merchant account
3. Navigate to: **Dashboard → Products → Discover**
4. Type a keyword (e.g. "wireless earbuds") and click **Search**
5. Browse the results — they should show:
   - Product images from AliExpress
   - Prices in SAR
   - Ratings and order counts
   - Shipping info to Saudi Arabia
6. Click **View Details** on any product to see:
   - Full image gallery
   - All SKU variants with prices
   - Shipping options
   - Profit calculator (30% margin suggested)
7. Click **Import to My Products** to save it to your catalog

---

## Step 4: Verify the Import Worked

After importing a product:

1. Go to **Dashboard → Products** (your product list)
2. The imported product should appear with:
   - Title from AliExpress
   - Supplier cost vs your retail price
   - Images from AliExpress
   - Status: Active

---

## Step 5: Go Live (After AliExpress Approves Your App)

Once your app status changes from **Test → Online**:

1. The same code works — no changes needed
2. API rate limits increase significantly
3. You get access to real product data and order placement
4. Deploy to production (`droplinker.asra3.com`)

---

## Troubleshooting

### "Search returned empty results"
- Your app may still be in Test mode with limited data access
- Try different keywords
- Check the terminal/console for error messages from the API
- Verify your `.env.local` has the correct `ALIEXPRESS_APP_KEY` and `ALIEXPRESS_APP_SECRET`

### "AliExpress API request failed: 401"
- App key or secret is wrong — double-check on the App Console
- App may have been suspended — check your AliExpress developer dashboard

### "HMAC signature error"
- Clock skew — make sure your system time is correct
- The signing algorithm uses millisecond timestamps

### "Unauthorized" on API routes
- You need to be logged in to DropLinker first
- Test via the dashboard UI instead of direct API calls

---

## Architecture Summary

```
┌──────────────────────────────────────────────────┐
│                   .env.local                      │
│  ALIEXPRESS_APP_KEY=534306                        │
│  ALIEXPRESS_APP_SECRET=<rotated — see .env>       │
│  (Platform-level, set once by super admin)        │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│           lib/aliexpress/client.ts                │
│  • HMAC-SHA256 signing                            │
│  • searchProducts()                               │
│  • getProductDetail()                             │
│  • getFreightOptions()                            │
└──────────────────┬───────────────────────────────┘
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
    /api/search  /api/product  /api/import
     (GET)       (GET)         (POST)
          │        │            │
          └────────┼────────────┘
                   ▼
        Product Discovery Page
        (merchant searches, views, imports)
                   │
                   ▼
          Supabase products table
                   │
                   ▼
            Salla Store Sync
       (publish to merchant's store)
```

### Who Does What

| Role | What They Do |
|------|-------------|
| **Super Admin (You)** | Set AliExpress API keys in `.env.local`. That's it. |
| **Merchant** | Search products → Import → Set retail price → Publish to Salla |
| **Platform** | Handles all AliExpress API calls using YOUR app key |
