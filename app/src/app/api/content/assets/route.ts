import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/content/assets
 * List content assets for the authenticated merchant.
 * Query params: ?type=description|social_post|carousel|reel|image&status=pending_review|approved&product_id=uuid
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const productId = searchParams.get("product_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("content_assets")
      .select("*, products(title_en, title_ar, images, supplier)", { count: "exact" })
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    if (productId) query = query.eq("product_id", productId);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      assets: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("[content/assets] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch content assets" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content/assets
 * Manually create a content asset (e.g. from n8n callback).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const { data, error } = await supabase
      .from("content_assets")
      .insert({
        merchant_id: user.id,
        product_id: body.product_id || null,
        store_id: body.store_id || null,
        type: body.type,
        status: body.status || "pending_review",
        title_en: body.title_en,
        title_ar: body.title_ar,
        body_en: body.body_en,
        body_ar: body.body_ar,
        hashtags: body.hashtags || [],
        caption: body.caption,
        media_urls: body.media_urls || [],
        thumbnail_url: body.thumbnail_url,
        ai_prompt: body.ai_prompt,
        ai_provider: body.ai_provider,
        ai_model: body.ai_model,
        generation_params: body.generation_params || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ asset: data }, { status: 201 });
  } catch (err) {
    console.error("[content/assets] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create content asset" },
      { status: 500 }
    );
  }
}
