import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCJToken, getCJFreight } from "@/lib/cj/client";

/**
 * POST /api/suppliers/cj/freight
 * Calculate CJ shipping options.
 *
 * Body: { products: [{ vid, quantity }], endCountryCode: "SA", startCountryCode?: "CN" }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      products,
      endCountryCode = "SA",
      startCountryCode = "CN",
    } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "products array is required" },
        { status: 400 }
      );
    }

    const options = await getCJFreight(
      { startCountryCode, endCountryCode, products },
      cjAuth.accessToken,
    );

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error: any) {
    console.error("[CJ Freight] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate shipping" },
      { status: 500 }
    );
  }
}
