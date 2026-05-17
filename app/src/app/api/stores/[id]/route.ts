"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * DELETE /api/stores/[id]
 *
 * Permanently removes a store record and its associated data.
 * Only the owning merchant can delete their own store.
 */
export async function DELETE(
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
    .select("id, merchant_id, store_name")
    .eq("id", storeId)
    .maybeSingle();

  if (!store || store.merchant_id !== user.id) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Delete the store record
  const { error } = await adminClient
    .from("stores")
    .delete()
    .eq("id", storeId);

  if (error) {
    console.error("[Delete Store] Failed:", error);
    return NextResponse.json(
      { error: "Failed to delete store" },
      { status: 500 }
    );
  }

  console.log(
    `[Delete Store] ✅ Store "${store.store_name}" (${storeId}) deleted by merchant ${user.id}`
  );
  return NextResponse.json({ status: "ok", message: "Store removed" });
}
