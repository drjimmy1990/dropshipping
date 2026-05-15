# DropLinker — Full Dropshipping Lifecycle Plan

> **Date:** 2026-05-15  
> **Status:** Planning — Awaiting Approval

---

## 1. Current State (What Works Right Now)

| Feature | Status |
|---------|--------|
| AliExpress OAuth (platform-level) | ✅ Working |
| Product search via `recommend.feed.get` | ✅ Working — 13,946+ products available |
| Product detail via `ds.product.get` | ✅ Fixed (just pushed) |
| Text search (`ds.text.search`) | ⚠️ Returns empty — AliExpress account propagation pending |
| Feed catalog (`ds.feedname.get`) | ✅ Working — 176 feed categories available |
| Salla store integration | ✅ Working |
| Order webhooks from Salla | ✅ Working |
| Merchant wallet system | ✅ Working |

---

## 2. Product Import Flow — How a Merchant Gets Products Into Their Store

### Step-by-Step Flow:

```
Merchant browses Product Discovery
    → Clicks "Import to My Store"
    → Import Wizard opens:
        1. Select variants (colors, sizes)
        2. Set retail price (with suggested markup)
        3. Edit title/description (or use AI-generated)
        4. Choose which Salla store to push to
    → "Publish" button:
        1. Saves product to `products` table (Supabase)
        2. Pushes product to Salla via their Product API
        3. Saves Salla's `store_product_id` back to our DB
    → Product appears in merchant's Salla storefront
```

### Database Table: `products`

| Column | Purpose |
|--------|---------|
| `id` | Our internal product ID |
| `merchant_id` | Who imported this product |
| `supplier` | `"aliexpress"` |
| `supplier_product_id` | AliExpress product ID (e.g., `1005011868343510`) |
| `supplier_sku_id` | Selected variant SKU ID |
| `title` / `title_ar` | Merchant's custom title (EN/AR) |
| `description` / `description_ar` | Product description |
| `retail_price` | What the merchant sells it for (SAR) |
| `supplier_price` | AliExpress cost price (SAR) |
| `profit_margin` | Calculated: retail - supplier - platform_fee |
| `images` | Array of image URLs |
| `store_id` | Which Salla store it's pushed to |
| `store_product_id` | Salla's product ID after push |
| `status` | `draft` / `active` / `inactive` / `out_of_stock` |
| `stock_quantity` | Last synced stock from AliExpress |
| `variants` | JSON array of selected variants |

### Pricing Model:

```
Merchant retail price = AliExpress price + Merchant markup + Platform commission

Example:
  AliExpress price:     25.76 SAR
  Platform commission:   2.58 SAR (10%)
  Merchant markup:      21.66 SAR (suggested 75%)
  ─────────────────────────────
  Customer pays:        50.00 SAR
  Merchant profit:      21.66 SAR
```

> [!IMPORTANT]
> **The merchant sets their own retail price.** The system shows a "suggested price" with recommended markup, but merchants have full control.

---

## 3. How Ordering Works — From Customer Purchase to AliExpress Fulfillment

### The Complete Order Lifecycle:

```
CUSTOMER places order on merchant's Salla store
    ↓
SALLA sends webhook → order.created
    ↓
DROPLINKER receives webhook
    ↓
Creates order in `orders` table (status: "new")
    ↓
AUTO-FULFILLMENT ENGINE checks:
    ├── Is auto-fulfill enabled for this merchant?
    ├── Does merchant wallet have enough balance?
    ├── Is the product still in stock on AliExpress?
    ↓
If YES to all:
    1. Deduct from merchant wallet: supplier_cost + platform_commission
    2. Place order on AliExpress via `aliexpress.ds.order.create`
    3. Save `supplier_order_id` + `supplier_order_number`
    4. Order status → "ordered"
    ↓
If NO (low balance / out of stock):
    1. Order status → "held" or "failed"
    2. Notify merchant via email/in-app notification
    3. Merchant can manually retry after topping up wallet
    ↓
ALIEXPRESS ships the product
    ↓
TRACKING SYNC (cron every 2h):
    1. Poll AliExpress for tracking updates
    2. Update `fulfillments` table with tracking number + carrier
    3. Push tracking info to Salla via their Shipments API
    4. Customer gets shipping notification from Salla
    ↓
DELIVERED
    1. AliExpress confirms delivery
    2. Order status → "delivered"
    3. Transaction finalized
```

### AliExpress APIs Used for Ordering:

| API | Purpose |
|-----|---------|
| `aliexpress.ds.order.create` | Place the order on AliExpress |
| `aliexpress.ds.tracking.info.query` | Get tracking number + carrier |
| `aliexpress.ds.order.get` | Get order status |
| `aliexpress.logistics.buyer.freight.calculate` | Calculate shipping before placing |

### Shipping Details:

When a customer orders, AliExpress ships **directly to the customer's address**. The flow is:

1. Customer places order on the Salla store with their Saudi address
2. Our system receives the customer's shipping address via the Salla webhook
3. We pass that address to AliExpress when placing the order
4. AliExpress ships from China/warehouse directly to the customer
5. Tracking number is pushed back to Salla so the customer can track

> [!WARNING]
> **Shipping times vary by product and warehouse.** Products from China typically take 15-45 days. Products from Saudi/UAE/local warehouses can arrive in 3-7 days. The `ship_from` filter in search can help merchants find locally-warehoused products.

### What the Merchant Pays Per Order:

| Line Item | Example |
|-----------|---------|
| Product cost (AliExpress) | 25.76 SAR |
| Shipping cost (AliExpress) | 12.00 SAR |
| Platform commission (10%) | 3.78 SAR |
| **Total deducted from wallet** | **41.54 SAR** |
| Customer paid | 65.00 SAR |
| **Merchant net profit** | **23.46 SAR** |

