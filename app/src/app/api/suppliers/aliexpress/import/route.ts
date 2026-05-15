import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getProductDetail } from "@/lib/aliexpress/client";
import { pushProductToSalla, SallaApiError } from "@/lib/salla/client";
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
 * 4. (Optional) Pushes to Salla store and saves store_product_id
 *
 * Request body:
 *  - productId: AliExpress product ID
 *  - retailPrice: (optional) merchant's retail price in SAR
 *  - marginType: "percentage" | "fixed" (default: percentage)
 *  - marginValue: margin amount (default: 30)
 *  - pushToStore: boolean (default: true) — auto-push to Salla
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

    const body = await request.json();
    const {
      productId,
      retailPrice,
      marginType = "percentage",
      marginValue = 30,
      pushToStore = true,
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
    const product = await getProductDetail(productId);

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

    // 5. Get merchant's connected Salla store
    const { data: store } = await adminClient
      .from("stores")
      .select("id, access_token, refresh_token")
      .eq("merchant_id", user.id)
      .eq("platform", "salla")
      .eq("is_active", true)
      .maybeSingle();

    // 6. Insert product into Supabase
    const productData = {
      merchant_id: user.id,
      supplier_account_id: null, // Platform-level, no per-merchant supplier account
      store_id: store?.id || null,
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

    // 7. Push to Salla (if enabled and store is connected)
    let pushedToStore = false;
    let storeProductId: string | null = null;
    let sallaUrl: string | undefined;
    let pushError: string | null = null;

    if (pushToStore && store?.access_token && store?.refresh_token) {
      try {
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
        sallaUrl = result.sallaUrl;
        pushedToStore = true;

        // Save the Salla product ID
        await adminClient
          .from("products")
          .update({
            store_product_id: storeProductId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", insertedProduct.id);

        console.log(
          `[Import] ✅ Pushed to Salla: ${product.title} → Salla ID: ${storeProductId}`
        );
      } catch (err) {
        pushError =
          err instanceof SallaApiError
            ? err.sallaMessage || "Salla API error"
            : err instanceof Error
              ? err.message
              : "Failed to push to store";

        console.error(`[Import] ⚠️ Salla push failed (product saved locally):`, pushError);
      }
    } else if (pushToStore && !store) {
      pushError = "No active Salla store connected";
    }

    return NextResponse.json({
      success: true,
      product: {
        id: insertedProduct.id,
        title: product.title,
        supplierCost,
        retailPrice: finalRetailPrice,
        storeProductId,
        sallaUrl,
      },
      pushedToStore,
      pushError,
    });
  } catch (error) {
    console.error("[Import] Unexpected error:", error);

    const message =
      error instanceof Error ? error.message : "Import failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
