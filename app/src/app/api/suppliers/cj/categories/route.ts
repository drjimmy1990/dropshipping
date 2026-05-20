import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCJPlatformToken, getCJCategories } from "@/lib/cj/client";
import type { CJCategoryL1 } from "@/lib/cj/types";

// Cache categories in memory — they rarely change
let cachedCategories: CJCategoryL1[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * GET /api/suppliers/cj/categories
 * Returns CJ 3-level category tree. Cached for 24h.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cjToken = await getCJPlatformToken();
    if (!cjToken) {
      return NextResponse.json({ error: "CJ API not configured." }, { status: 503 });
    }

    // Return cached if fresh
    if (cachedCategories && Date.now() - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({ categories: cachedCategories });
    }

    // Fetch fresh categories
    const categories = await getCJCategories(cjToken);
    cachedCategories = categories;
    cacheTimestamp = Date.now();

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("[CJ Categories] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
