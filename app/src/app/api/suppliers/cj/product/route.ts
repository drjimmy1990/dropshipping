import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { getCJPlatformToken, getCJProductDetail } from "@/lib/cj/client";

/**
 * GET /api/suppliers/cj/product?pid=...
 * Get CJ product detail with variants + shipping.
 * Uses platform-level API key.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await checkRateLimit(user.id, "cj_product", 60, 60))) {
      return NextResponse.json(rateLimitedResponse(), { status: 429 });
    }

    const cjToken = await getCJPlatformToken();
    if (!cjToken) {
      return NextResponse.json(
        { error: "CJ API not configured." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pid = searchParams.get("pid");

    if (!pid) {
      return NextResponse.json(
        { error: "Missing 'pid' parameter" },
        { status: 400 }
      );
    }

    const countryCode = searchParams.get("countryCode") || "SA";

    const product = await getCJProductDetail(pid, cjToken, countryCode);

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("[CJ Product Detail] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CJ product" },
      { status: 500 }
    );
  }
}
