"use client";

import React from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";
import { PRODUCTS } from "@/data/mockData";

/* ================================================================
   PRODUCT DISCOVERY — Browse & Import Products from Suppliers
   ================================================================ */

function SearchFilters() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/30 focus-within:border-secondary-container transition-colors mb-4">
        <Icon name="search" className="text-on-surface-variant" />
        <input
          type="text"
          placeholder="Search products by keyword..."
          className="bg-transparent text-on-surface outline-none w-full placeholder:text-on-surface-variant/50"
        />
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        {["All Suppliers", "Category", "Price Range", "Ship To", "Min Rating"].map((f) => (
          <select
            key={f}
            className="bg-surface-container-low text-on-surface-variant text-sm rounded-lg px-3 py-2 border border-outline-variant/30 outline-none"
          >
            <option>{f}</option>
          </select>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {["AliExpress", "Electronics", "SAR 0 - 500"].map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
          >
            {chip}
            <button className="hover:text-error transition-colors">×</button>
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-on-surface-variant">2,847 products found</span>
        <select className="bg-surface-container-low text-on-surface-variant text-sm rounded-lg px-3 py-2 border border-outline-variant/30 outline-none">
          <option>Sort: Relevance</option>
          <option>Price: Low to High</option>
          <option>Rating: High to Low</option>
        </select>
      </div>
    </div>
  );
}

function ProductGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
      {PRODUCTS.map((product) => (
        <GlassCard
          key={product.id}
          hover
          className="rounded-xl overflow-hidden group"
        >
          <div className="relative aspect-square bg-surface-container flex items-center justify-center">
            <Icon name="image" size="xl" className="text-on-surface-variant/20" />
            <span
              className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
                product.supplier === "AliExpress"
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-secondary-container/20 text-secondary"
              }`}
            >
              {product.supplier}
            </span>
          </div>
          <div className="p-4">
            <h4 className="text-sm font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h4>
            <div className="flex items-center gap-1 mb-2">
              <Icon name="star" filled className="text-yellow-400" size="sm" />
              <span className="text-xs text-on-surface-variant">
                {product.rating} ({product.reviews})
              </span>
            </div>
            <div className="text-lg font-bold text-on-surface mb-1">{product.price}</div>
            <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-3">
              <Icon name="local_shipping" size="sm" />
              {product.shipping}
            </div>
            <GradientButton size="sm" className="w-full text-xs">
              Import to Store
            </GradientButton>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function Pagination() {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, "...", 142].map((p, i) => (
        <button
          key={i}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
            p === 1
              ? "primary-gradient text-white"
              : "text-on-surface-variant hover:bg-white/5"
          }`}
        >
          {p}
        </button>
      ))}
      <button className="px-4 py-2 text-sm text-secondary hover:bg-white/5 rounded-lg transition-colors">
        Next →
      </button>
    </div>
  );
}

export default function ProductDiscoveryPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Product Discovery</h2>
        <p className="text-sm text-on-surface-variant">Browse millions of products from global suppliers</p>
      </div>
      <SearchFilters />
      <ProductGrid />
      <Pagination />
    </>
  );
}
