"use client";

import React from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";
import { PRODUCTS } from "@/data/mockData";

/* ================================================================
   MY PRODUCTS — Inventory Management
   ================================================================ */

export default function MyProductsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">My Products</h2>
          <p className="text-sm text-on-surface-variant">Manage your imported product inventory</p>
        </div>
        <div className="flex gap-3">
          <GradientButton variant="outline" size="sm">
            <span className="flex items-center gap-2">
              <Icon name="sync" size="sm" />
              Sync All
            </span>
          </GradientButton>
          <GradientButton size="sm">
            <span className="flex items-center gap-2">
              <Icon name="add" size="sm" />
              Import New
            </span>
          </GradientButton>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Products", value: "156", icon: "inventory_2" },
          { label: "Active", value: "132", icon: "check_circle" },
          { label: "Out of Stock", value: "12", icon: "error" },
          { label: "Pending Sync", value: "8", icon: "sync" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4 rounded-xl flex items-center gap-3">
            <Icon name={s.icon} className="text-primary" size="md" />
            <div>
              <div className="text-xs text-on-surface-variant">{s.label}</div>
              <div className="text-xl font-bold">{s.value}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant/30 flex-1 min-w-[200px]">
          <Icon name="search" size="sm" className="text-on-surface-variant" />
          <input type="text" placeholder="Search products..." className="bg-transparent text-sm text-on-surface outline-none w-full" />
        </div>
        <select className="bg-surface-container-low text-on-surface-variant text-sm rounded-lg px-3 py-2 border border-outline-variant/30 outline-none">
          <option>All Status</option>
          <option>Active</option>
          <option>Out of Stock</option>
        </select>
        <select className="bg-surface-container-low text-on-surface-variant text-sm rounded-lg px-3 py-2 border border-outline-variant/30 outline-none">
          <option>All Suppliers</option>
          <option>AliExpress</option>
          <option>CJ</option>
        </select>
      </div>

      {/* Products Table */}
      <GlassCard className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["", "Product", "Supplier", "Price", "Stock", "Status", "Last Synced", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p, i) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-outline-variant accent-primary-container" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <Icon name="image" size="sm" className="text-on-surface-variant/30" />
                      </div>
                      <span className="font-medium max-w-[200px] truncate">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${p.supplier === "AliExpress" ? "text-primary" : "text-secondary"}`}>
                      {p.supplier}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{p.price}</td>
                  <td className="px-4 py-3">{i % 3 === 0 ? "0" : `${(i + 1) * 15}`}</td>
                  <td className="px-4 py-3">
                    <Badge variant={i % 3 === 0 ? "failed" : "success"}>
                      {i % 3 === 0 ? "Out of Stock" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs">2 min ago</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded hover:bg-white/5 transition-colors" title="Edit">
                        <Icon name="edit" size="sm" className="text-on-surface-variant" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-white/5 transition-colors" title="Sync">
                        <Icon name="sync" size="sm" className="text-on-surface-variant" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}
