import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { deleteSallaProduct, SallaApiError } from "@/lib/salla/client";

/**
 * PATCH /api/products/:id
 *
 * Updates a product's editable fields (retail_price, is_active, title, etc.)
 * Only the owning merchant can update their products.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Whitelist allowed update fields
    const allowedFields = [
      "retail_price",
      "is_active",
      "title_en",
      "title_ar",
      "description_en",
      "description_ar",
      "margin_type",
      "margin_value",
      "min_stock_threshold",
      "auto_hide_when_low",
      "tags",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const adminClient = createAdminClient();

    // Verify ownership and update
    const { data, error } = await adminClient
      .from("products")
      .update(updates)
      .eq("id", id)
      .eq("merchant_id", user.id)
      .select("id, retail_price, is_active, store_product_id")
      .single();

    if (error) {
      console.error("[Products PATCH] Update failed:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product: data });
  } catch (error) {
    console.error("[Products PATCH] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/:id
 *
 * Deletes a product from DropLinker.
 * If the product is synced to Salla (has store_product_id), also deletes from Salla.
 * Only the owning merchant can delete their products.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = createAdminClient();

    // 1. Fetch the product (verify ownership + get Salla ID)
    const { data: product, error: fetchError } = await adminClient
      .from("products")
      .select("id, store_product_id, store_id")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // 2. If synced to Salla, delete from Salla first
    let sallaDeleteError: string | null = null;
    if (product.store_product_id && product.store_id) {
      try {
        const { data: store } = await adminClient
          .from("stores")
          .select("access_token, refresh_token")
          .eq("id", product.store_id)
          .single();

        if (store?.access_token && store?.refresh_token) {
          await deleteSallaProduct(
            {
              accessToken: store.access_token,
              refreshToken: store.refresh_token,
              storeId: product.store_id,
              onTokenRefresh: async (storeId, newAccess, newRefresh) => {
                await adminClient
                  .from("stores")
                  .update({
                    access_token: newAccess,
                    refresh_token: newRefresh,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", storeId);
              },
            },
            Number(product.store_product_id)
          );
        }
      } catch (err) {
        // Log but don't block the DB delete
        sallaDeleteError =
          err instanceof SallaApiError
            ? err.sallaMessage ?? "Salla API error"
            : "Failed to delete from Salla";
        console.error("[Products DELETE] Salla delete failed:", sallaDeleteError);
      }
    }

    // 3. Delete from Supabase
    const { error: deleteError } = await adminClient
      .from("products")
      .delete()
      .eq("id", id)
      .eq("merchant_id", user.id);

    if (deleteError) {
      console.error("[Products DELETE] DB delete failed:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...(sallaDeleteError && { sallaWarning: sallaDeleteError }),
    });
  } catch (error) {
    console.error("[Products DELETE] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
