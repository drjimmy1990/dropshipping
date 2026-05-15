/* ================================================================
   AliExpress Open Platform — API Client
   Handles HMAC-SHA256 signed requests to api-sg.aliexpress.com
   ================================================================ */

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type {
  AliExpressConfig,
  AliExpressTokenResponse,
  AliExpressSearchResponse,
  AliExpressSearchProduct,
  AliExpressProductDetail,
  AliExpressProductDetailResponse,
  AliExpressFreightResponse,
  AliExpressSkuInfo,
  AliExpressSkuProperty,
  NormalizedProduct,
  NormalizedProductDetail,
  NormalizedVariant,
  NormalizedShippingOption,
  ProductSearchParams,
} from "./types";

// ---------- Config ----------

function getConfig(): AliExpressConfig {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  const apiUrl = process.env.ALIEXPRESS_API_URL || "https://api-sg.aliexpress.com";

  if (!appKey || !appSecret) {
    throw new Error(
      "[AliExpress] ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET must be set in .env.local"
    );
  }

  return { appKey, appSecret, apiUrl };
}

// ---------- Master Token ----------

async function getMasterAccessToken(): Promise<string | undefined> {
  if (process.env.ALIEXPRESS_ACCESS_TOKEN) {
    return process.env.ALIEXPRESS_ACCESS_TOKEN;
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("platform_config")
      .select("value")
      .eq("key", "aliexpress_access_token")
      .single();

    if (data && data.value) {
      let token = data.value as string;
      if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }
      return token;
    }
  } catch (err) {
    console.warn("[AliExpress] Failed to fetch access token from platform config:", err);
  }

  return undefined;
}

// ---------- Request Signing (HMAC-SHA256) ----------

/**
 * Generates an HMAC-SHA256 signature per AliExpress Open Platform spec.
 * 1. Sort params alphabetically by key
 * 2. Concatenate: apiName + key1value1 + key2value2 + ...
 * 3. HMAC-SHA256(appSecret, concatenated) → uppercase hex
 */
function generateSignature(
  params: Record<string, string>,
  appSecret: string,
  apiName: string
): string {
  const sortedKeys = Object.keys(params).sort();

  let signStr = apiName;
  for (const key of sortedKeys) {
    signStr += `${key}${params[key]}`;
  }

  return crypto
    .createHmac("sha256", appSecret)
    .update(signStr, "utf8")
    .digest("hex")
    .toUpperCase();
}

// ---------- Core API Request ----------

/**
 * Makes a signed request to the AliExpress Open Platform REST API.
 */
async function apiRequest<T>(
  method: string,
  params: Record<string, string> = {},
  providedToken?: string
): Promise<T> {
  const config = getConfig();
  const accessToken = providedToken || await getMasterAccessToken();

  // Build the base system parameters
  const systemParams: Record<string, string> = {
    app_key: config.appKey,
    method,
    timestamp: Date.now().toString(),
    sign_method: "sha256",
    v: "2.0",
    format: "json",
    ...params,
  };

  if (accessToken) {
    systemParams.session = accessToken;
    systemParams.access_token = accessToken;
  }

  // Generate signature (exclude "sign" itself)
  const sign = generateSignature(systemParams, config.appSecret, method);
  systemParams.sign = sign;

  // Build URL-encoded body
  const body = new URLSearchParams(systemParams).toString();

  console.log(`[AliExpress] REQUEST → ${method}`);
  console.log(`[AliExpress] Params:`, JSON.stringify(params, null, 2));

  const response = await fetch(`${config.apiUrl}/rest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[AliExpress] HTTP error (${response.status}):`, errorText);
    throw new Error(`AliExpress API request failed: ${response.status}`);
  }

  const data = await response.json();

  // DEBUG: Log full raw response
  console.log(`[AliExpress] RAW RESPONSE:`, JSON.stringify(data, null, 2).substring(0, 2000));

  // AliExpress wraps responses in a method-named key
  // e.g. { "aliexpress_ds_product_get_response": { ... } }
  const responseKey = method.replace(/\./g, "_") + "_response";
  const result = data[responseKey] || data;

  // Check for API-level errors
  if (result?.code && result.code !== "0" && result.code !== 0) {
    console.error(`[AliExpress] API error:`, result);
    throw new Error(
      result.msg || result.sub_msg || `AliExpress API error: ${result.code}`
    );
  }

  return result as T;
}


// ---------- Note: OAuth functions removed ----------
// AliExpress is integrated at the platform level (super admin).
// The app key/secret in .env.local is used for all API calls.
// Individual merchants do NOT need to connect AliExpress accounts.

// ---------- Product Search ----------

