import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getZidCategories, ZidApiError } from "@/lib/zid/client";

/**
 * GET /api/zid/categories
 *
 * Lists categories from the merchant's Zid store.
 * Zid API: GET /v1/managers/store/categories
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get merchant's active Zid store
    const { data: store } = await adminClient
      .from("stores")
      .select("id, access_token, refresh_token, partner_token, platform_store_id")
      .eq("merchant_id", user.id)
      .eq("platform", "zid")
      .eq("is_active", true)
      .maybeSingle();

    if (!store || !store.access_token) {
      return NextResponse.json(
        { error: "No active Zid store connected" },
        { status: 400 }
      );
    }

    const categories = await getZidCategories({
      accessToken: store.access_token,
      refreshToken: store.refresh_token || "",
      partnerToken: store.partner_token || store.access_token,
      storeId: store.platform_store_id || store.id,
      onTokenRefresh: async (storeId, newAccess, newRefresh, newPartner) => {
        await adminClient
          .from("stores")
          .update({
            access_token: newAccess,
            refresh_token: newRefresh,
            ...(newPartner ? { partner_token: newPartner } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", store.id);
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[Zid Categories] Error:", error);

    if (error instanceof ZidApiError) {
      return NextResponse.json(
        { error: `Zid API error: ${error.zidMessage}` },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
