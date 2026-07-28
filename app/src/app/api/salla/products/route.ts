import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSallaProducts, SallaApiError } from "@/lib/salla/client";

/**
 * GET /api/salla/products
 *
 * Lists products from the merchant's Salla store (paginated).
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

    // Get merchant's active Salla store
    const { data: store } = await adminClient
      .from("stores")
      .select("id, access_token, refresh_token")
      .eq("merchant_id", user.id)
      .eq("platform", "salla")
      .eq("is_active", true)
      .maybeSingle();

    if (!store || !store.access_token || !store.refresh_token) {
      return NextResponse.json(
        { error: "No active Salla store connected" },
        { status: 400 }
      );
    }

    const result = await getSallaProducts(
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
      page
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Salla Products] Error:", error);

    if (error instanceof SallaApiError) {
      return NextResponse.json(
        { error: `Salla API error: ${error.sallaMessage}` },
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
 * POST /api/salla/products
 *
 * Syncs ALL products from the merchant's Salla store into the local DB.
 * - Products already tracked (matching product_listings.store_product_id) → updates local record
 * - New products (not in our DB) → inserts as supplier: "direct"
 *
 * Returns: { synced: number, created: number, updated: number }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get merchant's active Salla store
    const { data: store } = await adminClient
      .from("stores")
      .select("id, access_token, refresh_token")
      .eq("merchant_id", user.id)
      .eq("platform", "salla")
      .eq("is_active", true)
      .maybeSingle();

    if (!store || !store.access_token || !store.refresh_token) {
      return NextResponse.json(
        { error: "No active Salla store connected" },
        { status: 400 }
      );
    }

    const tokens = {
      accessToken: store.access_token,
      refreshToken: store.refresh_token,
      storeId: store.id,
      onTokenRefresh: async (storeId: string, newAccess: string, newRefresh: string) => {
        await adminClient
          .from("stores")
          .update({
            access_token: newAccess,
            refresh_token: newRefresh,
            updated_at: new Date().toISOString(),
          })
          .eq("id", storeId);
      },
    };

    // Fetch all pages from Salla
    let page = 1;
    let created = 0;
    let updated = 0;
    let errors = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await getSallaProducts(tokens, page);

      for (const sallaProduct of result.products) {
        try {
          // Safe number parsing
          const priceAmount = typeof sallaProduct.price === 'object' 
            ? sallaProduct.price.amount 
            : parseFloat(String(sallaProduct.price)) || 0;
          const costPrice = parseFloat(String(sallaProduct.cost_price)) || 0;
          const stockQty = parseInt(String(sallaProduct.quantity)) || 0;
          const imageUrls = Array.isArray(sallaProduct.images) 
            ? sallaProduct.images.map((img) => typeof img === 'string' ? img : img.url)
            : sallaProduct.main_image ? [sallaProduct.main_image] : [];

          // 1. Dedupe via product_listings. Phase 13 dropped products.salla_product_id,
          //    products.salla_store_id, products.store_product_id and products.store_id —
          //    the store↔product linkage now lives only in product_listings.
          const sallaId = String(sallaProduct.id);
          const { data: listing, error: listingErr } = await adminClient
            .from("product_listings")
            .select("id, product_id")
            .eq("store_id", store.id)
            .eq("store_product_id", sallaId)
            .maybeSingle();

          if (listingErr) {
            // NEVER discard this — swallowing it is what made the sync silently import zero products.
            console.error(`[Salla Sync] ❌ Listing lookup failed for "${sallaProduct.name}":`, listingErr.message);
            errors++;
            continue;
          }

          const isNew = !listing;
          const marginValue = Math.max(0, priceAmount - costPrice);
          let productId = listing?.product_id ?? null;

          if (productId) {
            // 2a. Known product — sync the latest data from Salla.
            const { error: updateErr } = await adminClient
              .from("products")
              .update({
                title_en: sallaProduct.name,
                retail_price: priceAmount,
                description_en: sallaProduct.description || null,
                is_active: sallaProduct.status === "sale",
                in_stock: sallaProduct.status !== "out",
                images: imageUrls,
                updated_at: new Date().toISOString(),
              })
              .eq("id", productId);

            if (updateErr) {
              console.error(`[Salla Sync] ⚠️ Update failed for "${sallaProduct.name}":`, updateErr.message);
              errors++;
              continue;
            }
          } else {
            // 2b. Upsert as a "direct" product on the real unique key
            //     (uq_products_supplier: merchant_id, supplier, supplier_product_id).
            const categoryId = sallaProduct.categories?.[0]?.id || null;

            const { data: upserted, error: upsertErr } = await adminClient
              .from("products")
              .upsert(
                {
                  merchant_id: user.id,
                  supplier: "direct",
                  supplier_product_id: sallaId,
                  title_en: sallaProduct.name,
                  description_en: sallaProduct.description || null,
                  supplier_cost: costPrice,
                  supplier_currency: (typeof sallaProduct.price === 'object' ? sallaProduct.price.currency : 'SAR') || "SAR",
                  retail_price: priceAmount,
                  margin_type: "fixed",
                  margin_value: marginValue,
                  stock_quantity: stockQty,
                  is_active: sallaProduct.status === "sale",
                  in_stock: sallaProduct.status !== "out",
                  images: imageUrls,
                  salla_category_id: categoryId,
                  category: sallaProduct.categories?.[0]?.name || null,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "merchant_id,supplier,supplier_product_id" }
              )
              .select("id")
              .single();

            if (upsertErr || !upserted) {
              console.error(`[Salla Sync] ❌ Product upsert failed for "${sallaProduct.name}":`, upsertErr?.message);
              errors++;
              continue;
            }

            productId = upserted.id;
          }

          // 3. Upsert the store listing — this is the linkage that replaced the dropped columns.
          const { error: listingUpsertErr } = await adminClient
            .from("product_listings")
            .upsert(
              {
                product_id: productId,
                store_id: store.id,
                merchant_id: user.id,
                store_product_id: sallaId,
                margin_type: "fixed",
                margin_value: marginValue,
                retail_price: priceAmount,
                is_active: sallaProduct.status === "sale",
                last_sync_at: new Date().toISOString(),
              },
              { onConflict: "product_id,store_id" }
            );

          if (listingUpsertErr) {
            console.error(`[Salla Sync] ❌ Listing upsert failed for "${sallaProduct.name}":`, listingUpsertErr.message);
            errors++;
            continue;
          }

          if (isNew) {
            created++;
          } else {
            updated++;
          }
        } catch (productErr) {
          console.error(`[Salla Sync] ❌ Error processing "${sallaProduct.name}":`, productErr);
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
      // Never claim success while products failed to import — that is what hid
      // the phase 13 column drift for weeks.
      success: errors === 0,
      synced: created + updated,
      created,
      updated,
      errors,
      ...(errors > 0
        ? { error: `Salla sync completed with ${errors} failed product(s). ${created + updated} synced.` }
        : {}),
    });
  } catch (error) {
    console.error("[Salla Sync] Error:", error);

    if (error instanceof SallaApiError) {
      return NextResponse.json(
        { error: `Salla API error: ${error.sallaMessage}` },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
