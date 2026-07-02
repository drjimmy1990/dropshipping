import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/social/accounts
 * List connected social media accounts for the authenticated merchant.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Mask tokens in response
    const masked = (data || []).map((acc) => ({
      ...acc,
      access_token: acc.access_token ? "****" + acc.access_token.slice(-4) : null,
      refresh_token: acc.refresh_token ? "****" : null,
      blotato_credentials: acc.blotato_credentials ? { masked: true } : null,
    }));

    return NextResponse.json({ accounts: masked });
  } catch (err) {
    console.error("[social/accounts] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

/**
 * POST /api/social/accounts
 * Connect a social media account.
 * Body: { platform, auth_method, account_name, account_id?, access_token?, blotato_credentials?, store_id? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    if (!body.platform || !body.auth_method) {
      return NextResponse.json(
        { error: "platform and auth_method are required" },
        { status: 400 }
      );
    }

    // Ownership check (IDOR): a linked store must belong to this merchant.
    if (body.store_id) {
      const { data: s } = await supabase.from("stores").select("id").eq("id", body.store_id).eq("merchant_id", user.id).maybeSingle();
      if (!s) return NextResponse.json({ error: "store_id not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("social_accounts")
      .upsert(
        {
          merchant_id: user.id,
          store_id: body.store_id || null,
          platform: body.platform,
          auth_method: body.auth_method,
          account_name: body.account_name || null,
          account_id: body.account_id || body.platform + "_" + Date.now(),
          access_token: body.access_token || null,
          refresh_token: body.refresh_token || null,
          token_expires_at: body.token_expires_at || null,
          blotato_credentials: body.blotato_credentials || null,
          is_active: true,
        },
        { onConflict: "merchant_id,platform,account_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ account: data }, { status: 201 });
  } catch (err) {
    console.error("[social/accounts] POST error:", err);
    return NextResponse.json({ error: "Failed to connect account" }, { status: 500 });
  }
}
