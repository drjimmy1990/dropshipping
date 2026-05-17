import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/zid/manual
 *
 * Manual Zid token connection — bypasses OAuth flow.
 * Use this when the app isn't approved in Zid's partner dashboard yet.
 * 
 * The merchant provides tokens obtained from bridge.zid.dev:
 *  - accessToken: The merchant's OAuth access token
 *  - partnerToken (authorization): The partner-level JWT
 *  - refreshToken: For auto-refresh on expiry
 *  - storeId: The Zid store UUID
 *
 * Body: { accessToken, partnerToken, refreshToken?, storeId }
 */
export async function POST(request: NextRequest) {
  // 1. Ensure the user is logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse the body
  let body: {
    accessToken?: string;
    partnerToken?: string;
    refreshToken?: string;
    storeId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { accessToken, partnerToken, refreshToken, storeId } = body;

  if (!accessToken || !storeId) {
    return NextResponse.json(
      { error: "accessToken and storeId are required" },
      { status: 400 }
    );
  }

  try {
    // 3. Validate the token by calling Zid's profile endpoint
    console.log("[Zid Manual] Validating tokens by fetching store profile...");

    const profileResponse = await fetch(
      "https://api.zid.sa/v1/managers/account/profile",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${partnerToken || accessToken}`,
          "Access-Token": accessToken,
          "Store-Id": storeId,
          Role: "Manager",
          "Accept-Language": "en",
          Accept: "application/json",
        },
      }
    );

    let storeName = "Zid Store";
    let storeUrl: string | null = null;

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log("[Zid Manual] Profile fetched successfully");

      const store =
        profileData?.user?.store ||
        profileData?.store ||
        profileData?.data?.store ||
        {};
      storeName =
        store.name ||
        store.title ||
        profileData?.user?.name ||
        "Zid Store";
      storeUrl = store.url || store.link || null;
    } else {
      const errorText = await profileResponse.text();
      console.warn(
        "[Zid Manual] Profile fetch failed (non-blocking):",
        profileResponse.status,
        errorText
      );
      // Non-blocking — tokens might still work for product operations
    }

    // 4. Upsert the store record in Supabase
    const adminClient = createAdminClient();
    const merchantId = user.id;

    // Check if merchant already has a Zid store
    const { data: existingStore } = await adminClient
      .from("stores")
      .select("id")
      .eq("merchant_id", merchantId)
      .eq("platform", "zid")
      .maybeSingle();

    const storeRecord = {
      store_name: storeName,
      store_url: storeUrl,
      platform_store_id: storeId,
      access_token: accessToken,
      refresh_token: refreshToken || null,
      partner_token: partnerToken || null,
      is_active: true,
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingStore) {
      const { error: updateError } = await adminClient
        .from("stores")
        .update(storeRecord)
        .eq("id", existingStore.id);

      if (updateError) {
        console.error("[Zid Manual] ❌ Store UPDATE failed:", updateError);
        return NextResponse.json(
          { error: "Failed to update store record" },
          { status: 500 }
        );
      }
      console.log("[Zid Manual] ✅ Store updated");
    } else {
      const { error: insertError } = await adminClient.from("stores").insert({
        merchant_id: merchantId,
        platform: "zid" as const,
        ...storeRecord,
      });

      if (insertError) {
        console.error("[Zid Manual] ❌ Store INSERT failed:", insertError);
        return NextResponse.json(
          { error: "Failed to save store record" },
          { status: 500 }
        );
      }
      console.log("[Zid Manual] ✅ Store inserted");
    }

    console.log(
      `[Zid Manual] Store "${storeName}" connected for merchant ${merchantId}`
    );

    return NextResponse.json({
      success: true,
      storeName,
      storeUrl,
      message: "Zid store connected successfully via manual token",
    });
  } catch (error) {
    console.error("[Zid Manual] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected error connecting Zid store" },
      { status: 500 }
    );
  }
}
