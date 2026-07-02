import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/content/schedule
 * List scheduled posts for the authenticated merchant.
 * Query: ?status=draft|scheduled|published|failed
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("scheduled_posts")
      .select(`
        *,
        content_assets(id, type, title_en, title_ar, caption, thumbnail_url, media_urls),
        social_accounts(id, platform, account_name)
      `)
      .eq("merchant_id", user.id)
      .order("scheduled_at", { ascending: true });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ posts: data || [] });
  } catch (err) {
    console.error("[content/schedule] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

/**
 * POST /api/content/schedule
 * Schedule a content asset for publishing.
 * Body: { content_asset_id, social_account_id, scheduled_at, is_recurring?, recurrence_rule? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    if (!body.content_asset_id || !body.social_account_id) {
      return NextResponse.json(
        { error: "content_asset_id and social_account_id are required" },
        { status: 400 }
      );
    }

    // Ownership check (IDOR): both referenced rows must belong to this merchant.
    const [{ data: asset }, { data: account }] = await Promise.all([
      supabase.from("content_assets").select("id").eq("id", body.content_asset_id).eq("merchant_id", user.id).maybeSingle(),
      supabase.from("social_accounts").select("id").eq("id", body.social_account_id).eq("merchant_id", user.id).maybeSingle(),
    ]);
    if (!asset || !account) {
      return NextResponse.json(
        { error: "content_asset_id or social_account_id not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        merchant_id: user.id,
        content_asset_id: body.content_asset_id,
        social_account_id: body.social_account_id,
        status: body.scheduled_at ? "scheduled" : "draft",
        scheduled_at: body.scheduled_at || null,
        is_recurring: body.is_recurring || false,
        recurrence_rule: body.recurrence_rule || null,
      })
      .select(`
        *,
        content_assets(id, type, title_en, title_ar, caption),
        social_accounts(id, platform, account_name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error("[content/schedule] POST error:", err);
    return NextResponse.json({ error: "Failed to schedule post" }, { status: 500 });
  }
}
