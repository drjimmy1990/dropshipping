import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { pushProductToSalla, SallaApiError } from "@/lib/salla/client";
import { pushProductToZid, ZidApiError } from "@/lib/zid/client";
import type { Product } from "@/lib/supabase/types";

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

    // Parse body for an array of store_ids
    let storeIds: string[] = [];
    try {
      const body = await request.json();
      if (Array.isArray(body.storeIds)) {
        storeIds = body.storeIds;
      }
    } catch {
      // Ignore JSON parse errors
    }

    // 1. Fetch the product
    const { data: product, error: fetchError } = await adminClient
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 2. Fetch the stores to push to
    let storeQuery = adminClient
      .from("stores")
      .select("id, access_token, refresh_token, platform, partner_token, platform_store_id")
      .eq("merchant_id", user.id)
      .eq("is_active", true);

    if (storeIds.length > 0) {
      storeQuery = storeQuery.in("id", storeIds);
    }

    const { data: stores, error: storeError } = await storeQuery;

    if (storeError || !stores || stores.length === 0) {
      return NextResponse.json(
        { error: "No active stores found to push to." },
        { status: 400 }
      );
    }

    // 3. Fetch existing listings to avoid duplicates
    const { data: existingListings } = await adminClient
      .from("product_listings")
      .select("store_id")
      .eq("product_id", id);

    const existingStoreIds = new Set(existingListings?.map((l) => l.store_id) || []);

    const results = [];
    const errors = [];

    // 4. Push to each store
    for (const store of stores) {
      if (existingStoreIds.has(store.id)) {
        errors.push({ storeId: store.id, error: "Product is already synced to this store." });
        continue;
      }

      if (!store.access_token || !store.refresh_token) {
        errors.push({ storeId: store.id, error: "Store authentication expired." });
        continue;
      }

      try {
        let storeProductId: string;
        let storeUrl: string | undefined;

        if (store.platform === "zid") {
          const result = await pushProductToZid(
            {
              accessToken: store.access_token,
              refreshToken: store.refresh_token,
              partnerToken: store.partner_token || store.access_token,
              storeId: store.platform_store_id || store.id,
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

        // 5. Insert into product_listings
        const { error: insertError } = await adminClient
          .from("product_listings")
          .insert({
            product_id: product.id,
            store_id: store.id,
            merchant_id: user.id,
            store_product_id: storeProductId,
            margin_type: product.margin_type,
            margin_value: product.margin_value,
            retail_price: product.retail_price,
            is_active: true,
          });

        if (insertError) {
          console.error("[Push] ⚠️ Product pushed but failed to save listing:", insertError);
          errors.push({ storeId: store.id, error: "Pushed to store but failed to save listing record." });
        } else {
          results.push({
            storeId: store.id,
            platform: store.platform,
            storeProductId,
            storeUrl,
          });
        }
      } catch (err: any) {
        console.error(`[Push] Failed for store ${store.id}:`, err);
        let msg = err.message || "Failed to push";
        if (err instanceof SallaApiError) msg = err.sallaMessage || msg;
        if (err instanceof ZidApiError) msg = err.zidMessage || msg;
        errors.push({ storeId: store.id, error: msg });
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Push] Unexpected error:", error);
    return NextResponse.json({ error: "Unexpected error during push" }, { status: 500 });
  }
}
