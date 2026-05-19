"use client";

import { useState, useCallback, useRef } from "react";
import type {
  NormalizedProduct,
  NormalizedProductDetail,
} from "@/lib/aliexpress/types";

// ---------- Types ----------

interface SearchState {
  products: NormalizedProduct[];
  totalPages: number;
  totalCount: number;
  page: number;
  loading: boolean;
  error: string | null;
}

interface DetailState {
  product: NormalizedProductDetail | null;
  loading: boolean;
  error: string | null;
}

interface ImportState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// ---------- Hook ----------

/**
 * Client-side hook for AliExpress product discovery.
 * Provides search, detail view, and import functionality.
 */
export function useProductSearch(supplier: "aliexpress" | "cj" = "aliexpress") {
  // Search state
  const [search, setSearch] = useState<SearchState>({
    products: [],
    totalPages: 0,
    totalCount: 0,
    page: 1,
    loading: false,
    error: null,
  });

  // Product detail state
  const [detail, setDetail] = useState<DetailState>({
    product: null,
    loading: false,
    error: null,
  });

  // Import state
  const [importState, setImportState] = useState<ImportState>({
    loading: false,
    error: null,
    success: false,
  });

  // Debounce timer ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ---------- Search ----------

  const searchProducts = useCallback(
    async (params: {
      keyword?: string;
      feedName?: string;
      category?: string;
      page?: number;
      sort?: string;
      minPrice?: number;
      maxPrice?: number;
      shipTo?: string;
    }) => {
      setSearch((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const query = new URLSearchParams();
        if (params.keyword) query.set("keyword", params.keyword);
        if (params.feedName) query.set("feedName", params.feedName);
        if (params.category) query.set("category", params.category);
        if (params.page) query.set("page", String(params.page));
        if (params.sort) query.set("sort", params.sort);
        if (params.minPrice) query.set("minPrice", String(params.minPrice));
        if (params.maxPrice) query.set("maxPrice", String(params.maxPrice));
        if (params.shipTo) query.set("shipTo", params.shipTo);

        const apiBase = supplier === "cj"
          ? `/api/suppliers/cj/search`
          : `/api/suppliers/aliexpress/search`;
        const response = await fetch(`${apiBase}?${query.toString()}`);
        const data = await response.json();

        if (data.error) {
          setSearch((prev) => ({
            ...prev,
            loading: false,
            error: data.error,
          }));
          return;
        }

        setSearch({
          products: data.products || [],
          totalPages: data.totalPages || 0,
          totalCount: data.totalCount || 0,
          page: data.page || params.page || 1,
          loading: false,
          error: null,
        });
      } catch (err) {
        setSearch((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Search failed",
        }));
      }
    },
    []
  );

  /**
   * Debounced search — waits 300ms before executing.
   * Useful for live typing search.
   */
  const debouncedSearch = useCallback(
    (params: Parameters<typeof searchProducts>[0]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        searchProducts(params);
      }, 300);
    },
    [searchProducts]
  );

  // ---------- Product Detail ----------

  const fetchProductDetail = useCallback(async (productId: number | string) => {
    setDetail({ product: null, loading: true, error: null });

    try {
      const detailUrl = supplier === "cj"
        ? `/api/suppliers/cj/product?pid=${productId}`
        : `/api/suppliers/aliexpress/product/${productId}`;
      const response = await fetch(detailUrl);
      const data = await response.json();

      if (data.error) {
        setDetail({ product: null, loading: false, error: data.error });
        return;
      }

      setDetail({
        product: data.product,
        loading: false,
        error: null,
      });
    } catch (err) {
      setDetail({
        product: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch product",
      });
    }
  }, []);

  const clearDetail = useCallback(() => {
    setDetail({ product: null, loading: false, error: null });
  }, []);

  // ---------- Import ----------

  const importProduct = useCallback(
    async (params: {
      productId: number | string;
      retailPrice?: number;
      marginType?: "percentage" | "fixed";
      marginValue?: number;
      pushToStore?: boolean;
      shippingCost?: number;
      shippingMethod?: string;
      estimatedDelivery?: string;
    }) => {
      setImportState({ loading: true, error: null, success: false });

      try {
        const importUrl = supplier === "cj"
          ? "/api/suppliers/cj/import"
          : "/api/suppliers/aliexpress/import";

        // For CJ, map productId → pid
        const importBody = supplier === "cj"
          ? { ...params, pid: params.productId }
          : params;

        const response = await fetch(importUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(importBody),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          setImportState({
            loading: false,
            error: data.error || "Import failed",
            success: false,
          });
          return { success: false, error: data.error };
        }

        setImportState({
          loading: false,
          error: null,
          success: true,
        });

        return { success: true, product: data.product };
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Import failed";
        setImportState({
          loading: false,
          error: errorMsg,
          success: false,
        });
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  const clearImportState = useCallback(() => {
    setImportState({ loading: false, error: null, success: false });
  }, []);

  return {
    // Search
    search,
    searchProducts,
    debouncedSearch,

    // Detail
    detail,
    fetchProductDetail,
    clearDetail,

    // Import
    importState,
    importProduct,
    clearImportState,
  };
}
