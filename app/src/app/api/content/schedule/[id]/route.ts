import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/content/schedule/:id
 * Update a scheduled post (reschedule, cancel).
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
      "status", "scheduled_at", "is_recurring", "recurrence_rule",
      "social_account_id",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("scheduled_posts")
      .update(updates)
      .eq("id", id)
      .eq("merchant_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data });
  } catch (err) {
    console.error("[content/schedule/:id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}

/**
 * DELETE /api/content/schedule/:id
 * Cancel a scheduled post.
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
      .from("scheduled_posts")
      .delete()
      .eq("id", id)
      .eq("merchant_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[content/schedule/:id] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
