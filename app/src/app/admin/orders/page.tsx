"use client";
import React, { useState } from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useAdminOrders } from "@/hooks/use-admin";
import type { OrderStatus } from "@/lib/supabase/types";

const STATUS_COLORS: Record<string, "success" | "warning" | "info" | "error" | "neutral"> = {
  new: "warning", processing: "info", ordered: "info", shipped: "success",
  delivered: "success", failed: "error", held: "warning", cancelled: "error",
};

export default function AdminOrdersPage() {
  const { orders, loading, error } = useAdminOrders();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Order Monitor</h1>
        <p className="text-sm text-text-secondary">Global view of all orders across all merchants</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total Orders", value: loading ? "…" : `${orders.length}`, icon: "receipt_long" },
          { label: "Processing", value: loading ? "…" : `${statusCounts["processing"] || 0}`, icon: "hourglass_top" },
          { label: "Failed", value: loading ? "…" : `${statusCounts["failed"] || 0}`, icon: "error_outline" },
          { label: "Held", value: loading ? "…" : `${statusCounts["held"] || 0}`, icon: "pause_circle" },
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
      <Card className="p-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-surface rounded-md px-3 py-2 text-sm border border-border text-text-secondary outline-none">
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="processing">Processing</option>
            <option value="ordered">Ordered</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="held">Held</option>
          </select>
        </div>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
          <Icon name="error" className="text-base" />{error}
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Order", "Customer", "Total", "Cost", "Profit", "Status", "Date", ""].map((h, i) => (
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted text-sm">No orders found.</td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="border-b border-border-subtle hover:bg-surface-sunken transition-colors">
                    <td className="px-4 py-3 font-medium text-text">#{o.store_order_id}</td>
                    <td className="px-4 py-3 text-text">{o.customer_info?.name || "—"}</td>
                    <td className="px-4 py-3 font-medium text-text">SAR {o.total_amount}</td>
                    <td className="px-4 py-3 text-text-secondary">SAR {o.total_cost}</td>
                    <td className="px-4 py-3 text-success font-medium">SAR {o.net_profit}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS_COLORS[o.status] || "neutral"}>{o.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(o.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm"><Icon name="visibility" className="text-sm" /></Button>
                        {o.status === "failed" && <Button variant="ghost" size="sm"><Icon name="replay" className="text-sm text-success" /></Button>}
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
