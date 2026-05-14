"use client";

import React from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";
import { DASHBOARD_STATS, ORDERS } from "@/data/mockData";

/* ================================================================
   DASHBOARD OVERVIEW — Stats, Charts, Recent Orders, Quick Actions
   ================================================================ */

// --- Stats Row ---
function StatsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
      {DASHBOARD_STATS.map((stat) => (
        <GlassCard key={stat.label} hover className="p-6 rounded-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-container/15 flex items-center justify-center">
              <Icon name={stat.icon} className="text-primary" size="md" />
            </div>
            {stat.change && (
              <Badge variant={stat.changeType === "positive" ? "success" : "warning"}>
                {stat.change}
              </Badge>
            )}
          </div>
          <div className="text-sm text-on-surface-variant mb-1">{stat.label}</div>
          <div className="text-2xl font-bold text-on-surface mb-2">{stat.value}</div>
          {stat.detail && (
            <div className="text-xs text-on-surface-variant">{stat.detail}</div>
          )}
          {stat.action && (
            <GradientButton size="sm" className="mt-3 w-full text-xs">
              {stat.action}
            </GradientButton>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

// --- Revenue Chart Placeholder ---
function RevenueChart() {
  return (
    <GlassCard className="p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Revenue Overview</h3>
        <select className="bg-surface-container-low text-on-surface-variant text-sm rounded-lg px-3 py-1.5 border border-outline-variant/30 outline-none">
          <option>Last 30 Days</option>
          <option>Last 7 Days</option>
          <option>Last 90 Days</option>
        </select>
      </div>
      {/* Chart placeholder with gradient bars */}
      <div className="flex items-end gap-2 h-48">
        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div
              className="primary-gradient rounded-t-md opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 text-xs text-on-surface-variant">
        <span>May 1</span>
        <span>May 7</span>
        <span>May 14</span>
      </div>
    </GlassCard>
  );
}

// --- Recent Orders ---
function RecentOrders() {
  return (
    <GlassCard className="p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Orders</h3>
        <a href="/dashboard/orders" className="text-sm text-secondary hover:underline">
          View All →
        </a>
      </div>
      <div className="space-y-3">
        {ORDERS.slice(0, 5).map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
          >
            <div>
              <div className="text-sm font-medium">{order.id}</div>
              <div className="text-xs text-on-surface-variant">{order.customer}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">SAR {order.total}</div>
              <Badge variant={order.status}>{order.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// --- Quick Actions ---
function QuickActions() {
  const actions = [
    { icon: "download", label: "Import Products", color: "text-primary" },
    { icon: "sync", label: "Sync Stock", color: "text-secondary" },
    { icon: "receipt_long", label: "View Orders", color: "text-tertiary" },
    { icon: "add_card", label: "Top Up Wallet", color: "text-yellow-400" },
  ];

  return (
    <GlassCard className="p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            className="glass-card p-4 rounded-lg flex flex-col items-center gap-2 hover:bg-white/5 transition-colors"
          >
            <Icon name={a.icon} className={a.color} size="lg" />
            <span className="text-xs font-medium text-on-surface-variant">{a.label}</span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

// --- Alerts ---
function AlertsPanel() {
  const alerts = [
    { icon: "warning", text: "Low wallet balance — Top up recommended", type: "warning" as const },
    { icon: "error", text: "3 orders failed to fulfill", type: "error" as const },
    { icon: "info", text: "Stock update: 12 items synced", type: "info" as const },
  ];

  return (
    <GlassCard className="p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5"
          >
            <Icon
              name={alert.icon}
              className={
                alert.type === "warning"
                  ? "text-yellow-400"
                  : alert.type === "error"
                    ? "text-error"
                    : "text-secondary"
              }
              size="md"
            />
            <span className="text-sm text-on-surface-variant">{alert.text}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// --- Page ---
export default function DashboardPage() {
  return (
    <>
      <StatsRow />
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <RecentOrders />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <QuickActions />
        <AlertsPanel />
      </div>
    </>
  );
}
