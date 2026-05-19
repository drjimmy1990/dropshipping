# CJDropshipping API v2.0 — Complete Reference

> **Base URL:** `https://developers.cjdropshipping.com/api2.0/v1`
> **Auth Header:** `CJ-Access-Token: <token>`
> **Content-Type:** `application/json` (for POST)
> **Prices:** All prices are in **USD**
> **Rate Limits:** Free/v1 users: max 1000 req/day; 3 users per IP

---

## 1. Authentication

### 1.1 Get Access Token — `GET /authentication/getAccessToken`

| Param | Type | Required | Note |
|-------|------|----------|------|
| email | string | Y | CJ account email |
| password | string | Y | CJ account password |

**Response:**
```json
{
  "code": 200,
  "result": true,
  "message": "Success",
  "data": {
    "accessToken": "xxx...",
    "accessTokenExpiryDate": "2024-01-01T00:00:00.000+00:00",
    "refreshToken": "yyy...",
    "refreshTokenExpiryDate": "2024-06-01T00:00:00.000+00:00",
    "createDate": "2023-07-01T00:00:00.000+00:00"
  }
}
```

### 1.2 Refresh Token — `GET /authentication/refreshAccessToken`

| Param | Type | Required | Note |
|-------|------|----------|------|
| refreshToken | string | Y | From getAccessToken |

**Response:** Same shape as getAccessToken.

---

## 2. Product

### 2.1 Category List — `GET /product/getCategory`

No params required.

**Response `data`:** Array of category tree:
```json
[{
  "categoryFirstName": "Computer & Office",
  "categoryFirstList": [{
    "categorySecondName": "Office Electronics",
    "categorySecondList": [{
      "categoryId": "2252588B-72E3-4397-8C92-7D9967161084",
      "categoryName": "Office & School Supplies"
    }]
  }]
}]
```

| Field | Type | Note |
|-------|------|------|
| categoryFirstName | string | L1 category name |
| categorySecondName | string | L2 category name |
| categoryId | string | L3 category ID (UUID) — use for filtering |
| categoryName | string | L3 category name |

---

### 2.2 Product List V2 — `GET /product/listV2` ⭐ PRIMARY SEARCH

Elasticsearch-powered. Use this for the discovery page.

| Param | Type | Required | Note |
|-------|------|----------|------|
| keyWord | string | N | Product name or SKU |
| page | int | N | Default 1, max 1000 |
| size | int | N | Default 10, max 100 |
| categoryId | string | N | L3 category ID |
| countryCode | string | N | `CN`, `US`, `GB` etc — filter by warehouse |
| startSellPrice | decimal | N | Min price (USD) |
| endSellPrice | decimal | N | Max price (USD) |
| productFlag | int | N | 0=Trending, 1=New, 2=Video, 3=Slow-moving |
| sort | string | N | `desc` (default) / `asc` |
| orderBy | int | N | 0=Best match, 1=Listed count, 2=Sell price, 3=Create time, 4=Inventory |
| features | array | N | `enable_description`, `enable_category`, `enable_video` |

**Response `data`:**
```json
{
  "pageSize": 20,
  "pageNumber": 1,
  "totalRecords": 1000,
  "totalPages": 50,
  "content": [{
    "productList": [{ /* CJProductV2 */ }],
    "relatedCategoryList": [{ "categoryId": "...", "categoryName": "..." }],
    "keyWord": "hoodie"
  }]
}
```

**CJProductV2 fields (in `productList`):**

