import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSallaCategories, SallaApiError } from "@/lib/salla/client";

/**
 * GET /api/salla/categories
 *
 * Fetches and caches the merchant's Salla store categories.
 * Uses local cache (salla_categories table) — refreshes if stale (>24h).
 * 
 * Query params:
 *   ?refresh=true  — force re-sync from Salla API
 *
 * Returns: { categories: [...], fromCache: boolean }
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // 1. Get merchant's active Salla store
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

    // 2. Check cache freshness (unless force refresh)
    if (!forceRefresh) {
      const { data: cached } = await adminClient
        .from("salla_categories")
        .select("salla_category_id, name, parent_id, status, synced_at")
        .eq("store_id", store.id)
        .order("name");

      if (cached && cached.length > 0) {
        // Check if cache is less than 24 hours old
        const lastSync = new Date(cached[0].synced_at);
        const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

        if (hoursSinceSync < 24) {
          return NextResponse.json({
            categories: cached.map((c) => ({
              id: c.salla_category_id,
              name: c.name,
              parent_id: c.parent_id,
              status: c.status,
            })),
            fromCache: true,
            lastSync: lastSync.toISOString(),
          });
        }
      }
    }

    // 3. Fetch from Salla API
    const sallaCategories = await getSallaCategories({
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
    });

    // 4. Flatten subcategories (Salla nests them)
    interface FlatCategory {
      salla_category_id: number;
      name: string;
      parent_id: number;
      status: string;
    }

    const flatCategories: FlatCategory[] = [];
    function flatten(cats: typeof sallaCategories, parentId: number = 0) {
      for (const cat of cats) {
        flatCategories.push({
          salla_category_id: cat.id,
          name: cat.name,
          parent_id: parentId,
          status: cat.status,
        });
        if (cat.sub_categories && cat.sub_categories.length > 0) {
          flatten(cat.sub_categories, cat.id);
        }
      }
    }
    flatten(sallaCategories);

    // 5. Upsert to cache
    if (flatCategories.length > 0) {
      // Delete old cache for this store
      await adminClient
        .from("salla_categories")
        .delete()
        .eq("store_id", store.id);

      // Insert new cache
      await adminClient.from("salla_categories").insert(
        flatCategories.map((c) => ({
          store_id: store.id,
          salla_category_id: c.salla_category_id,
          name: c.name,
          parent_id: c.parent_id,
          status: c.status,
          synced_at: new Date().toISOString(),
        }))
      );
    }

    return NextResponse.json({
      categories: flatCategories.map((c) => ({
        id: c.salla_category_id,
        name: c.name,
        parent_id: c.parent_id,
        status: c.status,
      })),
      fromCache: false,
      lastSync: new Date().toISOString(),
      total: flatCategories.length,
    });
  } catch (error) {
    console.error("[Categories] Error:", error);

    if (error instanceof SallaApiError) {
      return NextResponse.json(
        { error: `Salla API error: ${error.sallaMessage}` },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
