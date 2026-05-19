/* ================================================================
   CJDropshipping API v2.0 — Client
   Simple token-based auth (no HMAC signing like AliExpress).
   Reference: ./API_REFERENCE.md
   ================================================================ */

import { createAdminClient } from "@/lib/supabase/server";
import type {
  CJResponse,
  CJTokenData,
  CJCategoryL1,
  CJProductListV2Data,
  CJProductDetail,
  CJVariant,
  CJFreightOption,
  CJFreightRequest,
  CJSearchParams,
  CJOrderCreateRequest,
  CJOrderCreateResponse,
  CJOrderDetail,
} from "./types";
import type {
  NormalizedProduct,
  NormalizedProductDetail,
  NormalizedVariant,
  NormalizedShippingOption,
} from "@/lib/aliexpress/types";

// ---------- Config ----------

const CJ_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

// ---------- Token Management ----------

/**
 * Get a merchant's CJ access token from supplier_accounts.
 * CJ tokens are per-merchant (unlike AliExpress platform-level key).
 */
export async function getCJToken(merchantId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  accountId: string;
} | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("supplier_accounts")
    .select("id, api_key, api_secret, access_token, refresh_token")
    .eq("merchant_id", merchantId)
    .eq("supplier", "cj")
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;

  // api_key stores the CJ access token, api_secret stores refresh token
  const accessToken = data.access_token || data.api_key;
  const refreshToken = data.refresh_token || data.api_secret;

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: refreshToken || "",
    accountId: data.id,
  };
}

/**
 * Refresh a CJ access token using the refresh token.
 */
async function refreshCJToken(refreshToken: string): Promise<CJTokenData | null> {
  try {
    const url = `${CJ_BASE_URL}/authentication/refreshAccessToken?refreshToken=${encodeURIComponent(refreshToken)}`;
    const response = await fetch(url, { method: "GET" });
    const data: CJResponse<CJTokenData> = await response.json();

    if (data.code === 200 && data.data?.accessToken) {
      return data.data;
    }

    console.error("[CJ] Token refresh failed:", data.message);
    return null;
  } catch (err) {
    console.error("[CJ] Token refresh error:", err);
    return null;
  }
}

/**
 * Save refreshed CJ tokens to supplier_accounts.
 */
async function saveCJTokens(accountId: string, tokens: CJTokenData): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("supplier_accounts")
    .update({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      api_key: tokens.accessToken,
      api_secret: tokens.refreshToken,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId);
}

// ---------- Core API Request ----------

/**
 * Makes a request to the CJ API with auto-retry on token expiry.
 */
async function cjRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  token: string,
  body?: Record<string, unknown>,
  _isRetry = false,
  refreshToken?: string,
  accountId?: string,
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${CJ_BASE_URL}${endpoint}`;

  console.log(`[CJ] ${method} → ${url}`);

  const headers: Record<string, string> = {
    "CJ-Access-Token": token,
  };

  const fetchOpts: RequestInit = { method, headers };

  if (body && method !== "GET") {
    headers["Content-Type"] = "application/json";
    fetchOpts.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOpts);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[CJ] HTTP ${response.status}:`, errorText.substring(0, 500));
    throw new Error(`CJ API request failed: ${response.status}`);
  }

  const data: CJResponse<T> = await response.json();

  console.log(`[CJ] Response: code=${data.code}, msg=${data.message}, requestId=${data.requestId}`);

  // Token expired — try refresh
  if (data.code === 1600200 && !_isRetry && refreshToken && accountId) {
    console.warn("[CJ] Token expired — attempting refresh...");
    const newTokens = await refreshCJToken(refreshToken);
    if (newTokens) {
      await saveCJTokens(accountId, newTokens);
      return cjRequest<T>(endpoint, method, newTokens.accessToken, body, true);
    }
  }

  if (data.code !== 200 && data.result === false) {
    console.error(`[CJ] API error: code=${data.code}, msg=${data.message}`);
    throw new Error(`CJ API error: ${data.message || data.code}`);
  }

  return data.data;
}

