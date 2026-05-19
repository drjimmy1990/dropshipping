"use client";

import { useState, useEffect, useCallback } from "react";

interface ZidCategory {
  id: string;
  name: { ar: string; en: string };
  parent_id?: string | null;
  is_published?: boolean;
  children?: ZidCategory[];
}

interface UseZidCategoriesResult {
  categories: ZidCategory[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches Zid categories from our API.
 * Returns a flat list of categories for the dropdown picker.
 */
export function useZidCategories(): UseZidCategoriesResult {
  const [categories, setCategories] = useState<ZidCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/zid/categories");
      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || "Failed to fetch Zid categories");
        setLoading(false);
        return;
      }

      // Flatten nested categories for dropdown use
      const flat = flattenCategories(data.categories || []);
      setCategories(flat);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Zid categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refresh: () => fetchCategories(),
  };
}

/**
 * Flattens a nested Zid category tree into a flat list.
 * Adds indent prefix for display in dropdowns.
 */
function flattenCategories(
  cats: ZidCategory[],
  depth = 0
): ZidCategory[] {
  const result: ZidCategory[] = [];
  for (const cat of cats) {
    const prefix = depth > 0 ? "— ".repeat(depth) : "";
    result.push({
      ...cat,
      name: {
        en: prefix + cat.name.en,
        ar: prefix + cat.name.ar,
      },
    });
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, depth + 1));
    }
  }
  return result;
}
