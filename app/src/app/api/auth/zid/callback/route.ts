import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/zid/callback
 *
 * Handles the OAuth redirect from Zid after a merchant authorizes the app.
 * 1. Exchanges the authorization code for access + refresh tokens.
 * 2. Fetches the merchant's Zid store details via the manager profile endpoint.
 * 3. Upserts the store record into the DropLinker `stores` table.
 * 4. Redirects back to the integrations dashboard.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is the DropLinker merchant UUID
  const errorParam = searchParams.get("error");

  // Detect real origin behind Nginx proxy
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "droplinker.asra3.com";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;

  // --- Handle errors from Zid (e.g. user denied access) ---
  if (errorParam) {
    console.error("[Zid Callback] Authorization denied:", errorParam);
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=zid_denied`, origin)
    );
  }

  if (!code || !state) {
    console.error("[Zid Callback] Missing code or state parameter");
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=zid_invalid_callback`, origin)
    );
  }

  // --- Validate env vars ---
  const clientId = process.env.ZID_CLIENT_ID!;
  const clientSecret = process.env.ZID_CLIENT_SECRET!;
  const oauthUrl = process.env.ZID_OAUTH_URL || "https://oauth.zid.sa";

  if (!clientId || !clientSecret) {
    console.error("[Zid Callback] ZID_CLIENT_ID or ZID_CLIENT_SECRET missing");
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=zid_not_configured`, origin)
    );
  }

  const redirectUri = `${origin}/api/auth/zid/callback`;

  try {
    // ========== STEP 1: Exchange code for tokens ==========
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    console.log("[Zid Callback] Exchanging authorization code for tokens...");

    const tokenResponse = await fetch(`${oauthUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("[Zid Callback] Token exchange failed:", tokenResponse.status, errorBody);
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=zid_token_failed`, origin)
      );
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      authorization: partnerToken,
    } = tokenData;

    console.log("[Zid Callback] Token exchange success");

    // ========== STEP 2: Fetch merchant store info ==========
    // Zid requires both Authorization (partner JWT) and Access-Token (merchant OAuth)
    const profileResponse = await fetch(
      "https://api.zid.sa/v1/managers/account/profile",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${partnerToken || access_token}`,
          "X-Manager-Token": access_token,
          "Access-Token": access_token,
          "Accept-Language": "en",
          Accept: "application/json",
        },
      }
    );

    let storeName = "Zid Store";
    let storeUrl: string | null = null;
    let zidStoreId: string | null = null;

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log("[Zid Callback] Profile data:", JSON.stringify(profileData, null, 2));

      // Extract store info from profile response
      const store = profileData?.user?.store || profileData?.store || profileData?.data?.store || {};
      storeName = store.name || store.title || profileData?.user?.name || "Zid Store";
      storeUrl = store.url || store.link || null;
      zidStoreId = String(store.id || profileData?.user?.store_id || "");
    } else {
      const profileErrorBody = await profileResponse.text();
      console.warn(
        "[Zid Callback] Failed to fetch profile (non-blocking):",
        profileResponse.status,
        profileErrorBody
      );
      // Non-blocking: we still have tokens, store info can be fetched later
    }

    // ========== STEP 3: Upsert store into Supabase ==========
    const adminClient = createAdminClient();
    const merchantId = state; // The DropLinker user UUID we passed as the OAuth state

    console.log("[Zid Callback] Saving store for merchant:", merchantId, "Store:", storeName);

    // Check if this merchant already has a Zid store connected
    const { data: existingStore, error: findError } = await adminClient
      .from("stores")
      .select("id")
      .eq("merchant_id", merchantId)
      .eq("platform", "zid")
      .maybeSingle();

    if (findError) {
      console.error("[Zid Callback] Error finding existing store:", findError);
    }

    const storeRecord = {
      store_name: storeName,
      store_url: storeUrl,
      platform_store_id: zidStoreId,
      access_token,
      refresh_token,
      partner_token: partnerToken || null,
      is_active: true,
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingStore) {
      // Update the existing store's tokens
      const { error: updateError } = await adminClient
        .from("stores")
        .update(storeRecord)
        .eq("id", existingStore.id);

      if (updateError) {
        console.error("[Zid Callback] ❌ Store UPDATE failed:", updateError);
      } else {
        console.log("[Zid Callback] ✅ Store updated successfully");
      }
    } else {
      // Insert a new store record
      const { error: insertError } = await adminClient.from("stores").insert({
        merchant_id: merchantId,
        platform: "zid" as const,
        ...storeRecord,
      });

      if (insertError) {
        console.error("[Zid Callback] ❌ Store INSERT failed:", insertError);
      } else {
        console.log("[Zid Callback] ✅ Store inserted successfully");
      }
    }

    console.log(
      `[Zid Callback] Store "${storeName}" flow complete for merchant ${merchantId} (Zid Store ID: ${zidStoreId})`
    );

    // ========== STEP 4: Redirect to dashboard ==========
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?success=zid_connected`, origin)
    );
  } catch (error) {
    console.error("[Zid Callback] Unexpected error:", error);
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=zid_unexpected`, origin)
    );
  }
}
