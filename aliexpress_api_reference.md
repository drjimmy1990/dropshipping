# AliExpress API Reference — DropLinker

> **Last Updated:** 2026-05-15  
> **All filters tested live against your API credentials**

---

## 🔍 Why Text Search Was Empty (Now Fixed!)

**Root Cause:** AliExpress requires **24-48 hours of account propagation** after a new developer app is approved and authorized. During this period:
- `aliexpress.ds.feedname.get` → Works immediately ✅
- `aliexpress.ds.recommend.feed.get` → Works immediately ✅  
- `aliexpress.ds.product.get` → Works immediately ✅
- `aliexpress.ds.text.search` → Returns empty `{}` until propagation completes ⚠️

**Your account propagation is now complete.** Text search returns real products:
- "phone" → 45,000+ products
- "cup" → 7,539 products
- "shoes" → 59,000+ products

---

## 📦 All Available Feeds (47 Feeds — 500,000+ Products)

These are the feeds your account has access to via `aliexpress.ds.feedname.get`. Each feed is a curated product collection.

### 🌍 Regional Feeds (Saudi Arabia / Middle East)

| Feed Name | Products | Notes |
|-----------|----------|-------|
| `SA_Clothing&Shoes` | 13,050 | Saudi-targeted fashion |
| `DS_SelectedDentalSupplies_MiddleEast&Africa` | 323 | Middle East dental |

### 🏷️ Dropshipping Bestseller Feeds

| Feed Name | Products | Category |
|-----------|----------|----------|
| `DS_NewArrivals` | 14,010 | 🆕 Newest products |
| `DS_ConsumerElectronics_bestsellers` | 19,470 | Electronics |
| `DS_Home&Kitchen_bestsellers` | 12,300 | Home & Kitchen |
| `DS_Sports&Outdoors_bestsellers` | 27,495 | Sports |
| `DS_Automobile&Accessories_bestsellers` | 20,340 | Auto parts |
| `DS_Beauty_bestsellers` | 2,594 | Beauty |
| `DS_ElectronicComponents_bestsellers` | 2,580 | Components |

### 💰 Premium Price Range Feeds

| Feed Name | Products | Filter |
|-----------|----------|--------|
| `DS_Fashions&Cosmetics 20$+` | 4,781 | Fashion $20+ |
| `DS_Automotive&Motorcycle 10$+` | 5,316 | Auto $10+ |
| `DS_HairRemoval&Lights&Tools 10$+` | 1,521 | Hair tools $10+ |
| `DS_Jewelry&Watch 10$+` | 1,110 | Jewelry $10+ |
| `DS_Mother&Kids 10$+` | 1,078 | Mother & Kids $10+ |
| `DS_SexProducts 10$+` | 1,300 | Adult $10+ |

### 🎄 Seasonal / Event Feeds

| Feed Name | Products | Event |
|-----------|----------|-------|
| `DS_Christmas-Decor` | 6,840 | Christmas |
| `Christmas-Selectedgoods2023` | 420 | Christmas picks |
| `DS_BoxingDayEssentials` | 7,976 | Boxing Day |
| `DS_CyberMondayEssentials` | 4,645 | Cyber Monday |
| `DS_ThanksgivingDayEssentials` | 6,060 | Thanksgiving |
| `DS_NewYear'sEveEssentials` | 11,529 | New Year |
| `DS_Winter-must-haves` | 4,230 | Winter |

### 🏥 Medical / Health Feeds

| Feed Name | Products | Category |
|-----------|----------|----------|
| `DS_DentalEquipment&Supplies` | 25,343 | Dental equipment |
| `DS_DentalCare_stores` | 960 | Dental care |
| `DS_RespiratoryEquipment_stores` | 36 | Respiratory |
| `DS_healthcaredevices_stores` | 1,554 | Healthcare devices |
| `DS_Medical Devices_limited stores` | 120 | Medical devices |

### 🇿🇦 South Africa Topseller Feeds

| Feed Name | Products |
|-----------|----------|
| `Security_ZA topsellers_ 20240423` | 11,896 |
| `Sports_ZA topsellers_ 20240423` | 36,019 |
| `car&accessories_ZA topsellers_ 20240423` | 31,018 |
| `computer&office_ZA topsellers_ 20240423` | 13,380 |
| `consumer electronics_ZA topsellers_ 20240423` | 20,397 |
| `furniture_ZA topsellers_ 20240423` | 13,980 |
| `garden_ZA topsellers_ 20240423` | 15,569 |
| `home appliances_ZA topsellers_ 20240423` | 17,177 |
| `home_ZA topsellers_ 20240423` | 21,259 |
| `light_ZA topsellers_ 20240423` | 14,815 |
| `motorcycle&accessories_ZA topsellers_ 20240423` | 20,438 |
| `pets&supplies_ZA topsellers_ 20240423` | 19,698 |
| `phones&accessories_ZA topsellers_ 20240423` | 6,613 |
| `tool_ZA topsellers_ 20240423` | 22,075 |
| `toys_ZA topsellers_ 20240423` | 25,474 |

### 🇺🇸 USA-Specific Feeds

| Feed Name | Products | Notes |
|-----------|----------|-------|
| `US 3PL-Warehouse 20240202` | 2,836 | 🚀 US-based warehouse (3-7 day shipping!) |
| `US CN-Warehouse 20240202` | 1,980 | CN warehouse for US |
| `USA_beauty&health_topsellers` | 6,600 | Beauty for US market |
| `US_Dolls&Accessories` | 26,341 | Toys/dolls for US |

