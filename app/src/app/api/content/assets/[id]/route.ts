import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/content/assets/:id
 * Get a single content asset.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data, error } = await supabase
      .from("content_assets")
      .select("*, products(title_en, title_ar, images, supplier, retail_price, supplier_cost)")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ asset: data });
  } catch (err) {
    console.error("[content/assets/:id] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}

/**
 * PATCH /api/content/assets/:id
 * Update a content asset (approve, reject, edit content).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "status", "title_en", "title_ar", "body_en", "body_ar",
      "hashtags", "caption", "media_urls", "thumbnail_url",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("content_assets")
      .update(updates)
      .eq("id", id)
      .eq("merchant_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ asset: data });
  } catch (err) {
    console.error("[content/assets/:id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

/**
 * DELETE /api/content/assets/:id
 * Delete a content asset.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { error } = await supabase
      .from("content_assets")
      .delete()
      .eq("id", id)
      .eq("merchant_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[content/assets/:id] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
