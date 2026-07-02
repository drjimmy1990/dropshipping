import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveOrigin, buildOAuthState, setOAuthNonce } from "@/lib/oauth/state";

/**
 * GET /api/auth/salla
 *
 * Initiates the Salla OAuth 2.0 flow.
 * Redirects the authenticated DropLinker merchant to Salla's authorization page.
 * On success, Salla redirects back to /api/auth/salla/callback with an auth code.
 */
export async function GET(request: NextRequest) {
  // 1. Ensure the user is logged in to DropLinker first
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 1.5. Validate subscription limits
  const { data: merchantData } = await supabase
    .from("merchants")
    .select("plan")
    .eq("id", user.id)
    .single();

  const planName = merchantData?.plan || "free";
  const { data: tierData } = await supabase
    .from("subscription_tiers")
    .select("max_stores")
    .ilike("name", planName)
    .single();

  const maxStores = tierData?.max_stores || 1;

  const { count: currentStoreCount } = await supabase
    .from("stores")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", user.id);

  if (currentStoreCount !== null && currentStoreCount >= maxStores) {
    console.error(`[Salla OAuth] Merchant ${user.id} reached max stores (${maxStores})`);
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=max_stores_reached", request.url)
    );
  }

  // 2. Validate Salla credentials are configured
  const clientId = process.env.SALLA_CLIENT_ID;
  if (!clientId) {
    console.error("[Salla OAuth] SALLA_CLIENT_ID is not configured in .env.local");
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=salla_not_configured", request.url)
    );
  }

  // 3. Build the callback URL (pinned to PUBLIC_BASE_URL when set)
  const origin = resolveOrigin(request);
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
