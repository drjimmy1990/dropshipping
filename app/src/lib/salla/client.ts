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
  SallaTokenResponse,
  SallaProductImage,
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
    alt: product.title_en || "Product image",
    default: index === 0,
    sort: index + 1,
  }));

  // Map variants to Salla options (if any)
  const options = mapVariantsToOptions(product.variants || []);

  // Calculate total stock from variants or use product-level stock
  const quantity = product.stock_quantity || 100;

  return {
    name: product.title_en || product.title_ar || "Untitled Product",
    price: product.retail_price,
    product_type: "product",
    status: product.is_active ? "sale" : "hidden",
    quantity,
    description: product.description_en || product.description_ar || "",
    cost_price: product.supplier_cost,
    require_shipping: true,
    sku: product.supplier_product_id || undefined,
    images: images.length > 0 ? images : undefined,
    options: options.length > 0 ? options : undefined,
    metadata_title: product.title_en || undefined,
    metadata_description: product.description_en?.slice(0, 160) || undefined,
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
