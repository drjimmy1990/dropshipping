"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, Button, Badge, Icon } from "@/components/shared";
import { useProductSearch } from "@/hooks/use-product-search";
import type { NormalizedProduct, NormalizedProductDetail } from "@/lib/aliexpress/types";

type SupplierSource = "aliexpress" | "cj";

// CJ feed type (extended from AliExpress feed)
interface CJFeed {
  id: string;
  name: string;
  displayName: string;
  type: "all" | "productFlag" | "category";
  productFlag?: number;
  categoryIds?: string[];
  firstCategoryId?: string;
  productCount: number;
  sortOrder: number;
}

// ---------- Feed Type ----------
interface Feed {
  id: string;
  name: string;
  displayName: string;
  displayNameAr: string;
  category: string;
  productCount: number;
  sortOrder: number;
}

// ---------- Search Filters ----------

function SearchFilters({
  onSearch,
  loading,
  supplier,
}: {
  onSearch: (params: {
    keyword?: string;
    category?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    shipTo?: string;
  }) => void;
  loading: boolean;
  supplier: SupplierSource;
}) {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("");
  const [shipTo, setShipTo] = useState("SA");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Reset sort when supplier changes
  useEffect(() => {
    setSort("");
  }, [supplier]);

  const fireSearch = useCallback((overrides: Record<string, any> = {}) => {
    const params = {
      keyword: keyword || undefined,
      sort: sort || undefined,
      shipTo,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      ...overrides,
    };
    onSearch(params);
  }, [keyword, sort, shipTo, minPrice, maxPrice, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") fireSearch();
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    fireSearch({ sort: newSort || undefined });
  };

  const handleShipToChange = (newShipTo: string) => {
    setShipTo(newShipTo);
    fireSearch({ shipTo: newShipTo });
  };

  const isCJ = supplier === "cj";

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 bg-surface rounded-md px-3 py-2.5 border border-border focus-within:border-accent transition-colors mb-4">
        <Icon name="search" className="text-text-muted text-base" />
        <input
          type="text"
          placeholder={`Search ${isCJ ? 'CJ' : 'AliExpress'} products by keyword...`}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent text-text text-sm outline-none w-full placeholder:text-text-muted"
        />
        <Button size="sm" onClick={() => fireSearch()} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className={`bg-surface text-sm rounded-md px-3 py-2 border outline-none transition-colors ${
            sort
              ? "border-accent text-accent font-medium bg-accent/5"
              : "border-border text-text-secondary"
          }`}
        >
          {isCJ ? (
            <>
              <option value="">Sort: Best Match</option>
              <option value="CJ_POPULAR">🔥 Most Popular</option>
              <option value="CJ_PRICE_ASC">💰 Price: Low → High</option>
              <option value="CJ_PRICE_DESC">💰 Price: High → Low</option>
              <option value="CJ_NEWEST">🆕 Newest</option>
              <option value="CJ_MOST_STOCK">📦 Most Stock</option>
            </>
          ) : (
            <>
              <option value="">Sort: Default</option>
              <option value="SALE_PRICE_ASC">💰 Price: Low → High</option>
              <option value="SALE_PRICE_DESC">💰 Price: High → Low</option>
              <option value="LAST_VOLUME_DESC">🔥 Best Selling</option>
            </>
          )}
        </select>
        {!isCJ && (
          <select
            value={shipTo}
            onChange={(e) => handleShipToChange(e.target.value)}
            className="bg-surface text-text-secondary text-sm rounded-md px-3 py-2 border border-border outline-none"
          >
            <option value="SA">Ship To: Saudi Arabia</option>
            <option value="AE">Ship To: UAE</option>
            <option value="KW">Ship To: Kuwait</option>
            <option value="BH">Ship To: Bahrain</option>
            <option value="QA">Ship To: Qatar</option>
            <option value="OM">Ship To: Oman</option>
          </select>
        )}
        <input
          type="number"
          placeholder="Min Price (SAR)"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="bg-surface text-text-secondary text-sm rounded-md px-3 py-2 border border-border outline-none w-36"
        />
        <input
          type="number"
          placeholder="Max Price (SAR)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="bg-surface text-text-secondary text-sm rounded-md px-3 py-2 border border-border outline-none w-36"
        />
      </div>
    </div>
  );
}

