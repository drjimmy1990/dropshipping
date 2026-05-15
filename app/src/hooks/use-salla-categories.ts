"use client";

import { useState, useEffect, useCallback } from "react";

interface SallaCategory {
  id: number;
  name: string;
  parent_id: number;
  status: string;
}

interface CategoryTree extends SallaCategory {
  children: CategoryTree[];
}

interface UseSallaCategoriesResult {
  categories: SallaCategory[];
  tree: CategoryTree[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches Salla categories from our cached API.
 * Returns both flat list and tree structure for different UI needs.
 */
export function useSallaCategories(): UseSallaCategoriesResult {
  const [categories, setCategories] = useState<SallaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = forceRefresh
        ? "/api/salla/categories?refresh=true"
        : "/api/salla/categories";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || "Failed to fetch categories");
        setLoading(false);
        return;
      }

      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Build tree structure from flat list
  const tree = buildTree(categories);

  return {
    categories,
    tree,
    loading,
    error,
    refresh: () => fetchCategories(true),
  };
}

/**
 * Builds a tree structure from a flat category list.
 * Root categories have parent_id === 0.
 */
function buildTree(categories: SallaCategory[]): CategoryTree[] {
  const map = new Map<number, CategoryTree>();
  const roots: CategoryTree[] = [];

  // Create nodes
  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  // Build tree
  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parent_id === 0 || !map.has(cat.parent_id)) {
      roots.push(node);
    } else {
      map.get(cat.parent_id)!.children.push(node);
    }
  }

  return roots;
}
