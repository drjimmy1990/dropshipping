import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchProducts } from "@/lib/aliexpress/client";

/**
 * GET /api/suppliers/aliexpress/search
 *
 * Proxies product search requests to the AliExpress API.
 * Uses the platform-level app key (set in .env.local by the super admin).
 * Requires an authenticated DropLinker merchant.
 *
 * Query params:
 *  - keyword: search term
 *  - category: category ID
 *  - page: page number (default 1)
 *  - sort: SALE_PRICE_ASC | SALE_PRICE_DESC | LAST_VOLUME_DESC
 *  - minPrice: minimum price filter
 *  - maxPrice: maximum price filter
 *  - shipTo: destination country code (default SA)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth check — must be a logged-in merchant
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse search parameters
    const params = request.nextUrl.searchParams;
    const keyword = params.get("keyword") || undefined;
    const category_id = params.get("category") || undefined;
    const page = parseInt(params.get("page") || "1", 10);
    const sort = params.get("sort") as
      | "SALE_PRICE_ASC"
      | "SALE_PRICE_DESC"
      | "LAST_VOLUME_DESC"
      | undefined;
    const minPrice = params.get("minPrice")
      ? parseFloat(params.get("minPrice")!)
      : undefined;
    const maxPrice = params.get("maxPrice")
      ? parseFloat(params.get("maxPrice")!)
      : undefined;
    const shipTo = params.get("shipTo") || "SA";

    // 3. Execute search using platform-level app key (no per-merchant token)
    const results = await searchProducts({
      keyword,
      category_id,
      page,
      pageSize: 20,
      sort,
      minPrice,
      maxPrice,
      shipTo,
      currency: "SAR",
      language: "EN",
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[AliExpress Search] Error:", error);

    const message =
      error instanceof Error ? error.message : "Search failed";

    return NextResponse.json(
      {
        products: [],
        totalPages: 0,
        totalCount: 0,
        page: 1,
        error: message,
      },
      { status: 200 }
    );
  }
}
