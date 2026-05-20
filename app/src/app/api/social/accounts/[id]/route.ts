import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/social/accounts/:id
 * Disconnect a social media account.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { error } = await supabase
      .from("social_accounts")
      .delete()
      .eq("id", id)
      .eq("merchant_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[social/accounts/:id] DELETE error:", err);
    return NextResponse.json({ error: "Failed to disconnect account" }, { status: 500 });
  }
}

/**
 * PATCH /api/social/accounts/:id
 * Update a social media account (toggle active, update token, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "is_active", "account_name", "access_token", "refresh_token",
      "token_expires_at", "blotato_credentials",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("social_accounts")
      .update(updates)
      .eq("id", id)
      .eq("merchant_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ account: data });
  } catch (err) {
    console.error("[social/accounts/:id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
