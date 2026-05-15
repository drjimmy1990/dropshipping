import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * POST /api/suppliers/aliexpress/feeds/sync
 *
 * Calls aliexpress.ds.feedname.get to fetch all available feed names
 * from the AliExpress API, including product counts.
 * 
 * Admin-only endpoint.
 */

function getAliExpressConfig() {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  const apiUrl = process.env.ALIEXPRESS_API_URL || "https://api-sg.aliexpress.com";

  if (!appKey || !appSecret) {
    throw new Error("ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET must be set");
  }

  return { appKey, appSecret, apiUrl };
}

async function getAccessToken(): Promise<string | undefined> {
  if (process.env.ALIEXPRESS_ACCESS_TOKEN) {
    return process.env.ALIEXPRESS_ACCESS_TOKEN;
  }
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("platform_config")
      .select("value")
      .eq("key", "aliexpress_access_token")
      .single();
    if (data?.value) {
      let token = data.value as string;
      if (token.startsWith('"') && token.endsWith('"')) token = token.slice(1, -1);
      return token;
    }
  } catch {}
  return undefined;
}

function generateSignature(params: Record<string, string>, appSecret: string, apiName: string): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = apiName;
  for (const key of sortedKeys) {
    signStr += `${key}${params[key]}`;
  }
  return crypto.createHmac("sha256", appSecret).update(signStr, "utf8").digest("hex").toUpperCase();
}

export async function POST() {
  try {
    // Auth check — admin only
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super_admin
    const { data: merchant } = await supabase
      .from("merchants")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (merchant?.role !== "super_admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const config = getAliExpressConfig();
    const accessToken = await getAccessToken();

    const method = "aliexpress.ds.feedname.get";
    const systemParams: Record<string, string> = {
      app_key: config.appKey,
      method,
      timestamp: Date.now().toString(),
      sign_method: "sha256",
      v: "2.0",
      format: "json",
    };

    if (accessToken) {
      systemParams.session = accessToken;
      systemParams.access_token = accessToken;
    }

    const sign = generateSignature(systemParams, config.appSecret, method);
    systemParams.sign = sign;

    const body = new URLSearchParams(systemParams).toString();
    const response = await fetch(`${config.apiUrl}/rest`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body,
    });

    const data = await response.json();
    const responseKey = method.replace(/\./g, "_") + "_response";
    const result = data[responseKey] || data;

    // Parse promos list
    const respResult = result?.resp_result || result;
    const feedResult = respResult?.result || respResult;
    const promos = feedResult?.promos || [];

    // Map to our feed format
    const feeds = promos.map((promo: any, index: number) => ({
      id: promo.promo_name || `feed_${index}`,
      name: promo.promo_name || "",
      description: promo.promo_desc || "",
      productCount: promo.product_num || 0,
      sortOrder: index,
    }));

    return NextResponse.json({ 
      feeds,
      totalFeeds: feeds.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Feeds Sync] Error:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message, feeds: [] }, { status: 500 });
  }
}
