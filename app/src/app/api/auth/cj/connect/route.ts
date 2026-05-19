import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/cj/connect
 *
 * Admin-only endpoint to save the platform-level CJ API token.
 * This token is shared across all merchants (like AliExpress).
 *
 * Body: { apiKey: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check — admin only
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const adminClient = createAdminClient();
    const { data: merchant } = await adminClient
      .from("merchants")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!merchant || merchant.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // 2. Parse body
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
      return NextResponse.json(
        { error: "A valid CJ Access Token is required (minimum 10 chars)." },
        { status: 400 }
      );
    }

    const token = apiKey.trim();

    // 3. Validate the token by making a test API call (get categories)
    try {
      const testRes = await fetch(
        "https://developers.cjdropshipping.com/api2.0/v1/product/getCategory",
        {
          method: "GET",
          headers: { "CJ-Access-Token": token },
        }
      );
      const testData = await testRes.json();

      if (testData.code !== 200) {
        return NextResponse.json(
          { error: `CJ token validation failed: ${testData.message || "Invalid token"}` },
          { status: 400 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to validate CJ token. Check your network and try again." },
        { status: 502 }
      );
    }

    // 4. Save to platform_config (upsert)
    await adminClient.from("platform_config").upsert({
      key: "cj_access_token",
      value: token,
      updated_at: new Date().toISOString(),
    });

    console.log(`[CJ Auth] ✅ Platform CJ token saved by admin ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "CJ Access Token saved. All merchants can now browse CJ products.",
    });
  } catch (error: any) {
    console.error("[CJ Auth] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save CJ token" },
      { status: 500 }
    );
  }
}
