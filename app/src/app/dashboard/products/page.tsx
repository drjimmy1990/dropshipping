"use client";

import React from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useProducts } from "@/hooks/use-products";

export default function MyProductsPage() {
  const { products, total, activeCount, outOfStockCount, loading, error } = useProducts();

  const stats = [
    { label: "Total Products", value: loading ? "…" : `${total}`, icon: "inventory_2" },
    { label: "Active", value: loading ? "…" : `${activeCount}`, icon: "check_circle" },
    { label: "Out of Stock", value: loading ? "…" : `${outOfStockCount}`, icon: "error" },
    { label: "Pending Sync", value: "—", icon: "sync" },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">My Products</h1>
          <p className="text-sm text-text-secondary">Manage your imported product inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Icon name="sync" className="text-sm" />
            Sync All
          </Button>
          <Button size="sm">
            <Icon name="add" className="text-sm" />
            Import New
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center">
              <Icon name={s.icon} className="text-accent text-base" />
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
          <input type="text" placeholder="Search products..." className="bg-transparent text-sm text-text outline-none w-full placeholder:text-text-muted" />
        </div>
        <select className="bg-surface text-text-secondary text-sm rounded-md px-3 py-2 border border-border outline-none">
          <option>All Status</option>
          <option>Active</option>
          <option>Out of Stock</option>
        </select>
        <select className="bg-surface text-text-secondary text-sm rounded-md px-3 py-2 border border-border outline-none">
          <option>All Suppliers</option>
          <option>AliExpress</option>
          <option>CJ</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
          <Icon name="error" className="text-base" />
          {error}
        </div>
      )}

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["", "Product", "Supplier", "Cost", "Retail", "Stock", "Status", "Actions"].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-sunken">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted text-sm">
                    No products imported yet. Go to Discover to find products.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-border-subtle hover:bg-surface-sunken transition-colors">
                    <td className="px-4 py-3"><input type="checkbox" className="rounded border-border accent-accent" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-surface-sunken flex items-center justify-center shrink-0">
                          <Icon name="image" className="text-sm text-text-muted" />
                        </div>
                        <span className="font-medium text-text max-w-[200px] truncate">
                          {p.title_en || p.title_ar || "Untitled"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs capitalize">{p.supplier}</td>
                    <td className="px-4 py-3 text-text-secondary">SAR {p.supplier_cost}</td>
                    <td className="px-4 py-3 font-medium text-text">SAR {p.retail_price}</td>
                    <td className="px-4 py-3 text-text">{p.stock_quantity}</td>
                    <td className="px-4 py-3">
                      <Badge variant={!p.in_stock ? "error" : p.is_active ? "success" : "warning"}>
                        {!p.in_stock ? "Out of Stock" : p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm"><Icon name="edit" className="text-sm" /></Button>
                        <Button variant="ghost" size="sm"><Icon name="sync" className="text-sm" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