// ---------- Product Card ----------

function ProductCard({
  product,
  onViewDetail,
}: {
  product: NormalizedProduct;
  onViewDetail: (id: number) => void;
}) {
  return (
    <Card variant="interactive" className="overflow-hidden">
      <div className="relative aspect-square bg-surface-sunken flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon name="image" className="text-text-muted text-3xl" />
        )}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-surface/90 text-text-secondary text-xs font-medium border border-border-subtle backdrop-blur-sm">
          {product.supplier === "cj" ? "CJDropshipping" : "AliExpress"}
        </span>
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-error text-white text-xs font-bold">
            -{product.discount}%
          </span>
        )}
      </div>
      <div className="p-4">
        <h4 className="text-sm font-medium text-text mb-2 line-clamp-2">
          {product.title}
        </h4>
        <div className="flex items-center gap-1 mb-2">
          <Icon name="star" className="text-warning text-sm" />
          <span className="text-xs text-text-secondary">
            {product.rating.toFixed(1)} ({product.orders.toLocaleString()} sold)
          </span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-bold text-text">
            {product.currency} {product.price.toFixed(2)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-text-muted line-through">
              {product.currency} {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
          <Icon name="local_shipping" className="text-sm" />
          {product.shipping}
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={() => onViewDetail(product.id)}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
}

// ---------- Product Grid ----------

function ProductGrid({
  products,
  loading,
  onViewDetail,
}: {
  products: NormalizedProduct[];
  loading: boolean;
  onViewDetail: (id: number) => void;
}) {
  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="aspect-square bg-surface-sunken" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-surface-sunken rounded w-3/4" />
              <div className="h-3 bg-surface-sunken rounded w-1/2" />
              <div className="h-5 bg-surface-sunken rounded w-1/3" />
              <div className="h-8 bg-surface-sunken rounded w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Icon name="search" className="text-text-muted text-4xl mb-3" />
        <h3 className="text-lg font-medium text-text mb-1">No products found</h3>
        <p className="text-sm text-text-secondary">
          Try searching with different keywords or adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
}

// ---------- Pagination ----------

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm text-accent hover:bg-accent-subtle rounded-md transition-colors disabled:opacity-30"
      >
        ← Prev
      </button>
      {pages.map((p, i) => (
        <button
          key={i}
          onClick={() => typeof p === "number" && onPageChange(p)}
          disabled={typeof p === "string"}
          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
            p === page
              ? "bg-accent text-accent-on"
              : typeof p === "string"
              ? "text-text-muted cursor-default"
              : "text-text-secondary hover:bg-surface-sunken"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm text-accent hover:bg-accent-subtle rounded-md transition-colors disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
}

// ---------- Product Detail Modal ----------

function ProductDetailModal({
  product,
  loading,
  error,
  onClose,
  onImport,
  importing,
  importError,
  importSuccess,
  importedProductId,
}: {
  product: NormalizedProductDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onImport: (productId: number, retailPrice?: number, shippingCost?: number, shippingMethod?: string, estimatedDelivery?: string) => void;
  importing: boolean;
  importError: string | null;
  importSuccess: boolean;
  importedProductId: string | null;
}) {
  const [retailPrice, setRetailPrice] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedShippingIdx, setSelectedShippingIdx] = useState<number>(0);

  useEffect(() => {
    if (product) {
      // Default select first shipping option
      setSelectedShippingIdx(0);
      // Suggest 30% markup INCLUDING shipping cost
      const shippingCost = product.shippingOptions[0]?.price || 0;
      const totalCost = product.price + shippingCost;
      setRetailPrice(
        Math.ceil(totalCost * 1.3).toString()
      );
    }
  }, [product]);

  if (!product && !loading && !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-xl border border-border shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10 rounded-t-xl">
          <h2 className="text-lg font-semibold text-text">Product Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-sunken transition-colors"
          >
            <Icon name="close" className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
              <span className="ml-3 text-text-secondary">Loading product...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <Icon name="error" className="text-error text-3xl mb-2" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {product && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Images */}
              <div>
                <div className="aspect-square bg-surface-sunken rounded-lg overflow-hidden mb-3">
                  {product.images[selectedImage] ? (
                    <img
                      src={product.images[selectedImage]}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="image" className="text-text-muted text-5xl" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.slice(0, 6).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 transition-colors ${
                        i === selectedImage
                          ? "border-accent"
                          : "border-border hover:border-text-muted"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-3">
                  {product.title}
                </h3>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    <Icon name="star" className="text-warning text-sm" />
                    <span className="text-sm text-text-secondary">
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-text-muted">
                    {product.orders.toLocaleString()} orders
                  </span>
                  <Badge variant={product.stock ? "success" : "error"}>
                    {product.stock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>

                {/* Pricing */}
                <div className="bg-surface rounded-lg p-4 mb-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-text-secondary">
                      Supplier Cost
                    </span>
                    <span className="text-lg font-bold text-text">
                      {product.currency} {product.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">
                      Your Retail Price (SAR):
                    </label>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value)}
                      className="bg-surface text-text text-sm rounded-md px-3 py-2 border border-border outline-none flex-1 focus:border-accent"
                      min={product.price}
                      step="0.01"
                    />
                  </div>
                  {(() => {
                    const shippingCost = product.shippingOptions[selectedShippingIdx]?.price || 0;
                    const totalCost = product.price + shippingCost;
                    const retail = parseFloat(retailPrice);
                    if (retailPrice && retail > totalCost) {
                      const profit = retail - totalCost;
                      const margin = (profit / totalCost) * 100;
                      return (
                        <div className="mt-2 text-xs text-success">
                          Profit: SAR {profit.toFixed(2)} ({margin.toFixed(0)}% margin)
                          <span className="text-text-muted ml-1">
                            (cost {product.price.toFixed(2)} + ship {shippingCost.toFixed(2)})
                          </span>
                        </div>
                      );
                    } else if (retailPrice && retail > 0 && retail <= totalCost) {
                      return (
                        <div className="mt-2 text-xs text-error">
                          ⚠ Price is below total cost (SAR {totalCost.toFixed(2)} = product + shipping)
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                </div>

                {/* Variants */}
                {product.variants.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text mb-2">
                      Variants ({product.variants.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {product.variants.slice(0, 10).map((v) => (
                        <div
                          key={v.skuId}
                          className="flex items-center justify-between text-xs p-2 rounded bg-surface border border-border"
                        >
                          <span className="text-text-secondary">
                            {v.properties.map((p) => p.value).join(" / ")}
                          </span>
                          <span className="text-text font-medium">
                            SAR {v.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping — Selectable */}
                {product.shippingOptions.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text mb-2">
                      <Icon name="local_shipping" className="text-sm mr-1 align-text-bottom" />
                      Select Shipping Method
                    </h4>
                    <div className="space-y-1.5">
                      {product.shippingOptions.map((opt, i) => (
                        <label
                          key={i}
                          className={`flex items-center justify-between text-xs p-2.5 rounded-lg cursor-pointer border transition-all ${
                            selectedShippingIdx === i
                              ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                              : "border-border bg-surface hover:border-accent/40"
                          }`}
                          onClick={() => {
                            setSelectedShippingIdx(i);
                            // Recalculate suggested retail price with new shipping
                            const newTotal = product.price + opt.price;
                            setRetailPrice(Math.ceil(newTotal * 1.3).toString());
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedShippingIdx === i
                                ? "border-accent"
                                : "border-border"
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
                    {/* Cost summary */}
                    <div className="mt-2 px-2.5 py-2 bg-surface-sunken rounded-md">
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>Product cost</span>
                        <span>SAR {product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-text-secondary mt-0.5">
                        <span>Shipping ({product.shippingOptions[selectedShippingIdx]?.name || "—"})</span>
                        <span>SAR {(product.shippingOptions[selectedShippingIdx]?.price || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-text mt-1 pt-1 border-t border-border">
                        <span>Total landed cost</span>
                        <span>SAR {(product.price + (product.shippingOptions[selectedShippingIdx]?.price || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <Icon name="info" className="text-warning text-base mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-warning">Shipping not available to Saudi Arabia</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          This product may not ship directly to SA. You can still import it and arrange shipping separately.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Import Button */}
                {importSuccess ? (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Icon name="check_circle" className="text-success text-xl" />
                      <span className="text-sm font-semibold text-success">Saved to Your Catalog!</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-3">
                      The product has been saved as a draft. Edit the title, description, images and price before publishing to your Salla store.
                    </p>
                    <div className="flex gap-2 justify-center">
                      {importedProductId && (
                        <Link href={`/dashboard/products/${importedProductId}`}>
                          <Button size="sm" className="gap-1">
                            <Icon name="edit" className="text-sm" />
                            Edit & Customize
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        className="gap-1"
                      >
                        <Icon name="search" className="text-sm" />
                        Keep Browsing
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      const selectedShipping = product.shippingOptions[selectedShippingIdx];
                      onImport(
                        product.id,
                        retailPrice ? parseFloat(retailPrice) : undefined,
                        selectedShipping?.price || 0,
                        selectedShipping?.name || undefined,
                        selectedShipping?.estimatedDays || undefined
                      );
                    }}
                    disabled={importing || !product.stock}
                  >
                    {importing ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Saving to Catalog...
                      </>
                    ) : (
                      <>
                        <Icon name="download" className="text-sm mr-1" />
                        Import to Catalog
                      </>
                    )}
                  </Button>
                )}
                {importError && (
                  <p className="text-xs text-error mt-2 text-center">
                    {importError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Feed Tabs ----------

function FeedTabs({
  feeds,
  activeFeed,
  onFeedChange,
  loading,
}: {
  feeds: Feed[];
  activeFeed: string;
  onFeedChange: (feedName: string) => void;
  loading: boolean;
}) {
  return (
    <div className="mb-4 -mx-1">
      <div className="flex gap-1.5 overflow-x-auto pb-2 px-1 scrollbar-thin">
        {feeds.map((feed) => (
          <button
            key={feed.id}
            onClick={() => onFeedChange(feed.name)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border ${
              activeFeed === feed.name
                ? "bg-accent text-accent-on border-accent shadow-sm"
                : "bg-surface text-text-secondary border-border hover:bg-surface-sunken hover:text-text"
            }`}
          >
            <span>{feed.displayName}</span>
            {feed.productCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeFeed === feed.name
                  ? "bg-white/20 text-accent-on"
                  : "bg-surface-sunken text-text-muted"
              }`}>
                {feed.productCount >= 1000
                  ? `${(feed.productCount / 1000).toFixed(0)}k`
                  : feed.productCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Main Page ----------

export default function ProductDiscoveryPage() {
  const [activeSupplier, setActiveSupplier] = useState<SupplierSource>("aliexpress");

  const {
    search,
    searchProducts,
    detail,
    fetchProductDetail,
    clearDetail,
    importState,
    importProduct,
    clearImportState,
  } = useProductSearch(activeSupplier);

  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [activeFeed, setActiveFeed] = useState("all");
  const [searchFeedNotice, setSearchFeedNotice] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<{
    keyword?: string;
    feedName?: string;
    category?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    shipTo?: string;
  }>({});
  const [clientSort, setClientSort] = useState<string>("");

  /**
   * Client-side sort: guarantees correct sort order regardless of API behavior.
   * The AliExpress feed API sort param is unreliable — this ensures user always
   * sees products in their requested order.
   */
  const sortedProducts = useMemo(() => {
    if (!clientSort || search.products.length === 0) return search.products;

    const sorted = [...search.products];
    switch (clientSort) {
      case "SALE_PRICE_ASC":
      case "CJ_PRICE_ASC":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "SALE_PRICE_DESC":
      case "CJ_PRICE_DESC":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "LAST_VOLUME_DESC":
      case "CJ_POPULAR":
        sorted.sort((a, b) => (b.orders || 0) - (a.orders || 0));
        break;
      // CJ_BEST_MATCH, CJ_NEWEST, CJ_MOST_STOCK — trust API ordering
    }
    return sorted;
  }, [search.products, clientSort]);

  // CJ feeds state
  const [cjFeeds, setCjFeeds] = useState<CJFeed[]>([]);

  // Fetch available feeds on mount
  useEffect(() => {
    const feedUrl = activeSupplier === "cj"
      ? "/api/suppliers/cj/feeds"
      : "/api/suppliers/aliexpress/feeds";

    fetch(feedUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.feeds) {
          setFeeds(data.feeds);
          if (activeSupplier === "cj") {
            setCjFeeds(data.feeds);
          }
        }
      })
      .catch(console.error);
  }, [activeSupplier]);

  // Re-search when supplier changes
  useEffect(() => {
    setCurrentFilters({});
    setClientSort("");
    setSearchFeedNotice(null);
    searchProducts({ shipTo: "SA" });
  }, [activeSupplier, searchProducts]);

  const handleSearch = useCallback(
    (params: {
      keyword?: string;
      category?: string;
      sort?: string;
      minPrice?: number;
      maxPrice?: number;
      shipTo?: string;
    }) => {
      const feedName = activeFeed !== "all" ? activeFeed : undefined;

      if (params.keyword && feedName) {
        // AliExpress text.search API doesn't support feedName filtering.
        // Auto-reset to "All" and show notice.
        const previousFeedLabel = feeds.find(f => f.name === activeFeed)?.displayName || activeFeed;
        setActiveFeed("all");
        setSearchFeedNotice(
          `Keyword search applies to all products. "${previousFeedLabel}" feed was reset to All.`
        );
      } else if (!params.keyword) {
        // Keyword cleared — dismiss any notice and use the active feed
        setSearchFeedNotice(null);
      }

      const merged = {
        ...params,
        feedName: params.keyword ? undefined : feedName, // text.search doesn't support feedName
        page: 1,
      };
      setCurrentFilters(merged);
      setClientSort(params.sort || ""); // Track sort for client-side fallback
      searchProducts(merged);
    },
    [searchProducts, activeFeed, feeds]
  );

  const handleFeedChange = useCallback(
    (feedName: string) => {
      setActiveFeed(feedName);
      setSearchFeedNotice(null);

      const keyword = currentFilters.keyword;
      const params: any = {
        ...currentFilters,
        page: 1,
        // Clear old feed/category params
        feedName: undefined,
        productFlag: undefined,
        categoryId: undefined,
      };

      if (activeSupplier === "cj") {
        // CJ: map feed to productFlag or categoryId
        const cjFeed = cjFeeds.find((f) => f.name === feedName);
        if (cjFeed) {
          if (cjFeed.type === "productFlag" && cjFeed.productFlag !== undefined) {
            params.productFlag = cjFeed.productFlag;
          } else if (cjFeed.type === "category" && cjFeed.firstCategoryId) {
            params.categoryId = cjFeed.firstCategoryId;
          }
        }
        // Clear keyword when switching feeds
        if (keyword && feedName !== "all") {
          params.keyword = undefined;
        }
      } else {
        // AliExpress: use feedName
        params.feedName = feedName !== "all" ? feedName : undefined;
        if (keyword && feedName !== "all") {
          params.keyword = undefined;
          params.feedName = feedName;
        }
      }

      setCurrentFilters(params);
      searchProducts(params);
    },
    [searchProducts, currentFilters, activeSupplier, cjFeeds]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      searchProducts({ ...currentFilters, page });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchProducts, currentFilters]
  );

  const handleViewDetail = useCallback(
    (productId: number) => {
      clearImportState();
      fetchProductDetail(productId);
    },
    [fetchProductDetail, clearImportState]
  );

  const [importedProductId, setImportedProductId] = useState<string | null>(null);

  const handleImport = useCallback(
    async (productId: number, retailPrice?: number, shippingCost?: number, shippingMethod?: string, estimatedDelivery?: string) => {
      const result = await importProduct({ productId, retailPrice, shippingCost, shippingMethod, estimatedDelivery });
      if (result?.success && result.product?.id) {
        setImportedProductId(result.product.id);
      }
    },
    [importProduct]
  );

  const handleCloseDetail = useCallback(() => {
    clearDetail();
    clearImportState();
  }, [clearDetail, clearImportState]);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold text-text">Product Discovery</h1>
          {/* Supplier Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted font-medium">Supplier:</label>
            <select
              value={activeSupplier}
              onChange={(e) => {
                const newSupplier = e.target.value as SupplierSource;
                setActiveSupplier(newSupplier);
              }}
              className={`text-sm font-medium rounded-lg px-3 py-2 border outline-none transition-all cursor-pointer ${
                activeSupplier === "cj"
                  ? "bg-[#e94560]/5 text-[#e94560] border-[#e94560]/30"
                  : "bg-[#e8400a]/5 text-[#e8400a] border-[#e8400a]/30"
              }`}
            >
              <option value="aliexpress">🛒 AliExpress</option>
              <option value="cj">📦 CJDropshipping</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          {activeSupplier === "cj"
            ? "Browse products from CJDropshipping — fast shipping, US/EU warehouses"
            : "Browse millions of products from AliExpress suppliers"
          }
        </p>
      </div>

      <SearchFilters onSearch={handleSearch} loading={search.loading} supplier={activeSupplier} />

      {/* Info banner: keyword search resets feed */}
      {searchFeedNotice && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent">
          <Icon name="info" className="text-base flex-shrink-0" />
          <span className="flex-1">{searchFeedNotice}</span>
          <button
            onClick={() => setSearchFeedNotice(null)}
            className="text-accent/60 hover:text-accent transition-colors"
          >
            <Icon name="close" className="text-base" />
          </button>
        </div>
      )}

      {/* Feed Category Tabs */}
      {feeds.length > 0 && (
        <FeedTabs
          feeds={feeds}
          activeFeed={activeFeed}
          onFeedChange={handleFeedChange}
          loading={search.loading}
        />
      )}

      {/* Results count */}
      {search.totalCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-text-secondary">
            {search.totalCount.toLocaleString()} products found
            {activeFeed !== "all" && !currentFilters.keyword && (
              <span className="text-text-muted ml-1">
                in {feeds.find(f => f.name === activeFeed)?.displayName || activeFeed}
              </span>
            )}
          </span>
          {clientSort && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
              <Icon name="sort" className="text-xs" />
              Sorted by {
                {
                  "SALE_PRICE_ASC": "Price ↑", "SALE_PRICE_DESC": "Price ↓", "LAST_VOLUME_DESC": "Best Selling",
                  "CJ_BEST_MATCH": "Best Match", "CJ_POPULAR": "Most Popular", "CJ_PRICE_ASC": "Price ↑",
                  "CJ_PRICE_DESC": "Price ↓", "CJ_NEWEST": "Newest", "CJ_MOST_STOCK": "Most Stock",
                }[clientSort] || clientSort
              }
            </span>
          )}
        </div>
      )}

      {/* Error message */}
      {search.error && (
        <div className="bg-error/10 text-error rounded-lg p-4 mb-4 text-sm">
          <Icon name="warning" className="mr-1" />
          {search.error}
        </div>
      )}

      <ProductGrid
        products={sortedProducts}
        loading={search.loading}
        onViewDetail={handleViewDetail}
      />

      <Pagination
        page={search.page}
        totalPages={search.totalPages}
        onPageChange={handlePageChange}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detail.product}
        loading={detail.loading}
        error={detail.error}
        onClose={handleCloseDetail}
        onImport={handleImport}
        importing={importState.loading}
        importError={importState.error}
        importSuccess={importState.success}
        importedProductId={importedProductId}
      />
    </>
  );
}

