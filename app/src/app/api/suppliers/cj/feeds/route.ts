import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCJPlatformToken, getCJCategories } from "@/lib/cj/client";
import type { CJCategoryL1 } from "@/lib/cj/types";

// Force dynamic
export const dynamic = "force-dynamic";

// Cache derived feeds
let cachedFeeds: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * GET /api/suppliers/cj/feeds
 *
 * Returns CJ-specific "feeds" for the discovery page tabs.
 * Built from productFlag flags + top-level categories.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return cached if fresh
    if (cachedFeeds && Date.now() - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({ feeds: cachedFeeds });
    }

    // Static productFlag-based feeds
    const feeds: any[] = [
      {
        id: "all",
        name: "all",
        displayName: "🔥 All Products",
        type: "all",
        productCount: 0,
        sortOrder: 0,
      },
      {
        id: "trending",
        name: "trending",
        displayName: "📈 Trending",
        type: "productFlag",
        productFlag: 0,
        productCount: 0,
        sortOrder: 1,
      },
      {
        id: "new",
        name: "new",
        displayName: "🆕 New Arrivals",
        type: "productFlag",
        productFlag: 1,
        productCount: 0,
        sortOrder: 2,
      },
      {
        id: "video",
        name: "video",
        displayName: "🎥 Video Products",
        type: "productFlag",
        productFlag: 2,
        productCount: 0,
        sortOrder: 3,
      },
    ];

    // Try to load top-level categories and add them as feed tabs
    try {
      const cjToken = await getCJPlatformToken();
      if (cjToken) {
        const categories = await getCJCategories(cjToken);
        if (Array.isArray(categories)) {
          // Pick icons for common category names
          const categoryIcons: Record<string, string> = {
            "Computer & Office": "💻",
            "Consumer Electronics": "📱",
            "Home & Garden": "🏠",
            "Sports & Outdoors": "⚽",
            "Toys & Hobbies": "🎮",
            "Health & Beauty": "💄",
            "Automobiles & Motorcycles": "🚗",
            "Jewelry & Accessories": "💍",
            "Women's Clothing": "👗",
            "Men's Clothing": "👔",
            "Shoes & Bags": "👟",
            "Mother & Kids": "👶",
            "Tools & Home Improvement": "🔧",
            "Phones & Telecommunications": "📞",
            "Lights & Lighting": "💡",
            "Pet Products": "🐾",
          };

          categories.forEach((cat: CJCategoryL1, index: number) => {
            const name = cat.categoryFirstName;
            if (!name) return;

            // Get L3 category IDs under this L1
            const l3Ids: string[] = [];
            cat.categoryFirstList?.forEach((l2) => {
              l2.categorySecondList?.forEach((l3) => {
                if (l3.categoryId) l3Ids.push(l3.categoryId);
              });
            });

            // Only include categories that have sub-categories
            if (l3Ids.length === 0) return;

            feeds.push({
              id: `cat_${index}`,
              name: `cat_${name}`,
              displayName: `${categoryIcons[name] || "📦"} ${name}`,
              type: "category",
              // Use the first L3 ID for initial filtering (UI can expand later)
              categoryIds: l3Ids,
              firstCategoryId: l3Ids[0],
              productCount: 0,
              sortOrder: 10 + index,
            });
          });
        }
      }
    } catch (err) {
      console.warn("[CJ Feeds] Failed to load categories for feed tabs:", err);
      // Static feeds still work without categories
    }

    cachedFeeds = feeds;
    cacheTimestamp = Date.now();

    return NextResponse.json({ feeds });
  } catch (error: any) {
    console.error("[CJ Feeds] Error:", error);
    // Return at least the static feeds
    return NextResponse.json({
      feeds: [
        { id: "all", name: "all", displayName: "🔥 All Products", type: "all", productCount: 0, sortOrder: 0 },
        { id: "trending", name: "trending", displayName: "📈 Trending", type: "productFlag", productFlag: 0, productCount: 0, sortOrder: 1 },
        { id: "new", name: "new", displayName: "🆕 New Arrivals", type: "productFlag", productFlag: 1, productCount: 0, sortOrder: 2 },
        { id: "video", name: "video", displayName: "🎥 Video Products", type: "productFlag", productFlag: 2, productCount: 0, sortOrder: 3 },
      ],
    });
  }
}
