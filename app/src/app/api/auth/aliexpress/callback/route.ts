import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
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
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/admin/settings?error=no_code", req.url));
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
      console.error("[AliExpress Auth] API error:", data);
      return NextResponse.redirect(new URL("/admin/settings?error=auth_failed", req.url));
    }

    const { access_token, refresh_token } = data;

    if (!access_token) {
      console.error("[AliExpress Auth] No token in response:", data);
      return NextResponse.redirect(new URL("/admin/settings?error=no_token", req.url));
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

    return NextResponse.redirect(new URL("/admin/settings?aliexpress=success", req.url));
  } catch (error) {
    console.error("[AliExpress Auth] Route error:", error);
    return NextResponse.redirect(new URL("/admin/settings?error=internal", req.url));
  }
}
