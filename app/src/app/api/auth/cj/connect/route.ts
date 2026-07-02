import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/cj/connect
 *
 * Admin-only endpoint to connect CJDropshipping.
 * Takes the CJ API Key, exchanges it for an Access Token via CJ auth API,
 * then saves the tokens to platform_config.
 *
 * CJ Auth Flow:
 *   1. Admin provides their CJ API Key (format: CJUserNum@api@xxxxx)
 *   2. We POST it to CJ's /authentication/getAccessToken endpoint
 *   3. CJ returns accessToken + refreshToken
 *   4. We save both to platform_config
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
        { error: "A valid CJ API Key is required (minimum 10 chars)." },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();

    // 3. Exchange API Key for Access Token via CJ Auth endpoint
    console.log("[CJ Auth] Exchanging API Key for Access Token...");

    let tokenData;
    try {
      const authRes = await fetch(
        "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: trimmedKey }),
        }
      );

      const authJson = await authRes.json();
      console.log("[CJ Auth] Response:", JSON.stringify({ code: authJson.code, message: authJson.message }));

      if (authJson.code !== 200 || !authJson.data?.accessToken) {
        return NextResponse.json(
          { error: `CJ authentication failed: ${authJson.message || "Invalid API Key"}` },
          { status: 400 }
        );
      }

      tokenData = authJson.data;
    } catch (err) {
      console.error("[CJ Auth] Network error:", err);
      return NextResponse.json(
        { error: "Failed to reach CJ API. Check your network and try again." },
        { status: 502 }
      );
    }

    // 4. Validate the access token works by making a test API call
    try {
      const testRes = await fetch(
        "https://developers.cjdropshipping.com/api2.0/v1/product/getCategory",
        {
          method: "GET",
          headers: { "CJ-Access-Token": tokenData.accessToken },
        }
      );
      const testData = await testRes.json();

      if (testData.code !== 200) {
        console.warn("[CJ Auth] Token works but category test failed:", testData.message);
        // Don't block — the token exchange succeeded, categories might just be empty
      } else {
        console.log("[CJ Auth] ✅ Token validated — categories endpoint working");
      }
    } catch {
      console.warn("[CJ Auth] Category validation skipped (network issue)");
    }

    // 5. Save to platform_config (upsert all 3 values)
    const now = new Date().toISOString();

    await Promise.all([
      adminClient.from("platform_config").upsert({
        key: "cj_access_token",
        value: tokenData.accessToken,
        updated_at: now,
      }),
      adminClient.from("platform_config").upsert({
        key: "cj_refresh_token",
        value: tokenData.refreshToken,
        updated_at: now,
      }),
      adminClient.from("platform_config").upsert({
        key: "cj_api_key",
        value: trimmedKey,
        updated_at: now,
      }),
    ]);

    console.log(`[CJ Auth] ✅ CJ tokens saved by admin ${user.id}`);
    console.log(`[CJ Auth]   accessToken expires: ${tokenData.accessTokenExpiryDate}`);
    console.log(`[CJ Auth]   refreshToken expires: ${tokenData.refreshTokenExpiryDate}`);

    return NextResponse.json({
      success: true,
      message: "CJ connected! All merchants can now browse CJ products.",
      expiresAt: tokenData.accessTokenExpiryDate,
      refreshExpiresAt: tokenData.refreshTokenExpiryDate,
    });
  } catch (error: any) {
    console.error("[CJ Auth] Error:", error);
    return NextResponse.json(
      { error: "Failed to connect CJ" },
      { status: 500 }
    );
  }
}
