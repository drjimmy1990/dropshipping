"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/supabase/types";

interface ProductsState {
  products: Product[];
  total: number;
  activeCount: number;
  outOfStockCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches the current merchant's products.
 */
export function useProducts(): ProductsState {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
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

  useEffect(() => { fetch(); }, [fetch]);

  const activeCount = products.filter((p) => p.is_active).length;
  const outOfStockCount = products.filter((p) => !p.in_stock).length;

  return {
    products,
    total: products.length,
    activeCount,
    outOfStockCount,
    loading,
    error,
    refetch: fetch,
  };
}
