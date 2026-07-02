import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { getCJPlatformToken, searchCJProducts } from "@/lib/cj/client";

/**
 * GET /api/suppliers/cj/search
 * Search CJ products. Uses platform-level API key (shared for all merchants).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await checkRateLimit(user.id, "cj_search", 40, 60))) {
      return NextResponse.json(rateLimitedResponse(), { status: 429 });
    }

    // Get platform-level CJ token (shared for all merchants)
    const cjToken = await getCJPlatformToken();
    if (!cjToken) {
      return NextResponse.json(
        { error: "CJ API not configured. Platform admin needs to add the CJ Access Token." },
        { status: 503 }
      );
    }

    // Parse search params
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "20");
    const categoryId = searchParams.get("categoryId") || undefined;
    const countryCode = searchParams.get("countryCode") || undefined;
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;
    const sort = searchParams.get("sort") || undefined;
    const orderBy = searchParams.get("orderBy")
      ? parseInt(searchParams.get("orderBy")!)
      : undefined;
    const productFlag = searchParams.get("productFlag")
      ? parseInt(searchParams.get("productFlag")!)
      : undefined;

    const result = await searchCJProducts(
      {
        keyword,
        page,
        size,
        categoryId,
        countryCode,
        startSellPrice: minPrice,
        endSellPrice: maxPrice,
        sort,
        orderBy,
        productFlag,
      },
      cjToken,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[CJ Search] Error:", error);
    return NextResponse.json(
      { error: "Failed to search CJ products" },
      { status: 500 }
    );
  }
}
