"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, Button, Badge, Icon } from "@/components/shared";
import { useProductSearch } from "@/hooks/use-product-search";
import type { NormalizedProduct, NormalizedProductDetail } from "@/lib/aliexpress/types";

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
}) {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("");
  const [shipTo, setShipTo] = useState("SA");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

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

  // Sort change → immediately search
  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    fireSearch({ sort: newSort || undefined });
  };

  // Ship-to change → immediately search
  const handleShipToChange = (newShipTo: string) => {
    setShipTo(newShipTo);
    fireSearch({ shipTo: newShipTo });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 bg-surface rounded-md px-3 py-2.5 border border-border focus-within:border-accent transition-colors mb-4">
        <Icon name="search" className="text-text-muted text-base" />
        <input
          type="text"
          placeholder="Search AliExpress products by keyword..."
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
          <option value="">Sort: Default</option>
          <option value="SALE_PRICE_ASC">💰 Price: Low → High</option>
          <option value="SALE_PRICE_DESC">💰 Price: High → Low</option>
          <option value="LAST_VOLUME_DESC">🔥 Best Selling</option>
        </select>
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
          AliExpress
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
}: {
  product: NormalizedProductDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onImport: (productId: number, retailPrice?: number) => void;
  importing: boolean;
  importError: string | null;
  importSuccess: boolean;
}) {
  const [retailPrice, setRetailPrice] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (product) {
      // Suggest 30% markup as default retail price
      setRetailPrice(
        Math.ceil(product.price * 1.3).toString()
      );
    }
  }, [product]);

  if (!product && !loading && !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10">
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
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-text-secondary whitespace-nowrap">
                      Your Retail Price (SAR):
                    </label>
                    <input
                      type="number"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value)}
                      className="bg-background text-text text-sm rounded-md px-3 py-2 border border-border outline-none flex-1 focus:border-accent"
                      min={product.price}
                      step="0.01"
                    />
                  </div>
                  {retailPrice && parseFloat(retailPrice) > product.price && (
                    <div className="mt-2 text-xs text-success">
                      Profit: SAR{" "}
                      {(parseFloat(retailPrice) - product.price).toFixed(2)} (
                      {(
                        ((parseFloat(retailPrice) - product.price) /
                          product.price) *
                        100
                      ).toFixed(0)}
                      % margin)
                    </div>
                  )}
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

                {/* Shipping */}
                {product.shippingOptions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text mb-2">
                      Shipping to Saudi Arabia
                    </h4>
                    <div className="space-y-1">
                      {product.shippingOptions.map((opt, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs p-2 rounded bg-surface border border-border"
                        >
                          <span className="text-text-secondary">
                            {opt.name}
                          </span>
                          <span className="text-text">
                            {opt.price > 0
                              ? `SAR ${opt.price.toFixed(2)}`
                              : "Free"}{" "}
                            · {opt.estimatedDays}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Import Button */}
                {importSuccess ? (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Icon name="check_circle" className="text-success text-xl" />
                      <span className="text-sm font-semibold text-success">Product Imported Successfully!</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-3">
                      The product has been saved to your catalog and pushed to your Salla store.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Link href="/dashboard/products">
                        <Button size="sm" className="gap-1">
                          <Icon name="inventory_2" className="text-sm" />
                          Manage Products
                        </Button>
                      </Link>
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
                    onClick={() =>
                      onImport(
                        product.id,
                        retailPrice ? parseFloat(retailPrice) : undefined
                      )
                    }
                    disabled={importing || !product.stock}
                  >
                    {importing ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Importing & Pushing to Store...
                      </>
                    ) : (
                      <>
                        <Icon name="cloud_upload" className="text-sm mr-1" />
                        Import & Push to Salla
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
  const {
    search,
    searchProducts,
    detail,
    fetchProductDetail,
    clearDetail,
    importState,
    importProduct,
    clearImportState,
  } = useProductSearch();

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
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "SALE_PRICE_DESC":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "LAST_VOLUME_DESC":
        sorted.sort((a, b) => (b.orders || 0) - (a.orders || 0));
        break;
    }
    return sorted;
  }, [search.products, clientSort]);

  // Fetch available feeds on mount
  useEffect(() => {
    fetch("/api/suppliers/aliexpress/feeds")
      .then((res) => res.json())
      .then((data) => {
        if (data.feeds) setFeeds(data.feeds);
      })
      .catch(console.error);
  }, []);

  // Initial load — fetch recommended products
  useEffect(() => {
    searchProducts({ shipTo: "SA" });
  }, [searchProducts]);

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
      setSearchFeedNotice(null); // Clear notice on manual feed switch

      // If there's a keyword active, switching feeds clears it (feeds and keyword are exclusive)
      const keyword = currentFilters.keyword;
      const params = {
        ...currentFilters,
        feedName: feedName !== "all" ? feedName : undefined,
        page: 1,
      };

      if (keyword && feedName !== "all") {
        // User picked a feed while keyword is active — feed browsing takes over
        params.keyword = undefined;
        params.feedName = feedName;
      }

      setCurrentFilters(params);
      searchProducts(params);
    },
    [searchProducts, currentFilters]
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

  const handleImport = useCallback(
    async (productId: number, retailPrice?: number) => {
      await importProduct({ productId, retailPrice });
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
        <h1 className="text-xl font-semibold text-text">Product Discovery</h1>
        <p className="text-sm text-text-secondary">
          Browse millions of products from AliExpress suppliers
        </p>
      </div>

      <SearchFilters onSearch={handleSearch} loading={search.loading} />

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
              Sorted by {clientSort === "SALE_PRICE_ASC" ? "Price ↑" : clientSort === "SALE_PRICE_DESC" ? "Price ↓" : "Best Selling"}
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
      />
    </>
  );
}

