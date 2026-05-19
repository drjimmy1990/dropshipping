import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCJToken, getCJProductDetail } from "@/lib/cj/client";

/**
 * GET /api/suppliers/cj/product?pid=...
 * Get CJ product detail with variants + shipping.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cjAuth = await getCJToken(user.id);
    if (!cjAuth) {
      return NextResponse.json(
        { error: "CJ account not connected." },
        { status: 400 }
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

    const product = await getCJProductDetail(pid, cjAuth.accessToken, countryCode);

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("[CJ Product Detail] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch CJ product" },
      { status: 500 }
    );
  }
}
