import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveOrigin, buildOAuthState, setOAuthNonce } from "@/lib/oauth/state";

/**
 * GET /api/auth/aliexpress
 *
 * Initiates the AliExpress Open Platform OAuth flow.
 *
 * This is the ONLY place the `aliexpress_oauth_nonce` cookie is issued, and the
 * callback now refuses any request without a matching one. The flow is admin-only:
 * the callback writes the PLATFORM-wide access/refresh tokens that every merchant's
 * sourcing traffic runs through, so a non-admin must never be able to start it.
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

  // 2. Admin-only — fails CLOSED: a lookup error leaves `me` null and we refuse.
  const roleClient = createAdminClient();
  const { data: me, error: roleError } = await roleClient
    .from("merchants")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!me || me.role !== "admin") {
    console.error(
      "[AliExpress OAuth] Non-admin attempted to start platform connect:",
      user.id,
      roleError
    );
    return NextResponse.redirect(new URL("/admin/settings?error=not_admin", origin));
  }

  // 3. Validate AliExpress credentials are configured (server-side only — the
  //    app key used here MUST be the same one the callback signs the exchange with).
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  if (!appKey) {
    console.error("[AliExpress OAuth] ALIEXPRESS_APP_KEY is not configured");
    return NextResponse.redirect(
      new URL("/admin/settings?error=aliexpress_not_configured", origin)
    );
  }

  // 4. Bind the OAuth state to the admin's user id + a random CSRF nonce
  const { state, nonce } = buildOAuthState(user.id);

  // 5. Build the AliExpress authorization URL
  const apiUrl = (process.env.ALIEXPRESS_API_URL || "https://api-sg.aliexpress.com").replace(
    /\/+$/,
    ""
  );
  const authUrl = new URL(`${apiUrl}/oauth/authorize`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("force_auth", "true");
  authUrl.searchParams.set("client_id", appKey);
  authUrl.searchParams.set("redirect_uri", `${origin}/api/auth/aliexpress/callback`);
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  setOAuthNonce(res, "aliexpress_oauth_nonce", nonce);
  return res;
}
