import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // 2. Validate Salla credentials are configured
  const clientId = process.env.SALLA_CLIENT_ID;
  if (!clientId) {
    console.error("[Salla OAuth] SALLA_CLIENT_ID is not configured in .env.local");
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=salla_not_configured", request.url)
    );
  }

  // 3. Build the callback URL (dynamically based on the request origin)
  const origin = request.nextUrl.origin;
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

  // 5. Use the merchant's DropLinker user ID as the OAuth state parameter
  //    to map the callback back to the correct merchant
  const state = user.id;

  // 6. Build the Salla authorization URL
  const authUrl = new URL("https://accounts.salla.sa/oauth2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
