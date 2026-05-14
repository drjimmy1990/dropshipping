"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/stores/[id]/disconnect
 *
 * Disconnects a store by setting is_active = false.
 * Only the owning merchant can disconnect their own store.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: storeId } = await params;

  // Verify the user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the store belongs to this merchant
  const adminClient = createAdminClient();
  const { data: store } = await adminClient
    .from("stores")
    .select("id, merchant_id")
    .eq("id", storeId)
    .maybeSingle();

  if (!store || store.merchant_id !== user.id) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Deactivate the store
  const { error } = await adminClient
    .from("stores")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);

  if (error) {
    console.error("[Disconnect Store] Failed:", error);
    return NextResponse.json(
      { error: "Failed to disconnect store" },
      { status: 500 }
    );
  }

  console.log(
    `[Disconnect Store] ✅ Store ${storeId} disconnected by merchant ${user.id}`
  );
  return NextResponse.json({ status: "ok", message: "Store disconnected" });
}
