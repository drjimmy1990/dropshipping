/* ================================================================
   Salla Merchant API Client
   
   Handles product CRUD operations against the Salla Merchant API.
   Base URL: https://api.salla.dev/admin/v2
   Auth: OAuth2 Bearer token (per-merchant)
   
   Features:
   - Auto-refresh on 401 (token expired)
   - Maps DropLinker product schema → Salla format
   - Graceful error handling with structured errors
   
   FUTURE: Will support AI-generated images and descriptions.
           The image pipeline is abstracted to accept any URL source.
   ================================================================ */

import type {
  SallaCreateProductPayload,
  SallaProductResponse,
  SallaApiResponse,
  SallaListResponse,
  SallaTokenResponse,
  SallaProductImage,
  SallaCategoryItem,
  SallaUpdateProductPayload,
  SallaImageAttachResponse,
  SallaProductListItem,
} from "./types";
import type { Product } from "@/lib/supabase/types";

const SALLA_API_BASE = "https://api.salla.dev/admin/v2";
const SALLA_TOKEN_URL = "https://accounts.salla.sa/oauth2/token";

// ---------- Error Class ----------

export class SallaApiError extends Error {
  status: number;
  sallaMessage?: string;
  fields?: Record<string, string[]>;

  constructor(status: number, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = "SallaApiError";
    this.status = status;
    this.sallaMessage = message;
    this.fields = fields;
  }
}

// ---------- Token Refresh ----------

/**
 * Refreshes a Salla OAuth2 access token using the refresh token.
 * Uses the standard OAuth2 refresh_token grant.
 */
export async function refreshSallaToken(
  refreshToken: string
): Promise<SallaTokenResponse> {
  const clientId = process.env.SALLA_CLIENT_ID;
  const clientSecret = process.env.SALLA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SALLA_CLIENT_ID or SALLA_CLIENT_SECRET not configured");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(SALLA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Salla] Token refresh failed:", response.status, errorText);
    throw new SallaApiError(response.status, "Token refresh failed");
  }

  return response.json();
}

// ---------- Core HTTP Client ----------

interface SallaRequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  accessToken: string;
}

/**
 * Makes an authenticated request to the Salla Merchant API.
 * Does NOT auto-retry on 401 — that's handled at the calling layer.
 */
