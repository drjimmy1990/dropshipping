import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCJToken, searchCJProducts } from "@/lib/cj/client";

/**
 * GET /api/suppliers/cj/search
 * Search CJ products. Mirrors the AliExpress search route.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant's CJ token
    const cjAuth = await getCJToken(user.id);
    if (!cjAuth) {
      return NextResponse.json(
        { error: "CJ account not connected. Go to Integrations to connect your CJDropshipping account." },
        { status: 400 }
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
      cjAuth.accessToken,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[CJ Search] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search CJ products" },
      { status: 500 }
    );
  }
}
