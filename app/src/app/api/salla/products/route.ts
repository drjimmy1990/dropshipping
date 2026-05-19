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
 * - Products already tracked (matching store_product_id) → updates local record
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

          // Check if product already exists in our DB (match salla_product_id or legacy store_product_id)
          const sallaId = String(sallaProduct.id);
          let existing = null;
          const { data: bySallaId } = await adminClient
            .from("products")
            .select("id")
            .eq("salla_product_id", sallaId)
            .eq("merchant_id", user.id)
            .maybeSingle();
          existing = bySallaId;

          if (!existing) {
            const { data: byStoreId } = await adminClient
              .from("products")
              .select("id")
              .eq("store_product_id", sallaId)
              .eq("merchant_id", user.id)
              .maybeSingle();
            existing = byStoreId;
          }

          if (existing) {
            // Update existing product (sync latest data from Salla)
            const { error: updateErr } = await adminClient
              .from("products")
              .update({
                title_en: sallaProduct.name,
                retail_price: priceAmount,
                description_en: sallaProduct.description || null,
                is_active: sallaProduct.status === "sale",
                in_stock: sallaProduct.status !== "out",
                images: imageUrls,
                salla_product_id: sallaId,
                salla_store_id: store.id,
                store_product_id: sallaId,
                store_id: store.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);

            if (updateErr) {
              console.error(`[Salla Sync] ⚠️ Update failed for "${sallaProduct.name}":`, updateErr.message);
              errors++;
            } else {
              updated++;
            }
          } else {
            // Insert as "direct" product (merchant's own Salla product)
            const categoryId = sallaProduct.categories?.[0]?.id || null;

            const { error: insertErr } = await adminClient.from("products").insert({
              merchant_id: user.id,
              store_id: store.id,
              supplier: "direct",
              supplier_product_id: sallaId,
              title_en: sallaProduct.name,
              description_en: sallaProduct.description || null,
              supplier_cost: costPrice,
              supplier_currency: (typeof sallaProduct.price === 'object' ? sallaProduct.price.currency : 'SAR') || "SAR",
              retail_price: priceAmount,
              margin_type: "fixed",
              margin_value: priceAmount - costPrice,
              stock_quantity: stockQty,
              is_active: sallaProduct.status === "sale",
              in_stock: sallaProduct.status !== "out",
              images: imageUrls,
              store_product_id: sallaId,
              salla_product_id: sallaId,
              salla_store_id: store.id,
              salla_category_id: categoryId,
              category: sallaProduct.categories?.[0]?.name || null,
            });

            if (insertErr) {
              console.error(`[Salla Sync] ❌ Insert failed for "${sallaProduct.name}":`, insertErr.message);
              errors++;
            } else {
              created++;
            }
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
      success: true,
      synced: created + updated,
      created,
      updated,
      errors,
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