// ---------- Categories ----------

/**
 * Get CJ product category tree.
 */
export async function getCJCategories(
  token: string,
): Promise<CJCategoryL1[]> {
  return cjRequest<CJCategoryL1[]>("/product/getCategory", "GET", token);
}

// ---------- Product Search ----------

/**
 * Search CJ products using the V2 Elasticsearch endpoint.
 * Returns normalized products matching the AliExpress format.
 */
export async function searchCJProducts(
  params: CJSearchParams,
  token: string,
): Promise<{
  products: NormalizedProduct[];
  totalPages: number;
  totalCount: number;
  page: number;
}> {
  // Build query string
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyWord", params.keyword);
  query.set("page", String(params.page || 1));
  query.set("size", String(params.size || 20));
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.countryCode) query.set("countryCode", params.countryCode);
  if (params.startSellPrice) query.set("startSellPrice", String(params.startSellPrice));
  if (params.endSellPrice) query.set("endSellPrice", String(params.endSellPrice));
  if (params.productFlag !== undefined) query.set("productFlag", String(params.productFlag));
  if (params.sort) query.set("sort", params.sort);
  if (params.orderBy !== undefined) query.set("orderBy", String(params.orderBy));
  // Always request category info
  query.append("features", "enable_category");

  const data = await cjRequest<CJProductListV2Data>(
    `/product/listV2?${query.toString()}`,
    "GET",
    token,
  );

  // Extract products from the nested content structure
  const rawProducts = data?.content?.[0]?.productList || [];
  const products: NormalizedProduct[] = rawProducts.map(normalizeCJProduct);

  return {
    products,
    totalPages: data?.totalPages || 0,
    totalCount: data?.totalRecords || 0,
    page: data?.pageNumber || params.page || 1,
  };
}

// ---------- Product Detail ----------

/**
 * Get full CJ product detail with variants.
 */
export async function getCJProductDetail(
  pid: string,
  token: string,
  countryCode?: string,
): Promise<NormalizedProductDetail> {
  const query = new URLSearchParams({ pid });
  if (countryCode) query.set("countryCode", countryCode);

  const product = await cjRequest<CJProductDetail>(
    `/product/query?${query.toString()}`,
    "GET",
    token,
  );

  if (!product) {
    throw new Error(`CJ product ${pid} not found`);
  }

  // Fetch shipping options (if variants exist)
  let shippingOptions: NormalizedShippingOption[] = [];
  if (product.variants?.length > 0) {
    try {
      shippingOptions = await getCJFreight(
        {
          startCountryCode: "CN",
          endCountryCode: countryCode || "SA",
          products: [{ vid: product.variants[0].vid, quantity: 1 }],
        },
        token,
      );
    } catch (err) {
      console.warn(`[CJ] Failed to fetch freight for ${pid}:`, err);
    }
  }

  return normalizeCJProductDetail(product, shippingOptions);
}

// ---------- Freight / Shipping ----------

/**
 * Calculate shipping options for CJ products.
 */
export async function getCJFreight(
  request: CJFreightRequest,
  token: string,
): Promise<NormalizedShippingOption[]> {
  const data = await cjRequest<CJFreightOption[]>(
    "/logistic/freightCalculate",
    "POST",
    token,
    request as unknown as Record<string, unknown>,
  );

  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data.map((opt) => ({
    name: opt.logisticName || "Standard Shipping",
    price: opt.logisticPrice || 0,
    currency: "USD",
    estimatedDays: opt.logisticAging ? `${opt.logisticAging} days` : "N/A",
    trackingAvailable: true,
    serviceCode: opt.logisticKey,
  }));
}

// ---------- Orders ----------

/**
 * Create a CJ fulfillment order.
 */
export async function createCJOrder(
  params: CJOrderCreateRequest,
  token: string,
): Promise<CJOrderCreateResponse> {
  return cjRequest<CJOrderCreateResponse>(
    "/shopping/order/createOrderV2",
    "POST",
    token,
    params as unknown as Record<string, unknown>,
  );
}

