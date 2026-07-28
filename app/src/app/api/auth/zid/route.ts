import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveOrigin, buildOAuthState, setOAuthNonce } from "@/lib/oauth/state";

/**
 * GET /api/auth/zid
 *
 * Initiates the Zid OAuth 2.0 flow.
 * Redirects the authenticated DropLinker merchant to Zid's authorization page.
 * On success, Zid redirects back to /api/auth/zid/callback with an auth code.
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

  const maxStores = tierData?.max_stores || 10;

  const { count: currentStoreCount } = await supabase
    .from("stores")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", user.id);

  if (currentStoreCount !== null && currentStoreCount >= maxStores) {
    console.error(`[Zid OAuth] Merchant ${user.id} reached max stores (${maxStores})`);
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=max_stores_reached", request.url)
    );
  }

  // 2. Validate Zid credentials are configured
  const clientId = process.env.ZID_CLIENT_ID;
  const oauthUrl = process.env.ZID_OAUTH_URL || "https://oauth.zid.sa";

  if (!clientId) {
    console.error("[Zid OAuth] ZID_CLIENT_ID is not configured in .env.local");
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=zid_not_configured", request.url)
    );
  }

  // 3. Build the callback URL (pinned to PUBLIC_BASE_URL when set)
  const origin = resolveOrigin(request);
  const redirectUri = `${origin}/api/auth/zid/callback`;

  // 4. Bind the OAuth state to the merchant id + a random CSRF nonce
  const { state, nonce } = buildOAuthState(user.id);

  // 5. Build the Zid authorization URL
  const authUrl = new URL(`${oauthUrl}/oauth/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  console.log("[Zid OAuth] Redirecting merchant to Zid authorization:", authUrl.toString());

  const res = NextResponse.redirect(authUrl.toString());
  setOAuthNonce(res, "zid_oauth_nonce", nonce);
  return res;
}
