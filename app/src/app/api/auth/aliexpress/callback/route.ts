import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveOrigin, verifyOAuthCallback, clearOAuthNonce } from "@/lib/oauth/state";
import { redact } from "@/lib/log/redact";
import crypto from "crypto";

const APP_KEY = process.env.ALIEXPRESS_APP_KEY || "";
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || "";
const API_URL = process.env.ALIEXPRESS_API_URL || "https://api-sg.aliexpress.com";

function generateSignature(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = "/auth/token/create";
  for (const key of sortedKeys) {
    signStr += `${key}${params[key]}`;
  }
  return crypto.createHmac("sha256", APP_SECRET).update(signStr, "utf8").digest("hex").toUpperCase();
}

export async function GET(req: NextRequest) {
  // Pinned to PUBLIC_BASE_URL when set — never derived from req.url, which a
  // spoofed x-forwarded-host could point at another origin.
  const baseUrl = resolveOrigin(req);

  // Every exit from this route burns the nonce cookie so a single-use flow
  // cannot be replayed for the rest of its 600s TTL.
  const failRedirect = (slug: string) => {
    const res = NextResponse.redirect(new URL(`/admin/settings?error=${slug}`, baseUrl));
    clearOAuthNonce(res, "aliexpress_oauth_nonce");
    return res;
  };

  // --- Admin-only: this callback overwrites the PLATFORM AliExpress tokens,
  //     so require an authenticated admin session (CRIT-7). This check runs
  //     FIRST — before `code` is even read — so a stranger's forged callback
  //     never reaches the exchange and never learns whether a code was valid. ---
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    const res = NextResponse.redirect(new URL("/auth/login", baseUrl));
    clearOAuthNonce(res, "aliexpress_oauth_nonce");
    return res;
  }
  const roleClient = createAdminClient();
  const { data: me, error: roleError } = await roleClient
    .from("merchants")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!me || me.role !== "admin") {
    console.error(
      "[AliExpress Auth] Non-admin attempted to connect platform tokens:",
      user.id,
      roleError
    );
    return failRedirect("not_admin");
  }

  // --- CSRF: the `state` must carry the nonce issued by GET /api/auth/aliexpress
  //     to this same admin session. Without it an attacker could get an admin's
  //     browser to exchange the ATTACKER's code into platform_config. ---
  const state = req.nextUrl.searchParams.get("state") ?? "";
  const verified = verifyOAuthCallback(req, "aliexpress_oauth_nonce", state, user.id);
  if (!verified) {
    console.error("[AliExpress Auth] Session/state mismatch — refusing token exchange");
    return failRedirect("aliexpress_auth_mismatch");
  }

  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return failRedirect("no_code");
  }

  try {
    const params: Record<string, string> = {
      app_key: APP_KEY,
      timestamp: Date.now().toString(),
      sign_method: "sha256",
      code: code,
    };

    params.sign = generateSignature(params);
    const body = new URLSearchParams(params).toString();

    const response = await fetch(`${API_URL}/rest/auth/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body,
    });

    const data = await response.json();

    if (data.code && data.code !== "0" && data.code !== 0) {
      console.error("[AliExpress Auth] API error:", JSON.stringify(redact(data)));
      return failRedirect("auth_failed");
    }

    const { access_token, refresh_token } = data;

    if (!access_token) {
      console.error("[AliExpress Auth] No token in response:", JSON.stringify(redact(data)));
      return failRedirect("no_token");
    }

    // Save to Supabase using admin client
    const supabase = createAdminClient();

    // The platform_config table stores values as JSONB
    const { error: err1 } = await supabase.from("platform_config").upsert({
      key: "aliexpress_access_token",
      value: `"${access_token}"`,
      description: "Master access token for AliExpress Open Platform",
    }, { onConflict: "key" });

    if (err1) console.error("[AliExpress Auth] Failed to save access token:", err1);

    if (refresh_token) {
      const { error: err2 } = await supabase.from("platform_config").upsert({
        key: "aliexpress_refresh_token",
        value: `"${refresh_token}"`,
        description: "Master refresh token for AliExpress Open Platform",
      }, { onConflict: "key" });
      
      if (err2) console.error("[AliExpress Auth] Failed to save refresh token:", err2);
    }

    const res = NextResponse.redirect(new URL("/admin/settings?aliexpress=success", baseUrl));
    clearOAuthNonce(res, "aliexpress_oauth_nonce");
    return res;
  } catch (error) {
    console.error("[AliExpress Auth] Route error:", error);
    return failRedirect("internal");
  }
}
