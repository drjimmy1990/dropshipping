import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { getProductDetail } from "@/lib/aliexpress/client";
import { pushProductToSalla, SallaApiError } from "@/lib/salla/client";
import { pushProductToZid, ZidApiError } from "@/lib/zid/client";
import type { Product } from "@/lib/supabase/types";

/**
 * POST /api/suppliers/aliexpress/import
 *
 * Imports a product from AliExpress into the merchant's DropLinker catalog
 * and optionally pushes it to their connected Salla store.
 *
 * 1. Fetches full product detail from AliExpress
 * 2. Calculates retail price based on margin settings
 * 3. Inserts into the `products` table in Supabase
 * 4. (Optional) Pushes to the store and records the link in `product_listings`
 *
 * Request body:
 *  - productId: AliExpress product ID
 *  - retailPrice: (optional) merchant's retail price in SAR
 *  - marginType: "percentage" | "fixed" (default: percentage)
 *  - marginValue: margin amount (default: 30)
 *  - pushToStore: boolean (default: false) — save locally first, push later
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !(await checkRateLimit(user.id, "ae_import", 20, 60)) ||
      !(await checkRateLimit(user.id, "ae_import_day", 200, 86400))
    ) {
      return NextResponse.json(rateLimitedResponse(), { status: 429 });
    }

    const body = await request.json();
    const {
      productId,
      retailPrice,
      marginType = "percentage",
      marginValue = 30,
      pushToStore = false,
      shippingCost = 0,
      shippingMethod = null,
      estimatedDelivery = null,
      targetStoreId = null,   // Optional: specific store to push to
      targetPlatform = null,  // Optional: "salla" | "zid" — auto-detected if not provided
    } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 2. Check if product already imported by this merchant
    const { data: existingProduct } = await adminClient
      .from("products")
      .select("id")
      .eq("merchant_id", user.id)
      .eq("supplier_product_id", String(productId))
      .eq("supplier", "aliexpress")
      .maybeSingle();

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product already imported", productId: existingProduct.id },
        { status: 409 }
      );
    }

    // 3. Fetch full product detail using PLATFORM-level app key
    let product;
    try {
      product = await getProductDetail(productId);
    } catch (apiErr) {
      console.error("[AliExpress Import] ❌ Supplier API error:", apiErr);
      const msg = apiErr instanceof Error ? apiErr.message : "Supplier API unavailable";
      return NextResponse.json(
        { error: `Supplier API error: ${msg}` },
        { status: 502 }
      );
    }

    // 4. Calculate retail price
    const supplierCost = product.price;
    let finalRetailPrice = retailPrice;

    if (!finalRetailPrice) {
      if (marginType === "percentage") {
        finalRetailPrice = supplierCost * (1 + marginValue / 100);
      } else {
        finalRetailPrice = supplierCost + marginValue;
      }
    }

    // 5. Get merchant's connected store (Salla or Zid)
    // If targetStoreId specified, use that. Otherwise find any active store.
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

    // 6. Insert product into Supabase
    const productData = {
      merchant_id: user.id,
      supplier_account_id: null, // Platform-level, no per-merchant supplier account
      // NOTE: no store_id here — phase 13 dropped it. Store linkage is written to
      // product_listings after a successful push (step 7 below).
      supplier: "aliexpress" as const,
      supplier_product_id: String(productId),
      supplier_url: product.url,
      title_en: product.title,
      title_ar: null, // Will be AI-generated later
      description_en: product.description || null,
      description_ar: null,
      supplier_cost: supplierCost,
      supplier_currency: product.currency || "SAR",
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
      console.error("[Import] ❌ Product INSERT failed:", insertError);
      return NextResponse.json(
        { error: "Failed to save product: " + insertError.message },
        { status: 500 }
      );
    }

    console.log(
      `[Import] ✅ Product imported: ${product.title} (ID: ${insertedProduct.id})`
    );

    // 7. Push to store (Salla or Zid) if enabled and store is connected
    let pushedToStore = false;
    let storeProductId: string | null = null;
    let storeUrl: string | undefined;
    let pushError: string | null = null;

    if (pushToStore && store?.access_token && store?.refresh_token) {
      const storePlatform = (store as { platform?: string }).platform;

      try {
        if (storePlatform === "zid") {
          // ---- Push to Zid ----
          const result = await pushProductToZid(
            {
              accessToken: store.access_token,
              refreshToken: store.refresh_token,
              partnerToken: (store as { partner_token?: string }).partner_token || store.access_token,
              storeId: (store as { platform_store_id?: string }).platform_store_id || store.id,
              onTokenRefresh: async (storeId, newAccess, newRefresh, newPartner) => {
                await adminClient
                  .from("stores")
                  .update({
                    access_token: newAccess,
                    refresh_token: newRefresh,
                    ...(newPartner ? { partner_token: newPartner } : {}),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", storeId);
              },
            },
            insertedProduct as Product
          );

          storeProductId = result.zidProductId;
          storeUrl = result.zidUrl;
          pushedToStore = true;

          console.log(
            `[Import] ✅ Pushed to Zid: ${product.title} → Zid ID: ${storeProductId}`
          );
        } else {
          // ---- Push to Salla (default) ----
          const result = await pushProductToSalla(
            {
              accessToken: store.access_token,
              refreshToken: store.refresh_token,
              storeId: store.id,
              onTokenRefresh: async (storeId, newAccess, newRefresh) => {
                await adminClient
                  .from("stores")
                  .update({
                    access_token: newAccess,
                    refresh_token: newRefresh,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", storeId);
              },
            },
            insertedProduct as Product
          );

          storeProductId = String(result.sallaProductId);
          storeUrl = result.sallaUrl;
          pushedToStore = true;

          console.log(
            `[Import] ✅ Pushed to Salla: ${product.title} → Salla ID: ${storeProductId}`
          );
        }

        // Save the store linkage in product_listings (phase 13 replacement for
        // the dropped products.store_product_id / products.store_id columns).
        if (storeProductId) {
          const { error: listingError } = await adminClient
            .from("product_listings")
            .upsert(
              {
                product_id: insertedProduct.id,
                store_id: store.id,
                merchant_id: user.id,
                store_product_id: String(storeProductId),
                margin_type: marginType,
                margin_value: Math.max(0, marginValue),
                retail_price: finalRetailPrice,
                is_active: true,
                last_sync_at: new Date().toISOString(),
              },
              { onConflict: "product_id,store_id" }
            );

          if (listingError) {
            console.error("[Import] ❌ product_listings upsert failed:", listingError);
            pushError = `Product pushed to the store but the local link failed: ${listingError.message}`;
          }
        }
      } catch (err) {
        pushError =
          err instanceof SallaApiError
            ? err.sallaMessage || "Salla API error"
            : err instanceof ZidApiError
              ? err.zidMessage || "Zid API error"
              : err instanceof Error
                ? err.message
                : "Failed to push to store";

        console.error(`[Import] ⚠️ Store push failed (product saved locally):`, pushError);
      }
    } else if (pushToStore && !store) {
      pushError = "No active store connected (connect Salla or Zid first)";
    }

    return NextResponse.json({
      success: true,
      product: {
        id: insertedProduct.id,
        title: product.title,
        supplierCost,
        retailPrice: finalRetailPrice,
        storeProductId,
        storeUrl,
        storePlatform: (store as { platform?: string })?.platform || null,
      },
      pushedToStore,
      pushError,
    });
  } catch (error) {
    console.error("[AliExpress Import] ❌ Unexpected error:", error);
    if (error instanceof Error) {
      console.error("[AliExpress Import] Stack:", error.stack);
    }

    const message =
      error instanceof Error ? error.message : "Import failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
