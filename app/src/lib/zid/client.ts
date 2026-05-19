/* ================================================================
   Zid Merchant API Client
   
   Handles product CRUD operations against the Zid Merchant API.
   Base URL: https://api.zid.sa/v1
   Auth: Dual-header — Authorization (partner JWT) + Access-Token (merchant OAuth)
   
   Features:
   - Auto-refresh on 401 (token expired)
   - Maps DropLinker product schema → Zid format (bilingual AR/EN)
   - Graceful error handling with structured errors
   
   IMPORTANT: Zid requires 4 headers on every request:
     - Authorization: Bearer {partner_token}
     - Access-Token: {merchant_access_token}
     - Store-Id: {store_id}
     - Role: Manager
   ================================================================ */

import type {
  ZidCreateProductPayload,
  ZidProductResponse,
  ZidTokenResponse,
  ZidCategoryItem,
  ZidLocalizedString,
} from "./types";
import type { Product } from "@/lib/supabase/types";

const ZID_API_BASE = "https://api.zid.sa/v1";
const ZID_OAUTH_URL = process.env.ZID_OAUTH_URL || "https://oauth.zid.sa";

// ---------- Error Class ----------

export class ZidApiError extends Error {
  status: number;
  zidMessage?: string;
  fields?: Record<string, string[]>;

  constructor(status: number, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = "ZidApiError";
    this.status = status;
    this.zidMessage = message;
    this.fields = fields;
  }
}

// ---------- Token Refresh ----------

/**
 * Refreshes a Zid OAuth2 access token using the refresh token.
 * Uses the standard OAuth2 refresh_token grant.
 */