---

## 4. Super Admin Product Curation — Can You Control What Merchants See?

### YES — Two Approaches:

### Option A: Feed-Based Curation (Recommended — Easiest)

AliExpress already provides **176 curated feed categories** for your account. The super admin can:

1. **Select which feeds are visible** to merchants
2. **Create custom feed mappings** with friendly names
3. **Hide/show specific categories** per merchant tier

**Available feeds right now (sample):**

| Feed Name | Products | Category |
|-----------|----------|----------|
| `DS_NewArrivals` | 13,946 | New products |
| `DS_ConsumerElectronics_bestsellers` | 19,470 | Electronics |
| `DS_Home&Kitchen_bestsellers` | 12,300 | Home & Kitchen |
| `DS_Beauty_bestsellers` | 2,594 | Beauty |
| `DS_Sports&Outdoors_bestsellers` | 27,495 | Sports |
| `SA_Clothing&Shoes` | 13,050 | Fashion (SA) |
| `DS_Automobile&Accessories_bestsellers` | 20,340 | Auto |

**Implementation:** Add a `product_feeds` table where the super admin enables/disables feeds. The merchant's Product Discovery page only shows enabled feeds.

### Option B: Curated Product Catalog (More Control)

The super admin pre-imports specific products into a **platform catalog**:

1. Admin browses AliExpress → selects products → adds to platform catalog
2. Admin sets recommended retail prices, categories, and tags
3. Merchants browse the **platform catalog** (not AliExpress directly)
4. Merchants import from the curated catalog to their stores

**Pros:** Full quality control, pre-vetted products, consistent pricing  
**Cons:** More admin work, limited product variety

### Option C: Hybrid (Best of Both)

- **Free tier merchants:** Only see the curated platform catalog
- **Pro tier merchants:** Get access to direct AliExpress search + curated catalog
- **Enterprise tier:** Full access + ability to request custom product sourcing

> [!IMPORTANT]
> **My recommendation is Option A (Feed-Based) for launch, evolving to Option C (Hybrid) as you grow.** It gives you control without requiring you to manually curate thousands of products.

---

## 5. Database Tables Needed

### New Tables Required:

```sql
-- Products imported by merchants
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  store_id UUID REFERENCES stores(id),
  supplier TEXT DEFAULT 'aliexpress',
  supplier_product_id TEXT NOT NULL,
  supplier_sku_id TEXT,
  store_product_id TEXT, -- Salla's product ID after push
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  images JSONB DEFAULT '[]',
  retail_price DECIMAL(10,2) NOT NULL,
  supplier_price DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  variants JSONB DEFAULT '[]',
  category TEXT,
  status product_status DEFAULT 'draft',
  stock_quantity INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  auto_price_update BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order fulfillment tracking
CREATE TABLE fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  supplier_order_id TEXT, -- AliExpress order ID
  supplier_order_number TEXT,
  tracking_number TEXT,
  carrier TEXT,
  shipping_status TEXT DEFAULT 'pending',
  supplier_cost DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  placed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin feed curation (Option A)
CREATE TABLE platform_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  display_name_ar TEXT,
  category TEXT,
  product_count INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  min_tier subscription_tier DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock sync logs
CREATE TABLE stock_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  previous_stock INTEGER,
  new_stock INTEGER,
  price_changed BOOLEAN DEFAULT false,
  previous_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  synced_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. Implementation Phases

### Phase 4A: Product Import (Next to build)

| Task | Effort |
|------|--------|
| Import wizard UI (variant selection, pricing, description editor) | 2-3 days |
| Save product to `products` table | 0.5 day |
| Push product to Salla store via API | 1 day |
| "My Products" page (list, edit price, toggle status, delete) | 1-2 days |
| Admin feed management page (enable/disable feeds) | 1 day |

### Phase 4B: AI Content Generation

| Task | Effort |
|------|--------|
| n8n workflow: product images + title → GPT/Gemini → bilingual description | 1-2 days |
| "Pending Review" inbox for AI-generated content | 1 day |
| Unit conversion (inches→cm, lbs→kg) | 0.5 day |

### Phase 6: Auto-Fulfillment Engine

| Task | Effort |
|------|--------|
| `aliexpress.ds.order.create` integration | 2 days |
| Wallet deduction on order placement | 1 day |
| Tracking sync cron (poll every 2h) | 1-2 days |
| Push tracking to Salla shipments API | 1 day |
| Stock sync cron (poll every 6h) | 1-2 days |
| Failed order retry mechanism | 1 day |

---

## 7. Revenue Model for the Platform

| Revenue Stream | When |
|----------------|------|
| **Platform commission** (5-15% per order) | On every auto-fulfilled order |
| **Subscription fees** (monthly plans) | Recurring revenue |
| **Wallet top-up convenience fee** | On payment gateway charges |
| **Premium features** (AI content, priority support) | Upsell |

---

## 8. Open Questions for You

> [!IMPORTANT]
> Please answer these so I can proceed with the right architecture:

1. **Commission model:** What percentage should the platform charge per order? (Suggested: 10%)
2. **Feed curation:** Do you want Option A (feed-based), Option B (manual catalog), or Option C (hybrid)?
3. **Shipping visibility:** Should merchants see the AliExpress shipping cost, or should it be hidden and baked into the platform commission?
4. **Auto-fulfill default:** Should new merchants have auto-fulfillment ON or OFF by default?
5. **Which phase to build next:** Product Import (4A) or the full Auto-Fulfillment Engine (Phase 6)?
