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
    let hasMore = true;

    while (hasMore) {
      const result = await getSallaProducts(tokens, page);

      for (const sallaProduct of result.products) {
        // Check if product already exists in our DB
        const { data: existing } = await adminClient
          .from("products")
          .select("id")
          .eq("store_product_id", String(sallaProduct.id))
          .eq("merchant_id", user.id)
          .maybeSingle();

        if (existing) {
          // Update existing product (sync latest data from Salla)
          await adminClient
            .from("products")
            .update({
              title_en: sallaProduct.name,
              retail_price: sallaProduct.price.amount,
              description_en: sallaProduct.description || null,
              is_active: sallaProduct.status === "sale",
              in_stock: sallaProduct.status !== "out",
              images: sallaProduct.images.map((img) => img.url),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          updated++;
        } else {
          // Insert as "direct" product (merchant's own Salla product)
          const categoryId = sallaProduct.categories?.[0]?.id || null;

          await adminClient.from("products").insert({
            merchant_id: user.id,
            store_id: store.id,
            supplier: "direct",
            supplier_product_id: String(sallaProduct.id),
            title_en: sallaProduct.name,
            description_en: sallaProduct.description || null,
            supplier_cost: parseFloat(sallaProduct.cost_price) || 0,
            supplier_currency: sallaProduct.price.currency || "SAR",
            retail_price: sallaProduct.price.amount,
            margin_type: "fixed",
            margin_value: sallaProduct.price.amount - (parseFloat(sallaProduct.cost_price) || 0),
            stock_quantity: parseInt(sallaProduct.quantity) || 0,
            is_active: sallaProduct.status === "sale",
            in_stock: sallaProduct.status !== "out",
            images: sallaProduct.images.map((img) => img.url),
            store_product_id: String(sallaProduct.id),
            salla_category_id: categoryId,
            category: sallaProduct.categories?.[0]?.name || null,
          });
          created++;
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