| Field | Type | Note |
|-------|------|------|
| id | string | Product ID (UUID) — **THIS IS THE PID** |
| nameEn | string | Product English name |
| sku | string | Product SPU code |
| bigImage | string | Main image URL |
| sellPrice | string | Original price (USD) |
| nowPrice | string | Current/discount price (USD) |
| discountPrice | string | Best discount price |
| discountPriceRate | string | Discount percentage |
| listedNum | int | Times listed on platform |
| categoryId | string | L3 category ID |
| threeCategoryName | string | L3 category name (if `enable_category`) |
| twoCategoryId | string | L2 category ID |
| twoCategoryName | string | L2 category name (if `enable_category`) |
| oneCategoryId | string | L1 category ID |
| oneCategoryName | string | L1 category name (if `enable_category`) |
| addMarkStatus | int | 0=paid shipping, 1=free shipping |
| isVideo | int | 0=no, 1=yes |
| productType | string | e.g. `ORDINARY_PRODUCT` |
| supplierName | string | Supplier name |
| createAt | long | Timestamp ms |
| warehouseInventoryNum | long | Total inventory |
| deliveryCycle | string | e.g. `"3-5"` (days) |
| description | string | Full description (if `enable_description`) |

---

### 2.3 Product Details — `GET /product/query` ⭐ DETAIL VIEW

| Param | Type | Required | Note |
|-------|------|----------|------|
| pid | string | one of 3 | Product ID |
| productSku | string | one of 3 | Product SPU |
| variantSku | string | one of 3 | Variant SKU |
| features | array | N | `enable_combine`, `enable_video` |
| countryCode | string | N | Filter variants by warehouse country |

**Response `data`:** Single product object:

| Field | Type | Note |
|-------|------|------|
| pid | string | Product ID |
| productNameEn | string | English name |
| productSku | string | SPU code |
| bigImage | string | Main image URL |
| productImageSet | string[] | All image URLs |
| productWeight | string | Weight in grams |
| productUnit | string | e.g. `"unit(s)"` |
| productType | string | e.g. `"ORDINARY_PRODUCT"` |
| categoryId | string | Category ID |
| categoryName | string | Full category path |
| sellPrice | number | Price in USD |
| suggestSellPrice | string | e.g. `"0.97-4.08"` |
| description | string | HTML description |
| listedNum | int | Listed count |
| status | string | `"3"` = approved |
| productKeyEn | string | Variant keys, e.g. `"Color-Size"` |
| variants | CJVariant[] | See below |

**CJVariant fields:**

| Field | Type | Note |
|-------|------|------|
| vid | string | Variant ID (UUID) — **CRITICAL for orders** |
| pid | string | Parent product ID |
| variantNameEn | string | e.g. `"Small trailer model Black"` |
| variantSku | string | e.g. `"CJJJJTJT05843-Black"` |
| variantImage | string | Variant image URL |
| variantKey | string | Options joined by `-`, e.g. `"Black-XXL"` |
| variantWeight | double | Weight in grams |
| variantSellPrice | double | Price in USD |
| variantSugSellPrice | double | Suggested retail price (USD) |
| variantLength | int | mm |
| variantWidth | int | mm |
| variantHeight | int | mm |
| inventories | CJInventory[] | Stock per warehouse |

**CJInventory fields (in variant):**

| Field | Type | Note |
|-------|------|------|
| countryCode | string | `"CN"`, `"US"` etc |
| totalInventory | int | Total stock |
| cjInventory | int | CJ-managed stock |
| factoryInventory | int | Factory-managed stock |
| verifiedWarehouse | int | 1=verified, 2=unverified |

---

### 2.4 Variant Query — `GET /product/variant/query`

| Param | Type | Required | Note |
|-------|------|----------|------|
| pid | string | one of 3 | Product ID |
| productSku | string | one of 3 | Product SPU |
| variantSku | string | one of 3 | Variant SKU |
| countryCode | string | N | Filter by warehouse country |

**Response `data`:** Array of CJVariant objects (same fields as above).

### 2.5 Variant by VID — `GET /product/variant/queryByVid`

| Param | Type | Required | Note |
|-------|------|----------|------|
| vid | string | Y | Variant ID |
| features | string | N | `enable_inventory` returns inventory with stockId |

**Response `data`:** Single CJVariant with inventories.

---

### 2.6 Inventory by VID — `GET /product/stock/queryByVid`

| Param | Type | Required | Note |
|-------|------|----------|------|
| vid | string | Y | Variant ID |

**Response `data`:** Array of warehouse stock:
```json
[{
  "vid": "7874B45D-...",
  "areaId": "1",
  "areaEn": "China Warehouse",
  "countryCode": "CN",
  "totalInventoryNum": 10877,
  "cjInventoryNum": 700,
  "factoryInventoryNum": 10177
}]
```

