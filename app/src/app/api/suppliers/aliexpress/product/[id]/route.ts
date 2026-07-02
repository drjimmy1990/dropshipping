import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { getProductDetail } from "@/lib/aliexpress/client";

/**
 * GET /api/suppliers/aliexpress/product/[id]
 *
 * Fetches full product detail from AliExpress using platform-level credentials.
 * Includes images, variants, specs, and shipping options to Saudi Arabia.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await checkRateLimit(user.id, "ae_product", 60, 60))) {
      return NextResponse.json(rateLimitedResponse(), { status: 429 });
    }

    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // 2. Get ship-to country (default: SA)
    const shipTo = request.nextUrl.searchParams.get("shipTo") || "SA";

    // 3. Fetch product detail using platform-level app key
    const product = await getProductDetail(productId, undefined, shipTo);

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[AliExpress Product Detail] Error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch product";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
