import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCJPlatformToken, getCJCategories } from "@/lib/cj/client";

/**
 * GET /api/suppliers/cj/categories
 * Returns CJ category tree for filter dropdowns.
 * Uses platform-level API key.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cjToken = await getCJPlatformToken();
    if (!cjToken) {
      return NextResponse.json(
        { error: "CJ API not configured." },
        { status: 503 }
      );
    }

    const categories = await getCJCategories(cjToken);

    // Flatten to a simple list for the UI dropdown
    const flatCategories: { id: string; name: string; parent: string }[] = [];
    for (const l1 of categories) {
      for (const l2 of l1.categoryFirstList) {
        for (const l3 of l2.categorySecondList) {
          flatCategories.push({
            id: l3.categoryId,
            name: `${l1.categoryFirstName} > ${l2.categorySecondName} > ${l3.categoryName}`,
            parent: l2.categorySecondName,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      categories: flatCategories,
      tree: categories,
    });
  } catch (error: any) {
    console.error("[CJ Categories] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch CJ categories" },
      { status: 500 }
    );
  }
}
