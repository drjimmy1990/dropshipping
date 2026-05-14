"use client";

import React from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";
import { ORDERS, STATUS_COLORS } from "@/data/mockData";
import type { OrderStatus } from "@/data/mockData";

/* ================================================================
   ORDERS MANAGEMENT — Track, filter, and manage all orders
   ================================================================ */

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
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {ORDER_TABS.map((tab, i) => (
        <button
          key={tab.label}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            i === 0
              ? "primary-gradient text-white"
              : "text-on-surface-variant hover:bg-white/5 border border-outline-variant/30"
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}

function OrderPipeline() {
  const steps = [
    { label: "New", count: 12, color: "bg-yellow-400" },
    { label: "Processing", count: 28, color: "bg-secondary-container" },
    { label: "Ordered", count: 45, color: "bg-primary-container" },
    { label: "Shipped", count: 52, color: "bg-tertiary" },
    { label: "Delivered", count: 8, color: "bg-tertiary" },
  ];

  return (
    <GlassCard className="p-6 rounded-xl mb-6">
      <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
        Order Pipeline
      </h3>
      <div className="flex items-center gap-4 overflow-x-auto">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-3 h-3 rounded-full ${step.color}`} />
              <span className="text-sm font-medium">{step.label}</span>
              <span className="text-xs text-on-surface-variant">({step.count})</span>
            </div>
            {i < steps.length - 1 && (
              <Icon name="arrow_forward" size="sm" className="text-outline-variant shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </GlassCard>
  );
}

function OrdersTable() {
  return (
    <GlassCard className="rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {["", "Order #", "Date", "Customer", "Products", "Total", "Cost", "Profit", "Supplier", "Status", ""].map(
                (h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
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
                className="border-b border-white/5 hover:bg-white/3 transition-colors"
              >
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded border-outline-variant accent-primary-container" />
                </td>
                <td className="px-4 py-3 font-medium text-on-surface">{order.id}</td>
                <td className="px-4 py-3 text-on-surface-variant">{order.date}</td>
                <td className="px-4 py-3">{order.customer}</td>
                <td className="px-4 py-3 text-on-surface-variant max-w-[180px] truncate">
                  {order.products}
                </td>
                <td className="px-4 py-3 font-medium">SAR {order.total}</td>
                <td className="px-4 py-3 text-on-surface-variant">SAR {order.cost}</td>
                <td className="px-4 py-3 text-tertiary font-medium">SAR {order.profit}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium ${
                      order.supplier === "AliExpress" ? "text-primary" : "text-secondary"
                    }`}
                  >
                    {order.supplier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={order.status}>{order.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <button className="text-on-surface-variant hover:text-on-surface text-xs hover:bg-white/5 px-2 py-1 rounded transition-colors">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
        <span className="text-xs text-on-surface-variant">Showing 1-8 of 147 orders</span>
        <div className="flex gap-2">
          {[1, 2, 3, "...", 19].map((p, i) => (
            <button
              key={i}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                p === 1 ? "primary-gradient text-white" : "text-on-surface-variant hover:bg-white/5"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export default function OrdersPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Orders</h2>
          <p className="text-sm text-on-surface-variant">Track and manage all customer orders</p>
        </div>
        <GradientButton variant="outline" size="sm">
          <span className="flex items-center gap-2">
            <Icon name="download" size="sm" />
            Export CSV
          </span>
        </GradientButton>
      </div>
      <StatusTabs />
      <OrderPipeline />
      <OrdersTable />
    </>
  );
}
