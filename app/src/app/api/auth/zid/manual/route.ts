import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStoreLimit } from "@/lib/plan/storeLimit";

/**
 * POST /api/auth/zid/manual
 *
 * Manual Zid token connection — uses Zid's Direct Integration (الربط المباشر).
 * The merchant provides their Manager Token and Store ID from the Zid dashboard
 * (Settings → Integrations → Direct Integration).
 *
 * Body: { accessToken, storeId }
 *   - accessToken = The Manager Token (المفتاح الخاص بالتاجر) from Zid dashboard
 *   - storeId     = Store ID (معرّف المتجر) from Zid dashboard
 */
export async function POST(request: NextRequest) {
  // 1. Ensure the user is logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1.5. Validate subscription limits (fails CLOSED; JSON only — the caller parses data.error)
  const limit = await getStoreLimit(supabase, user.id);
  if ("error" in limit) {
    console.error("[Zid Manual] plan limit lookup failed:", limit.error);
    return NextResponse.json({ error: "Could not verify plan limits" }, { status: 500 });
  }

  const { count: currentStoreCount, error: storeCountError } = await supabase
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", user.id);

  if (storeCountError || currentStoreCount === null) {
    console.error("[Zid Manual] store count failed:", storeCountError);
    return NextResponse.json({ error: "Could not verify plan limits" }, { status: 500 });
  }

  if (currentStoreCount >= limit.maxStores) {
    return NextResponse.json({ error: "max_stores_reached" }, { status: 403 });
  }

  // 2. Parse the body
  let body: {
    accessToken?: string;
    storeId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { accessToken, storeId } = body;

  if (!accessToken || !storeId) {
    return NextResponse.json(
      { error: "Manager Token and Store ID are required" },
      { status: 400 }
    );
  }

  try {
    // 3. Try to get a Partner/Authorization token from our app credentials
    //    This uses OAuth client_credentials to get our app-level JWT
    let partnerToken: string | null = null;

    const clientId = process.env.ZID_CLIENT_ID;
    const clientSecret = process.env.ZID_CLIENT_SECRET;
    const oauthUrl = process.env.ZID_OAUTH_URL || "https://oauth.zid.sa";

    if (clientId && clientSecret) {
      try {
        console.log("[Zid Manual] Attempting to get app Authorization token...");
        const tokenRes = await fetch(`${oauthUrl}/oauth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          partnerToken = tokenData.access_token || tokenData.token || null;
          console.log("[Zid Manual] Got app Authorization token ✅");
        } else {
          console.warn(
            "[Zid Manual] client_credentials grant failed (non-blocking):",
            tokenRes.status
          );
        }
      } catch (err) {
        console.warn("[Zid Manual] OAuth token request failed (non-blocking):", err);
      }
    }

    // 4. Validate the token by calling Zid's profile endpoint
    //    Use our partner token if we have one, otherwise try the manager token
    console.log("[Zid Manual] Validating tokens by fetching store profile...");

    const authHeader = partnerToken
      ? `Bearer ${partnerToken}`
      : `Bearer ${accessToken}`;

    const profileResponse = await fetch(
      "https://api.zid.sa/v1/managers/account/profile",
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "X-Manager-Token": accessToken,
          "Access-Token": accessToken,
          "Store-Id": storeId,
          Role: "Manager",
          "Accept-Language": "en",
          Accept: "application/json",
        },
      }
    );

    let storeName = "Zid Store";
    let storeUrl: string | null = null;

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log("[Zid Manual] Profile fetched successfully ✅");

      const store =
        profileData?.user?.store ||
        profileData?.store ||
        profileData?.data?.store ||
        {};
      storeName =
        store.name ||
        store.title ||
        profileData?.user?.name ||
        "Zid Store";
      storeUrl = store.url || store.link || null;
    } else {
      const errorText = await profileResponse.text();
      console.warn(
        "[Zid Manual] Profile fetch failed:",
        profileResponse.status,
        errorText
      );
      // If profile fails completely, tokens might be invalid
      if (profileResponse.status === 401 || profileResponse.status === 403) {
        return NextResponse.json(
          {
            error:
              "Invalid Manager Token. Please copy a fresh token from your Zid dashboard (Settings → Integrations → الربط المباشر).",
          },
          { status: 401 }
        );
      }
      // For other errors, continue (non-blocking)
    }

    // 5. Upsert the store record in Supabase
    const adminClient = createAdminClient();
    const merchantId = user.id;

    // Ensure merchant row exists to prevent foreign key errors.
    // ignoreDuplicates: true => ON CONFLICT DO NOTHING, so reconnecting never resets
    // an existing merchant's real business_name back to "My Store".
    const { error: merchantErr } = await adminClient
      .from("merchants")
      .upsert(
        { id: merchantId, email: user?.email || "", business_name: "My Store" },
        { onConflict: "id", ignoreDuplicates: true }
      );
    if (merchantErr) {
      console.error("[Zid Manual] merchant ensure failed:", merchantErr);
      return NextResponse.json(
        { error: "Failed to save store record" },
        { status: 500 }
      );
    }

    // Check if merchant already has a Zid store
    const { data: existingStore } = await adminClient
      .from("stores")
      .select("id")
      .eq("merchant_id", merchantId)
      .eq("platform", "zid")
      .maybeSingle();

    const storeRecord = {
      store_name: storeName,
      store_url: storeUrl,
      platform_store_id: storeId,
      access_token: accessToken,
      refresh_token: null,
      partner_token: partnerToken || null,
      is_active: true,
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingStore) {
      const { error: updateError } = await adminClient
        .from("stores")
        .update(storeRecord)
        .eq("id", existingStore.id);

      if (updateError) {
        console.error("[Zid Manual] ❌ Store UPDATE failed:", updateError);
        return NextResponse.json(
          { error: "Failed to update store record" },
          { status: 500 }
        );
      }
      console.log("[Zid Manual] ✅ Store updated");
    } else {
      const { error: insertError } = await adminClient.from("stores").insert({
        merchant_id: merchantId,
        platform: "zid" as const,
        ...storeRecord,
      });

      if (insertError) {
        console.error("[Zid Manual] ❌ Store INSERT failed:", insertError);
        return NextResponse.json(
          { error: "Failed to save store record" },
          { status: 500 }
        );
      }
      console.log("[Zid Manual] ✅ Store inserted");
    }

    console.log(
      `[Zid Manual] Store "${storeName}" connected for merchant ${merchantId}`
    );

    return NextResponse.json({
      success: true,
      storeName,
      storeUrl,
      message: "Zid store connected successfully",
    });
  } catch (error) {
    console.error("[Zid Manual] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected error connecting Zid store" },
      { status: 500 }
    );
  }
}
