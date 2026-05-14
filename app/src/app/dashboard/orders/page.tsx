"use client";

import React, { useState } from "react";
import { Card, Button, Badge, Icon, Skeleton, EmptyState } from "@/components/shared";
import { useOrders } from "@/hooks/use-orders";
import type { OrderStatus } from "@/lib/supabase/types";

/* ================================================================
   ORDERS MANAGEMENT — Track, filter, and manage all orders
   ================================================================ */

const statusVariant: Record<string, "success" | "warning" | "error" | "neutral" | "info"> = {
  delivered: "success",
  shipped: "info",
  processing: "warning",
  ordered: "info",
  new: "info",
  failed: "error",
  held: "warning",
  cancelled: "error",
};

const TAB_STATUSES: { label: string; status?: OrderStatus }[] = [
  { label: "All" },
  { label: "New", status: "new" },
  { label: "Processing", status: "processing" },
  { label: "Ordered", status: "ordered" },
  { label: "Shipped", status: "shipped" },
  { label: "Delivered", status: "delivered" },
  { label: "Failed", status: "failed" },
];

export default function OrdersPage() {
  const [activeStatus, setActiveStatus] = useState<OrderStatus | null>(null);
  const { orders, counts, loading, error } = useOrders(activeStatus);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Orders</h1>
          <p className="text-sm text-text-secondary">Track and manage all customer orders</p>
        </div>
        <Button variant="secondary" size="sm">
          <Icon name="download" className="text-sm" />
          Export CSV
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {TAB_STATUSES.map((tab) => {
          const isActive = tab.status ? activeStatus === tab.status : activeStatus === null;
          const count = tab.status ? (counts[tab.status] || 0) : counts.all;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveStatus(tab.status || null)}
              className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-on"
                  : "text-text-secondary hover:bg-surface-sunken border border-border-subtle"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-xs opacity-70">({loading ? "…" : count})</span>
            </button>
          );
        })}
      </div>

      {/* Pipeline */}
      <Card className="p-4 mb-4">
        <h3 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wider">
          Order Pipeline
        </h3>
        <div className="flex items-center gap-3 overflow-x-auto">
          {[
            { label: "New", icon: "fiber_new", status: "new" as OrderStatus },
            { label: "Processing", icon: "schedule", status: "processing" as OrderStatus },
            { label: "Ordered", icon: "shopping_cart", status: "ordered" as OrderStatus },
            { label: "Shipped", icon: "local_shipping", status: "shipped" as OrderStatus },
            { label: "Delivered", icon: "check_circle", status: "delivered" as OrderStatus },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <div className="flex items-center gap-2 shrink-0">
                <Icon name={step.icon} className="text-base text-text-secondary" />
                <span className="text-sm font-medium text-text">{step.label}</span>
                <span className="text-xs text-text-muted">
                  ({loading ? "…" : counts[step.status] || 0})
                </span>
              </div>
              {i < arr.length - 1 && (
                <Icon name="arrow_forward" className="text-sm text-text-muted shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
          <Icon name="error" className="text-base" />
          {error}
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["", "Order #", "Date", "Customer", "Total", "Cost", "Profit", "Status", ""].map(
                  (h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-sunken">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-muted text-sm">
                    No orders found. When customers purchase, orders will appear here.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border-subtle hover:bg-surface-sunken transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-border accent-accent" />
                    </td>
                    <td className="px-4 py-3 font-medium text-text">#{order.store_order_id}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {new Date(order.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-text">{order.customer_info?.name || "—"}</td>
                    <td className="px-4 py-3 font-medium text-text">SAR {order.total_amount}</td>
                    <td className="px-4 py-3 text-text-secondary">SAR {order.total_cost}</td>
                    <td className="px-4 py-3 text-success font-medium">SAR {order.net_profit}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[order.status] || "neutral"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <span className="text-xs text-text-muted">
            Showing {orders.length} of {counts.all} orders
          </span>
        </div>
      </Card>
    </>
  );
}
