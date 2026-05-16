import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // 2. Validate Zid credentials are configured
  const clientId = process.env.ZID_CLIENT_ID;
  const oauthUrl = process.env.ZID_OAUTH_URL || "https://oauth.zid.sa";

  if (!clientId) {
    console.error("[Zid OAuth] ZID_CLIENT_ID is not configured in .env.local");
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=zid_not_configured", request.url)
    );
  }

  // 3. Build the callback URL (dynamically based on the request origin)
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/zid/callback`;

  // 4. Use the merchant's DropLinker user ID as the OAuth state parameter
  //    to map the callback back to the correct merchant
  const state = user.id;

  // 5. Build the Zid authorization URL
  const authUrl = new URL(`${oauthUrl}/oauth/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  console.log("[Zid OAuth] Redirecting merchant to Zid authorization:", authUrl.toString());

  return NextResponse.redirect(authUrl.toString());
}
