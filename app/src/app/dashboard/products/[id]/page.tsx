"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, Button, Badge, Icon } from "@/components/shared";
import { useSallaCategories } from "@/hooks/use-salla-categories";
import type { Product } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

type Tab = "general" | "images" | "pricing" | "seo";

export default function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { categories } = useSallaCategories();

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
  const [categoryId, setCategoryId] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [isActive, setIsActive] = useState(true);

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
      .select("*")
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
      setMetaTitle((p.title_en || "").slice(0, 70));
      setMetaDesc((p.description_en || "").slice(0, 160));
      setIsActive(p.is_active);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

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
      };

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast({
          type: "success",
          message: data.sallaSynced
            ? "Saved & synced to Salla ✅"
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
  const handlePush = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}/push`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ type: "success", message: `Pushed to Salla! ID: ${data.sallaProductId}` });
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

  const profit = parseFloat(retailPrice) - product.supplier_cost;
  const margin = product.supplier_cost > 0 ? ((profit / product.supplier_cost) * 100).toFixed(0) : "∞";

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "general", label: "General", icon: "edit_note" },
    { key: "images", label: "Images", icon: "photo_library" },
    { key: "pricing", label: "Pricing", icon: "payments" },
    { key: "seo", label: "SEO", icon: "search" },
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
              {product.store_product_id ? (
                <Badge variant="success" icon="cloud_done">Synced</Badge>
              ) : (
                <Badge variant="warning" icon="cloud_off">Not Synced</Badge>
              )}
              <Badge variant={isActive ? "success" : "neutral"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!product.store_product_id && (
            <Button variant="secondary" size="sm" onClick={handlePush} disabled={saving}>
              <Icon name="cloud_upload" className="text-sm" /> Push to Salla
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Icon name="save" className="text-sm" />
            {saving ? "Saving..." : "Save Changes"}
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
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent">
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
                {/* AI Generate button (disabled stub) */}
                <div className="pt-2 border-t border-border">
                  <Button variant="secondary" size="sm" disabled title="Coming soon — AI content generation">
                    <Icon name="auto_awesome" className="text-sm" /> ✨ Generate with AI (Coming Soon)
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {tab === "images" && (
            <Card className="p-6">
              <h2 className="font-semibold text-text mb-4">Product Images</h2>
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {product.images.map((img, i) => (
                    <div key={i} className="relative aspect-square bg-surface-sunken rounded-lg overflow-hidden border border-border group">
                      <Image src={img} alt={`Product image ${i + 1}`} fill sizes="200px" className="object-cover" unoptimized />
                      {i === 0 && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="accent" icon="star">Main</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-muted">
                  <Icon name="photo_library" className="text-4xl mb-2" />
                  <p className="text-sm">No images available</p>
                </div>
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
              </div>
            </Card>
          )}

          {tab === "seo" && (
            <Card className="p-6">
              <h2 className="font-semibold text-text mb-4">SEO Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Meta Title <span className={`float-right ${metaTitle.length > 70 ? "text-error" : "text-text-muted"}`}>{metaTitle.length}/70</span>
                  </label>
                  <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value.slice(0, 70))} maxLength={70}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Meta Description <span className={`float-right ${metaDesc.length > 160 ? "text-error" : "text-text-muted"}`}>{metaDesc.length}/160</span>
                  </label>
                  <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value.slice(0, 160))} maxLength={160} rows={3}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-text outline-none focus:border-accent resize-none" />
                </div>
                {/* Preview */}
                <div className="bg-surface-sunken rounded-lg p-4 mt-4">
                  <p className="text-xs text-text-muted mb-2">Search preview</p>
                  <div className="text-[#1a0dab] text-base font-medium truncate">{metaTitle || titleEn || "Product Title"}</div>
                  <div className="text-[#006621] text-xs truncate mt-0.5">droplinker.asra3.com › product</div>
                  <div className="text-text-secondary text-xs mt-1 line-clamp-2">{metaDesc || descEn?.slice(0, 160) || "Product description..."}</div>
                </div>
              </div>
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
              <div className="flex justify-between">
                <span className="text-text-secondary">SKU</span>
                <span className="text-text font-mono text-xs">{product.supplier_product_id?.slice(0, 16)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Created</span>
                <span className="text-text text-xs">{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
              {product.store_product_id && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Salla ID</span>
                  <span className="text-text font-mono text-xs">{product.store_product_id}</span>
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
              {!product.store_product_id && (
                <Button variant="secondary" className="w-full justify-start" size="sm" onClick={handlePush} disabled={saving}>
                  <Icon name="cloud_upload" className="text-sm" /> Push to Salla
                </Button>
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
