"use client";

import React from "react";
import { Card, Button, Badge, Icon, EmptyState } from "@/components/shared";
import { ORDERS } from "@/data/mockData";
import type { OrderStatus } from "@/data/mockData";

/* ================================================================
   ORDERS MANAGEMENT — Track, filter, and manage all orders
   ================================================================ */

const statusVariant: Record<string, "success" | "warning" | "error" | "neutral" | "info"> = {
  fulfilled: "success",
  delivered: "success",
  shipped: "info",
  processing: "warning",
  ordered: "info",
  new: "accent" as "info",
  failed: "error",
  pending: "neutral",
};

const ORDER_TABS: { label: string; count: number; status?: OrderStatus }[] = [
  { label: "All", count: 147 },
  { label: "New", count: 12, status: "new" },
  { label: "Processing", count: 28, status: "processing" },
  { label: "Ordered", count: 45, status: "ordered" },
  { label: "Shipped", count: 52, status: "shipped" },
  { label: "Delivered", count: 8, status: "delivered" },
  { label: "Failed", count: 2, status: "failed" },
];

function StatusTabs() {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
      {ORDER_TABS.map((tab, i) => (
        <button
          key={tab.label}
          className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            i === 0
              ? "bg-accent text-accent-on"
              : "text-text-secondary hover:bg-surface-sunken border border-border-subtle"
          }`}
        >
          {tab.label}
          <span className="ml-1 text-xs opacity-70">({tab.count})</span>
        </button>
      ))}
    </div>
  );
}

function OrderPipeline() {
  const steps = [
    { label: "New", count: 12, icon: "fiber_new" },
    { label: "Processing", count: 28, icon: "schedule" },
    { label: "Ordered", count: 45, icon: "shopping_cart" },
    { label: "Shipped", count: 52, icon: "local_shipping" },
    { label: "Delivered", count: 8, icon: "check_circle" },
  ];

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wider">
        Order Pipeline
      </h3>
      <div className="flex items-center gap-3 overflow-x-auto">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex items-center gap-2 shrink-0">
              <Icon name={step.icon} className="text-base text-text-secondary" />
              <span className="text-sm font-medium text-text">{step.label}</span>
              <span className="text-xs text-text-muted">({step.count})</span>
            </div>
            {i < steps.length - 1 && (
              <Icon name="arrow_forward" className="text-sm text-text-muted shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}

function OrdersTable() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["", "Order #", "Date", "Customer", "Products", "Total", "Cost", "Profit", "Supplier", "Status", ""].map(
                (h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-sunken">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((order) => (
              <tr
                key={order.id}
                className="border-b border-border-subtle hover:bg-surface-sunken transition-colors"
              >
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded border-border accent-accent" />
                </td>
                <td className="px-4 py-3 font-medium text-text">{order.id}</td>
                <td className="px-4 py-3 text-text-secondary">{order.date}</td>
                <td className="px-4 py-3 text-text">{order.customer}</td>
                <td className="px-4 py-3 text-text-secondary max-w-[180px] truncate">
                  {order.products}
                </td>
                <td className="px-4 py-3 font-medium text-text">SAR {order.total}</td>
                <td className="px-4 py-3 text-text-secondary">SAR {order.cost}</td>
                <td className="px-4 py-3 text-success font-medium">SAR {order.profit}</td>
                <td className="px-4 py-3 text-text-secondary text-xs">{order.supplier}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[order.status] || "neutral"}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm">View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
        <span className="text-xs text-text-muted">Showing 1-8 of 147 orders</span>
        <div className="flex gap-1">
          {[1, 2, 3, "...", 19].map((p, i) => (
            <button
              key={i}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                p === 1 ? "bg-accent text-accent-on" : "text-text-secondary hover:bg-surface-sunken"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function OrdersPage() {
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
      <StatusTabs />
      <OrderPipeline />
      <OrdersTable />
    </>
  );
}
