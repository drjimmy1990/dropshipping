import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { pushProductToSalla, SallaApiError } from "@/lib/salla/client";
import { pushProductToZid, ZidApiError } from "@/lib/zid/client";
import type { Product } from "@/lib/supabase/types";

/**
 * POST /api/products/:id/push
 *
 * Pushes an existing product from the DropLinker catalog to the merchant's store.
 * Supports both Salla and Zid stores — auto-detects the platform.
 * Used for products that were imported without auto-push, or for retrying failed pushes.
 *
 * Optional body:
 *  - targetStoreId: specific store UUID to push to
 *  - targetPlatform: "salla" | "zid" — filter by platform
 *
 * Requirements:
 * - Product must exist and belong to the authenticated merchant
 * - Merchant must have an active store connected (Salla or Zid)
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

    // Parse optional body
    let targetStoreId: string | null = null;
    let targetPlatform: string | null = null;
    try {
      const body = await request.json();
      targetStoreId = body.targetStoreId || null;
      targetPlatform = body.targetPlatform || null;
    } catch {
      // No body provided — that's fine
    }

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

    // 3. Get merchant's active store (Salla or Zid)
    let storeQuery = adminClient
      .from("stores")
      .select("id, access_token, refresh_token, platform, partner_token, platform_store_id")
      .eq("merchant_id", user.id)
      .eq("is_active", true);

    if (targetStoreId) {
      storeQuery = storeQuery.eq("id", targetStoreId);
    } else if (targetPlatform) {
      storeQuery = storeQuery.eq("platform", targetPlatform);
    }

    const { data: store, error: storeError } = await storeQuery.maybeSingle();

    if (storeError || !store) {
      return NextResponse.json(
        { error: "No active store connected. Please connect your Salla or Zid store first." },
        { status: 400 }
      );
    }

    if (!store.access_token || !store.refresh_token) {
      return NextResponse.json(
        { error: "Store authentication expired. Please reconnect your store." },
        { status: 401 }
      );
    }

    // 4. Push to the appropriate platform
    let storeProductId: string;
    let storeUrl: string | undefined;
    const storePlatform = (store as { platform?: string }).platform;

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
        product as Product
      );

      storeProductId = result.zidProductId;
      storeUrl = result.zidUrl;
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
        product as Product
      );

      storeProductId = String(result.sallaProductId);
      storeUrl = result.sallaUrl;
    }

    // 5. Save the store product ID back to our DB
    const { error: updateError } = await adminClient
      .from("products")
      .update({
        store_product_id: storeProductId,
        store_id: store.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Push] ⚠️ Product pushed but failed to save ID:", updateError);
    }

    return NextResponse.json({
      success: true,
      storeProductId,
      storeUrl,
      platform: storePlatform,
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

    if (error instanceof ZidApiError) {
      return NextResponse.json(
        {
          error: `Zid API error: ${error.zidMessage}`,
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
