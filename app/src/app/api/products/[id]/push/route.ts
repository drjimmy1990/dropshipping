import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { pushProductToSalla, SallaApiError } from "@/lib/salla/client";
import type { Product } from "@/lib/supabase/types";

/**
 * POST /api/products/:id/push
 *
 * Pushes an existing product from the DropLinker catalog to the merchant's Salla store.
 * Used for products that were imported without auto-push, or for retrying failed pushes.
 *
 * Requirements:
 * - Product must exist and belong to the authenticated merchant
 * - Merchant must have an active Salla store connected
 * - Product must not already be synced (store_product_id must be null)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = createAdminClient();

    // 1. Fetch the product
    const { data: product, error: fetchError } = await adminClient
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // 2. Check if already synced
    if (product.store_product_id) {
      return NextResponse.json(
        {
          error: "Product is already synced to store",
          store_product_id: product.store_product_id,
        },
        { status: 409 }
      );
    }

    // 3. Get merchant's active Salla store
    const { data: store, error: storeError } = await adminClient
      .from("stores")
      .select("id, access_token, refresh_token, platform")
      .eq("merchant_id", user.id)
      .eq("platform", "salla")
      .eq("is_active", true)
      .maybeSingle();

    if (storeError || !store) {
      return NextResponse.json(
        { error: "No active Salla store connected. Please connect your store first." },
        { status: 400 }
      );
    }

    if (!store.access_token || !store.refresh_token) {
      return NextResponse.json(
        { error: "Store authentication expired. Please reconnect your Salla store." },
        { status: 401 }
      );
    }

    // 4. Push to Salla
    const { sallaProductId, sallaUrl } = await pushProductToSalla(
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
      product as Product
    );

    // 5. Save the Salla product ID back to our DB
    const { error: updateError } = await adminClient
      .from("products")
      .update({
        store_product_id: String(sallaProductId),
        store_id: store.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Push] ⚠️ Product pushed to Salla but failed to save ID:", updateError);
    }

    return NextResponse.json({
      success: true,
      sallaProductId,
      sallaUrl,
    });
  } catch (error) {
    console.error("[Push] Unexpected error:", error);

    if (error instanceof SallaApiError) {
      return NextResponse.json(
        {
          error: `Salla API error: ${error.sallaMessage}`,
          fields: error.fields,
        },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Push to store failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
