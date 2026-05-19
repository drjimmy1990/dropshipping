import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { deleteSallaProduct, fullUpdateSallaProduct, SallaApiError } from "@/lib/salla/client";
import { updateZidProduct, deleteZidProduct, ZidApiError } from "@/lib/zid/client";
import type { SallaUpdateProductPayload } from "@/lib/salla/types";
import type { ZidLocalizedString } from "@/lib/zid/types";

/**
 * PATCH /api/products/:id
 *
 * Updates a product's editable fields (retail_price, is_active, title, etc.)
 * Only the owning merchant can update their products.
 * If the product is synced to a store (Salla or Zid), auto-syncs changes.
 */
export async function PATCH(
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
    const body = await request.json();

    // Whitelist allowed update fields
    const allowedFields = [
      "retail_price",
      "is_active",
      "title_en",
      "title_ar",
      "description_en",
      "description_ar",
      "margin_type",
      "margin_value",
      "min_stock_threshold",
      "auto_hide_when_low",
      "tags",
      "category",
      "images",
      "salla_category_id",
      "stock_quantity",
      "shipping_cost",
      "shipping_method",
      "estimated_delivery",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const adminClient = createAdminClient();

    // Verify ownership and update
    const { data, error } = await adminClient
      .from("products")
      .update(updates)
      .eq("id", id)
      .eq("merchant_id", user.id)
      .select("id, retail_price, is_active, store_product_id, store_id, title_en, title_ar, description_en, salla_category_id")
      .single();

    if (error) {
      console.error("[Products PATCH] Update failed:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Auto-sync to connected store if product is synced
    let storeSynced = false;
    let storeSyncError: string | null = null;

    if (data.store_product_id && data.store_id) {
      try {
        const { data: store } = await adminClient
          .from("stores")
          .select("access_token, refresh_token, platform, partner_token, platform_store_id")
          .eq("id", data.store_id)
          .single();

        if (store?.access_token) {
          const platform = (store as { platform?: string }).platform;

          if (platform === "zid") {
            // ---------- Sync to Zid ----------
            const zidPayload: { name?: ZidLocalizedString; price?: number; short_description?: ZidLocalizedString } = {};

            if (updates.title_en || updates.title_ar) {
              zidPayload.name = {
                en: String(updates.title_en || data.title_en || ""),
                ar: String(updates.title_ar || data.title_ar || ""),
              };
            }
            if (updates.retail_price) zidPayload.price = Number(updates.retail_price);
            if (updates.description_en) {
              zidPayload.short_description = {
                en: String(updates.description_en).replace(/<[^>]*>/g, "").slice(0, 250),
                ar: String(updates.description_en).replace(/<[^>]*>/g, "").slice(0, 250),
              };
            }

            if (Object.keys(zidPayload).length > 0) {
              await updateZidProduct(
                {
                  accessToken: store.access_token,
                  refreshToken: store.refresh_token || "",
                  partnerToken: (store as { partner_token?: string }).partner_token || store.access_token,
                  storeId: (store as { platform_store_id?: string }).platform_store_id || data.store_id,
                  onTokenRefresh: async (storeId, newAccess, newRefresh, newPartner) => {
                    await adminClient
                      .from("stores")
                      .update({
                        access_token: newAccess,
                        refresh_token: newRefresh,
                        ...(newPartner ? { partner_token: newPartner } : {}),
                        updated_at: new Date().toISOString(),
                      })
                      .eq("id", data.store_id);
                  },
                },
                String(data.store_product_id),
                zidPayload
              );
              storeSynced = true;
            }
          } else {
            // ---------- Sync to Salla (default) ----------
            if (store.refresh_token) {
              const sallaPayload: SallaUpdateProductPayload = {};

              if (updates.title_en) sallaPayload.name = String(updates.title_en);
              if (updates.retail_price) sallaPayload.price = Number(updates.retail_price);
              if (updates.description_en) sallaPayload.description = String(updates.description_en);
              if (updates.stock_quantity) sallaPayload.quantity = Number(updates.stock_quantity);
              if (updates.salla_category_id) sallaPayload.categories = [Number(updates.salla_category_id)];
              if (updates.title_en) sallaPayload.metadata_title = String(updates.title_en).slice(0, 70);

              // Only sync if there are Salla-relevant changes
              if (Object.keys(sallaPayload).length > 0) {
                await fullUpdateSallaProduct(
                  {
                    accessToken: store.access_token,
                    refreshToken: store.refresh_token,
                    storeId: data.store_id,
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
                  Number(data.store_product_id),
                  sallaPayload
                );
                storeSynced = true;
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof ZidApiError) {
          storeSyncError = err.zidMessage ?? "Zid sync error";
        } else if (err instanceof SallaApiError) {
          storeSyncError = err.sallaMessage ?? "Salla sync error";
        } else {
          storeSyncError = "Failed to sync with store";
        }
        console.error("[Products PATCH] Store sync failed:", storeSyncError);
      }
    }

    return NextResponse.json({
      success: true,
      product: data,
      storeSynced,
      ...(storeSyncError && { storeWarning: storeSyncError }),
    });
  } catch (error) {
    console.error("[Products PATCH] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/:id
 *
 * Deletes a product from DropLinker.
 * If the product is synced to a store (Salla or Zid), also deletes from that store.
 * Only the owning merchant can delete their products.
 */
export async function DELETE(
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

    // 1. Fetch the product (verify ownership + get store info)
    const { data: product, error: fetchError } = await adminClient
      .from("products")
      .select("id, store_product_id, store_id")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // 2. If synced to a store, delete from that store first
    let storeDeleteError: string | null = null;
    if (product.store_product_id && product.store_id) {
      try {
        const { data: store } = await adminClient
          .from("stores")
          .select("access_token, refresh_token, platform, partner_token, platform_store_id")
          .eq("id", product.store_id)
          .single();

        if (store?.access_token) {
          const platform = (store as { platform?: string }).platform;

          if (platform === "zid") {
            // ---------- Delete from Zid ----------
            await deleteZidProduct(
              {
                accessToken: store.access_token,
                refreshToken: store.refresh_token || "",
                partnerToken: (store as { partner_token?: string }).partner_token || store.access_token,
                storeId: (store as { platform_store_id?: string }).platform_store_id || product.store_id,
                onTokenRefresh: async (storeId, newAccess, newRefresh, newPartner) => {
                  await adminClient
                    .from("stores")
                    .update({
                      access_token: newAccess,
                      refresh_token: newRefresh,
                      ...(newPartner ? { partner_token: newPartner } : {}),
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", product.store_id);
                },
              },
              String(product.store_product_id)
            );
          } else {
            // ---------- Delete from Salla ----------
            if (store.refresh_token) {
              await deleteSallaProduct(
                {
                  accessToken: store.access_token,
                  refreshToken: store.refresh_token,
                  storeId: product.store_id,
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
                Number(product.store_product_id)
              );
            }
          }
        }
      } catch (err) {
        // Log but don't block the DB delete
        if (err instanceof ZidApiError) {
          storeDeleteError = err.zidMessage ?? "Zid API error";
        } else if (err instanceof SallaApiError) {
          storeDeleteError = err.sallaMessage ?? "Salla API error";
        } else {
          storeDeleteError = "Failed to delete from store";
        }
        console.error("[Products DELETE] Store delete failed:", storeDeleteError);
      }
    }

    // 3. Delete from Supabase
    const { error: deleteError } = await adminClient
      .from("products")
      .delete()
      .eq("id", id)
      .eq("merchant_id", user.id);

    if (deleteError) {
      console.error("[Products DELETE] DB delete failed:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...(storeDeleteError && { storeWarning: storeDeleteError }),
    });
  } catch (error) {
    console.error("[Products DELETE] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
