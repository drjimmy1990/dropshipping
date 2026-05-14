"use client";

import React from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";
import { PRODUCTS } from "@/data/mockData";

export default function MyProductsPage() {
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
        {[
          { label: "Total Products", value: "156", icon: "inventory_2" },
          { label: "Active", value: "132", icon: "check_circle" },
          { label: "Out of Stock", value: "12", icon: "error" },
          { label: "Pending Sync", value: "8", icon: "sync" },
        ].map((s) => (
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

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["", "Product", "Supplier", "Price", "Stock", "Status", "Last Synced", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-sunken">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p, i) => (
                <tr key={p.id} className="border-b border-border-subtle hover:bg-surface-sunken transition-colors">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-border accent-accent" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-surface-sunken flex items-center justify-center shrink-0">
                        <Icon name="image" className="text-sm text-text-muted" />
                      </div>
                      <span className="font-medium text-text max-w-[200px] truncate">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{p.supplier}</td>
                  <td className="px-4 py-3 font-medium text-text">{p.price}</td>
                  <td className="px-4 py-3 text-text">{i % 3 === 0 ? "0" : `${(i + 1) * 15}`}</td>
                  <td className="px-4 py-3">
                    <Badge variant={i % 3 === 0 ? "error" : "success"}>
                      {i % 3 === 0 ? "Out of Stock" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">2 min ago</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Icon name="edit" className="text-sm" /></Button>
                      <Button variant="ghost" size="sm"><Icon name="sync" className="text-sm" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