### 2.7 Inventory by SKU — `GET /product/stock/queryBySku`

| Param | Type | Required | Note |
|-------|------|----------|------|
| sku | string | Y | SPU or variant SKU |

**Response `data`:** Same warehouse stock array as 2.6.

### 2.8 Inventory by PID — `GET /product/stock/getInventoryByPid`

| Param | Type | Required | Note |
|-------|------|----------|------|
| pid | string | Y | Product ID |

**Response `data`:** `{ inventories: [...], variantInventories: [{ vid, inventory: [...] }] }`

---

## 3. Logistics

### 3.1 Freight Calculate — `POST /logistic/freightCalculate`

| Param | Type | Required | Note |
|-------|------|----------|------|
| startCountryCode | string | Y | Origin country, e.g. `"CN"` |
| endCountryCode | string | Y | Destination, e.g. `"US"` |
| products | array | Y | `[{ quantity, vid }]` |

**Product item:**

| Field | Type | Required | Note |
|-------|------|----------|------|
| quantity | int | Y | Item quantity |
| vid | string | Y | Variant ID |

**Response `data`:** Array of shipping options:
```json
[{
  "logisticName": "CJPacket Ordinary",
  "logisticAging": "7-15",
  "logisticPrice": 3.68,
  "logisticPriceCn": 25.0,
  "logisticWeight": 50,
  "logisticUpdateTime": "2024-01-01 00:00:00",
  "logisticKey": "CJPACKET",
  "logisticVolume": 0,
  "logisticType": "1"
}]
```

| Field | Type | Note |
|-------|------|------|
| logisticName | string | Shipping method name |
| logisticAging | string | Delivery estimate, e.g. `"7-15"` days |
| logisticPrice | double | Shipping cost in USD |
| logisticKey | string | Shipping method code — **USE THIS for orders** |

### 3.2 Tracking Query — `GET /logistic/getTrackInfo`

| Param | Type | Required | Note |
|-------|------|----------|------|
| trackNumber | string | Y | Tracking number |

---

## 4. Shopping (Orders)

### 4.1 Create Order V2 — `POST /shopping/order/createOrderV2` ⭐

| Param | Type | Required | Note |
|-------|------|----------|------|
| orderNumber | string | Y | YOUR unique order ID |
| shippingCountryCode | string | Y | Two-letter code, e.g. `"SA"` |
| shippingCountry | string | Y | Country name |
| shippingProvince | string | Y | Province |
| shippingCity | string | Y | City |
| shippingCustomerName | string | Y | Recipient name |
| shippingAddress | string | Y | Address |
| shippingAddress2 | string | N | Address line 2 |
| shippingZip | string | N | Zip code |
| shippingPhone | string | N | Phone |
| logisticName | string | Y | From freight calc, e.g. `"CJPacket Ordinary"` |
| fromCountryCode | string | Y | Ship from, e.g. `"CN"` |
| remark | string | N | Order note |
| payType | int | N | 1=Page pay (default), 2=Balance, 3=Create only |
| platform | string | N | Default `"Api"` |
| products | array | Y | `[{ vid, quantity, sku? }]` |

**Product item:**

| Field | Type | Required | Note |
|-------|------|----------|------|
| vid | string | Y* | CJ variant ID |
| sku | string | N* | CJ variant SKU (fallback if no vid) |
| quantity | int | Y | Quantity |
| unitPrice | decimal | N | Item price |
| storeLineItemId | string | N | Your line item ID |

**Response `data`:**
```json
{
  "orderId": "123434",
  "orderNumber": "1234",
  "orderAmount": "25.50",
  "productAmount": "20.00",
  "postageAmount": "5.50",
  "cjPayUrl": "https://...",
  "orderStatus": "CREATED"
}
```

