import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveOrigin, verifyOAuthCallback, clearOAuthNonce } from "@/lib/oauth/state";
import { SALLA_USER_AGENT } from "@/lib/salla/client";

/**
 * GET /api/auth/salla/callback
 *
 * Handles the OAuth redirect from Salla after a merchant authorizes the app.
 * 1. Exchanges the authorization code for access + refresh tokens.
 * 2. Fetches the merchant's Salla store details via the User Info endpoint.
 * 3. Upserts the store record into the DropLinker `stores` table.
 * 4. Redirects back to the integrations dashboard.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is the DropLinker merchant UUID
  const errorParam = searchParams.get("error");

  const origin = resolveOrigin(request);

  // Every exit from this route must burn the nonce cookie. Clearing it only on
  // success left a valid nonce alive for the rest of its 600s TTL after a
  // denied / token_failed / mismatch / catch outcome.
  const failRedirect = (slug: string) => {
    const res = NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${slug}`, origin)
    );
    clearOAuthNonce(res, "salla_oauth_nonce");
    return res;
  };

  // --- Handle errors from Salla (e.g. user denied access) ---
  if (errorParam) {
    console.error("[Salla Callback] Authorization denied:", errorParam);
    return failRedirect("salla_denied");
  }

  if (!code || !state) {
    console.error("[Salla Callback] Missing code or state parameter");
    return failRedirect("salla_invalid_callback");
  }

  // --- Verify this callback belongs to the signed-in merchant (CRIT-7) ---
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  const merchantId = verifyOAuthCallback(request, "salla_oauth_nonce", state, user?.id);
  if (!merchantId) {
    console.error("[Salla Callback] Session/state mismatch — refusing to attach store");
    return failRedirect("salla_auth_mismatch");
  }

  // --- Validate env vars ---
  const clientId = process.env.SALLA_CLIENT_ID!;
  const clientSecret = process.env.SALLA_CLIENT_SECRET!;

  if (!clientId || !clientSecret) {
    console.error("[Salla Callback] SALLA_CLIENT_ID or SALLA_CLIENT_SECRET missing");
    return failRedirect("salla_not_configured");
  }

  const redirectUri = `${origin}/api/auth/salla/callback`;

  try {
    // ========== STEP 1: Exchange code for tokens ==========
    // Salla's Ory-based token endpoint requires x-www-form-urlencoded (NOT JSON)
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    // Salla's edge/WAF answers 403 with an HTML "human verification" page when a
    // server-to-server request carries no identifying User-Agent and does not ask
    // for JSON. Identify the app honestly and negotiate JSON explicitly.
    const tokenResponse = await fetch("https://accounts.salla.sa/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": SALLA_USER_AGENT,
      },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("[Salla Callback] Token exchange failed:", tokenResponse.status, errorBody);
      return failRedirect("salla_token_failed");
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token } = tokenData;

    console.log("[Salla Callback] Token exchange success, scopes:", tokenData.scope);

    // ========== STEP 2: Fetch merchant store info ==========
    const userInfoResponse = await fetch(
      "https://accounts.salla.sa/oauth2/user/info",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
          "User-Agent": SALLA_USER_AGENT,
        },
      }
    );

    if (!userInfoResponse.ok) {
      const uiErrorBody = await userInfoResponse.text();
      console.error("[Salla Callback] Failed to fetch user info:", userInfoResponse.status, uiErrorBody);
      return failRedirect("salla_userinfo_failed");
    }

    const userInfo = await userInfoResponse.json();

    // Real shape per the bundled `Merchant APIs V2.7.6.postman_collection.json`
    // (request "Store / User Information Details"):
    //   { data: { id, name, email, merchant: { id, name, domain, ... } } }
    // `data.id` is the *user* who authorized the app — NOT the merchant. The Salla
    // webhook payload's `merchant` field is `data.merchant.id`, and that is what
    // `stores.salla_merchant_id` must hold or every order is dropped.
    // No `shop` fallback on purpose: a silent fallback is what hid this outage.
    const info = userInfo.data ?? userInfo;
    const sallaMerchant = info?.merchant ?? {};
    const storeName = sallaMerchant.name || info?.name || "Salla Store";
    // Already an absolute URL (e.g. "https://www.domain.com") — do NOT prefix it.
    const storeDomain = sallaMerchant.domain || null;
    const sallaMerchantId = String(sallaMerchant.id ?? "");

    if (!sallaMerchantId) {
      console.error("[Salla Callback] user/info returned no merchant.id — refusing to save an unroutable store");
      return failRedirect("salla_userinfo_failed");
    }

    // ========== STEP 3: Upsert store into Supabase ==========
    // merchantId was verified above against the signed-in session.
    const adminClient = createAdminClient();

    console.log("[Salla Callback] Saving store for merchant:", merchantId, "Store:", storeName);

    // Ensure merchant row exists to prevent foreign key errors.
    // ignoreDuplicates: true => ON CONFLICT DO NOTHING. Without it supabase-js sends
    // Prefer: resolution=merge-duplicates (ON CONFLICT DO UPDATE), which resets an
    // existing merchant's real business_name to "My Store" on every reconnect.
    // No .select().single() either — that returns PGRST116 on the DO NOTHING path,
    // which (the row is created at signup) is the normal path.
    const { error: merchantErr } = await adminClient
      .from("merchants")
      .upsert(
        { id: merchantId, email: user?.email || "", business_name: "My Store" },
        { onConflict: "id", ignoreDuplicates: true }
      );
    if (merchantErr) {
      console.error("[Salla Callback] merchant ensure failed:", merchantErr);
      return failRedirect("salla_unexpected");
    }

    // Check if this merchant already has a Salla store connected
    const { data: existingStore, error: findError } = await adminClient
      .from("stores")
      .select("id")
      .eq("merchant_id", merchantId)
      .eq("platform", "salla")
      .maybeSingle();

    if (findError) {
      console.error("[Salla Callback] DB find error:", findError);
      return failRedirect("salla_unexpected");
    }

    if (existingStore) {
      // Update the existing store's tokens
      const { error: updateError } = await adminClient
        .from("stores")
        .update({
          store_name: storeName,
          store_url: storeDomain,
          salla_merchant_id: sallaMerchantId,
          platform_store_id: sallaMerchantId,
          access_token,
          refresh_token,
          is_active: true,
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingStore.id);

      if (updateError) {
        console.error("[Salla Callback] ❌ Store UPDATE failed:", updateError);
        return failRedirect("salla_unexpected");
      } else {
        console.log("[Salla Callback] ✅ Store updated successfully");
      }
    } else {
      // Insert a new store record
      const { error: insertError } = await adminClient.from("stores").insert({
        merchant_id: merchantId,
        platform: "salla" as const,
        salla_merchant_id: sallaMerchantId,
        platform_store_id: sallaMerchantId,
        store_name: storeName,
        store_url: storeDomain,
        access_token,
        refresh_token,
        // webhook_secret intentionally NOT stored: Salla signs with the single
        // global app secret (env). Persisting it here leaked it to merchants.
        is_active: true,
        last_sync: new Date().toISOString(),
      });

      if (insertError) {
        console.error("[Salla Callback] ❌ Store INSERT failed:", insertError);
        return failRedirect("salla_unexpected");
      } else {
        console.log("[Salla Callback] ✅ Store inserted successfully");
      }
    }

    console.log(
      `[Salla Callback] Store "${storeName}" flow complete for merchant ${merchantId} (Salla ID: ${sallaMerchantId})`
    );

    // ========== STEP 4: Redirect to dashboard ==========
    const res = NextResponse.redirect(
      new URL(`/dashboard/integrations?success=salla_connected`, origin)
    );
    clearOAuthNonce(res, "salla_oauth_nonce");
    return res;
  } catch (error) {
    console.error("[Salla Callback] Unexpected error:", error);
    return failRedirect("salla_unexpected");
  }
}
