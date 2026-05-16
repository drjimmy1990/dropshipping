import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getProductDetail } from "@/lib/aliexpress/client";

/**
 * GET /api/products/:id/shipping
 *
 * Fetches available AliExpress shipping options for an already-imported product.
 * Re-queries the AliExpress product detail API (which includes freight) and
 * returns the normalized shipping options.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = createAdminClient();

    // Get product with supplier info
    const { data: product, error } = await adminClient
      .from("products")
      .select("supplier_product_id, supplier, merchant_id")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.supplier !== "aliexpress" || !product.supplier_product_id) {
      return NextResponse.json({ error: "Not an AliExpress product" }, { status: 400 });
    }

    // Fetch full product detail (includes shipping options via freight API)
    // Args: (productId, accessToken?, shipTo?) — pass undefined for token so auto-refresh works
    const detail = await getProductDetail(
      Number(product.supplier_product_id),
      undefined,
      "SA"
    );

    return NextResponse.json({
      success: true,
      options: detail.shippingOptions,
    });
  } catch (err) {
    console.error("[Shipping API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch shipping options" },
      { status: 500 }
    );
  }
}
