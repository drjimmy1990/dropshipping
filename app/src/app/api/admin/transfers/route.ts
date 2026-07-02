import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/transfers
 *
 * Admin-only bank-transfer approve/reject. Moved server-side so the wallet
 * credit no longer runs from the browser (CRIT-2). The admin identity is taken
 * from the authenticated session — never trusted from the request body.
 *
 * Body: { transferId: string, action: "approve" | "reject", notes?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth — must be a logged-in admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: me } = await admin
      .from("merchants")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!me || me.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // 2. Validate body
    const body = await request.json().catch(() => null);
    const transferId: string | undefined = body?.transferId;
    const action: string | undefined = body?.action;
    const notes: string | null = typeof body?.notes === "string" ? body.notes : null;

    if (!transferId || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { error: "transferId and action ('approve' | 'reject') are required" },
        { status: 400 }
      );
    }

    // 3. Load the transfer (service-role read; must still be pending)
    const { data: transfer, error: loadErr } = await admin
      .from("bank_transfers")
      .select("id, merchant_id, amount, status, reference_number")
      .eq("id", transferId)
      .single();

    if (loadErr || !transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }
    if (transfer.status !== "pending") {
      return NextResponse.json(
        { error: `Transfer already ${transfer.status}` },
        { status: 409 }
      );
    }

    // 4a. Reject
    if (action === "reject") {
      const { error } = await admin
        .from("bank_transfers")
        .update({
          status: "rejected",
          approved_by: user.id,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", transferId)
        .eq("status", "pending");
      if (error) {
        console.error("[admin/transfers] reject failed:", error.message);
        return NextResponse.json({ error: "Failed to reject transfer" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // 4b. Approve — flip to approved only if still pending (guards double-credit)
    const { data: updRows, error: updErr } = await admin
      .from("bank_transfers")
      .update({
        status: "approved",
        approved_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", transferId)
      .eq("status", "pending")
      .select("id");

    if (updErr) {
      console.error("[admin/transfers] approve update failed:", updErr.message);
      return NextResponse.json({ error: "Failed to approve transfer" }, { status: 500 });
    }
    if (!updRows || updRows.length === 0) {
      return NextResponse.json({ error: "Transfer already processed" }, { status: 409 });
    }

    // 5. Credit the wallet atomically via the (now DEFINER, service-role-only) RPC
    const { error: creditErr } = await admin.rpc("wallet_credit", {
      p_merchant_id: transfer.merchant_id,
      p_amount: transfer.amount,
      p_method: "bank_transfer",
      p_description: `Bank transfer approved — Ref: ${transfer.reference_number || transferId.slice(0, 8)}`,
      p_reference: transferId,
    });

    if (creditErr) {
      console.error("[admin/transfers] wallet_credit failed, rolling back:", creditErr.message);
      const { error: revErr } = await admin
        .from("bank_transfers")
        .update({ status: "pending", approved_by: null, reviewed_at: null })
        .eq("id", transferId);
      if (revErr) console.error("[admin/transfers] rollback failed:", revErr.message);
      return NextResponse.json(
        { error: "Failed to credit wallet; approval rolled back" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin/transfers] error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