| Field | Type | Note |
|-------|------|------|
| orderId | string | CJ order ID |
| orderNumber | string | Your order number |
| orderAmount | decimal | Total (USD) |
| productAmount | decimal | Product subtotal |
| postageAmount | decimal | Shipping cost |
| cjPayUrl | string | Payment URL (if payType=1) |
| orderStatus | string | `CREATED`, `IN_CART`, `UNPAID`, etc |

### 4.2 List Orders — `GET /shopping/order/list`

| Param | Type | Required | Note |
|-------|------|----------|------|
| pageNum | int | N | Default 1 |
| pageSize | int | N | Default 20 |
| status | string | N | `CREATED`, `IN_CART`, `UNPAID`, `UNSHIPPED`, `SHIPPED`, `DELIVERED`, `CANCELLED` |

**Response:** Paginated list of order objects with fields: `orderId`, `orderNum`, `orderStatus`, `orderAmount`, `trackNumber`, `logisticName`, `createDate`, `productList`.

### 4.3 Order Detail — `GET /shopping/order/getOrderDetail`

| Param | Type | Required | Note |
|-------|------|----------|------|
| orderId | string | Y | CJ order ID or your order number |

**Response `data`:** Full order with:

| Field | Type | Note |
|-------|------|------|
| orderId | string | CJ order ID |
| orderNum | string | Your order number |
| orderStatus | string | Current status |
| orderAmount | decimal | Total (USD) |
| productAmount | decimal | Product cost |
| postageAmount | decimal | Shipping cost |
| logisticName | string | Shipping method |
| trackNumber | string | Tracking number (null until shipped) |
| createDate | string | Order creation time |
| paymentDate | string | Payment time |
| fromCountryCode | string | Ship-from country |
| productList | array | `[{ vid, quantity, sellPrice, lineItemId }]` |

### 4.4 Delete Order — `DELETE /shopping/order/deleteOrder`

| Param | Type | Required | Note |
|-------|------|----------|------|
| orderId | string | Y | CJ order ID |

### 4.5 Add Cart — `POST /shopping/order/addCart`

| Param | Type | Required | Note |
|-------|------|----------|------|
| cjOrderIdList | string[] | Y | Array of CJ order IDs |

### 4.6 Confirm Order — `POST /shopping/order/addCartConfirm`

| Param | Type | Required | Note |
|-------|------|----------|------|
| cjOrderIdList | string[] | Y | Array of CJ order IDs |

---

## 5. Order Status Reference

| Status | Meaning |
|--------|---------|
| `CREATED` | Order created, not in cart |
| `IN_CART` | Added to cart |
| `UNPAID` | Confirmed, awaiting payment |
| `UNSHIPPED` | Paid, awaiting shipment |
| `SHIPPED` | Shipped, has tracking |
| `DELIVERED` | Delivered |
| `CANCELLED` | Cancelled |

---

## 6. Standard Response Envelope

ALL endpoints return:
```json
{
  "code": 200,
  "result": true,
  "message": "Success",
  "data": { ... },
  "requestId": "uuid-string"
}
```

**Error:**
```json
{
  "code": 1600100,
  "result": false,
  "message": "Param error",
  "data": null,
  "requestId": "uuid-string"
}
```

| Code | Meaning |
|------|---------|
| 200 | Success |
| 1600000 | General error |
| 1600100 | Parameter error |
| 1600200 | Token expired |
| 1603001 | Order confirm failed |

---

## 7. Key Differences from AliExpress

| Aspect | AliExpress | CJDropshipping |
|--------|------------|----------------|
| Auth | HMAC-SHA256 signed requests | Simple Bearer token header |
| Token | Platform-level (shared key) | Per-merchant email/password |
| IDs | Numeric product IDs | UUID strings |
| Prices | Multi-currency (target_currency) | Always USD |
| Variants | `ae_item_sku_info_dtos` array | `variants` array with `vid` |
| Images | Semicolon-separated string | `productImageSet` string array |
| Stock | No stock API | Dedicated stock endpoints per VID/SKU/PID |
| Shipping | `aliexpress.ds.freight.query` | `POST /logistic/freightCalculate` |
| Orders | `aliexpress.ds.order.create` | `POST /shopping/order/createOrderV2` |
