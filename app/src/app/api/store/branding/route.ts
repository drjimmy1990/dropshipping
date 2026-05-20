import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/store/branding
 * Get branding settings for the merchant's stores.
 * Query: ?store_id=uuid (optional, returns all if not specified)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");

    let query = supabase
      .from("store_branding")
      .select("*, stores(store_name, platform)")
      .eq("merchant_id", user.id);

    if (storeId) query = query.eq("store_id", storeId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ branding: data || [] });
  } catch (err) {
    console.error("[store/branding] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch branding" }, { status: 500 });
  }
}

/**
 * POST /api/store/branding
 * Create or update branding settings for a store.
 * Body: { store_id, brand_name?, logo_url?, brand_colors?, tone?, tagline?, target_audience?, language_preference? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    if (!body.store_id) {
      return NextResponse.json({ error: "store_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("store_branding")
      .upsert(
        {
          store_id: body.store_id,
          merchant_id: user.id,
          brand_name: body.brand_name || null,
          logo_url: body.logo_url || null,
          brand_colors: body.brand_colors || [],
          tone: body.tone || "professional",
          tagline: body.tagline || null,
          target_audience: body.target_audience || null,
          language_preference: body.language_preference || "ar",
        },
        { onConflict: "store_id" }
      )
      .select("*, stores(store_name, platform)")
      .single();

    if (error) throw error;

    return NextResponse.json({ branding: data });
  } catch (err) {
    console.error("[store/branding] POST error:", err);
    return NextResponse.json({ error: "Failed to save branding" }, { status: 500 });
  }
}
