import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/cj/connect
 *
 * Saves a CJ Access Token to the merchant's supplier_accounts.
 * Called from the CJ Connect modal on the Integrations page.
 *
 * Body: { apiKey: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
      return NextResponse.json(
        { error: "A valid CJ Access Token is required." },
        { status: 400 }
      );
    }

    // Validate the token by making a test request to CJ
    try {
      const testResponse = await fetch(
        "https://developers.cjdropshipping.com/api2.0/v1/product/getCategory",
        {
          method: "GET",
          headers: { "CJ-Access-Token": apiKey.trim() },
        }
      );
      const testData = await testResponse.json();

      if (testData.code !== 200) {
        return NextResponse.json(
          { error: `CJ token validation failed: ${testData.message || "Invalid token"}` },
          { status: 400 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Could not reach CJ API. Please check your token and try again." },
        { status: 502 }
      );
    }

    const adminClient = createAdminClient();

    // Check if merchant already has a CJ supplier account
    const { data: existing } = await adminClient
      .from("supplier_accounts")
      .select("id")
      .eq("merchant_id", user.id)
      .eq("supplier", "cj")
      .maybeSingle();

    if (existing) {
      // Update existing
      await adminClient
        .from("supplier_accounts")
        .update({
          api_key: apiKey.trim(),
          access_token: apiKey.trim(),
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new
      await adminClient
        .from("supplier_accounts")
        .insert({
          merchant_id: user.id,
          supplier: "cj",
          api_key: apiKey.trim(),
          access_token: apiKey.trim(),
          is_active: true,
          is_default: false,
        });
    }

    return NextResponse.json({
      success: true,
      message: "CJDropshipping connected successfully!",
    });
  } catch (error: any) {
    console.error("[CJ Connect] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect CJ account" },
      { status: 500 }
    );
  }
}