### 🏢 Other

| Feed Name | Products |
|-----------|----------|
| `DS_Sports-Clothing&Shoes` | 7,990 |
| `DS_Automotive&Motorcycle&Parts_limited stores` | 1,260 |
| `Bestseller 2024` | 201,065 |

---

## 🎛️ Text Search Filters (`aliexpress.ds.text.search`)

### ✅ Working Filters (Tested Live)

| Parameter | Type | Required | Example | Status |
|-----------|------|----------|---------|--------|
| `keyWord` | String | **YES** | `"phone case"` | ✅ Returns products |
| `local` | String | **YES** | `"en_US"` | ✅ Language/locale |
| `countryCode` | String | **YES** | `"SA"` | ✅ Target country |
| `currency` | String | No | `"SAR"` | ✅ Target currency |
| `pageIndex` | String | No | `"1"` | ✅ Page number |
| `pageSize` | String | No | `"20"` | ✅ Items per page (max 50) |
| `sort` | String | No | `"SALE_PRICE_ASC"` | ✅ See sort options below |
| `minPrice` | String | No | `"10"` | ✅ Min price filter (in target currency) |
| `maxPrice` | String | No | `"50"` | ✅ Max price filter |
| `shipToCountry` | String | No | `"SA"` | ✅ Ship destination |

### Sort Options

| Value | Meaning | Tested |
|-------|---------|--------|
| `SALE_PRICE_ASC` | Cheapest first | ✅ Works |
| `SALE_PRICE_DESC` | Most expensive first | ✅ Works |
| `LAST_VOLUME_DESC` | Most ordered first | ✅ Works |

### ❌ Invalid / Unsupported Filters

| Parameter | Error | Notes |
|-----------|-------|-------|
| `searchExtend` | `"The specified parameter "null#searchExtend" is not valid"` | Not supported in DS API |
| `selectionName` | Returns 0 products | Needs exact match to a valid selection |
| `categoryId` | Returns 0 for most IDs | AliExpress category IDs are complex hierarchies |

---

## 🏭 Ship-From / Warehouse Filtering

### How It Works

AliExpress doesn't have a direct `ship_from` filter in text.search. However, you have two strategies:

### Strategy 1: Use Warehouse-Specific Feeds
The best way to find locally-warehoused products (fast shipping):

| Feed | Location | Shipping Time |
|------|----------|---------------|
| `US 3PL-Warehouse 20240202` | US warehouse | 3-7 days to US |
| `US CN-Warehouse 20240202` | China warehouse for US | 7-15 days |

> For Saudi Arabia, there's no SA-warehouse feed yet, but products from the `SA_Clothing&Shoes` feed typically have better SA shipping options.

### Strategy 2: Check Shipping at Product Level
After finding a product, call `aliexpress.logistics.buyer.freight.calculate` to get:
- Available shipping methods
- Estimated delivery days
- Shipping cost

This lets you filter/sort products by actual shipping time to Saudi Arabia.

### Strategy 3: Use `shipToCountry` Parameter
Pass `shipToCountry: "SA"` in text.search — while it doesn't filter by warehouse, it ensures pricing and availability are accurate for Saudi Arabia.

---

## 📊 Feed Search Filters (`aliexpress.ds.recommend.feed.get`)

| Parameter | Type | Required | Example |
|-----------|------|----------|---------|
| `feed_name` | String | **YES** | `"DS_NewArrivals"` |
| `target_currency` | String | No | `"SAR"` |
| `target_language` | String | No | `"EN"` |
| `country` | String | No | `"SA"` |
| `page_no` | String | No | `"1"` |
| `page_size` | String | No | `"20"` |
| `sort` | String | No | `"SALE_PRICE_ASC"` |
| `min_sale_price` | String | No | `"5"` |
| `max_sale_price` | String | No | `"100"` |
| `category_id` | String | No | Category filter |

---

## 📋 Response Field Mapping

### Text Search (`ds.text.search`) → Our `NormalizedProduct`

| AliExpress Field | Our Field | Example |
|-----------------|-----------|---------|
| `itemId` | `id` | `1005011916867933` |
| `title` | `title` | `"Pure Copper Cup..."` |
| `itemMainPic` | `image` | `"https://ae01.alicdn.com/..."` |
| `targetSalePrice` | `price` | `44.40` |
| `targetOriginalPrice` | `originalPrice` | `80.73` |
| `targetOriginalPriceCurrency` | `currency` | `"SAR"` |
| `discount` | `discount` | `45` |
| `evaluateRate` | `rating` | Converted to 5-star |
| `orders` | `orders` | `5` |
| `itemUrl` | `url` | AliExpress product page |
| `cateId` | `category` | Category ID chain |

### Feed Search (`ds.recommend.feed.get`) → Our `NormalizedProduct`

| AliExpress Field | Our Field | Example |
|-----------------|-----------|---------|
| `product_id` | `id` | `1005011837376097` |
| `product_title` | `title` | Direct field name |
| `product_main_image_url` | `image` | Direct field name |
| `target_sale_price` | `price` | `25.76` |
| `target_original_price` | `originalPrice` | Direct |
| `target_sale_price_currency` | `currency` | `"SAR"` |
| `discount` | `discount` | `"57%"` |
| `product_detail_url` | `url` | Full URL |
| `product_small_image_urls` | `images` | Direct array |
| `lastest_volume` | `orders` | Order count |
