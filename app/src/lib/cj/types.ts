/* ================================================================
   CJDropshipping API v2.0 — TypeScript Types
   Matches the API responses from developers.cjdropshipping.com/api2.0/v1
   Reference: ./API_REFERENCE.md
   ================================================================ */

// ---------- Config ----------

export interface CJConfig {
  baseUrl: string;
  accessToken: string;
  refreshToken?: string;
}

// ---------- Standard Response Envelope ----------

export interface CJResponse<T> {
  code: number;
  result: boolean;
  message: string;
  data: T;
  requestId: string;
  success?: boolean;
}

// ---------- Authentication ----------

export interface CJTokenData {
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken: string;
  refreshTokenExpiryDate: string;
  createDate: string;
}

// ---------- Categories ----------

export interface CJCategoryL3 {
  categoryId: string;
  categoryName: string;
}

export interface CJCategoryL2 {
  categorySecondName: string;
  categorySecondList: CJCategoryL3[];
}

export interface CJCategoryL1 {
  categoryFirstName: string;
  categoryFirstList: CJCategoryL2[];
}

// ---------- Product List V2 (Search) ----------

export interface CJProductV2 {
  id: string;                    // Product ID (UUID)
  nameEn: string;                // English name
  sku: string;                   // SPU code
  spu?: string;
  bigImage: string;              // Main image URL
  sellPrice: string;             // Original price (USD)
  nowPrice?: string;             // Current discount price
  discountPrice?: string;        // Best discount price
  discountPriceRate?: string;    // Discount percentage
  listedNum: number;             // Times listed on platform
  categoryId: string;            // L3 category ID
  threeCategoryName?: string;    // L3 name (needs enable_category)
  twoCategoryId?: string;
  twoCategoryName?: string;
  oneCategoryId?: string;
  oneCategoryName?: string;
  addMarkStatus: number;         // 0=paid, 1=free shipping
  isVideo: number;               // 0=no, 1=yes
  videoList?: string[];
  productType: string;           // e.g. "ORDINARY_PRODUCT"
  supplierName?: string;
  createAt?: number;             // Timestamp ms
  warehouseInventoryNum?: number;
  totalVerifiedInventory?: number;
  totalUnVerifiedInventory?: number;
  verifiedWarehouse?: number;    // 1=verified, 2=unverified
  customization?: number;
  isPersonalized?: number;
  hasCECertification?: number;
  myProduct?: boolean;
  description?: string;          // Needs enable_description
  deliveryCycle?: string;        // e.g. "3-5" (days)
  saleStatus?: string;           // "3" = approved
  isCollect?: number;
}

/** Wrapper in content array */
export interface CJProductSearchContent {
  productList: CJProductV2[];
  relatedCategoryList?: { categoryId: string; categoryName: string }[];
  keyWord?: string;
  keyWordOld?: string;
}

/** Response data from /product/listV2 */
export interface CJProductListV2Data {
  pageSize: number;
  pageNumber: number;
  totalRecords: number;
  totalPages: number;
  content: CJProductSearchContent[];
}

// ---------- Product Detail ----------

export interface CJInventoryStock {
  stockId: string;
  inventory: number;
  factoryInventory: number;
}

export interface CJInventory {
  countryCode: string;
  totalInventory: number;
  cjInventory: number;
  factoryInventory: number;
  verifiedWarehouse?: number;   // 1=verified, 2=unverified
  stock?: CJInventoryStock[];
}

export interface CJVariant {
  vid: string;                    // Variant ID (UUID) — CRITICAL
  pid: string;                    // Parent product ID
  variantName?: string | null;
  variantNameEn: string;
  variantSku: string;
  variantImage?: string;
  variantUnit?: string | null;
  variantKey?: string;            // Options joined by "-", e.g. "Black-XXL"
  variantLength?: number;         // mm
  variantWidth?: number;          // mm
  variantHeight?: number;         // mm
  variantVolume?: number;         // mm³
  variantWeight?: number;         // grams
  variantSellPrice: number;       // USD
  variantSugSellPrice?: number;   // Suggested retail (USD)
  variantStandard?: string;
  createTime?: string | null;
  combineNum?: number;
  combineVariants?: CJVariant[];
  inventories?: CJInventory[];
}

