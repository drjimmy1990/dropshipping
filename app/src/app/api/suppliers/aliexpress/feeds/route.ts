import { NextResponse } from "next/server";

/**
 * GET /api/suppliers/aliexpress/feeds
 *
 * Returns the list of enabled AliExpress feeds for product discovery.
 * Feeds are curated by the admin and stored in platform_config.
 * 
 * Returns a hardcoded list until platform_feeds table is created.
 */

// Default curated feeds — these are the top feeds verified against the live API
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
    // TODO: When platform_feeds table exists, fetch from Supabase instead
    // For now, return the hardcoded curated list
    // No auth required — feeds are public catalog configuration
    return NextResponse.json({ feeds: DEFAULT_FEEDS });
  } catch (error) {
    console.error("[Feeds] Error:", error);
    return NextResponse.json({ feeds: DEFAULT_FEEDS });
  }
}