/**
 * Search AliExpress products.
 * - With keyword: uses aliexpress.ds.text.search (keyword-based)
 * - Without keyword: uses aliexpress.ds.recommend.feed.get (feed/browse)
 */
export async function searchProducts(
  params: ProductSearchParams,
  accessToken?: string
): Promise<{ products: NormalizedProduct[]; totalPages: number; totalCount: number; page: number }> {
  // Decide which API to use based on whether we have a keyword
  if (params.keyword && params.keyword.trim()) {
    return searchByKeyword(params, accessToken);
  }
  return searchByFeed(params, accessToken);
}

/**
 * Keyword-based search using aliexpress.ds.text.search
 */
async function searchByKeyword(
  params: ProductSearchParams,
  accessToken?: string
): Promise<{ products: NormalizedProduct[]; totalPages: number; totalCount: number; page: number }> {
  const apiParams: Record<string, string> = {
    keyWord: params.keyword!,
    currency: params.currency || "SAR",
    local: params.language === "AR" ? "ar_AE" : "en_US",
    pageIndex: String(params.page || 1),
    pageSize: String(params.pageSize || 20),
    countryCode: params.shipTo || "SA",
  };

  if (params.sort) apiParams.sort = params.sort;
  if (params.minPrice) apiParams.minPrice = String(params.minPrice);
  if (params.maxPrice) apiParams.maxPrice = String(params.maxPrice);
  if (params.category_id) apiParams.categoryId = params.category_id;

  try {
    const response = await apiRequest<{ data?: any; resp_result?: any }>(
      "aliexpress.ds.text.search",
      apiParams,
      accessToken
    );

    const result = response.resp_result || response;
    
    // Handle text.search specific response structure
    let rawProducts = [];
    if (result?.data && result.data.products) {
      rawProducts = result.data.products;
    } else if (result?.products?.traffic_product_dto) {
      rawProducts = result.products.traffic_product_dto;
    }

    if (!rawProducts || rawProducts.length === 0) {
      console.log("[AliExpress] text.search returned 0 products, falling back to feed browse...");
      return searchByFeed({ ...params, keyword: undefined }, accessToken);
    }

    // Map text.search fields to traffic_product_dto fields so normalizeSearchProduct works
    // IMPORTANT: Always prefer target_* prices (SAR) over raw prices (CNY/USD)
    const normalizedRawProducts = rawProducts.map((p: any) => ({
      product_id: p.itemId || p.product_id,
      product_title: p.title || p.product_title,
      product_main_image_url: p.itemMainPic || p.product_main_image_url,
      // SAR prices — these are the target currency prices
      target_sale_price: p.targetSalePrice || p.target_sale_price,
      target_original_price: p.targetOriginalPrice || p.target_original_price,
      target_sale_price_currency: "SAR",
      // DO NOT use salePrice/originalPrice — those are in CNY
      sale_price: p.targetSalePrice || p.target_sale_price || p.salePrice || p.sale_price,
      original_price: p.targetOriginalPrice || p.target_original_price || p.originalPrice || p.original_price,
      sale_price_currency: "SAR",
      evaluate_rate: p.evaluateRate || p.evaluate_rate,
      lastest_volume: p.orders || p.lastest_volume,
      product_detail_url: p.itemUrl || p.product_detail_url,
      first_level_category_name: p.categoryId ? String(p.categoryId) : p.first_level_category_name,
      discount: p.discount,
    }));

    const products: NormalizedProduct[] = normalizedRawProducts.map(normalizeSearchProduct);

    return {
      products,
      totalPages: result?.data?.totalCount ? Math.ceil(result.data.totalCount / (params.pageSize || 20)) : 1,
      totalCount: result?.data?.totalCount || products.length,
      page: result?.data?.pageIndex || 1,
    };
  } catch (error) {
    // Fallback: if text.search is not available, try feed with keyword as feed_name
    console.warn("[AliExpress] text.search failed, falling back to feed:", error);
    return searchByFeed({ ...params, keyword: undefined }, accessToken);
  }
}

/**
 * Browse/Feed-based search using aliexpress.ds.recommend.feed.get
 * feed_name is REQUIRED — defaults to "DS center" for general browsing.
 */
