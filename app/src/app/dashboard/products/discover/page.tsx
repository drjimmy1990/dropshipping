"use client";

import React from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";
import { PRODUCTS } from "@/data/mockData";

function SearchFilters() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 bg-surface rounded-md px-3 py-2.5 border border-border focus-within:border-accent transition-colors mb-4">
        <Icon name="search" className="text-text-muted text-base" />
        <input
          type="text"
          placeholder="Search products by keyword..."
          className="bg-transparent text-text text-sm outline-none w-full placeholder:text-text-muted"
        />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {["All Suppliers", "Category", "Price Range", "Ship To", "Min Rating"].map((f) => (
          <select
            key={f}
            className="bg-surface text-text-secondary text-sm rounded-md px-3 py-2 border border-border outline-none"
          >
            <option>{f}</option>
          </select>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {["AliExpress", "Electronics", "SAR 0 - 500"].map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-subtle text-accent text-xs font-medium"
          >
            {chip}
            <button className="hover:text-error transition-colors">×</button>
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">2,847 products found</span>
        <select className="bg-surface text-text-secondary text-sm rounded-md px-3 py-2 border border-border outline-none">
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
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {PRODUCTS.map((product) => (
        <Card key={product.id} variant="interactive" className="overflow-hidden">
          <div className="relative aspect-square bg-surface-sunken flex items-center justify-center">
            <Icon name="image" className="text-text-muted text-3xl" />
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-surface text-text-secondary text-xs font-medium border border-border-subtle">
              {product.supplier}
            </span>
          </div>
          <div className="p-4">
            <h4 className="text-sm font-medium text-text mb-2 line-clamp-2">
              {product.name}
            </h4>
            <div className="flex items-center gap-1 mb-2">
              <Icon name="star" className="text-warning text-sm" />
              <span className="text-xs text-text-secondary">
                {product.rating} ({product.reviews})
              </span>
            </div>
            <div className="text-base font-bold text-text mb-1">{product.price}</div>
            <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
              <Icon name="local_shipping" className="text-sm" />
              {product.shipping}
            </div>
            <Button size="sm" className="w-full">Import to Store</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Pagination() {
  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3, "...", 142].map((p, i) => (
        <button
          key={i}
          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
            p === 1 ? "bg-accent text-accent-on" : "text-text-secondary hover:bg-surface-sunken"
          }`}
        >
          {p}
        </button>
      ))}
      <button className="px-3 py-1.5 text-sm text-accent hover:bg-accent-subtle rounded-md transition-colors">
        Next →
      </button>
    </div>
  );
}

export default function ProductDiscoveryPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Product Discovery</h1>
        <p className="text-sm text-text-secondary">Browse millions of products from global suppliers</p>
      </div>
      <SearchFilters />
      <ProductGrid />
      <Pagination />
    </>
  );
}
