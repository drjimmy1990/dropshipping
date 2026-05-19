import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { attachSallaImage, deleteSallaProduct, fullUpdateSallaProduct, SallaApiError } from "@/lib/salla/client";
import { updateZidProduct, deleteZidProduct, uploadProductImages, ZidApiError } from "@/lib/zid/client";
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
      "metadata_title",
      "metadata_description",
      "zid_keywords",
      "zid_category_id",
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
      .select("id, retail_price, is_active, store_product_id, store_id, title_en, title_ar, description_en, description_ar, salla_category_id, salla_product_id, salla_store_id, zid_product_id, zid_store_id, metadata_title, metadata_description, zid_keywords")
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

    // Auto-sync to ALL connected platforms independently
    let sallaSynced = false;
    let zidSynced = false;
    const syncErrors: string[] = [];

    // ---------- Sync to Salla if connected ----------
    const sallaProductId = (data as Record<string, unknown>).salla_product_id as string | null;
    const sallaStoreId = (data as Record<string, unknown>).salla_store_id as string | null;

    if (sallaProductId && sallaStoreId) {
      try {
        const { data: sallaStore } = await adminClient
          .from("stores")
          .select("access_token, refresh_token")
          .eq("id", sallaStoreId)
          .single();

        if (sallaStore?.access_token && sallaStore.refresh_token) {
          const sallaTokens = {
            accessToken: sallaStore.access_token,
            refreshToken: sallaStore.refresh_token,
            storeId: sallaStoreId,
            onTokenRefresh: async (storeId: string, newAccess: string, newRefresh: string) => {
              await adminClient.from("stores").update({
                access_token: newAccess, refresh_token: newRefresh, updated_at: new Date().toISOString(),
              }).eq("id", storeId);
            },
          };

          const sallaPayload: SallaUpdateProductPayload = {};
          if (updates.title_en) sallaPayload.name = String(updates.title_en);
          if (updates.retail_price) sallaPayload.price = Number(updates.retail_price);
          if (updates.description_en) sallaPayload.description = String(updates.description_en);
          if (updates.stock_quantity) sallaPayload.quantity = Number(updates.stock_quantity);
          if (updates.salla_category_id) sallaPayload.categories = [Number(updates.salla_category_id)];
          // SEO fields
          if (updates.metadata_title) sallaPayload.metadata_title = String(updates.metadata_title).slice(0, 70);
          else if (updates.title_en) sallaPayload.metadata_title = String(updates.title_en).slice(0, 70);
          if (updates.metadata_description) sallaPayload.metadata_description = String(updates.metadata_description).slice(0, 160);
          // Status sync
          if (updates.is_active !== undefined) {
            // Salla doesn't have is_active in update payload directly — use status field workaround
            // Note: status is not in SallaUpdateProductPayload type, so we cast
            (sallaPayload as Record<string, unknown>).status = updates.is_active ? "sale" : "hidden";
          }

          if (Object.keys(sallaPayload).length > 0) {
            await fullUpdateSallaProduct(sallaTokens, Number(sallaProductId), sallaPayload);
            sallaSynced = true;
            console.log(`[Products PATCH] ✅ Synced to Salla (product ${sallaProductId})`);
          }

          // Sync images to Salla if images were updated
          if (updates.images && Array.isArray(updates.images) && (updates.images as string[]).length > 0) {
            try {
              const imageUrls = updates.images as string[];
              console.log(`[Products PATCH] Uploading ${imageUrls.length} images to Salla product ${sallaProductId}`);
              for (let i = 0; i < imageUrls.length; i++) {
                await attachSallaImage(sallaTokens, Number(sallaProductId), imageUrls[i], {
                  isDefault: i === 0,
                  sort: i + 1,
                });
              }
              sallaSynced = true;
            } catch (imgErr) {
              console.warn(`[Products PATCH] ⚠️ Image sync to Salla failed (non-blocking):`, imgErr);
            }
          }
        }
      } catch (err) {
        const msg = err instanceof SallaApiError ? err.sallaMessage : "Salla sync failed";
        syncErrors.push(`Salla: ${msg ?? "sync error"}`);
        console.error("[Products PATCH] Salla sync failed:", msg);
      }
    }

    // ---------- Sync to Zid if connected ----------
    const zidProductId = (data as Record<string, unknown>).zid_product_id as string | null;
    const zidStoreId = (data as Record<string, unknown>).zid_store_id as string | null;

    if (zidProductId && zidStoreId) {
      try {
        const { data: zidStore } = await adminClient
          .from("stores")
          .select("access_token, refresh_token, partner_token, platform_store_id")
          .eq("id", zidStoreId)
          .single();

        if (zidStore?.access_token) {
          const zidTokens = {
            accessToken: zidStore.access_token,
            refreshToken: zidStore.refresh_token || "",
            partnerToken: (zidStore as { partner_token?: string }).partner_token || zidStore.access_token,
            storeId: (zidStore as { platform_store_id?: string }).platform_store_id || zidStoreId,
            onTokenRefresh: async (storeId: string, newAccess: string, newRefresh: string, newPartner?: string) => {
              await adminClient.from("stores").update({
                access_token: newAccess, refresh_token: newRefresh,
                ...(newPartner ? { partner_token: newPartner } : {}),
                updated_at: new Date().toISOString(),
              }).eq("id", zidStoreId);
            },
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const zidPayload: Record<string, any> = {};
          if (updates.title_en || updates.title_ar) {
            zidPayload.name = {
              en: String(updates.title_en || data.title_en || ""),
              ar: String(updates.title_ar || data.title_ar || ""),
            };
          }
          if (updates.retail_price) zidPayload.price = Number(updates.retail_price);
          if (updates.description_en || updates.description_ar) {
            zidPayload.short_description = {
              en: String(updates.description_en || data.description_en || "").replace(/<[^>]*>/g, "").slice(0, 250),
              ar: String(updates.description_ar || data.description_ar || updates.description_en || "").replace(/<[^>]*>/g, "").slice(0, 250),
            };
          }
          // Stock sync
          if (updates.stock_quantity !== undefined) zidPayload.quantity = Number(updates.stock_quantity);
          // Keywords/SEO sync
          if (updates.zid_keywords && Array.isArray(updates.zid_keywords)) {
            zidPayload.keywords = updates.zid_keywords;
          }
          // Status sync
          if (updates.is_active !== undefined) {
            zidPayload.is_draft = !updates.is_active;
          }
          // Category sync
          if (updates.zid_category_id) {
            zidPayload.categories = [{ id: String(updates.zid_category_id) }];
          }

          if (Object.keys(zidPayload).length > 0) {
            await updateZidProduct(zidTokens, zidProductId, zidPayload);
            zidSynced = true;
            console.log(`[Products PATCH] ✅ Synced to Zid (product ${zidProductId})`);
          }

          // Sync images to Zid if images were updated
          if (updates.images && Array.isArray(updates.images) && (updates.images as string[]).length > 0) {
            try {
              await uploadProductImages(zidTokens, zidProductId, updates.images as string[]);
              zidSynced = true;
            } catch (imgErr) {
              console.warn(`[Products PATCH] ⚠️ Image sync to Zid failed (non-blocking):`, imgErr);
            }
          }
        }
      } catch (err) {
        const msg = err instanceof ZidApiError ? err.zidMessage : "Zid sync failed";
        syncErrors.push(`Zid: ${msg ?? "sync error"}`);
        console.error("[Products PATCH] Zid sync failed:", msg);
      }
    }

    const storeSynced = sallaSynced || zidSynced;
    const storeSyncError = syncErrors.length > 0 ? syncErrors.join("; ") : null;

    return NextResponse.json({
      success: true,
      product: data,
      storeSynced,
      sallaSynced,
      zidSynced,
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
      .select("id, store_product_id, store_id, salla_product_id, salla_store_id, zid_product_id, zid_store_id")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // 2. Delete from ALL connected stores
    const deleteErrors: string[] = [];

    // Delete from Salla if connected
    if (product.salla_product_id && product.salla_store_id) {
      try {
        const { data: sallaStore } = await adminClient
          .from("stores")
          .select("access_token, refresh_token")
          .eq("id", product.salla_store_id)
          .single();

        if (sallaStore?.access_token && sallaStore.refresh_token) {
          await deleteSallaProduct(
            {
              accessToken: sallaStore.access_token,
              refreshToken: sallaStore.refresh_token,
              storeId: product.salla_store_id,
              onTokenRefresh: async (storeId, newAccess, newRefresh) => {
                await adminClient.from("stores").update({
                  access_token: newAccess, refresh_token: newRefresh, updated_at: new Date().toISOString(),
                }).eq("id", storeId);
              },
            },
            Number(product.salla_product_id)
          );
          console.log(`[Products DELETE] ✅ Deleted from Salla (${product.salla_product_id})`);
        }
      } catch (err) {
        const msg = err instanceof SallaApiError ? err.sallaMessage : "Salla delete failed";
        deleteErrors.push(msg ?? "Salla delete error");
        console.error("[Products DELETE] Salla delete failed:", msg);
      }
    }

    // Delete from Zid if connected
    if (product.zid_product_id && product.zid_store_id) {
      try {
        const { data: zidStore } = await adminClient
          .from("stores")
          .select("access_token, refresh_token, partner_token, platform_store_id")
          .eq("id", product.zid_store_id)
          .single();

        if (zidStore?.access_token) {
          await deleteZidProduct(
            {
              accessToken: zidStore.access_token,
              refreshToken: zidStore.refresh_token || "",
              partnerToken: (zidStore as { partner_token?: string }).partner_token || zidStore.access_token,
              storeId: (zidStore as { platform_store_id?: string }).platform_store_id || product.zid_store_id,
              onTokenRefresh: async (storeId, newAccess, newRefresh, newPartner) => {
                await adminClient.from("stores").update({
                  access_token: newAccess, refresh_token: newRefresh,
                  ...(newPartner ? { partner_token: newPartner } : {}),
                  updated_at: new Date().toISOString(),
                }).eq("id", product.zid_store_id);
              },
            },
            String(product.zid_product_id)
          );
          console.log(`[Products DELETE] ✅ Deleted from Zid (${product.zid_product_id})`);
        }
      } catch (err) {
        const msg = err instanceof ZidApiError ? err.zidMessage : "Zid delete failed";
        deleteErrors.push(msg ?? "Zid delete error");
        console.error("[Products DELETE] Zid delete failed:", msg);
      }
    }

    const storeDeleteError = deleteErrors.length > 0 ? deleteErrors.join("; ") : null;

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
