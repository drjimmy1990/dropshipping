import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getZidProducts, getZidProductImages, ZidApiError } from "@/lib/zid/client";
import type { ZidProductListItem } from "@/lib/zid/client";

/**
 * GET /api/zid/products
 *
 * Lists products from the merchant's Zid store (paginated).
 * Does NOT save to DB — just returns the list for preview.
 *
 * Query params:
 *   ?page=1  — page number
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const page = parseInt(new URL(request.url).searchParams.get("page") || "1");

    // Get merchant's active Zid store
    const { data: store } = await adminClient
      .from("stores")
      .select("id, access_token, refresh_token, partner_token, platform_store_id")
      .eq("merchant_id", user.id)
      .eq("platform", "zid")
      .eq("is_active", true)
      .maybeSingle();

    if (!store || !store.access_token) {
      return NextResponse.json(
        { error: "No active Zid store connected" },
        { status: 400 }
      );
    }

    const result = await getZidProducts(
      {
        accessToken: store.access_token,
        refreshToken: store.refresh_token || "",
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
            .eq("id", store.id);
        },
      },
      page
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Zid Products] Error:", error);

    if (error instanceof ZidApiError) {
      return NextResponse.json(
        { error: `Zid API error: ${error.zidMessage}` },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/zid/products
 *
 * Syncs ALL products from the merchant's Zid store into the local DB.
 * - Products already tracked (matching store_product_id) → updates local record
 * - New products (not in our DB) → inserts as supplier: "direct"
 *
 * Returns: { synced: number, created: number, updated: number }
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get merchant's active Zid store
    const { data: store } = await adminClient
      .from("stores")
      .select("id, access_token, refresh_token, partner_token, platform_store_id")
      .eq("merchant_id", user.id)
      .eq("platform", "zid")
      .eq("is_active", true)
      .maybeSingle();

    if (!store || !store.access_token) {
      return NextResponse.json(
        { error: "No active Zid store connected" },
        { status: 400 }
      );
    }

    const tokens = {
      accessToken: store.access_token,
      refreshToken: store.refresh_token || "",
      partnerToken: store.partner_token || store.access_token,
      storeId: store.platform_store_id || store.id,
      onTokenRefresh: async (storeId: string, newAccess: string, newRefresh: string, newPartner?: string) => {
        await adminClient
          .from("stores")
          .update({
            access_token: newAccess,
            refresh_token: newRefresh,
            ...(newPartner ? { partner_token: newPartner } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", store.id);
      },
    };

    // Fetch all pages from Zid
    let page = 1;
    let created = 0;
    let updated = 0;
    let errors = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await getZidProducts(tokens, page);

      for (const zidProduct of result.products) {
        try {
          const processed = normalizeZidProduct(zidProduct);

          // Images: try inline first (from extended=true), then fetch separately
          // Debug: dump raw image data for first product to see actual Zid field names
          if (zidProduct.images && zidProduct.images.length > 0) {
            console.log(`[Zid Sync] RAW inline images for "${processed.title_en}":`, JSON.stringify(zidProduct.images[0]));
          }

          let productImages = processed.images;
          if (productImages.length === 0) {
            console.log(`[Zid Sync] No inline images for "${processed.title_en}", fetching separately...`);
            const fetchedImages = await getZidProductImages(tokens, String(zidProduct.id));
            if (fetchedImages.length > 0) {
              productImages = fetchedImages;
            }
          }
          console.log(`[Zid Sync] Product "${processed.title_en}": ${productImages.length} images, URLs: ${JSON.stringify(productImages.slice(0, 2))}`);

          // Check if product already exists in our DB
          const { data: existing } = await adminClient
            .from("products")
            .select("id")
            .eq("store_product_id", String(zidProduct.id))
            .eq("merchant_id", user.id)
            .maybeSingle();

          if (existing) {
            // Update existing product (sync latest data from Zid)
            // Only update images if we actually got some — avoid wiping existing ones
            const updatePayload: Record<string, unknown> = {
              title_en: processed.title_en,
              title_ar: processed.title_ar,
              retail_price: processed.price,
              description_en: processed.description || null,
              is_active: !zidProduct.is_draft,
              in_stock: (zidProduct.quantity ?? 0) > 0 || zidProduct.is_infinite === true,
              updated_at: new Date().toISOString(),
            };
            if (productImages.length > 0) {
              updatePayload.images = productImages;
            }

            const { error: updateErr } = await adminClient
              .from("products")
              .update(updatePayload)
              .eq("id", existing.id);

            if (updateErr) {
              console.error(`[Zid Sync] ⚠️ Update failed for "${processed.title_en}":`, updateErr.message);
              errors++;
            } else {
              updated++;
            }
          } else {
            // Insert as "direct" product (merchant's own Zid product)
            const { error: insertErr } = await adminClient.from("products").insert({
              merchant_id: user.id,
              store_id: store.id,
              supplier: "direct",
              supplier_product_id: String(zidProduct.id),
              title_en: processed.title_en,
              title_ar: processed.title_ar,
              description_en: processed.description || null,
              supplier_cost: processed.price,
              supplier_currency: zidProduct.currency || "SAR",
              retail_price: processed.price,
              margin_type: "fixed",
              margin_value: 0,
              stock_quantity: zidProduct.quantity ?? 0,
              is_active: !zidProduct.is_draft,
              in_stock: (zidProduct.quantity ?? 0) > 0 || zidProduct.is_infinite === true,
              images: productImages,
              store_product_id: String(zidProduct.id),
              category: processed.category || null,
            });

            if (insertErr) {
              console.error(`[Zid Sync] ❌ Insert failed for "${processed.title_en}":`, insertErr.message);
              errors++;
            } else {
              created++;
            }
          }
        } catch (productErr) {
          console.error(`[Zid Sync] ❌ Error processing product ${zidProduct.id}:`, productErr);
          errors++;
        }
      }

      if (result.pagination.currentPage >= result.pagination.totalPages) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Update store last_sync
    await adminClient
      .from("stores")
      .update({ last_sync: new Date().toISOString() })
      .eq("id", store.id);

    return NextResponse.json({
      success: true,
      synced: created + updated,
      created,
      updated,
      errors,
    });
  } catch (error) {
    console.error("[Zid Sync] Error:", error);

    if (error instanceof ZidApiError) {
      return NextResponse.json(
        { error: `Zid API error: ${error.zidMessage}` },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

// ---------- Helpers ----------

/**
 * Normalizes a Zid product into our internal format.
 * Handles bilingual name, description, and image extraction.
 */
