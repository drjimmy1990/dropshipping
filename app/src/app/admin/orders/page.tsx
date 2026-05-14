"use client";
import React, { useState } from "react";
import { GlassCard, Badge, Icon } from "@/components/shared";

/* ================================================================
   ADMIN ORDER MONITOR — Global order view across all merchants
   ================================================================ */

const ORDERS = [
  { id: "#DL-2847", merchant: "Ahmed K.", customer: "عبدالله م.", products: "Wireless Earbuds x2", total: "SAR 180", cost: "SAR 90", supplier: "AliExpress", status: "shipped", date: "May 14" },
  { id: "#DL-2846", merchant: "Sara M.", customer: "هدى ع.", products: "Hair Oil Set", total: "SAR 95", cost: "SAR 35", supplier: "CJ", status: "processing", date: "May 14" },
  { id: "#DL-2845", merchant: "Omar A.", customer: "فهد ر.", products: "Smart Watch", total: "SAR 320", cost: "SAR 145", supplier: "AliExpress", status: "failed", date: "May 13" },
  { id: "#DL-2844", merchant: "Fatima H.", customer: "نورة ك.", products: "LED Strip x3", total: "SAR 165", cost: "SAR 78", supplier: "CJ", status: "ordered", date: "May 13" },
  { id: "#DL-2843", merchant: "Noor S.", customer: "خالد ب.", products: "Phone Case x5", total: "SAR 125", cost: "SAR 50", supplier: "AliExpress", status: "delivered", date: "May 12" },
  { id: "#DL-2842", merchant: "Yusuf B.", customer: "سارة ل.", products: "Fitness Band", total: "SAR 85", cost: "SAR 40", supplier: "CJ", status: "new", date: "May 12" },
  { id: "#DL-2841", merchant: "Ahmed K.", customer: "محمد ح.", products: "Serum x2", total: "SAR 70", cost: "SAR 30", supplier: "AliExpress", status: "held", date: "May 11" },
  { id: "#DL-2840", merchant: "Omar A.", customer: "ريم م.", products: "Desk Lamp", total: "SAR 210", cost: "SAR 95", supplier: "AliExpress", status: "shipped", date: "May 11" },
];

const STATUS_COLORS: Record<string, "success" | "warning" | "info" | "failed"> = {
  new: "warning", processing: "info", ordered: "info", shipped: "success", delivered: "success", failed: "failed", held: "warning",
};

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const filtered = ORDERS.filter((o) => (statusFilter === "all" || o.status === statusFilter) && (supplierFilter === "all" || o.supplier.toLowerCase().includes(supplierFilter)));

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Order Monitor</h2>
        <p className="text-sm text-on-surface-variant">Global view of all orders across all merchants</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Orders", value: "8,432", icon: "receipt_long" },
          { label: "Processing", value: "1,247", icon: "hourglass_top" },
          { label: "Failed (24h)", value: "23", icon: "error_outline" },
          { label: "Held (Low Balance)", value: "14", icon: "pause_circle" },
        ].map((s) => (
          <GlassCard key={s.label} hover className="p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Icon name={s.icon} size="md" className="text-primary" />
              <div><div className="text-xs text-on-surface-variant">{s.label}</div><div className="text-lg font-bold">{s.value}</div></div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <GlassCard className="p-4 rounded-xl mb-6">
        <div className="flex flex-wrap gap-4">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm border border-outline-variant/30">
            <option value="all">All Status</option><option value="new">New</option><option value="processing">Processing</option>
            <option value="ordered">Ordered</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option>
            <option value="failed">Failed</option><option value="held">Held</option>
          </select>
          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm border border-outline-variant/30">
            <option value="all">All Suppliers</option><option value="aliexpress">AliExpress</option><option value="cj">CJ</option>
          </select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10">
              {["Order", "Merchant", "Customer", "Products", "Total", "Cost", "Supplier", "Status", "Date", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-medium">{o.id}</td>
                  <td className="px-4 py-3">{o.merchant}</td>
                  <td className="px-4 py-3">{o.customer}</td>
                  <td className="px-4 py-3">{o.products}</td>
                  <td className="px-4 py-3 font-medium">{o.total}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{o.cost}</td>
                  <td className="px-4 py-3"><Badge variant="info">{o.supplier}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={STATUS_COLORS[o.status]}>{o.status.toUpperCase()}</Badge></td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{o.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-white/5 rounded-lg"><Icon name="visibility" size="sm" /></button>
                      {o.status === "failed" && <button className="p-1.5 hover:bg-white/5 rounded-lg text-tertiary"><Icon name="replay" size="sm" /></button>}
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
