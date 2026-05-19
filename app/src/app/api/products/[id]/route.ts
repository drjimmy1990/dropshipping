import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { attachSallaImage, deleteSallaProduct, fullUpdateSallaProduct, SallaApiError } from "@/lib/salla/client";
import { updateZidProduct, deleteZidProduct, uploadProductImages, ZidApiError } from "@/lib/zid/client";
import type { SallaUpdateProductPayload } from "@/lib/salla/types";
import type { ZidLocalizedString } from "@/lib/zid/types";

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
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("products")
      .update(updates)
      .eq("id", id)
      .eq("merchant_id", user.id)
      .select("id, retail_price, is_active, title_en, title_ar, description_en, description_ar, salla_category_id, metadata_title, metadata_description, zid_keywords")
      .single();

    if (error || !data) {
      console.error("[Products PATCH] Update failed:", error);
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }

    // Auto-sync to ALL connected platform listings
    let sallaSynced = false;
    let zidSynced = false;
    const syncErrors: string[] = [];

    const { data: listings } = await adminClient
      .from("product_listings")
      .select("store_id, store_product_id, store:stores(platform, access_token, refresh_token, partner_token, platform_store_id)")
      .eq("product_id", id);

    if (listings && listings.length > 0) {
      for (const listing of listings) {
        const store = Array.isArray(listing.store) ? listing.store[0] : listing.store;
        if (!store) continue;

        if (store.platform === "salla") {
          try {
            if (store.access_token && store.refresh_token) {
              const sallaTokens = {
                accessToken: store.access_token,
                refreshToken: store.refresh_token,
                storeId: listing.store_id,
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
              if (updates.stock_quantity !== undefined) sallaPayload.quantity = Number(updates.stock_quantity);
              if (updates.salla_category_id) sallaPayload.categories = [Number(updates.salla_category_id)];
              if (updates.metadata_title) sallaPayload.metadata_title = String(updates.metadata_title).slice(0, 70);
              else if (updates.title_en) sallaPayload.metadata_title = String(updates.title_en).slice(0, 70);
              if (updates.metadata_description) sallaPayload.metadata_description = String(updates.metadata_description).slice(0, 160);
              if (updates.is_active !== undefined) (sallaPayload as any).status = updates.is_active ? "sale" : "hidden";

              if (Object.keys(sallaPayload).length > 0) {
                await fullUpdateSallaProduct(sallaTokens, Number(listing.store_product_id), sallaPayload);
                sallaSynced = true;
                console.log(`[Products PATCH] ✅ Synced to Salla (product ${listing.store_product_id})`);
              }

              if (updates.images && Array.isArray(updates.images) && updates.images.length > 0) {
                try {
                  const imageUrls = updates.images as string[];
                  for (let i = 0; i < imageUrls.length; i++) {
                    await attachSallaImage(sallaTokens, Number(listing.store_product_id), imageUrls[i], {
                      isDefault: i === 0, sort: i + 1,
                    });
                  }
                  sallaSynced = true;
                } catch (imgErr) {
                  console.warn(`[Products PATCH] ⚠️ Image sync to Salla failed (non-blocking):`, imgErr);
                }
              }
            }
          } catch (err: any) {
            const msg = err instanceof SallaApiError ? err.sallaMessage : "Salla sync failed";
            syncErrors.push(`Salla: ${msg ?? "sync error"}`);
            console.error("[Products PATCH] Salla sync failed:", msg);
          }
        } else if (store.platform === "zid") {
          try {
            if (store.access_token) {
              const zidTokens = {
                accessToken: store.access_token,
                refreshToken: store.refresh_token || "",
                partnerToken: store.partner_token || store.access_token,
                storeId: store.platform_store_id || listing.store_id,
                onTokenRefresh: async (storeId: string, newAccess: string, newRefresh: string, newPartner?: string) => {
                  await adminClient.from("stores").update({
                    access_token: newAccess, refresh_token: newRefresh,
                    ...(newPartner ? { partner_token: newPartner } : {}),
                    updated_at: new Date().toISOString(),
                  }).eq("id", listing.store_id);
                },
              };

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
              if (updates.stock_quantity !== undefined) zidPayload.quantity = Number(updates.stock_quantity);
              if (updates.zid_keywords && Array.isArray(updates.zid_keywords)) zidPayload.keywords = updates.zid_keywords;
              if (updates.is_active !== undefined) zidPayload.is_draft = !updates.is_active;
              if (updates.zid_category_id) zidPayload.categories = [{ id: String(updates.zid_category_id) }];

              if (Object.keys(zidPayload).length > 0) {
                await updateZidProduct(zidTokens, listing.store_product_id, zidPayload);
                zidSynced = true;
                console.log(`[Products PATCH] ✅ Synced to Zid (product ${listing.store_product_id})`);
              }

              if (updates.images && Array.isArray(updates.images) && updates.images.length > 0) {
                try {
                  await uploadProductImages(zidTokens, listing.store_product_id, updates.images as string[]);
                  zidSynced = true;
                } catch (imgErr) {
                  console.warn(`[Products PATCH] ⚠️ Image sync to Zid failed (non-blocking):`, imgErr);
                }
              }
            }
          } catch (err: any) {
            const msg = err instanceof ZidApiError ? err.zidMessage : "Zid sync failed";
            syncErrors.push(`Zid: ${msg ?? "sync error"}`);
            console.error("[Products PATCH] Zid sync failed:", msg);
          }
        }
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    // 1. Fetch the product
    const { data: product, error: fetchError } = await adminClient
      .from("products")
      .select("id")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 2. Fetch all listings to delete from connected stores
    const { data: listings } = await adminClient
      .from("product_listings")
      .select("store_id, store_product_id, store:stores(platform, access_token, refresh_token, partner_token, platform_store_id)")
      .eq("product_id", id);

    const deleteErrors: string[] = [];

    if (listings && listings.length > 0) {
      for (const listing of listings) {
        const store = Array.isArray(listing.store) ? listing.store[0] : listing.store;
        if (!store) continue;

        if (store.platform === "salla") {
          try {
            if (store.access_token && store.refresh_token) {
              await deleteSallaProduct(
                {
                  accessToken: store.access_token,
                  refreshToken: store.refresh_token,
                  storeId: listing.store_id,
                  onTokenRefresh: async (storeId, newAccess, newRefresh) => {
                    await adminClient.from("stores").update({
                      access_token: newAccess, refresh_token: newRefresh, updated_at: new Date().toISOString(),
                    }).eq("id", storeId);
                  },
                },
                Number(listing.store_product_id)
              );
              console.log(`[Products DELETE] ✅ Deleted from Salla (${listing.store_product_id})`);
            }
          } catch (err: any) {
            const msg = err instanceof SallaApiError ? err.sallaMessage : "Salla delete failed";
            deleteErrors.push(msg ?? "Salla delete error");
            console.error("[Products DELETE] Salla delete failed:", msg);
          }
        } else if (store.platform === "zid") {
          try {
            if (store.access_token) {
              await deleteZidProduct(
                {
                  accessToken: store.access_token,
                  refreshToken: store.refresh_token || "",
                  partnerToken: store.partner_token || store.access_token,
                  storeId: store.platform_store_id || listing.store_id,
                  onTokenRefresh: async (storeId, newAccess, newRefresh, newPartner) => {
                    await adminClient.from("stores").update({
                      access_token: newAccess, refresh_token: newRefresh,
                      ...(newPartner ? { partner_token: newPartner } : {}),
                      updated_at: new Date().toISOString(),
                    }).eq("id", listing.store_id);
                  },
                },
                String(listing.store_product_id)
              );
              console.log(`[Products DELETE] ✅ Deleted from Zid (${listing.store_product_id})`);
            }
          } catch (err: any) {
            const msg = err instanceof ZidApiError ? err.zidMessage : "Zid delete failed";
            deleteErrors.push(msg ?? "Zid delete error");
            console.error("[Products DELETE] Zid delete failed:", msg);
          }
        }
      }
    }

    const storeDeleteError = deleteErrors.length > 0 ? deleteErrors.join("; ") : null;

    // 3. Delete from Supabase (this will cascade to product_listings)
    const { error: deleteError } = await adminClient
      .from("products")
      .delete()
      .eq("id", id)
      .eq("merchant_id", user.id);

    if (deleteError) {
      console.error("[Products DELETE] DB delete failed:", deleteError);
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...(storeDeleteError && { storeWarning: storeDeleteError }),
    });
  } catch (error) {
    console.error("[Products DELETE] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
