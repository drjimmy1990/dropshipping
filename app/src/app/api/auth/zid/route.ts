import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveOrigin, buildOAuthState, setOAuthNonce } from "@/lib/oauth/state";
import { getStoreLimit } from "@/lib/plan/storeLimit";

/**
 * GET /api/auth/zid
 *
 * Initiates the Zid OAuth 2.0 flow.
 * Redirects the authenticated DropLinker merchant to Zid's authorization page.
 * On success, Zid redirects back to /api/auth/zid/callback with an auth code.
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
    console.error("[Zid OAuth] plan limit lookup failed:", limit.error);
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=store_count_failed", origin)
    );
  }

  const { count: currentStoreCount, error: storeCountError } = await supabase
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", user.id);

  if (storeCountError || currentStoreCount === null) {
    console.error("[Zid OAuth] store count failed:", storeCountError);
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=store_count_failed", origin)
    );
  }

  if (currentStoreCount >= limit.maxStores) {
    console.error(`[Zid OAuth] Merchant ${user.id} reached max stores (${limit.maxStores})`);
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=max_stores_reached", origin)
    );
  }

  // 2. Validate Zid credentials are configured
  const clientId = process.env.ZID_CLIENT_ID;
  const oauthUrl = process.env.ZID_OAUTH_URL || "https://oauth.zid.sa";

  if (!clientId) {
    console.error("[Zid OAuth] ZID_CLIENT_ID is not configured in .env.local");
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=zid_not_configured", origin)
    );
  }

  // 3. Build the callback URL (pinned to PUBLIC_BASE_URL when set)
  const redirectUri = `${origin}/api/auth/zid/callback`;

  // 4. Bind the OAuth state to the merchant id + a random CSRF nonce
  const { state, nonce } = buildOAuthState(user.id);

  // 5. Build the Zid authorization URL
  const authUrl = new URL(`${oauthUrl}/oauth/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  // Destination only — NEVER authUrl.toString(). The query string carries
  // `state=<userId>:<nonce>`, and the nonce is now the SOLE CSRF control for the
  // callback. Writing it to ~/.pm2/logs would hand anyone with log access a
  // userId:nonce pair valid for 600s — enough to forge
  // /api/auth/zid/callback?code=<attacker>&state=<uuid>:<nonce> and bind their own
  // store to this merchant's account: exactly the attack the mandatory nonce closes.
  console.log(
    "[Zid OAuth] Redirecting merchant to Zid authorization:",
    `${authUrl.origin}${authUrl.pathname}`
  );

  const res = NextResponse.redirect(authUrl.toString());
  setOAuthNonce(res, "zid_oauth_nonce", nonce);
  return res;
}
