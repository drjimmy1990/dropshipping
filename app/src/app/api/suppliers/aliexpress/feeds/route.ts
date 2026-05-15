import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/suppliers/aliexpress/feeds
 *
 * Returns the list of enabled AliExpress feeds for product discovery.
 * Reads from platform_config table (key: "feed_config").
 * Falls back to default feeds if no config is saved.
 * 
 * No auth required — feeds are public catalog configuration.
 */

// Default curated feeds — fallback when no admin config exists
const DEFAULT_FEEDS = [
  { id: "all", name: "all", displayName: "🔥 All", displayNameAr: "الكل", category: "all", productCount: 0, sortOrder: 0 },
  { id: "DS_NewArrivals", name: "DS_NewArrivals", displayName: "🆕 New Arrivals", displayNameAr: "وصل حديثاً", category: "trending", productCount: 14010, sortOrder: 1 },
  { id: "Bestseller 2024", name: "Bestseller 2024", displayName: "🏆 Bestsellers", displayNameAr: "الأكثر مبيعاً", category: "trending", productCount: 201065, sortOrder: 2 },
  { id: "DS_ConsumerElectronics_bestsellers", name: "DS_ConsumerElectronics_bestsellers", displayName: "📱 Electronics", displayNameAr: "إلكترونيات", category: "electronics", productCount: 19470, sortOrder: 3 },
  { id: "DS_Home&Kitchen_bestsellers", name: "DS_Home&Kitchen_bestsellers", displayName: "🏠 Home & Kitchen", displayNameAr: "المنزل والمطبخ", category: "home", productCount: 12300, sortOrder: 4 },
  { id: "DS_Sports&Outdoors_bestsellers", name: "DS_Sports&Outdoors_bestsellers", displayName: "⚽ Sports", displayNameAr: "رياضة", category: "sports", productCount: 27495, sortOrder: 5 },
  { id: "SA_Clothing&Shoes", name: "SA_Clothing&Shoes", displayName: "👗 Fashion (SA)", displayNameAr: "أزياء", category: "fashion", productCount: 13050, sortOrder: 6 },
  { id: "DS_Beauty_bestsellers", name: "DS_Beauty_bestsellers", displayName: "💄 Beauty", displayNameAr: "جمال", category: "beauty", productCount: 2594, sortOrder: 7 },
  { id: "DS_Automobile&Accessories_bestsellers", name: "DS_Automobile&Accessories_bestsellers", displayName: "🚗 Auto", displayNameAr: "سيارات", category: "auto", productCount: 20340, sortOrder: 8 },
  { id: "DS_ElectronicComponents_bestsellers", name: "DS_ElectronicComponents_bestsellers", displayName: "🔌 Components", displayNameAr: "مكونات", category: "electronics", productCount: 2580, sortOrder: 9 },
  { id: "DS_Sports-Clothing&Shoes", name: "DS_Sports-Clothing&Shoes", displayName: "🏃 Sportswear", displayNameAr: "ملابس رياضية", category: "fashion", productCount: 7990, sortOrder: 10 },
  { id: "DS_Christmas-Decor", name: "DS_Christmas-Decor", displayName: "🎄 Seasonal", displayNameAr: "موسمي", category: "seasonal", productCount: 6840, sortOrder: 11 },
];

export async function GET() {
  try {
    // Try to load admin-configured feeds from platform_config
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("platform_config")
      .select("value")
      .eq("key", "feed_config")
      .single();

    if (data?.value) {
      try {
        const savedFeeds = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        if (Array.isArray(savedFeeds) && savedFeeds.length > 0) {
          // Always prepend the "All" tab
          const allTab = { id: "all", name: "all", displayName: "🔥 All", displayNameAr: "الكل", category: "all", productCount: 0, sortOrder: 0 };
          return NextResponse.json({ feeds: [allTab, ...savedFeeds] });
        }
      } catch {
        // Invalid JSON — fall through to defaults
      }
    }

    return NextResponse.json({ feeds: DEFAULT_FEEDS });
  } catch (error) {
    console.error("[Feeds] Error:", error);
    return NextResponse.json({ feeds: DEFAULT_FEEDS });
  }
}

/**
 * PUT /api/suppliers/aliexpress/feeds
 * 
 * Admin saves the feed configuration to platform_config table.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const adminClient = createAdminClient();
    const { data: merchant } = await adminClient
      .from("merchants")
      .select("role")
      .eq("id", user.id)
      .single();

    if (merchant?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { feeds } = body;

    if (!Array.isArray(feeds)) {
      return NextResponse.json({ error: "Invalid feeds data" }, { status: 400 });
    }

    // Upsert into platform_config
    const { error } = await adminClient
      .from("platform_config")
      .upsert(
        { key: "feed_config", value: JSON.stringify(feeds) },
        { onConflict: "key" }
      );

    if (error) {
      console.error("[Feeds Save] DB Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, savedCount: feeds.length });
  } catch (error) {
    console.error("[Feeds Save] Error:", error);
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
