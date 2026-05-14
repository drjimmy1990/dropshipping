"use client";

import React from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { DASHBOARD_STATS, ORDERS } from "@/data/mockData";

/* ================================================================
   DASHBOARD OVERVIEW — Stats, Revenue Chart, Recent Orders, Alerts
   ================================================================ */

const statusVariant: Record<string, "success" | "warning" | "error" | "neutral"> = {
  fulfilled: "success",
  processing: "warning",
  failed: "error",
  pending: "neutral",
};

function StatsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {DASHBOARD_STATS.map((stat) => (
        <Card key={stat.label} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center">
              <Icon name={stat.icon} className="text-accent text-base" />
            </div>
            {stat.change && (
              <Badge variant={stat.changeType === "positive" ? "success" : "warning"}>
                {stat.change}
              </Badge>
            )}
          </div>
          <div className="text-xs text-text-secondary mb-0.5">{stat.label}</div>
          <div className="text-xl font-bold text-text">{stat.value}</div>
          {stat.detail && (
            <div className="text-xs text-text-muted mt-1">{stat.detail}</div>
          )}
        </Card>
      ))}
    </div>
  );
}

function RevenueChart() {
  const bars = [40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-text">Revenue Overview</h3>
        <select className="bg-surface-sunken text-text-secondary text-xs rounded-md px-2.5 py-1.5 border border-border outline-none">
          <option>Last 30 Days</option>
          <option>Last 7 Days</option>
          <option>Last 90 Days</option>
        </select>
      </div>
      <div className="flex items-end gap-1.5 h-40">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div
              className="bg-accent rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-text-muted">
        <span>May 1</span>
        <span>May 7</span>
        <span>May 14</span>
      </div>
    </Card>
  );
}

function RecentOrders() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text">Recent Orders</h3>
        <a href="/dashboard/orders" className="text-xs text-accent hover:underline">
          View All →
        </a>
      </div>
      <div className="space-y-2">
        {ORDERS.slice(0, 5).map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
          >
            <div>
              <div className="text-sm font-medium text-text">{order.id}</div>
              <div className="text-xs text-text-secondary">{order.customer}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text">SAR {order.total}</div>
              <Badge variant={statusVariant[order.status] || "neutral"}>
                {order.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { icon: "download", label: "Import Products" },
    { icon: "sync", label: "Sync Stock" },
    { icon: "receipt_long", label: "View Orders" },
    { icon: "add_card", label: "Top Up Wallet" },
  ];

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-text mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            className="p-3 rounded-md border border-border-subtle flex flex-col items-center gap-2 hover:bg-surface-sunken transition-colors text-center"
          >
            <Icon name={a.icon} className="text-accent text-lg" />
            <span className="text-xs font-medium text-text-secondary">{a.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function AlertsPanel() {
  const alerts = [
    { icon: "warning", text: "Low wallet balance — Top up recommended", type: "warning" as const },
    { icon: "error", text: "3 orders failed to fulfill", type: "error" as const },
    { icon: "info", text: "Stock update: 12 items synced", type: "info" as const },
  ];

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-text mb-4">Alerts</h3>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-md border ${
              alert.type === "error"
                ? "bg-error-subtle border-error/20"
                : alert.type === "warning"
                  ? "bg-warning-subtle border-warning/20"
                  : "bg-info-subtle border-info/20"
            }`}
          >
            <Icon
              name={alert.icon}
              className={`text-base ${
                alert.type === "error"
                  ? "text-error"
                  : alert.type === "warning"
                    ? "text-warning"
                    : "text-info"
              }`}
            />
            <span className="text-sm text-text">{alert.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
        <p className="text-sm text-text-secondary">Your store at a glance.</p>
      </div>
      <StatsRow />
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <RecentOrders />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <QuickActions />
        <AlertsPanel />
      </div>
    </>
  );
}