function normalizeZidProduct(zidProduct: ZidProductListItem) {
  // Name — Zid uses { ar, en } localized strings
  const title_en = typeof zidProduct.name === "object"
    ? zidProduct.name.en || zidProduct.name.ar || "Untitled"
    : String(zidProduct.name || "Untitled");
  const title_ar = typeof zidProduct.name === "object"
    ? zidProduct.name.ar || zidProduct.name.en || ""
    : "";

  // Description — can be string or localized object
  let description = "";
  if (typeof zidProduct.short_description === "object" && zidProduct.short_description !== null) {
    description = (zidProduct.short_description as { en?: string; ar?: string }).en ||
                  (zidProduct.short_description as { en?: string; ar?: string }).ar || "";
  } else if (typeof zidProduct.short_description === "string") {
    description = zidProduct.short_description;
  }

  // Images
  const images = (zidProduct.images || [])
    .map((img) => img.url || img.image_url || img.original || img.src || img.image || img.thumbnail_url)
    .filter((url): url is string => !!url);

  // Category
  const category = zidProduct.categories?.[0]?.name
    ? (typeof zidProduct.categories[0].name === "object"
        ? zidProduct.categories[0].name.en || zidProduct.categories[0].name.ar
        : String(zidProduct.categories[0].name))
    : null;

  return {
    title_en,
    title_ar,
    price: zidProduct.price || 0,
    description,
    images,
    category,
  };
}