async function searchByFeed(
  params: ProductSearchParams,
  accessToken?: string
): Promise<{ products: NormalizedProduct[]; totalPages: number; totalCount: number; page: number }> {
  const apiParams: Record<string, string> = {
    // feed_name is REQUIRED — use a known valid feed, NOT the search keyword
    feed_name: params.feedName || "DS_NewArrivals",
    target_currency: params.currency || "SAR",
    target_language: params.language || "EN",
    page_no: String(params.page || 1),
    page_size: String(params.pageSize || 20),
  };

  if (params.category_id) apiParams.category_id = params.category_id;
  // Feed API uses different sort values than text search:
  // text.search: SALE_PRICE_ASC, SALE_PRICE_DESC, LAST_VOLUME_DESC
  // feed.get:   priceAsc, priceDesc, volumeAsc, volumeDesc, discountAsc, discountDesc
  if (params.sort) {
    const feedSortMap: Record<string, string> = {
      SALE_PRICE_ASC: "priceAsc",
      SALE_PRICE_DESC: "priceDesc",
      LAST_VOLUME_DESC: "volumeDesc",
    };
    apiParams.sort = feedSortMap[params.sort] || params.sort;
  }
  if (params.shipTo) apiParams.country = params.shipTo;
  if (params.minPrice) apiParams.min_sale_price = String(params.minPrice);
  if (params.maxPrice) apiParams.max_sale_price = String(params.maxPrice);

  const response = await apiRequest<any>(
    "aliexpress.ds.recommend.feed.get",
    apiParams,
    accessToken
  );

  // The feed API returns: { result: { products: [...], total_record_count, ... }, rsp_code, code }
  // After apiRequest unwraps the outer key, we get the object with .result inside
  const feedResult = response?.result || response?.resp_result || response;
  const rawProducts: any[] = feedResult?.products || feedResult?.products?.traffic_product_dto || [];
  const products: NormalizedProduct[] = rawProducts.map(normalizeFeedProduct);

  const totalCount = feedResult?.total_record_count || products.length;
  const pageSize = params.pageSize || 20;

  return {
    products,
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
    page: params.page || 1,
  };
}

// ---------- Product Detail ----------

/**
 * Get full product detail including variants, images, specs.
 */
export async function getProductDetail(
  productId: string | number,
  accessToken?: string,
  shipTo: string = "SA"
): Promise<NormalizedProductDetail> {
  const apiParams: Record<string, string> = {
    product_id: String(productId),
    target_currency: "SAR",
    target_language: "EN",
    ship_to_country: shipTo,
  };

  const response = await apiRequest<any>(
    "aliexpress.ds.product.get",
    apiParams,
    accessToken
  );

  const product = response.result || response;
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // Fetch shipping options
  let shippingOptions: NormalizedShippingOption[] = [];
  try {
    shippingOptions = await getFreightOptions(productId, 1, shipTo, accessToken);
  } catch {
    console.warn(`[AliExpress] Failed to fetch freight for product ${productId}`);
  }

  return normalizeProductDetail(product, shippingOptions);
}

// ---------- Freight / Shipping ----------

/**
 * Calculate shipping options for a product to a destination.
 */
export async function getFreightOptions(
  productId: string | number,
  quantity: number = 1,
  countryCode: string = "SA",
  accessToken?: string
): Promise<NormalizedShippingOption[]> {
  const apiParams: Record<string, string> = {
    product_id: String(productId),
    product_num: String(quantity),
    country_code: countryCode,
  };

  const response = await apiRequest<AliExpressFreightResponse>(
    "aliexpress.logistics.buyer.freight.calculate",
    apiParams,
    accessToken
  );

  const options = response?.freight_result?.freight || [];

  return options.map((opt) => ({
    name: opt.service_name,
    price: parseFloat(opt.amount?.amount || "0"),
    currency: opt.amount?.currency_code || "SAR",
    estimatedDays: opt.estimated_delivery_time || "N/A",
    trackingAvailable: opt.tracking_available === "true",
  }));
}

// ---------- Normalization Helpers ----------

function normalizeSearchProduct(raw: AliExpressSearchProduct): NormalizedProduct {
  // ALWAYS use target_sale_price (SAR) — never fall back to sale_price (CNY)
  const price = parseFloat(raw.target_sale_price || "0");
  const originalPrice = parseFloat(raw.target_original_price || "0");
  const discount = originalPrice > 0 && price > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
  const ratingStr = (raw.evaluate_rate || "0").replace("%", "");
  const rating = parseFloat(ratingStr) / 20; // Convert percentage to 5-star scale

  return {
    id: raw.product_id,
    title: raw.product_title || "Untitled Product",
    image: raw.product_main_image_url || "",
    images: raw.product_small_image_urls?.string || [raw.product_main_image_url].filter(Boolean),
    price,
    originalPrice,
    currency: "SAR", // Always SAR — we request target_currency=SAR from AliExpress
    discount,
    rating: Math.min(rating, 5),
    orders: raw.lastest_volume || raw.orders_count || 0,
    shipping: raw.ship_to_days ? `${raw.ship_to_days} days` : "Varies",
    category: raw.first_level_category_name || "",
    url: raw.product_detail_url || `https://www.aliexpress.com/item/${raw.product_id}.html`,
    supplier: "aliexpress",
  };
}

