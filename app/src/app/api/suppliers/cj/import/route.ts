import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCJPlatformToken, getCJProductDetail } from "@/lib/cj/client";
import { pushProductToSalla, SallaApiError } from "@/lib/salla/client";
import { pushProductToZid, ZidApiError } from "@/lib/zid/client";
import type { Product } from "@/lib/supabase/types";

/**
 * POST /api/suppliers/cj/import
 *
 * Imports a CJ product into the merchant's catalog.
 * Mirrors the AliExpress import route pattern exactly.
 *
 * Request body:
 *  - pid: CJ product ID (UUID string)
 *  - retailPrice: (optional) custom retail price
 *  - marginType: "percentage" | "fixed" (default: percentage)
 *  - marginValue: margin amount (default: 30)
 *  - pushToStore: boolean (default: false)
 *  - targetStoreId: specific store UUID
 *  - targetPlatform: "salla" | "zid"
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      pid,
      productId, // Alias for pid (compat)
      retailPrice,
      marginType = "percentage",
      marginValue = 30,
      pushToStore = false,
      shippingCost = 0,
      shippingMethod = null,
      estimatedDelivery = null,
      targetStoreId = null,
      targetPlatform = null,
    } = body;

    const cjProductId = pid || productId;

    if (!cjProductId) {
      return NextResponse.json(
        { error: "pid is required" },
        { status: 400 }
      );
    }

    // 2. Get platform-level CJ token (shared for all merchants)
    const cjToken = await getCJPlatformToken();
    if (!cjToken) {
      return NextResponse.json(
        { error: "CJ API not configured. Platform admin needs to add the CJ Access Token." },
        { status: 503 }
      );
    }

    const adminClient = createAdminClient();

    // 3. Check if already imported
    const { data: existingProduct } = await adminClient
      .from("products")
      .select("id")
      .eq("merchant_id", user.id)
      .eq("supplier_product_id", String(cjProductId))
      .eq("supplier", "cj")
      .maybeSingle();

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product already imported", productId: existingProduct.id },
        { status: 409 }
      );
    }

    // 4. Fetch CJ product detail
    let product;
    try {
      product = await getCJProductDetail(cjProductId, cjToken, "SA");
    } catch (apiErr) {
      console.error("[CJ Import] ❌ Supplier API error:", apiErr);
      const msg = apiErr instanceof Error ? apiErr.message : "Supplier API unavailable";
      return NextResponse.json(
        { error: `Supplier API error: ${msg}` },
        { status: 502 }
      );
    }

    // 5. Calculate retail price (CJ prices are in USD)
    const supplierCost = product.price;
    let finalRetailPrice = retailPrice;

    if (!finalRetailPrice) {
      if (marginType === "percentage") {
        finalRetailPrice = supplierCost * (1 + marginValue / 100);
      } else {
        finalRetailPrice = supplierCost + marginValue;
      }
    }

    // 6. Get merchant's connected store
    let storeQuery = adminClient
      .from("stores")
      .select("id, platform, access_token, refresh_token, partner_token, platform_store_id, salla_merchant_id")
      .eq("merchant_id", user.id)
      .eq("is_active", true);

    if (targetStoreId) {
      storeQuery = storeQuery.eq("id", targetStoreId);
    } else if (targetPlatform) {
      storeQuery = storeQuery.eq("platform", targetPlatform);
    }

    const { data: store } = await storeQuery.maybeSingle();

    // 7. Insert product into Supabase
    const productData = {
      merchant_id: user.id,
      supplier_account_id: null,
      store_id: store?.id || null,
      supplier: "cj" as const,
      supplier_product_id: String(cjProductId),
      supplier_url: product.url,
      title_en: product.title,
      title_ar: null,
      description_en: product.description || null,
      description_ar: null,
      supplier_cost: supplierCost,
      supplier_currency: "SAR", // Normalized to SAR
      retail_price: Math.round(finalRetailPrice * 100) / 100,
      margin_type: marginType,
      margin_value: marginValue,
      stock_quantity: product.variants.reduce(
        (sum: number, v: { stockQuantity?: number }) => sum + (v.stockQuantity || 0),
        0
      ) || 100,
      in_stock: product.stock,
      is_active: true,
      images: product.images,
      variants: product.variants,
      category: product.category || null,
      tags: [],
      shipping_cost: shippingCost || 0,
      shipping_method: shippingMethod || null,
      estimated_delivery: estimatedDelivery || null,
    };

    const { data: insertedProduct, error: insertError } = await adminClient
      .from("products")
      .insert(productData)
      .select("*")
      .single();

    if (insertError) {
      console.error("[CJ Import] ❌ Product INSERT failed:", insertError);
      return NextResponse.json(
        { error: "Failed to save product: " + insertError.message },
        { status: 500 }
      );
    }

    console.log(`[CJ Import] ✅ Product imported: ${product.title} (ID: ${insertedProduct.id})`);

    // 8. Push to store if enabled
    let pushedToStore = false;
    let storeProductId: string | null = null;
    let storeUrl: string | undefined;
    let pushError: string | null = null;

    if (pushToStore && store?.access_token && store?.refresh_token) {
      const storePlatform = (store as { platform?: string }).platform;
      try {
        if (storePlatform === "zid") {
          const result = await pushProductToZid(
            {
              accessToken: store.access_token,
              refreshToken: store.refresh_token,
              partnerToken: (store as any).partner_token || store.access_token,
              storeId: (store as any).platform_store_id || store.id,
              onTokenRefresh: async (storeId, newAccess, newRefresh, newPartner) => {
                await adminClient.from("stores").update({
                  access_token: newAccess,
                  refresh_token: newRefresh,
                  ...(newPartner ? { partner_token: newPartner } : {}),
                  updated_at: new Date().toISOString(),
                }).eq("id", storeId);
              },
            },
            insertedProduct as Product,
          );
          storeProductId = result.zidProductId;
          storeUrl = result.zidUrl;
          pushedToStore = true;
        } else {
          const result = await pushProductToSalla(
            {
              accessToken: store.access_token,
              refreshToken: store.refresh_token,
              storeId: store.id,
              onTokenRefresh: async (storeId, newAccess, newRefresh) => {
                await adminClient.from("stores").update({
                  access_token: newAccess,
                  refresh_token: newRefresh,
                  updated_at: new Date().toISOString(),
                }).eq("id", storeId);
              },
            },
            insertedProduct as Product,
          );
          storeProductId = String(result.sallaProductId);
          storeUrl = result.sallaUrl;
          pushedToStore = true;
        }

        // Save product_listing if pushed
        if (pushedToStore && storeProductId) {
          await adminClient.from("product_listings").insert({
            product_id: insertedProduct.id,
            store_id: store.id,
            merchant_id: user.id,
            store_product_id: storeProductId,
            margin_type: marginType,
            margin_value: marginValue,
            retail_price: finalRetailPrice,
            is_active: true,
          });
        }
      } catch (err: any) {
        pushError = err.message || "Push failed";
        if (err instanceof SallaApiError) pushError = err.sallaMessage || pushError;
        if (err instanceof ZidApiError) pushError = err.zidMessage || pushError;
        console.error("[CJ Import] Push to store failed:", pushError);
      }
    }

    return NextResponse.json({
      success: true,
      product: insertedProduct,
      pushedToStore,
      storeProductId,
      storeUrl,
      pushError,
    });
  } catch (error: any) {
    console.error("[CJ Import] ❌ Unexpected error:", error);
    if (error instanceof Error) {
      console.error("[CJ Import] Stack:", error.stack);
    }
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}
