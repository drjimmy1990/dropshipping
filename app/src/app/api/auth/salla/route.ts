import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveOrigin, buildOAuthState, setOAuthNonce } from "@/lib/oauth/state";
import { getStoreLimit } from "@/lib/plan/storeLimit";

/**
 * GET /api/auth/salla
 *
 * Initiates the Salla OAuth 2.0 flow.
 * Redirects the authenticated DropLinker merchant to Salla's authorization page.
 * On success, Salla redirects back to /api/auth/salla/callback with an auth code.
 */
export async function GET(request: NextRequest) {
  const origin = resolveOrigin(request);

  // 1. Ensure the user is logged in to DropLinker first
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  // 1.5. Validate subscription limits (fails CLOSED)
  const limit = await getStoreLimit(supabase, user.id);
  if ("error" in limit) {
    console.error("[Salla OAuth] plan limit lookup failed:", limit.error);
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=store_count_failed", origin)
    );
  }

  const { count: currentStoreCount, error: storeCountError } = await supabase
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", user.id);

  if (storeCountError || currentStoreCount === null) {
    console.error("[Salla OAuth] store count failed:", storeCountError);
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=store_count_failed", origin)
    );
  }

  if (currentStoreCount >= limit.maxStores) {
    console.error(`[Salla OAuth] Merchant ${user.id} reached max stores (${limit.maxStores})`);
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=max_stores_reached", origin)
    );
  }

  // 2. Validate Salla credentials are configured
  const clientId = process.env.SALLA_CLIENT_ID;
  if (!clientId) {
    console.error("[Salla OAuth] SALLA_CLIENT_ID is not configured in .env.local");
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=salla_not_configured", origin)
    );
  }

  // 3. Build the callback URL (pinned to PUBLIC_BASE_URL when set)
  const redirectUri = `${origin}/api/auth/salla/callback`;

  // 4. Scopes we need from the Salla store
  const scopes = [
    "offline_access",
    "orders.read_write",
    "products.read_write",
    "customers.read_write",
    "webhooks.read_write",
    "settings.read",
    "shippings.read_write",
  ].join(" ");

  // 5. Bind the OAuth state to the merchant id + a random CSRF nonce
  const { state, nonce } = buildOAuthState(user.id);

  // 6. Build the Salla authorization URL
  const authUrl = new URL("https://accounts.salla.sa/oauth2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  setOAuthNonce(res, "salla_oauth_nonce", nonce);
  return res;
}
