"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, Button, Badge, Icon } from "@/components/shared";
import { useSallaCategories } from "@/hooks/use-salla-categories";
import { useZidCategories } from "@/hooks/use-zid-categories";
import type { Product } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

type Tab = "general" | "images" | "pricing" | "store";

export default function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { categories: sallaCategories } = useSallaCategories();
  const { categories: zidCategories } = useZidCategories();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("general");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Editable fields
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  // Shipping options
  const [shippingCostInput, setShippingCostInput] = useState("");
  const [shippingMethodInput, setShippingMethodInput] = useState("");
  const [estimatedDeliveryInput, setEstimatedDeliveryInput] = useState("");
  const [shippingOptions, setShippingOptions] = useState<{ name: string; price: number; currency: string; estimatedDays: string; trackingAvailable: boolean; serviceCode?: string }[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [selectedShippingIdx, setSelectedShippingIdx] = useState<number>(-1);
  const [categoryId, setCategoryId] = useState("");
  const [zidCategoryId, setZidCategoryId] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [isActive, setIsActive] = useState(true);
  // Image management
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  // Zid-specific keywords
  const [zidKeywords, setZidKeywords] = useState("");
  // Connected stores
  const [connectedStores, setConnectedStores] = useState<{id: string; platform: string; store_name: string; is_active: boolean}[]>([]);

  // Platform detection (derived from connected stores)
  const hasSallaStore = connectedStores.some(s => s.platform === "salla");
  const hasZidStore = connectedStores.some(s => s.platform === "zid");

  const isSallaSynced = useCallback(() => {
    return (product as any)?.listings?.some((l: any) => connectedStores.find(s => s.id === l.store_id)?.platform === "salla");
  }, [(product as any)?.listings, connectedStores]);

  const isZidSynced = useCallback(() => {
    return (product as any)?.listings?.some((l: any) => connectedStores.find(s => s.id === l.store_id)?.platform === "zid");
  }, [(product as any)?.listings, connectedStores]);

  const isStoreSynced = useCallback((platform: string) => {
    return (product as any)?.listings?.some((l: any) => connectedStores.find(s => s.id === l.store_id)?.platform === platform);
  }, [(product as any)?.listings, connectedStores]);

  // Unsaved changes tracking
  const hasChanges = useMemo(() => {
    if (!product) return false;
    return (
      titleEn !== (product.title_en || "") ||
      titleAr !== (product.title_ar || "") ||
      descEn !== (product.description_en || "") ||
      descAr !== (product.description_ar || "") ||
      retailPrice !== String(product.retail_price) ||
      stockQty !== String(product.stock_quantity) ||
      isActive !== product.is_active ||
      JSON.stringify(localImages) !== JSON.stringify(product.images || []) ||
      metaTitle !== (product.metadata_title || (product.title_en || "").slice(0, 70)) ||
      metaDesc !== (product.metadata_description || (product.description_en || "").slice(0, 160)) ||
      zidKeywords !== (product.zid_keywords || []).join(", ") ||
      categoryId !== (product.salla_category_id ? String(product.salla_category_id) : "") ||
      zidCategoryId !== (product.zid_category_id || "")
    );
  }, [product, titleEn, titleAr, descEn, descAr, retailPrice, stockQty, isActive, localImages, metaTitle, metaDesc, zidKeywords, categoryId, zidCategoryId]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Fetch product
  const fetchProduct = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("products")
      .select("*, listings:product_listings(*)")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .single();

    if (data) {
      const p = data as Product;
      setProduct(p);
      setTitleEn(p.title_en || "");
      setTitleAr(p.title_ar || "");
      setDescEn(p.description_en || "");
      setDescAr(p.description_ar || "");
      setRetailPrice(String(p.retail_price));
      setStockQty(String(p.stock_quantity));
      setCategoryId(p.salla_category_id ? String(p.salla_category_id) : "");
      setMetaTitle(p.metadata_title || (p.title_en || "").slice(0, 70));
      setMetaDesc(p.metadata_description || (p.description_en || "").slice(0, 160));
      setZidKeywords((p.zid_keywords || []).join(", "));
      setZidCategoryId(p.zid_category_id || "");
      setIsActive(p.is_active);
      setLocalImages(p.images || []);
      setShippingCostInput(String(p.shipping_cost || 0));
      setShippingMethodInput(p.shipping_method || "");
      setEstimatedDeliveryInput(p.estimated_delivery || "");
    }
    setLoading(false);
  }, [id]);

  // Fetch connected stores
  const fetchStores = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("stores")
      .select("id, platform, store_name, is_active")
      .eq("merchant_id", user.id)
      .eq("is_active", true);
    if (data) setConnectedStores(data);
  }, []);

  useEffect(() => { fetchProduct(); fetchStores(); }, [fetchProduct, fetchStores]);

  // Save changes
  const handleSave = async () => {
    if (!product) return;
    setSaving(true);

    try {
      const updates: Record<string, unknown> = {
        title_en: titleEn,
        title_ar: titleAr || null,
        description_en: descEn || null,
        description_ar: descAr || null,
        retail_price: parseFloat(retailPrice) || product.retail_price,
        stock_quantity: parseInt(stockQty) || product.stock_quantity,
        is_active: isActive,
        salla_category_id: categoryId ? parseInt(categoryId) : null,
        images: localImages,
        shipping_cost: parseFloat(shippingCostInput) || 0,
        shipping_method: shippingMethodInput || null,
        estimated_delivery: estimatedDeliveryInput || null,
        metadata_title: metaTitle || null,
        metadata_description: metaDesc || null,
        zid_keywords: zidKeywords ? zidKeywords.split(",").map(s => s.trim()).filter(Boolean) : null,
        zid_category_id: zidCategoryId || null,
      };

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const syncParts: string[] = [];
        if (data.sallaSynced) syncParts.push("Salla ✅");
        if (data.zidSynced) syncParts.push("Zid ✅");
        if (data.storeWarning) syncParts.push(data.storeWarning);
        setToast({
          type: "success",
          message: syncParts.length > 0
            ? `Saved — ${syncParts.join(" · ")}`
            : "Saved successfully",
        });
        fetchProduct();
      } else {
        setToast({ type: "error", message: data.error || "Save failed" });
      }
    } catch {
      setToast({ type: "error", message: "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!product) return;
    setDeleteConfirm(false);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/dashboard/products");
      } else {
        setToast({ type: "error", message: data.error || "Delete failed" });
      }
    } catch {
      setToast({ type: "error", message: "Delete failed" });
    }
  };

  // Push to store
  const handlePush = async (targetPlatform?: string) => {
    if (!product) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}/push`, {
        method: "POST",
        ...(targetPlatform ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetPlatform }),
        } : {}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const platformName = data.platform === "zid" ? "Zid" : "Salla";
        setToast({ type: "success", message: `Pushed to ${platformName}! ID: ${data.storeProductId}` });
        fetchProduct();
      } else {
        setToast({ type: "error", message: data.error || "Push failed" });
      }
    } catch {
      setToast({ type: "error", message: "Push failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        <span className="ml-3 text-text-secondary">Loading product...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Icon name="error" className="text-error text-4xl mb-3" />
        <p className="text-text font-medium">Product not found</p>
        <Link href="/dashboard/products">
          <Button variant="secondary" size="sm" className="mt-4">← Back to Products</Button>
        </Link>
      </div>
    );
  }

  const shippingCost = parseFloat(shippingCostInput) || 0;
  const totalCost = product.supplier_cost + shippingCost;
  const profit = parseFloat(retailPrice) - totalCost;
  const margin = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(0) : "0";

  const fetchShippingOptions = async () => {
    if (!product.supplier_product_id || product.supplier !== "aliexpress") return;
    setShippingLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/shipping`);
      const data = await res.json();
      if (data.success && data.options?.length > 0) {
        setShippingOptions(data.options);
        // Pre-select current method if it matches
        const currentIdx = data.options.findIndex((o: any) => o.name === shippingMethodInput || o.serviceCode === shippingMethodInput);
        setSelectedShippingIdx(currentIdx >= 0 ? currentIdx : 0);
      } else {
        setShippingOptions([]);
        setSelectedShippingIdx(-1);
        setToast({ type: "error", message: data.error || "No shipping options available for SA" });
      }
    } catch {
      setShippingOptions([]);
      setToast({ type: "error", message: "Failed to fetch shipping options — token may need refresh" });
    } finally {
      setShippingLoading(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "general", label: "General", icon: "edit_note" },
    { key: "images", label: "Images", icon: "photo_library" },
    { key: "pricing", label: "Pricing", icon: "payments" },
    { key: "store", label: "Store Settings", icon: "tune" },
  ];

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
          toast.type === "success" ? "bg-success text-white" : "bg-error text-white"
        }`}>
          <Icon name={toast.type === "success" ? "check_circle" : "error"} className="text-base" />
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <Icon name="close" className="text-base" />
          </button>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                <Icon name="delete" className="text-error text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-text">Delete Product?</h3>
                <p className="text-xs text-text-secondary">This cannot be undone</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
              <Button size="sm" className="!bg-error hover:!bg-error/90" onClick={handleDelete}>Delete</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="sm"><Icon name="arrow_back" className="text-sm" /></Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-text">{product.title_en || "Untitled Product"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={product.supplier === "direct" ? "info" : "accent"} icon={product.supplier === "direct" ? "storefront" : "link"}>
                {product.supplier === "direct" ? "Direct" : "AliExpress"}
              </Badge>
              {isSallaSynced() && (
                <Badge variant="success" icon="cloud_done">Salla ✓</Badge>
              )}
              {isZidSynced() && (
                <Badge variant="success" icon="cloud_done">Zid ✓</Badge>
              )}
              {!isSallaSynced() && !isZidSynced() && (
                <Badge variant="warning" icon="cloud_off">Not Synced</Badge>
              )}
              <Badge variant={isActive ? "success" : "neutral"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {connectedStores.length > 0 && (
            <div className="flex gap-1">
              {connectedStores
                .filter((store) => {
                  // Show push button only if product is NOT yet pushed to this platform
                  if (isStoreSynced(store.platform)) return false;
                  return true;
                })
                .map((store) => (
                <Button key={store.id} variant="secondary" size="sm" onClick={() => handlePush(store.platform)} disabled={saving}>
                  <Icon name="cloud_upload" className="text-sm" /> Push to {store.platform === "zid" ? "Zid" : "Salla"}
                </Button>
              ))}
            </div>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Icon name="save" className="text-sm" />
            {saving ? "Saving..." : "Save Changes"}
            {hasChanges && !saving && (
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-sunken rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-surface text-accent shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            <Icon name={t.icon} className="text-sm" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {tab === "general" && (
            <Card className="p-6">
              <h2 className="font-semibold text-text mb-4">Product Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Title (English)</label>
                  <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Title (Arabic)</label>
                  <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Description (English)</label>
                  <textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={5}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent resize-y" />
                  <span className="text-[10px] text-text-muted">{descEn.length} characters</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Description (Arabic)</label>
                  <textarea value={descAr} onChange={(e) => setDescAr(e.target.value)} rows={3} dir="rtl"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent resize-y" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="text-sm text-text-secondary">Active</label>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isActive ? "bg-success" : "bg-border"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
                {/* AI Generate */}
                <div className="pt-2 border-t border-border">
                  <AIGenerateSection
                    productId={product.id}
                    onApply={(result) => {
                      if (result.title_en) setTitleEn(result.title_en);
                      if (result.title_ar) setTitleAr(result.title_ar);
                      if (result.description_en) setDescEn(result.description_en);
                      if (result.description_ar) setDescAr(result.description_ar);
                      if (result.metadata_title) setMetaTitle(result.metadata_title);
                      if (result.metadata_description) setMetaDesc(result.metadata_description);
                      setToast({ type: "success", message: "AI content applied! Review and save." });
                    }}
                  />
                </div>
              </div>
            </Card>
          )}

          {tab === "images" && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text">Product Images</h2>
                <Badge variant="neutral">{localImages.length} image{localImages.length !== 1 ? "s" : ""}</Badge>
              </div>

              {/* Add image by URL */}
              <div className="flex gap-2 mb-4">
                <input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Paste image URL here..."
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newImageUrl.trim()) {
                      setLocalImages((prev) => [...prev, newImageUrl.trim()]);
                      setNewImageUrl("");
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!newImageUrl.trim()}
                  onClick={() => {
                    if (newImageUrl.trim()) {
                      setLocalImages((prev) => [...prev, newImageUrl.trim()]);
                      setNewImageUrl("");
                    }
                  }}
                >
                  <Icon name="add_photo_alternate" className="text-sm" /> Add
                </Button>
              </div>

              {localImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {localImages.map((img, i) => (
                    <div key={`${img}-${i}`} className="relative aspect-square bg-surface-sunken rounded-lg overflow-hidden border border-border group">
                      <Image src={img} alt={`Product image ${i + 1}`} fill sizes="200px" className="object-cover" unoptimized />
                      {/* Main badge */}
                      {i === 0 && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="accent" icon="star">Main</Badge>
                        </div>
                      )}
                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {/* Set as Main */}
                        {i !== 0 && (
                          <button
                            onClick={() => {
                              setLocalImages((prev) => {
                                const next = [...prev];
                                const [item] = next.splice(i, 1);
                                next.unshift(item);
                                return next;
                              });
                            }}
                            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
                            title="Set as main image"
                          >
                            <Icon name="star" className="text-sm" />
                          </button>
                        )}
                        {/* Move left */}
                        {i > 0 && (
                          <button
                            onClick={() => {
                              setLocalImages((prev) => {
                                const next = [...prev];
                                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                                return next;
                              });
                            }}
                            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
                            title="Move left"
                          >
                            <Icon name="chevron_left" className="text-sm" />
                          </button>
                        )}
                        {/* Move right */}
                        {i < localImages.length - 1 && (
                          <button
                            onClick={() => {
                              setLocalImages((prev) => {
                                const next = [...prev];
                                [next[i], next[i + 1]] = [next[i + 1], next[i]];
                                return next;
                              });
                            }}
                            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
                            title="Move right"
                          >
                            <Icon name="chevron_right" className="text-sm" />
                          </button>
                        )}
                        {/* Delete */}
                        <button
                          onClick={() => setLocalImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-error hover:text-white transition-colors"
                          title="Delete image"
                        >
                          <Icon name="delete" className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-muted">
                  <Icon name="photo_library" className="text-4xl mb-2" />
                  <p className="text-sm">No images — add one above</p>
                </div>
              )}

              {/* Hint */}
              {localImages.length > 0 && (
                <p className="text-[10px] text-text-muted mt-3">
                  <Icon name="info" className="text-xs align-middle mr-1" />
                  Hover images to reorder, set main, or delete. First image = main. Remember to save.
                </p>
              )}
            </Card>
          )}

          {tab === "pricing" && (
            <Card className="p-6">
              <h2 className="font-semibold text-text mb-4">Pricing & Inventory</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Supplier Cost</label>
                    <div className="px-3 py-2 bg-surface-sunken border border-border rounded-md text-sm text-text-muted font-mono">
                      {product.supplier_currency} {product.supplier_cost.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Shipping Cost</label>
                    <div className="px-3 py-2 bg-surface-sunken border border-border rounded-md text-sm text-text-muted font-mono">
                      SAR {shippingCost.toFixed(2)}
                      {shippingMethodInput && <span className="text-text-muted ml-1 text-xs">({shippingMethodInput})</span>}
                      {shippingCost === 0 && !shippingMethodInput && <span className="text-text-muted ml-1 text-xs">(Free / Not set)</span>}
                    </div>
                  </div>
                </div>
                {/* Total Landed Cost */}
                <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-accent">Total Landed Cost</span>
                  <span className="text-sm font-bold text-accent font-mono">SAR {totalCost.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Retail Price (SAR)</label>
                    <input type="number" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} min={0} step="0.01"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent font-mono" />
                  </div>
                </div>
                {/* Margin display */}
                <div className="bg-surface-sunken rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-text-secondary">Profit per unit</span>
                    <div className={`text-lg font-bold font-mono ${profit > 0 ? "text-success" : "text-error"}`}>
                      SAR {profit.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-text-secondary">Margin</span>
                    <div className={`text-lg font-bold ${profit > 0 ? "text-success" : "text-error"}`}>
                      {margin}%
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Stock Quantity</label>
                    <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} min={0}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Sale Price (optional)</label>
                    <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} min={0} step="0.01" placeholder="—"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent font-mono" />
                  </div>
                </div>

                {/* AliExpress Shipping Options */}
                {product.supplier === "aliexpress" && product.supplier_product_id && (
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-text flex items-center gap-1.5">
                        <Icon name="local_shipping" className="text-sm" />
                        AliExpress Shipping Options
                      </h3>
                      <button
                        onClick={fetchShippingOptions}
                        disabled={shippingLoading}
                        className="text-xs px-3 py-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {shippingLoading ? (
                          <><span className="animate-spin inline-block w-3 h-3 border border-accent/30 border-t-accent rounded-full" /> Fetching...</>
                        ) : (
                          <><Icon name="refresh" className="text-xs" /> Refresh Options</>
                        )}
                      </button>
                    </div>

                    {shippingOptions.length > 0 ? (
                      <div className="space-y-1.5">
                        {shippingOptions.map((opt, i) => (
                          <label
                            key={i}
                            className={`flex items-center justify-between text-xs p-2.5 rounded-lg cursor-pointer border transition-all ${
                              selectedShippingIdx === i
                                ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                                : "border-border bg-surface hover:border-accent/40"
                            }`}
                            onClick={() => {
                              setSelectedShippingIdx(i);
                              setShippingCostInput(String(opt.price));
                              setShippingMethodInput(opt.serviceCode || opt.name);
                              setEstimatedDeliveryInput(opt.estimatedDays);
                              // Recalculate retail price suggestion
                              const newTotal = product.supplier_cost + opt.price;
                              if (parseFloat(retailPrice) < newTotal) {
                                setRetailPrice(Math.ceil(newTotal * 1.3).toString());
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedShippingIdx === i ? "border-accent" : "border-border"
                              }`}>
                                {selectedShippingIdx === i && (
                                  <div className="w-2 h-2 rounded-full bg-accent" />
                                )}
                              </div>
                              <div>
                                <span className="text-text font-medium">{opt.name}</span>
                                {opt.trackingAvailable && (
                                  <span className="ml-1.5 text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">Tracked</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-text font-semibold">
                                {opt.price > 0 ? `SAR ${opt.price.toFixed(2)}` : "Free"}
                              </span>
                              <span className="text-text-muted ml-1">· {opt.estimatedDays}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : !shippingLoading ? (
                      <p className="text-xs text-text-muted py-2">
                        Click &quot;Refresh Options&quot; to fetch available shipping methods from AliExpress.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </Card>
          )}

          {tab === "store" && (
            <Card className="p-6">
              <h2 className="font-semibold text-text mb-4">Store Settings</h2>

              {/* Sync Coverage Map */}
              <div className="mb-6 p-4 bg-surface-sunken rounded-lg">
                <h3 className="text-xs font-medium text-text-muted uppercase mb-3">Sync Coverage</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { field: "Title (EN)", salla: true, zid: true },
                    { field: "Title (AR)", salla: false, zid: true },
                    { field: "Description", salla: true, zid: true },
                    { field: "Price", salla: true, zid: true },
                    { field: "Stock", salla: true, zid: true },
                    { field: "Images", salla: true, zid: true },
                    { field: "Status", salla: true, zid: true },
                    { field: "Category", salla: true, zid: true },
                  ].map(({ field, salla, zid }) => (
                    <div key={field} className="flex items-center justify-between py-1">
                      <span className="text-text-secondary">{field}</span>
                      <div className="flex gap-1">
                        {hasSallaStore && salla && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">Salla</span>}
                        {hasZidStore && zid && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">Zid</span>}
                        {hasSallaStore && !salla && hasZidStore && zid && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-[10px]">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted mt-2 italic">Edit these fields in General/Pricing tabs. Changes sync on save.</p>
              </div>

              {/* ---- SALLA PANEL ---- */}
              {hasSallaStore && (
                <div className="border border-emerald-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-600 text-xs font-bold">S</span>
                      </div>
                      <span className="font-medium text-text">Salla</span>
                    </div>
                    {isSallaSynced()
                      ? <Badge variant="success">Synced</Badge>
                      : <Badge variant="warning">Not Pushed</Badge>
                    }
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Meta Title <span className={`float-right ${metaTitle.length > 60 ? "text-warning" : "text-text-muted"}`}>{metaTitle.length}/70</span>
                      </label>
                      <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value.slice(0, 70))} maxLength={70}
                        placeholder="SEO title for Salla store"
                        className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Meta Description <span className={`float-right ${metaDesc.length > 150 ? "text-warning" : "text-text-muted"}`}>{metaDesc.length}/160</span>
                      </label>
                      <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value.slice(0, 160))} maxLength={160} rows={3}
                        placeholder="SEO description for search engines"
                        className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent resize-none" />
                    </div>

                    {/* SERP Preview */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-border">
                      <p className="text-[10px] text-text-muted mb-2 uppercase font-medium tracking-wide">Google Search Preview</p>
                      <div className="text-[#1a0dab] dark:text-blue-400 text-base font-medium truncate">{metaTitle || titleEn || "Product Title"}</div>
                      <div className="text-[#006621] dark:text-green-400 text-xs truncate mt-0.5">store.salla.sa › products</div>
                      <div className="text-text-secondary text-xs mt-1 line-clamp-2">{metaDesc || descEn?.slice(0, 160) || "Product description..."}</div>
                    </div>

                    <button disabled className="flex items-center gap-2 text-xs text-text-muted px-3 py-2 rounded-md bg-surface-sunken cursor-not-allowed opacity-60">
                      <Icon name="auto_awesome" className="text-sm" /> Auto-Generate SEO with AI (Coming Soon)
                    </button>

                    {/* Salla Category */}
                    <div className="pt-3 border-t border-emerald-100">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Salla Category</label>
                      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent">
                        <option value="">No category</option>
                        {sallaCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-text-muted mt-1">Category displayed in your Salla storefront.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- ZID PANEL ---- */}
              {hasZidStore && (
                <div className="border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">Z</span>
                      </div>
                      <span className="font-medium text-text">Zid</span>
                    </div>
                    {isZidSynced()
                      ? <Badge variant="success">Synced</Badge>
                      : <Badge variant="warning">Not Pushed</Badge>
                    }
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Keywords</label>
                      <input value={zidKeywords} onChange={(e) => setZidKeywords(e.target.value)}
                        placeholder="keyword1, keyword2, keyword3"
                        className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent" />
                      <p className="text-[10px] text-text-muted mt-1">Comma-separated keywords for Zid store search optimization.</p>
                    </div>

                    <button disabled className="flex items-center gap-2 text-xs text-text-muted px-3 py-2 rounded-md bg-surface-sunken cursor-not-allowed opacity-60">
                      <Icon name="auto_awesome" className="text-sm" /> Auto-Generate Keywords with AI (Coming Soon)
                    </button>

                    {/* Zid Category */}
                    <div className="pt-3 border-t border-blue-100">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Zid Category</label>
                      <select value={zidCategoryId} onChange={(e) => setZidCategoryId(e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent">
                        <option value="">No category</option>
                        {zidCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name.en}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-text-muted mt-1">Category displayed in your Zid storefront.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* No stores connected */}
              {!hasSallaStore && !hasZidStore && (
                <div className="text-center py-8">
                  <Icon name="store" className="text-4xl text-text-muted mb-2" />
                  <p className="text-sm text-text-secondary mb-3">Connect a Salla or Zid store to manage platform-specific settings</p>
                  <Link href="/dashboard/integrations">
                    <Button size="sm" variant="secondary"><Icon name="add" className="text-sm" /> Connect Store</Button>
                  </Link>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Product info card */}
          <Card className="p-4">
            <div className="aspect-square bg-surface-sunken rounded-lg overflow-hidden mb-3 relative">
              {product.images?.[0] ? (
                <Image src={product.images[0]} alt="" fill sizes="300px" className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="image" className="text-4xl text-text-muted" />
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Supplier</span>
                <span className="text-text font-medium">{product.supplier}</span>
              </div>
              {product.supplier !== "direct" && product.supplier_product_id && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Source</span>
                  <a
                    href={`https://www.aliexpress.com/item/${product.supplier_product_id}.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent text-xs hover:underline flex items-center gap-1"
                  >
                    View on AliExpress <Icon name="open_in_new" className="text-[10px]" />
                  </a>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Images</span>
                <span className="text-text text-xs">{localImages.length} image{localImages.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">SKU</span>
                <span className="text-text font-mono text-xs">{product.supplier_product_id?.slice(0, 16)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Created</span>
                <span className="text-text text-xs">{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
              {((product as any)?.listings?.[0]?.store_product_id) && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Store ID</span>
                  <span className="text-text font-mono text-xs">{((product as any)?.listings?.[0]?.store_product_id)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="p-4">
            <h3 className="text-xs font-medium text-text-muted uppercase mb-3">Actions</h3>
            <div className="space-y-2">
              <Button className="w-full justify-start" size="sm" onClick={handleSave} disabled={saving}>
                <Icon name="save" className="text-sm" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
              {connectedStores.filter((store) => {
                if (isStoreSynced(store.platform)) return false;
                return true;
              }).length > 0 && (
                <>
                  {connectedStores.filter((store) => {
                    if (isStoreSynced(store.platform)) return false;
                    return true;
                  }).map((store) => (
                    <Button key={store.id} variant="secondary" className="w-full justify-start" size="sm" onClick={() => handlePush(store.platform)} disabled={saving}>
                      <Icon name="cloud_upload" className="text-sm" /> Push to {store.platform === "zid" ? "Zid" : "Salla"}
                    </Button>
                  ))}
                </>
              )}
              <Button variant="secondary" className="w-full justify-start text-error hover:!bg-error/10" size="sm" onClick={() => setDeleteConfirm(true)}>
                <Icon name="delete" className="text-sm" /> Delete Product
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

// ─── AI Generate Section Component ───
interface AIResult {
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  metadata_title?: string;
  metadata_description?: string;
  hashtags_en?: string[];
  hashtags_ar?: string[];
  seo_keywords_en?: string;
  seo_keywords_ar?: string;
}

function AIGenerateSection({
  productId,
  onApply,
}: {
  productId: string;
  onApply: (result: AIResult) => void;
}) {
  const [contentType, setContentType] = useState<string>("description");
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/products/${productId}/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: contentType, language: "both" }),
      });

      const data = await res.json();

      if (data.generated) {
        setResult(data.generated);
        setShowPreview(true);
      } else if (data.prompt) {
        setPrompt(data.prompt);
        setShowPreview(true);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError("Failed to connect. Check n8n configuration.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="px-2 py-1.5 bg-surface border border-border rounded-md text-xs text-text outline-none focus:border-accent"
        >
          <option value="description">📝 Description + SEO</option>
          <option value="social_post">📱 Social Post</option>
          <option value="carousel">🎠 Carousel</option>
          <option value="reel">🎬 Reel Script</option>
        </select>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin inline-block" />
              Generating...
            </>
          ) : (
            <>
              <Icon name="auto_awesome" className="text-sm" /> ✨ Generate with AI
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-error mt-2">{error}</p>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="auto_awesome" className="text-accent text-lg" />
                <h3 className="text-lg font-semibold text-text">AI Generated Content</h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 rounded-md hover:bg-surface-sunken text-text-muted"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            {result ? (
              <div className="space-y-4">
                {/* Titles */}
                {(result.title_en || result.title_ar) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.title_en && (
                      <div>
                        <label className="text-xs font-medium text-text-muted uppercase mb-1 block">Title (English)</label>
                        <p className="text-sm text-text bg-surface-sunken rounded-lg p-3">{result.title_en}</p>
                      </div>
                    )}
                    {result.title_ar && (
                      <div>
                        <label className="text-xs font-medium text-text-muted uppercase mb-1 block">Title (Arabic)</label>
                        <p className="text-sm text-text bg-surface-sunken rounded-lg p-3" dir="rtl">{result.title_ar}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Descriptions */}
                {(result.description_en || result.description_ar) && (
                  <div className="space-y-3">
                    {result.description_en && (
                      <div>
                        <label className="text-xs font-medium text-text-muted uppercase mb-1 block">Description (English)</label>
                        <div className="text-sm text-text bg-surface-sunken rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {result.description_en}
                        </div>
                      </div>
                    )}
                    {result.description_ar && (
                      <div>
                        <label className="text-xs font-medium text-text-muted uppercase mb-1 block">Description (Arabic)</label>
                        <div className="text-sm text-text bg-surface-sunken rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto" dir="rtl">
                          {result.description_ar}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SEO Metadata */}
                {(result.metadata_title || result.metadata_description) && (
                  <div className="border border-accent/20 rounded-lg p-4 bg-accent/5">
                    <h4 className="text-xs font-medium text-accent uppercase mb-3 flex items-center gap-1">
                      <Icon name="search" className="text-xs" /> SEO Metadata
                    </h4>
                    {result.metadata_title && (
                      <div className="mb-2">
                        <label className="text-[10px] text-text-muted block">Meta Title ({result.metadata_title.length}/70)</label>
                        <p className="text-sm text-text font-medium">{result.metadata_title}</p>
                      </div>
                    )}
                    {result.metadata_description && (
                      <div>
                        <label className="text-[10px] text-text-muted block">Meta Description ({result.metadata_description.length}/160)</label>
                        <p className="text-xs text-text-secondary">{result.metadata_description}</p>
                      </div>
                    )}

                    {/* SERP Preview */}
                    <div className="mt-3 bg-white dark:bg-gray-900 rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-text-muted mb-1 uppercase font-medium">Google Preview</p>
                      <div className="text-[#1a0dab] dark:text-blue-400 text-sm font-medium truncate">{result.metadata_title || "Product Title"}</div>
                      <div className="text-[#006621] dark:text-green-400 text-xs truncate mt-0.5">store.salla.sa › products</div>
                      <div className="text-xs text-[#545454] dark:text-gray-400 mt-0.5 line-clamp-2">{result.metadata_description}</div>
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                {(result.hashtags_en?.length || result.hashtags_ar?.length) ? (
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-2 block">Hashtags</label>
                    <div className="flex flex-wrap gap-1">
                      {(result.hashtags_en || []).map((tag, i) => (
                        <span key={`en-${i}`} className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full text-xs">
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                      {(result.hashtags_ar || []).map((tag, i) => (
                        <span key={`ar-${i}`} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs" dir="rtl">
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button
                    size="sm"
                    onClick={() => {
                      onApply(result);
                      setShowPreview(false);
                    }}
                    className="flex-1"
                  >
                    <Icon name="check" className="text-sm" /> Apply to Product
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowPreview(false);
                      handleGenerate();
                    }}
                  >
                    <Icon name="refresh" className="text-sm" /> Regenerate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ) : prompt ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-500 font-medium mb-1">⚠️ n8n Not Configured</p>
                  <p className="text-xs text-text-secondary">
                    Configure your n8n webhook URLs in Admin → Settings → AI Content Engine.
                    Below is the prompt that will be sent:
                  </p>
                </div>
                <div className="bg-surface-sunken rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono">{prompt}</pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(prompt);
                    }}
                    className="flex-1"
                  >
                    <Icon name="content_copy" className="text-sm" /> Copy Prompt
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      )}
    </>
  );
}