/**
 * Normalize a product from aliexpress.ds.recommend.feed.get
 * Feed products have a slightly different structure:
 *   - product_small_image_urls is a direct string[] (not { string: [...] })
 *   - lastest_volume is used for order count
 */
function normalizeFeedProduct(raw: any): NormalizedProduct {
  // ALWAYS use target_sale_price (SAR) — never fall back to sale_price (CNY/USD)
  const price = parseFloat(raw.target_sale_price || "0");
  const originalPrice = parseFloat(raw.target_original_price || "0");
  const discountStr = raw.discount ? String(raw.discount).replace("%", "") : "0";
  const discount = parseInt(discountStr) || (originalPrice > 0 && price > 0 ? Math.round((1 - price / originalPrice) * 100) : 0);
  const ratingStr = (raw.evaluate_rate || "0").replace("%", "");
  const rating = parseFloat(ratingStr) / 20; // Convert percentage to 5-star scale

  // Feed API returns product_small_image_urls as a direct array
  const images: string[] = Array.isArray(raw.product_small_image_urls)
    ? raw.product_small_image_urls
    : raw.product_small_image_urls?.string || [raw.product_main_image_url].filter(Boolean);

  return {
    id: raw.product_id,
    title: raw.product_title || "Untitled Product",
    image: raw.product_main_image_url || "",
    images,
    price,
    originalPrice,
    currency: "SAR", // Always SAR — we request target_currency=SAR from AliExpress
    discount,
    rating: Math.min(rating, 5),
    orders: raw.lastest_volume || 0,
    shipping: "Varies",
    category: raw.first_level_category_name || raw.second_level_category_name || "",
    url: raw.product_detail_url || `https://www.aliexpress.com/item/${raw.product_id}.html`,
    supplier: "aliexpress",
  };
}

function normalizeProductDetail(
  raw: any,
  shippingOptions: NormalizedShippingOption[]
): NormalizedProductDetail {
  // The API returns nested DTOs — extract each section
  const baseInfo = raw.ae_item_base_info_dto || {};
  const mediaInfo = raw.ae_multimedia_info_dto || {};
  const skuInfos: any[] = raw.ae_item_sku_info_dtos || [];
  const itemProperties: any[] = raw.ae_item_properties || [];
  const storeInfo = raw.ae_store_info || {};

  // Parse images from semicolon-separated string
  const imageStr = mediaInfo.image_urls || baseInfo.image_u_r_ls || "";
  const imageList = imageStr.split(";").filter(Boolean);

  // Parse variants from ae_item_sku_info_dtos
  // offer_sale_price is in target currency (SAR) when we pass target_currency=SAR
  // sku_price is the original price (may be CNY/USD) — only use as last resort
  const variants: NormalizedVariant[] = skuInfos.map((sku: any) => ({
    skuId: String(sku.sku_id || sku.id),
    price: parseFloat(sku.offer_sale_price || sku.sku_price || "0"),
    stock: sku.sku_available_stock > 0,
    stockQuantity: sku.sku_available_stock,
    properties: (sku.ae_sku_property_dtos || []).map((prop: any) => ({
      name: prop.sku_property_name,
      value: prop.property_value_definition_name || prop.sku_property_value,
      image: prop.sku_image,
    })),
  }));

  // Parse properties from ae_item_properties
  const properties = itemProperties.map((p: any) => ({
    name: p.attr_name || p.attr_name_id || "",
    value: p.attr_value || p.attr_value_id || "",
  }));

  // Calculate price range from variants
  const prices = variants.map((v) => v.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  // Rating and orders from base info
  const ratingStr = (baseInfo.avg_evaluation_rating || "0").replace("%", "");
  const rating = parseFloat(ratingStr);
  const orders = parseInt(baseInfo.sales_count || "0") || 0;

  // Product ID from base info or converter
  const productId = baseInfo.product_id
    || raw.product_id_converter_result?.main_product_id
    || 0;

  return {
    id: productId,
    title: baseInfo.subject || "Untitled Product",
    description: baseInfo.detail || "",
    image: imageList[0] || "",
    images: imageList,
    price: minPrice,
    originalPrice: maxPrice > minPrice ? maxPrice : minPrice,
    currency: "SAR", // Always SAR — we request target_currency=SAR from AliExpress
    discount: 0,
    rating: rating > 5 ? rating / 20 : rating,
    orders,
    shipping: shippingOptions.length > 0
      ? `From SAR ${shippingOptions[0].price.toFixed(2)}`
      : "Calculate at checkout",
    category: String(baseInfo.category_id || ""),
    url: `https://www.aliexpress.com/item/${productId}.html`,
    supplier: "aliexpress",
    variants,
    properties,
    shippingOptions,
    stock: baseInfo.product_status_type === "onSelling",
  };
}