export async function refreshZidToken(
  refreshToken: string
): Promise<ZidTokenResponse> {
  const clientId = process.env.ZID_CLIENT_ID;
  const clientSecret = process.env.ZID_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("ZID_CLIENT_ID or ZID_CLIENT_SECRET not configured");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(`${ZID_OAUTH_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Zid] Token refresh failed:", response.status, errorText);
    throw new ZidApiError(response.status, "Token refresh failed");
  }

  return response.json();
}

// ---------- Core HTTP Client ----------

interface ZidRequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  accessToken: string;
  partnerToken: string;
  storeId: string;
}

/**
 * Makes an authenticated request to the Zid Merchant API.
 * Zid requires 4 headers: Authorization, Access-Token, Store-Id, Role.
 */
async function zidRequest<T>(options: ZidRequestOptions): Promise<T> {
  const { method, path, body, accessToken, partnerToken, storeId } = options;
  const url = `${ZID_API_BASE}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${partnerToken}`,
    "X-Manager-Token": accessToken,
    "Access-Token": accessToken,
    "Store-Id": storeId,
    Role: "Manager",
    Accept: "application/json",
    "Accept-Language": "en",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Parse response
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.message?.description ||
      data?.message?.name ||
      data?.non_field_errors?.[0] ||
      `Zid API error: ${response.status}`;
    const fields = data?.error?.fields;

    console.error(`[Zid] ${method} ${path} failed:`, response.status, errorMessage);
    if (data) {
      console.error(`[Zid] Full error response:`, JSON.stringify(data, null, 2));
    }
    throw new ZidApiError(response.status, errorMessage, fields);
  }

  return data as T;
}

// ---------- Auto-Refresh Wrapper ----------

export interface ZidStoreTokens {
  accessToken: string;
  refreshToken: string;
  partnerToken: string;
  storeId: string;
  onTokenRefresh?: (
    storeId: string,
    newAccessToken: string,
    newRefreshToken: string,
    newPartnerToken?: string
  ) => Promise<void>;
}

/**
 * Wraps a Zid API call with auto-refresh logic.
 * If the call returns 401, refreshes the token and retries once.
 */
async function withAutoRefresh<T>(
  tokens: ZidStoreTokens,
  makeRequest: (accessToken: string, partnerToken: string) => Promise<T>
): Promise<T> {
  try {
    return await makeRequest(tokens.accessToken, tokens.partnerToken);
  } catch (error) {
    if (error instanceof ZidApiError && error.status === 401) {
      console.log(`[Zid] Token expired for store ${tokens.storeId}, refreshing...`);

      const newTokens = await refreshZidToken(tokens.refreshToken);

      // Persist the new tokens if a callback is provided
      if (tokens.onTokenRefresh) {
        await tokens.onTokenRefresh(
          tokens.storeId,
          newTokens.access_token,
          newTokens.refresh_token,
          newTokens.authorization
        );
      }

      // Retry with new token
      return await makeRequest(
        newTokens.access_token,
        newTokens.authorization || tokens.partnerToken
      );
    }
    throw error;
  }
}

// ---------- Product Schema Mapper ----------

/**
 * Maps a DropLinker Product (from Supabase) to a Zid Create Product payload.
 *
 * Key differences from Salla:
 * - Zid requires bilingual name: { ar, en }
 * - SKU is required and must be unique
 * - No options in create — variants are added via a separate endpoint
 */
export function mapDroplinkerToZid(product: Product): ZidCreateProductPayload {
  // Bilingual name (required by Zid)
  const name: ZidLocalizedString = {
    en: (product.title_en || product.title_ar || "Untitled Product").slice(0, 250),
    ar: (product.title_ar || product.title_en || "منتج بدون عنوان").slice(0, 250),
  };

  // Description (bilingual if available) — Zid max 250 chars
  const short_description: ZidLocalizedString | undefined =
    product.description_en || product.description_ar
      ? {
          en: (product.description_en || product.description_ar || "").replace(/<[^>]*>/g, "").slice(0, 250),
          ar: (product.description_ar || product.description_en || "").replace(/<[^>]*>/g, "").slice(0, 250),
        }
      : undefined;

  // SKU — Zid requires unique SKU
  const sku =
    product.supplier_product_id ||
    `DL-${Date.now()}`;

  // Quantity
  const quantity = product.stock_quantity || 100;

  return {
    name,
    price: product.retail_price,
    sku,
    quantity,
    is_infinite: false,
    is_draft: false,
    requires_shipping: true,
    is_taxable: true,
    short_description,
    weight: "0.5", // Zid expects weight as string
  };
}

// ---------- Image Upload ----------

/**
 * Uploads images to a Zid product via their image upload endpoint.
 * Zid accepts image URLs or multipart file uploads.
 */
async function uploadProductImages(
  tokens: ZidStoreTokens,
  zidProductId: string,
  imageUrls: string[]
): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) return;

  console.log(`[Zid] Uploading ${imageUrls.length} images to product ${zidProductId}`);

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      await withAutoRefresh(tokens, (accessToken, partnerToken) =>
        zidRequest({
          method: "POST",
          path: `/products/${zidProductId}/images`,
          body: {
            url: imageUrls[i],
            sort_order: i + 1,
            is_default: i === 0,
          },
          accessToken,
          partnerToken,
          storeId: tokens.storeId,
        })
      );
      console.log(`[Zid] ✅ Image ${i + 1}/${imageUrls.length} uploaded`);
    } catch (error) {
      console.warn(`[Zid] ⚠️ Image ${i + 1} upload failed (non-blocking):`, error);
      // Non-blocking: continue with remaining images
    }
  }
}

// ---------- Variant Creation ----------

/**
 * Creates variant options for a Zid product.
 * Zid uses a separate endpoint for variants after product creation.
 *
 * Our variants: [{ name: "Color: Blue", price: 5.99, stockQuantity: 100 }, ...]
 * Zid expects: { options: [{ name: { ar, en }, values: [{ ar, en }] }] }
 */
async function createProductVariants(
  tokens: ZidStoreTokens,
  zidProductId: string,
  variants: Record<string, unknown>[]
): Promise<void> {
  if (!variants || variants.length === 0) return;

  // Group variants by option name (e.g., "Color", "Size")
  const optionGroups = new Map<string, string[]>();

  for (const variant of variants) {
    const rawName = String(variant.name || "");
    const colonIndex = rawName.indexOf(":");

    let optionName: string;
    let valueName: string;

    if (colonIndex > 0) {
      optionName = rawName.slice(0, colonIndex).trim();
      valueName = rawName.slice(colonIndex + 1).trim();
    } else {
      optionName = "Variant";
      valueName = rawName || "Default";
    }

    if (!optionGroups.has(optionName)) {
      optionGroups.set(optionName, []);
    }

    const values = optionGroups.get(optionName)!;
    if (!values.includes(valueName)) {
      values.push(valueName);
    }
  }

  // Cap at 100 combinations (same as Salla limit)
  let totalCombinations = 1;
  const groupEntries = Array.from(optionGroups.entries());
  for (const [, values] of groupEntries) {
    totalCombinations *= values.length;
  }

  if (totalCombinations > 100) {
    console.warn(
      `[Zid] Variant combinations (${totalCombinations}) exceed 100. Trimming...`
    );
    // Trim the largest group iteratively
    while (totalCombinations > 100) {
      let largestKey = groupEntries[0][0];
      let largestSize = groupEntries[0][1].length;
      for (const [key, values] of groupEntries) {
        if (values.length > largestSize) {
          largestKey = key;
          largestSize = values.length;
        }
      }
      const group = optionGroups.get(largestKey)!;
      if (group.length <= 1) break;
      group.pop();
      totalCombinations = Array.from(optionGroups.values()).reduce(
        (acc, v) => acc * v.length,
        1
      );
    }
    console.log(`[Zid] Trimmed to ${totalCombinations} combinations`);
  }

  // Build Zid variant payload (bilingual)
  const options = Array.from(optionGroups.entries()).map(([optionName, values]) => ({
    name: { ar: optionName, en: optionName } as ZidLocalizedString,
    values: values.map((v) => ({ ar: v, en: v } as ZidLocalizedString)),
  }));

  console.log(`[Zid] Creating ${options.length} variant options for product ${zidProductId}`);

  try {
    await withAutoRefresh(tokens, (accessToken, partnerToken) =>
      zidRequest({
        method: "POST",
        path: `/products/${zidProductId}/variants`,
        body: { options },
        accessToken,
        partnerToken,
        storeId: tokens.storeId,
      })
    );
    console.log(`[Zid] ✅ Variants created successfully`);
  } catch (error) {
    console.warn(`[Zid] ⚠️ Variant creation failed (non-blocking):`, error);
  }
}

// ---------- Public API Functions ----------

/**
 * Pushes a DropLinker product to a Zid store.
 *
 * Flow:
 * 1. Create the base product (name, price, sku)
 * 2. Upload images (separate endpoint)
 * 3. Create variants (separate endpoint)
 *
 * @returns The Zid product ID (store_product_id)
 */
export async function pushProductToZid(
  tokens: ZidStoreTokens,
  product: Product
): Promise<{ zidProductId: string; zidUrl?: string }> {
  const payload = mapDroplinkerToZid(product);

  console.log(`[Zid] Pushing product "${payload.name.en}" to store ${tokens.storeId}`);
  console.log(`[Zid] Payload:`, JSON.stringify(payload, null, 2));

  // Step 1: Create the base product
  const result = await withAutoRefresh(tokens, (accessToken, partnerToken) =>
    zidRequest<ZidProductResponse>({
      method: "POST",
      path: "/products/",
      body: payload,
      accessToken,
      partnerToken,
      storeId: tokens.storeId,
    })
  );

  const zidProductId = String(result.id);
  console.log(`[Zid] ✅ Product created: ID=${zidProductId}`);

  // Step 2: Upload images (non-blocking)
  if (product.images && product.images.length > 0) {
    await uploadProductImages(tokens, zidProductId, product.images);
  }

  // Step 3: Create variants (non-blocking)
  if (product.variants && product.variants.length > 0) {
    await createProductVariants(
      tokens,
      zidProductId,
      product.variants as Record<string, unknown>[]
    );
  }

  return {
    zidProductId,
    zidUrl: result.html_url || undefined,
  };
}

/**
 * Deletes a product from a Zid store.
 */
export async function deleteZidProduct(
  tokens: ZidStoreTokens,
  zidProductId: string
): Promise<void> {
  console.log(`[Zid] Deleting product ${zidProductId} from store ${tokens.storeId}`);

  await withAutoRefresh(tokens, (accessToken, partnerToken) =>
    zidRequest({
      method: "DELETE",
      path: `/products/${zidProductId}`,
      accessToken,
      partnerToken,
      storeId: tokens.storeId,
    })
  );

  console.log(`[Zid] ✅ Product ${zidProductId} deleted`);
}

/**
 * Updates a product on Zid.
 */
export async function updateZidProduct(
  tokens: ZidStoreTokens,
  zidProductId: string,
  updates: {
    name?: ZidLocalizedString;
    price?: number;
    short_description?: ZidLocalizedString;
  }
): Promise<void> {
  console.log(`[Zid] Updating product ${zidProductId} on store ${tokens.storeId}`);

  await withAutoRefresh(tokens, (accessToken, partnerToken) =>
    zidRequest({
      method: "PATCH",
      path: `/products/${zidProductId}`,
      body: updates,
      accessToken,
      partnerToken,
      storeId: tokens.storeId,
    })
  );

  console.log(`[Zid] ✅ Product ${zidProductId} updated`);
}

/**
 * Fetches categories from a Zid store.
 */
export async function getZidCategories(
  tokens: ZidStoreTokens
): Promise<ZidCategoryItem[]> {
  console.log(`[Zid] Fetching categories for store ${tokens.storeId}`);

  const result = await withAutoRefresh(tokens, (accessToken, partnerToken) =>
    zidRequest<{ results?: ZidCategoryItem[] }>({
      method: "GET",
      path: "/products/categories",
      accessToken,
      partnerToken,
      storeId: tokens.storeId,
    })
  );

  const categories = result.results || [];
  console.log(`[Zid] ✅ Fetched ${categories.length} categories`);
  return categories;
}

/**
 * Fetches store info from Zid.
 */
export async function getZidStoreInfo(
  tokens: ZidStoreTokens
): Promise<Record<string, unknown>> {
  console.log(`[Zid] Fetching store info for store ${tokens.storeId}`);

  const result = await withAutoRefresh(tokens, (accessToken, partnerToken) =>
    zidRequest<Record<string, unknown>>({
      method: "GET",
      path: "/managers/account/profile",
      accessToken,
      partnerToken,
      storeId: tokens.storeId,
    })
  );

  return result;
}
