"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useProducts } from "@/hooks/use-products";
import { createClient } from "@/lib/supabase/client";

type StatusFilter = "all" | "active" | "inactive" | "out_of_stock" | "synced" | "not_synced";
type SourceFilter = "all" | "aliexpress" | "direct";
type PlatformFilter = "all" | "salla" | "zid";

interface StoreInfo { id: string; platform: string; is_active: boolean }

export default function MyProductsPage() {
  const {
    products,
    total,
    activeCount,
    outOfStockCount,
    syncedCount,
    loading,
    error,
    refetch,
    updateProduct,
    deleteProduct,
    toggleActive,
    pushToStore,
  } = useProducts();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [syncingSalla, setSyncingSalla] = useState(false);
  const [syncingZid, setSyncingZid] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [storeMap, setStoreMap] = useState<Record<string, StoreInfo>>({});

  // Fetch connected stores to build storeId → platform map
  const fetchStores = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("stores").select("id, platform, is_active").eq("merchant_id", user.id);
    if (data) {
      const map: Record<string, StoreInfo> = {};
      for (const s of data) map[s.id] = s as StoreInfo;
      setStoreMap(map);
    }
  }, []);
  useEffect(() => { fetchStores(); }, [fetchStores]);

  // Helper to get platform for a product
  const getProductPlatform = useCallback((p: { store_id: string | null }) => {
    if (!p.store_id) return null;
    return storeMap[p.store_id]?.platform || null;
  }, [storeMap]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ---------- Filtered Products ----------
  const filteredProducts = useMemo(() => {
    let result = products;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title_en?.toLowerCase() || "").includes(q) ||
          (p.title_ar?.toLowerCase() || "").includes(q) ||
          (p.supplier_product_id || "").includes(q) ||
          (p.category?.toLowerCase() || "").includes(q)
      );
    }

    // Status filter
    switch (statusFilter) {
      case "active":
        result = result.filter((p) => p.is_active && p.in_stock);
        break;
      case "inactive":
        result = result.filter((p) => !p.is_active);
        break;
      case "out_of_stock":
        result = result.filter((p) => !p.in_stock);
        break;
      case "synced":
        result = result.filter((p) => p.store_product_id);
        break;
      case "not_synced":
        result = result.filter((p) => !p.store_product_id);
        break;
    }

    // Source filter
    switch (sourceFilter) {
      case "aliexpress":
        result = result.filter((p) => p.supplier !== "direct");
        break;
      case "direct":
        result = result.filter((p) => p.supplier === "direct");
        break;
    }

    // Platform filter
    if (platformFilter !== "all") {
      result = result.filter((p) => {
        const plat = getProductPlatform(p);
        if (platformFilter === "salla") return plat === "salla";
        if (platformFilter === "zid") return plat === "zid";
        return true;
      });
    }

    return result;
  }, [products, searchQuery, statusFilter, sourceFilter, platformFilter, getProductPlatform]);

  // ---------- Action Handlers ----------

  const handleToggleActive = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: "toggle" }));
    const result = await toggleActive(id);
    setActionLoading((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (result.success) {
      setToast({ type: "success", message: "Status updated" });
    } else {
      setToast({ type: "error", message: result.error || "Failed to update" });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null);
    setActionLoading((prev) => ({ ...prev, [id]: "delete" }));
    const result = await deleteProduct(id);
    setActionLoading((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (result.success) {
      setToast({ type: "success", message: "Product deleted" });
    } else {
      setToast({ type: "error", message: result.error || "Failed to delete" });
    }
  };

  const handlePushToStore = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: "push" }));
    const result = await pushToStore(id);
    setActionLoading((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (result.success) {
      const platformName = result.platform === "zid" ? "Zid" : "Salla";
      setToast({ type: "success", message: `Pushed to ${platformName}! ID: ${result.storeProductId}` });
    } else {
      setToast({ type: "error", message: result.error || "Push failed" });
    }
  };

  const handlePriceEdit = (id: string, currentPrice: number) => {
    setEditingPriceId(id);
    setEditPriceValue(String(currentPrice));
  };

  const handlePriceSave = async (id: string) => {
    const newPrice = parseFloat(editPriceValue);
    if (isNaN(newPrice) || newPrice <= 0) {
      setToast({ type: "error", message: "Invalid price" });
      return;
    }

    setActionLoading((prev) => ({ ...prev, [id]: "price" }));
    const result = await updateProduct(id, { retail_price: Math.round(newPrice * 100) / 100 });
    setActionLoading((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setEditingPriceId(null);

    if (result.success) {
      setToast({ type: "success", message: "Price updated" });
    } else {
      setToast({ type: "error", message: result.error || "Failed to update" });
    }
  };

  const handlePriceCancel = () => {
    setEditingPriceId(null);
    setEditPriceValue("");
  };

  const handleSyncFromStore = async (platform: "salla" | "zid") => {
    const setSyncing = platform === "salla" ? setSyncingSalla : setSyncingZid;
    const endpoint = platform === "salla" ? "/api/salla/products" : "/api/zid/products";
    const label = platform === "salla" ? "Salla" : "Zid";
    setSyncing(true);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();
      if (response.ok && data.success) {
        setToast({
          type: data.errors > 0 ? "error" : "success",
          message: `${label}: Synced ${data.synced} products (${data.created} new, ${data.updated} updated${data.errors ? `, ${data.errors} errors` : ""})`,
        });
        refetch();
        fetchStores();
      } else {
        setToast({ type: "error", message: data.error || `${label} sync failed` });
      }
    } catch {
      setToast({ type: "error", message: `${label} sync failed` });
    } finally {
      setSyncing(false);
    }
  };

  // ---------- Stats ----------
  const directCount = products.filter((p) => p.supplier === "direct").length;
  const droplinkerCount = products.filter((p) => p.supplier !== "direct").length;
  const stats = [
    { label: "Total", value: loading ? "…" : `${total}`, icon: "inventory_2", color: "text-accent" },
    { label: "Active", value: loading ? "…" : `${activeCount}`, icon: "check_circle", color: "text-success" },
    { label: "Out of Stock", value: loading ? "…" : `${outOfStockCount}`, icon: "error", color: "text-error" },
    { label: "Synced to Store", value: loading ? "…" : `${syncedCount}`, icon: "cloud_done", color: "text-info" },
  ];

  // ---------- Helpers ----------
  const getProfit = (retail: number, cost: number) => {
    const profit = retail - cost;
    const margin = cost > 0 ? ((profit / cost) * 100).toFixed(0) : "∞";
    return { profit: profit.toFixed(2), margin };
  };

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-[slideIn_0.3s_ease-out] ${
            toast.type === "success"
              ? "bg-success text-white"
              : "bg-error text-white"
          }`}
        >
          <Icon name={toast.type === "success" ? "check_circle" : "error"} className="text-base" />
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <Icon name="close" className="text-base" />
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                <Icon name="delete" className="text-error text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-text">Delete Product?</h3>
                <p className="text-xs text-text-secondary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              The product will be removed from your catalog.
              {(() => {
                const dp = products.find((p) => p.id === deleteConfirmId);
                if (dp?.store_product_id) {
                  const plat = getProductPlatform(dp);
                  return ` It will also be removed from your ${plat === "zid" ? "Zid" : "Salla"} store.`;
                }
                return null;
              })()}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="!bg-error hover:!bg-error/90"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                <Icon name="delete" className="text-sm" />
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">My Products</h1>
          <p className="text-sm text-text-secondary">Manage your imported product inventory</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSyncFromStore("salla")}
            disabled={syncingSalla}
          >
            <Icon name="cloud_download" className="text-sm" />
            {syncingSalla ? "Syncing..." : "Import from Salla"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSyncFromStore("zid")}
            disabled={syncingZid}
          >
            <Icon name="cloud_download" className="text-sm" />
            {syncingZid ? "Syncing..." : "Import from Zid"}
          </Button>
          <Button variant="secondary" size="sm" onClick={refetch}>
            <Icon name="sync" className="text-sm" />
            Refresh
          </Button>
          <Link href="/dashboard/products/discover">
            <Button size="sm">
              <Icon name="add" className="text-sm" />
              Import New
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center">
              <Icon name={s.icon} className={`${s.color} text-base`} />
            </div>
            <div>
              <div className="text-xs text-text-secondary">{s.label}</div>
              <div className="text-lg font-bold text-text">{s.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 bg-surface rounded-md px-3 py-2 border border-border flex-1 min-w-[200px]">
          <Icon name="search" className="text-sm text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, SKU, category..."
            className="bg-transparent text-sm text-text outline-none w-full placeholder:text-text-muted"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-text-muted hover:text-text">
              <Icon name="close" className="text-sm" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-surface text-text-secondary text-sm rounded-md px-3 py-2 border border-border outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="synced">✅ Synced to Store</option>
          <option value="not_synced">⏳ Not Synced</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
          className="bg-surface text-text-secondary text-sm rounded-md px-3 py-2 border border-border outline-none cursor-pointer"
        >
          <option value="all">All Sources ({total})</option>
          <option value="aliexpress">🔗 DropLinker ({droplinkerCount})</option>
          <option value="direct">🏪 Direct ({directCount})</option>
        </select>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
          className="bg-surface text-text-secondary text-sm rounded-md px-3 py-2 border border-border outline-none cursor-pointer"
        >
          <option value="all">All Platforms</option>
          <option value="salla">🟢 Salla Only</option>
          <option value="zid">🔵 Zid Only</option>
        </select>
        {(searchQuery || statusFilter !== "all" || sourceFilter !== "all" || platformFilter !== "all") && (
          <Badge variant="accent" icon="filter_list">
            {filteredProducts.length} of {total}
          </Badge>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
          <Icon name="error" className="text-base" />
          {error}
          <Button variant="ghost" size="sm" onClick={refetch} className="ml-auto">
            Retry
          </Button>
        </div>
      )}

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Product", "Supplier", "Cost", "Retail", "Profit", "Stock", "Store", "Status", "Actions"].map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-sunken"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-surface-sunken flex items-center justify-center">
                        <Icon name={searchQuery ? "search_off" : "inventory_2"} className="text-2xl text-text-muted" />
                      </div>
                      <div>
                        <p className="font-medium text-text">
                          {searchQuery
                            ? "No products match your search"
                            : "No products imported yet"}
                        </p>
                        <p className="text-text-muted text-xs mt-1">
                          {searchQuery
                            ? "Try adjusting your search or filters"
                            : "Go to Discover to find and import products"}
                        </p>
                      </div>
                      {!searchQuery && (
                        <Link href="/dashboard/products/discover">
                          <Button size="sm">
                            <Icon name="explore" className="text-sm" />
                            Discover Products
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const { profit, margin } = getProfit(p.retail_price, p.supplier_cost);
                  const isLoading = !!actionLoading[p.id];
                  const loadingAction = actionLoading[p.id];

                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-border-subtle hover:bg-surface-sunken transition-colors ${
                        isLoading ? "opacity-60 pointer-events-none" : ""
                      }`}
                    >
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-surface-sunken overflow-hidden shrink-0 relative">
                            {p.images && p.images.length > 0 ? (
                              <Image
                                src={p.images[0]}
                                alt={p.title_en || "Product"}
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon name="image" className="text-sm text-text-muted" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-text max-w-[200px] truncate block">
                              {p.title_en || p.title_ar || "Untitled"}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              SKU: {p.supplier_product_id?.slice(0, 12)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3">
                        <Badge variant={p.supplier === "direct" ? "info" : "accent"}
                          icon={p.supplier === "direct" ? "storefront" : "link"}
                        >
                          {p.supplier === "direct" ? "Direct" : "AliExpress"}
                        </Badge>
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                        {p.supplier_currency} {p.supplier_cost.toFixed(2)}
                      </td>

                      {/* Retail Price (editable) */}
                      <td className="px-4 py-3">
                        {editingPriceId === p.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editPriceValue}
                              onChange={(e) => setEditPriceValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handlePriceSave(p.id);
                                if (e.key === "Escape") handlePriceCancel();
                              }}
                              className="w-20 px-2 py-1 text-xs bg-surface border border-accent rounded outline-none text-text font-mono"
                              autoFocus
                            />
                            <button onClick={() => handlePriceSave(p.id)} className="text-success hover:text-success/80">
                              <Icon name="check" className="text-sm" />
                            </button>
                            <button onClick={handlePriceCancel} className="text-text-muted hover:text-error">
                              <Icon name="close" className="text-sm" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePriceEdit(p.id, p.retail_price)}
                            className="font-medium text-text hover:text-accent transition-colors font-mono text-xs group flex items-center gap-1"
                            title="Click to edit price"
                          >
                            SAR {p.retail_price.toFixed(2)}
                            <Icon name="edit" className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity" />
                          </button>
                        )}
                      </td>

                      {/* Profit */}
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs font-medium ${parseFloat(profit) > 0 ? "text-success" : "text-error"}`}>
                          +{profit}
                        </span>
                        <span className="text-[10px] text-text-muted ml-1">({margin}%)</span>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 text-text font-mono text-xs">{p.stock_quantity}</td>

                      {/* Store Sync Status */}
                      <td className="px-4 py-3">
                        {p.store_product_id ? (
                          <Badge variant="success" icon="cloud_done">
                            {getProductPlatform(p) === "zid" ? "Zid" : "Salla"}
                          </Badge>
                        ) : (
                          <button
                            onClick={() => handlePushToStore(p.id)}
                            disabled={isLoading}
                            className="group"
                          >
                            <Badge variant="warning" icon="cloud_upload" className="cursor-pointer group-hover:opacity-80">
                              {loadingAction === "push" ? "Pushing..." : "Push"}
                            </Badge>
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleActive(p.id)} disabled={isLoading} title="Click to toggle">
                          <Badge
                            variant={!p.in_stock ? "error" : p.is_active ? "success" : "warning"}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {loadingAction === "toggle"
                              ? "..."
                              : !p.in_stock
                                ? "Out of Stock"
                                : p.is_active
                                  ? "Active"
                                  : "Inactive"}
                          </Badge>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Link href={`/dashboard/products/${p.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit product"
                            >
                              <Icon name="edit" className="text-sm text-accent" />
                            </Button>
                          </Link>
                          {!p.store_product_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePushToStore(p.id)}
                              disabled={isLoading}
                              title="Push to Store"
                            >
                              <Icon name="upload" className="text-sm text-accent" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(p.id)}
                            disabled={isLoading}
                            title="Delete product"
                          >
                            <Icon name="delete" className="text-sm text-error" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