async function sallaRequest<T>(options: SallaRequestOptions): Promise<T> {
  const { method, path, body, accessToken } = options;
  const url = `${SALLA_API_BASE}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
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
      data?.data?.message ||
      data?.error?.message ||
      `Salla API error: ${response.status}`;
    const fields = data?.error?.fields;

    console.error(`[Salla] ${method} ${path} failed:`, response.status, errorMessage);
    if (fields) {
      console.error(`[Salla] Invalid fields:`, JSON.stringify(fields, null, 2));
    }
    if (data) {
      console.error(`[Salla] Full error response:`, JSON.stringify(data, null, 2));
    }
    throw new SallaApiError(response.status, errorMessage, fields);
  }

  return data as T;
}

// ---------- Auto-Refresh Wrapper ----------

interface StoreTokens {
  accessToken: string;
  refreshToken: string;
  storeId: string;
  onTokenRefresh?: (storeId: string, newAccessToken: string, newRefreshToken: string) => Promise<void>;
}

/**
 * Wraps a Salla API call with auto-refresh logic.
 * If the call returns 401, refreshes the token and retries once.
 */
async function withAutoRefresh<T>(
  tokens: StoreTokens,
  makeRequest: (accessToken: string) => Promise<T>
): Promise<T> {
  try {
    return await makeRequest(tokens.accessToken);
  } catch (error) {
    if (error instanceof SallaApiError && error.status === 401) {
      console.log(`[Salla] Token expired for store ${tokens.storeId}, refreshing...`);

      const newTokens = await refreshSallaToken(tokens.refreshToken);

      // Persist the new tokens if a callback is provided
      if (tokens.onTokenRefresh) {
        await tokens.onTokenRefresh(
          tokens.storeId,
          newTokens.access_token,
          newTokens.refresh_token
        );
      }

      // Retry with new token
      return await makeRequest(newTokens.access_token);
    }
    throw error;
  }
}

// ---------- Product Schema Mapper ----------

/**
 * Maps a DropLinker Product (from Supabase) to a Salla Create Product payload.
 *
 * Handles:
 * - Images: passes AliExpress URLs directly (Salla accepts external URLs)
 * - Variants → Options: maps our variant objects to Salla option format
 * - Price: uses retail_price as the Salla price, supplier_cost as cost_price
 * 
 * FUTURE: Image URLs can come from any source (AliExpress, AI-generated, uploaded).
 *         The mapper is source-agnostic.
 */
export function mapDroplinkerToSalla(product: Product): SallaCreateProductPayload {
  // Map images
  const images: SallaProductImage[] = (product.images || []).map((url, index) => ({
    original: url,
    thumbnail: url,
    alt: `product-image-${index + 1}`,
    default: index === 0,
    sort: index + 1,
  }));

  // Map variants to Salla options (if any), capped to 100 combinations (Salla limit)
  const rawOptions = mapVariantsToOptions(product.variants || []);
  const options = capVariantCombinations(rawOptions, 100);

  // Calculate total stock from variants or use product-level stock
  const quantity = product.stock_quantity || 100;

  // Product name — Salla max is 250 chars
  const name = (product.title_en || product.title_ar || "Untitled Product").slice(0, 250);

  return {
    name,
    price: product.retail_price,
    product_type: "product",
    status: product.is_active ? "sale" : "hidden",
    quantity,
    description: product.description_en || product.description_ar || "",
    cost_price: product.supplier_cost,
    require_shipping: true,
    weight: 0.5, // Default weight in kg — AliExpress doesn't always provide weight
    weight_type: "kg",
    sku: product.supplier_product_id
      ? `${product.supplier_product_id}-${Date.now().toString(36)}`
      : undefined,
    images: images.length > 0 ? images : undefined,
    options: options.length > 0 ? options : undefined,
    metadata_title: name.slice(0, 70) || undefined,
    metadata_description: (product.description_en || "").slice(0, 160) || undefined,
  };
}

/**
 * Maps our variant array to Salla's options format.
 * 
 * Our variants format (from AliExpress normalization):
 * [{ name: "Color: Blue", price: 5.99, stockQuantity: 100, imageUrl: "..." }, ...]
 * 
 * Salla expects:
 * [{ name: "Color", display_type: "text", values: [{ name: "Blue", price: 0, quantity: 100 }] }]
 */
function mapVariantsToOptions(variants: Record<string, unknown>[]): Array<{ name: string; display_type: "text"; values: { name: string; price: number; quantity: number }[] }> {
  if (!variants || variants.length === 0) return [];

  // Group variants by option name (e.g., "Color", "Size")
  const optionGroups = new Map<string, Array<{ name: string; price: number; quantity: number }>>();

  for (const variant of variants) {
    const rawName = String(variant.name || "");
    // Variant names from AliExpress are like "Color: Blue" or "Size: L"
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

    optionGroups.get(optionName)!.push({
      name: valueName,
      price: Number(variant.price) || 0,
      quantity: Number(variant.stockQuantity) || 10,
    });
  }

  return Array.from(optionGroups.entries()).map(([name, values]) => ({
    name,
    display_type: "text" as const,
    values,
  }));
}

/**
 * Caps variant options so the Cartesian product of all option values stays ≤ maxCombinations.
 * Salla enforces a 100-combination limit.
 * Strategy: trim the largest option group first, then repeat until under the limit.
 */
function capVariantCombinations(
  options: Array<{ name: string; display_type: "text"; values: { name: string; price: number; quantity: number }[] }>,
  maxCombinations: number = 100
): typeof options {
  if (options.length === 0) return options;

  // Calculate current total combinations (Cartesian product)
  let totalCombinations = options.reduce((acc, opt) => acc * opt.values.length, 1);

  if (totalCombinations <= maxCombinations) return options;

  console.warn(`[Salla] Variant combinations (${totalCombinations}) exceed limit (${maxCombinations}). Trimming...`);

  // Clone options so we don't mutate the original
  const capped = options.map(opt => ({
    ...opt,
    values: [...opt.values],
  }));

  // Iteratively trim the largest group until we're under the limit
  while (totalCombinations > maxCombinations) {
    // Find the option group with the most values
    let largestIdx = 0;
    for (let i = 1; i < capped.length; i++) {
      if (capped[i].values.length > capped[largestIdx].values.length) {
        largestIdx = i;
      }
    }

    // If the largest group has only 1 value, we can't trim further
    if (capped[largestIdx].values.length <= 1) break;

    // Remove the last value from the largest group
    capped[largestIdx].values.pop();

    // Recalculate total
    totalCombinations = capped.reduce((acc, opt) => acc * opt.values.length, 1);
  }

  console.log(`[Salla] Trimmed to ${totalCombinations} combinations: ${capped.map(o => `${o.name}(${o.values.length})`).join(" × ")}`);

  return capped;
}

// ---------- Public API Functions ----------

/**
 * Pushes a DropLinker product to a Salla store.
 * 
 * @returns The Salla product ID (store_product_id)
 */
export async function pushProductToSalla(
  tokens: StoreTokens,
  product: Product
): Promise<{ sallaProductId: number; sallaUrl?: string }> {
  const payload = mapDroplinkerToSalla(product);

  console.log(`[Salla] Pushing product "${payload.name}" to store ${tokens.storeId}`);
  console.log(`[Salla] Payload:`, JSON.stringify(payload, null, 2));

  const result = await withAutoRefresh(tokens, (accessToken) =>
    sallaRequest<SallaApiResponse<SallaProductResponse>>({
      method: "POST",
      path: "/products",
      body: payload,
      accessToken,
    })
  );

  console.log(`[Salla] ✅ Product created: ID=${result.data.id}, status=${result.data.status}`);

  return {
    sallaProductId: result.data.id,
    sallaUrl: result.data.url,
  };
}

/**
 * Deletes a product from a Salla store.
 * NOTE: Salla may soft-delete (trash) rather than hard-delete.
 */
export async function deleteSallaProduct(
  tokens: StoreTokens,
  sallaProductId: number
): Promise<void> {
  console.log(`[Salla] Deleting product ${sallaProductId} from store ${tokens.storeId}`);

  await withAutoRefresh(tokens, (accessToken) =>
    sallaRequest<SallaApiResponse<unknown>>({
      method: "DELETE",
      path: `/products/${sallaProductId}`,
      accessToken,
    })
  );

  console.log(`[Salla] ✅ Product ${sallaProductId} deleted`);
}

/**
 * Updates a product on Salla using the bulk editor endpoint.
 * More efficient than individual update calls.
 */
export async function updateSallaProduct(
  tokens: StoreTokens,
  sallaProductId: number,
  updates: {
    name?: string;
    price?: number;
    description?: string;
  }
): Promise<void> {
  const bulkPayload = {
    products: [
      {
        id: sallaProductId,
        ...(updates.name && { name: updates.name }),
        ...(updates.price && { prices: { price: updates.price } }),
        ...(updates.description && { description: updates.description }),
      },
    ],
  };

  console.log(`[Salla] Updating product ${sallaProductId} on store ${tokens.storeId}`);

  await withAutoRefresh(tokens, (accessToken) =>
    sallaRequest<SallaApiResponse<unknown>>({
      method: "POST",
      path: "/products/bulk",
      body: bulkPayload,
      accessToken,
    })
  );

  console.log(`[Salla] ✅ Product ${sallaProductId} updated`);
}

// ---------- Categories ----------

/**
 * Fetches all categories from a Salla store.
 * API: GET /categories?page=1&per_page=100
 * Response fields: id, name, image, parent_id, sort_order, status, sub_categories
 */
export async function getSallaCategories(
  tokens: StoreTokens
): Promise<SallaCategoryItem[]> {
  console.log(`[Salla] Fetching categories for store ${tokens.storeId}`);

  const allCategories: SallaCategoryItem[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await withAutoRefresh(tokens, (accessToken) =>
      sallaRequest<SallaListResponse<SallaCategoryItem>>({
        method: "GET",
        path: `/categories?page=${page}&per_page=100`,
        accessToken,
      })
    );

    allCategories.push(...result.data);

    if (result.pagination.currentPage >= result.pagination.totalPages) {
      hasMore = false;
    } else {
      page++;
    }
  }

  console.log(`[Salla] ✅ Fetched ${allCategories.length} categories`);
  return allCategories;
}

// ---------- Full Product Update ----------

/**
 * Updates a product on Salla using PUT /products/:id.
 * Accepts only changed fields — Salla merges them.
 * 
 * Fields from Merchant APIs V2.7.6:
 *   name, price, quantity, description, categories[], sale_price, cost_price,
 *   require_shipping, weight, weight_type, sku, metadata_title, metadata_description, tags[]
 */
export async function fullUpdateSallaProduct(
  tokens: StoreTokens,
  sallaProductId: number,
  payload: SallaUpdateProductPayload
): Promise<void> {
  // Enforce field limits
  if (payload.metadata_title) {
    payload.metadata_title = payload.metadata_title.slice(0, 70);
  }
  if (payload.metadata_description) {
    payload.metadata_description = payload.metadata_description.slice(0, 160);
  }
  if (payload.name) {
    payload.name = payload.name.slice(0, 250);
  }

  console.log(`[Salla] PUT update product ${sallaProductId} on store ${tokens.storeId}`);

  await withAutoRefresh(tokens, (accessToken) =>
    sallaRequest<SallaApiResponse<SallaProductResponse>>({
      method: "PUT",
      path: `/products/${sallaProductId}`,
      body: payload,
      accessToken,
    })
  );

  console.log(`[Salla] ✅ Product ${sallaProductId} updated via PUT`);
}

// ---------- Image Management ----------

/**
 * Attaches an image to a Salla product via URL.
 * API: POST /products/:product/images
 * Body: FormData with fields: original (URL), alt, default, sort
 * 
 * NOTE: Salla accepts ONE image per request.
 * NOTE: Uses formdata, not JSON — the API requires multipart/form-data.
 */
export async function attachSallaImage(
  tokens: StoreTokens,
  sallaProductId: number,
  imageUrl: string,
  options?: { alt?: string; isDefault?: boolean; sort?: number }
): Promise<SallaImageAttachResponse> {
  console.log(`[Salla] Attaching image to product ${sallaProductId}`);

  const result = await withAutoRefresh(tokens, async (accessToken) => {
    const formData = new FormData();
    formData.append("original", imageUrl);
    formData.append("alt", options?.alt || "product-image");
    formData.append("default", options?.isDefault ? "1" : "0");
    formData.append("sort", String(options?.sort || 1));

    const url = `${SALLA_API_BASE}/products/${sallaProductId}/images`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        // No Content-Type — FormData sets it with boundary
      },
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.data?.message || data?.error?.message || `Salla API error: ${response.status}`;
      console.error(`[Salla] POST /products/${sallaProductId}/images failed:`, response.status, errorMessage);
      if (data) console.error(`[Salla] Full error response:`, JSON.stringify(data, null, 2));
      throw new SallaApiError(response.status, errorMessage, data?.error?.fields);
    }

    return data as SallaApiResponse<SallaImageAttachResponse>;
  });

  console.log(`[Salla] ✅ Image attached: ID=${result.data.id}`);
  return result.data;
}

/**
 * Deletes an image from a Salla product.
 * API: DELETE /products/images/:image
 */
export async function deleteSallaImage(
  tokens: StoreTokens,
  imageId: number
): Promise<void> {
  console.log(`[Salla] Deleting image ${imageId}`);

  await withAutoRefresh(tokens, (accessToken) =>
    sallaRequest<SallaApiResponse<{ message: string }>>({
      method: "DELETE",
      path: `/products/images/${imageId}`,
      accessToken,
    })
  );

  console.log(`[Salla] ✅ Image ${imageId} deleted`);
}

// ---------- Product Listing (for Sync) ----------

/**
 * Lists products from a Salla store (paginated).
 * API: GET /products?page=X&per_page=20
 * Response: SallaProductListItem[]
 */
export async function getSallaProducts(
  tokens: StoreTokens,
  page: number = 1,
  perPage: number = 20
): Promise<{ products: SallaProductListItem[]; pagination: { currentPage: number; totalPages: number; total: number } }> {
  console.log(`[Salla] Fetching products page ${page} for store ${tokens.storeId}`);

  const result = await withAutoRefresh(tokens, (accessToken) =>
    sallaRequest<SallaListResponse<SallaProductListItem>>({
      method: "GET",
      path: `/products?page=${page}&per_page=${perPage}`,
      accessToken,
    })
  );

  console.log(`[Salla] ✅ Fetched ${result.data.length} products (page ${page}/${result.pagination.totalPages})`);

  return {
    products: result.data,
    pagination: {
      currentPage: result.pagination.currentPage,
      totalPages: result.pagination.totalPages,
      total: result.pagination.total,
    },
  };
}