export interface CJProductDetail {
  pid: string;
  productName?: string;           // Chinese name (JSON array string)
  productNameEn: string;
  productSku: string;
  bigImage: string;
  productImageSet?: string[];
  productWeight?: string;         // grams
  productUnit?: string;
  productType?: string;
  categoryId?: string;
  categoryName?: string;          // Full path, e.g. "Home & Garden > ..."
  entryCode?: string;             // HS code
  entryNameEn?: string;
  materialNameEnSet?: string[];
  packingWeight?: string;
  packingNameEnSet?: string[];
  productKeyEn?: string;          // Variant keys, e.g. "Color-Size"
  productProEnSet?: string[];
  addMarkStatus?: number;
  description?: string;           // HTML
  sellPrice: number;
  suggestSellPrice?: string;      // e.g. "0.97-4.08"
  listedNum?: number;
  status?: string;                // "3" = approved
  supplierName?: string;
  supplierId?: string;
  customizationVersion?: number;
  variants: CJVariant[];
  createrTime?: string;
}

// ---------- Inventory ----------

export interface CJWarehouseStock {
  vid?: string;
  areaId: string | number;
  areaEn: string;
  countryCode: string;
  totalInventoryNum: number;
  cjInventoryNum: number;
  factoryInventoryNum: number;
  countryNameEn?: string;
  storageNum?: number;            // Deprecated, use totalInventoryNum
  stock?: CJInventoryStock[] | null;
}

export interface CJProductInventory {
  inventories: CJWarehouseStock[];
  variantInventories?: {
    vid: string;
    inventory: CJInventory[];
  }[];
}

// ---------- Logistics ----------

export interface CJFreightProduct {
  quantity: number;
  vid: string;
}

export interface CJFreightRequest {
  startCountryCode: string;       // e.g. "CN"
  endCountryCode: string;         // e.g. "SA"
  products: CJFreightProduct[];
}

export interface CJFreightOption {
  logisticName: string;           // e.g. "CJPacket Ordinary"
  logisticAging: string;          // e.g. "7-15" (days)
  logisticPrice: number;          // USD
  logisticPriceCn?: number;
  logisticWeight?: number;
  logisticUpdateTime?: string;
  logisticKey: string;            // Shipping method code — USE THIS for orders
  logisticVolume?: number;
  logisticType?: string;
}

// ---------- Shopping (Orders) ----------

export interface CJOrderProduct {
  vid: string;
  quantity: number;
  sku?: string;
  unitPrice?: number;
  storeLineItemId?: string;
}

export interface CJOrderCreateRequest {
  orderNumber: string;            // YOUR unique order ID
  shippingCountryCode: string;    // Two-letter, e.g. "SA"
  shippingCountry: string;
  shippingProvince: string;
  shippingCity: string;
  shippingCustomerName: string;
  shippingAddress: string;
  shippingAddress2?: string;
  shippingZip?: string;
  shippingPhone?: string;
  logisticName: string;           // From freight calc
  fromCountryCode: string;        // Ship from, e.g. "CN"
  remark?: string;
  payType?: number;               // 1=Page pay, 2=Balance, 3=Create only
  platform?: string;              // Default "Api"
  products: CJOrderProduct[];
}

export interface CJOrderCreateResponse {
  orderId: string;
  orderNumber: string;
  orderAmount: string;
  productAmount: string;
  postageAmount: string;
  cjPayUrl?: string;
  orderStatus: string;
}

export interface CJOrderDetail {
  orderId: string;
  orderNum: string;
  orderStatus: string;
  orderAmount: string;
  productAmount: string;
  postageAmount: string;
  logisticName?: string;
  trackNumber?: string | null;
  createDate: string;
  paymentDate?: string;
  fromCountryCode?: string;
  productList?: {
    vid: string;
    quantity: number;
    sellPrice: number;
    lineItemId?: string;
  }[];
}

// ---------- Search Params (Internal) ----------

export interface CJSearchParams {
  keyword?: string;
  page?: number;
  size?: number;
  categoryId?: string;
  countryCode?: string;
  startSellPrice?: number;
  endSellPrice?: number;
  productFlag?: number;         // 0=Trending, 1=New, 2=Video
  sort?: string;                // "desc" | "asc"
  orderBy?: number;             // 0=Best match, 1=Listed, 2=Price, 3=Time, 4=Inventory
  features?: string[];          // e.g. ["enable_description", "enable_category"]
}