/**
 * Get CJ order detail.
 */
export async function getCJOrderDetail(
  orderId: string,
  token: string,
): Promise<CJOrderDetail> {
  return cjRequest<CJOrderDetail>(
    `/shopping/order/getOrderDetail?orderId=${encodeURIComponent(orderId)}`,
    "GET",
    token,
  );
}

// ---------- Normalization ----------

/**
 * Normalize CJ V2 search product to our universal NormalizedProduct format.
 * CJ prices are always in USD.
 */
function normalizeCJProduct(raw: import("./types").CJProductV2): NormalizedProduct {
  const sellPrice = parseFloat(raw.sellPrice || "0");
  const discountPrice = parseFloat(raw.discountPrice || raw.nowPrice || raw.sellPrice || "0");
  const discount = sellPrice > 0 && discountPrice < sellPrice
    ? Math.round((1 - discountPrice / sellPrice) * 100)
    : 0;

  return {
    id: raw.id as unknown as number, // CJ uses UUID strings; cast for compat
    title: raw.nameEn || "Untitled Product",
    image: raw.bigImage || "",
    images: [raw.bigImage].filter(Boolean),
    price: discountPrice || sellPrice,
    originalPrice: sellPrice,
    currency: "USD",
    discount,
    rating: 0, // CJ doesn't provide ratings in search
    orders: raw.listedNum || 0,
    shipping: raw.addMarkStatus === 1
      ? "Free Shipping"
      : raw.deliveryCycle
        ? `${raw.deliveryCycle} days`
        : "Varies",
    category: raw.threeCategoryName || raw.oneCategoryName || "",
    url: `https://cjdropshipping.com/product/p-${raw.id}.html`,
    supplier: "cj",
  };
}

/**
 * Normalize CJ product detail to NormalizedProductDetail.
 */
function normalizeCJProductDetail(
  raw: CJProductDetail,
  shippingOptions: NormalizedShippingOption[],
): NormalizedProductDetail {
  const images = raw.productImageSet || [raw.bigImage].filter(Boolean);

  // Normalize variants
  const variants: NormalizedVariant[] = (raw.variants || []).map((v: CJVariant) => {
    // Parse variant options from variantKey (e.g. "Black-XXL")
    const keyParts = (raw.productKeyEn || "").split("-");
    const valueParts = (v.variantKey || "").split("-");
    const properties = keyParts.map((key, i) => ({
      name: key.trim(),
      value: valueParts[i]?.trim() || "",
      image: v.variantImage,
    }));

    // Sum inventory across all warehouses
    const totalStock = v.inventories?.reduce(
      (sum, inv) => sum + (inv.totalInventory || 0), 0
    ) || 0;

    return {
      skuId: v.vid,
      price: v.variantSellPrice || raw.sellPrice || 0,
      stock: totalStock > 0,
      stockQuantity: totalStock,
      properties,
    };
  });

  // Price range from variants
  const prices = variants.map((v) => v.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : raw.sellPrice || 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : raw.sellPrice || 0;

  return {
    id: raw.pid as unknown as number,
    title: raw.productNameEn || "Untitled Product",
    description: raw.description || "",
    image: images[0] || "",
    images,
    price: minPrice,
    originalPrice: maxPrice > minPrice ? maxPrice : minPrice,
    currency: "USD",
    discount: 0,
    rating: 0,
    orders: raw.listedNum || 0,
    shipping: shippingOptions.length > 0
      ? `From $${shippingOptions[0].price.toFixed(2)}`
      : raw.addMarkStatus === 1
        ? "Free Shipping"
        : "Calculate at checkout",
    category: raw.categoryName || String(raw.categoryId || ""),
    url: `https://cjdropshipping.com/product/p-${raw.pid}.html`,
    supplier: "cj",
    variants,
    properties: [],
    shippingOptions,
    stock: variants.some((v) => v.stock),
  };
}
