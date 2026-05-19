"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/supabase/types";

interface ProductsState {
  products: Product[];
  total: number;
  activeCount: number;
  outOfStockCount: number;
  syncedCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleActive: (id: string) => Promise<{ success: boolean; error?: string }>;
  pushToStore: (id: string, targetPlatform?: string) => Promise<{ success: boolean; error?: string; storeProductId?: string; platform?: string }>;
}

/**
 * Fetches the current merchant's products with full mutation capabilities.
 */
export function useProducts(): ProductsState {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error: err } = await supabase
      .from("products")
      .select("*")
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false });

    if (err) { setError(err.message); setLoading(false); return; }

    setProducts((data || []) as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ---------- Mutations ----------

  /**
   * Update a product's editable fields via PATCH /api/products/:id
   */
  const updateProduct = useCallback(async (
    id: string,
    updates: Partial<Product>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        return { success: false, error: data.error || "Update failed" };
      }

      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
      );

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Update failed" };
    }
  }, []);

  /**
   * Delete a product via DELETE /api/products/:id
   * Also removes from Salla if synced.
   */
  const deleteProduct = useCallback(async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || "Delete failed" };
      }

      // Remove from local state
      setProducts((prev) => prev.filter((p) => p.id !== id));

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Delete failed" };
    }
  }, []);

  /**
   * Toggle a product's is_active status
   */
  const toggleActive = useCallback(async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    const product = products.find((p) => p.id === id);
    if (!product) return { success: false, error: "Product not found" };

    return updateProduct(id, { is_active: !product.is_active });
  }, [products, updateProduct]);

  /**
   * Push a product to the merchant's connected store (Salla or Zid)
   */
  const pushToStore = useCallback(async (
    id: string,
    targetPlatform?: string
  ): Promise<{ success: boolean; error?: string; storeProductId?: string; platform?: string }> => {
    try {
      const response = await fetch(`/api/products/${id}/push`, {
        method: "POST",
        ...(targetPlatform ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetPlatform }),
        } : {}),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || "Push to store failed" };
      }

      // Update local state with the store product ID and store
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, store_product_id: String(data.storeProductId), store_id: data.storeId || p.store_id, updated_at: new Date().toISOString() }
            : p
        )
      );

      return { success: true, storeProductId: data.storeProductId, platform: data.platform };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Push failed" };
    }
  }, []);

  // ---------- Computed Stats ----------

  const activeCount = products.filter((p) => p.is_active).length;
  const outOfStockCount = products.filter((p) => !p.in_stock).length;
  const syncedCount = products.filter((p) => p.store_product_id).length;

  return {
    products,
    total: products.length,
    activeCount,
    outOfStockCount,
    syncedCount,
    loading,
    error,
    refetch: fetchProducts,
    updateProduct,
    deleteProduct,
    toggleActive,
    pushToStore,
  };
}
