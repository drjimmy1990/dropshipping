"use client";

import React from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useWallet } from "@/hooks/use-wallet";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import type { Order, OrderStatus } from "@/lib/supabase/types";

/* ================================================================
   DASHBOARD OVERVIEW — Stats, Revenue Chart, Recent Orders, Alerts
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

function StatsRow() {
  const { wallet, loading: wLoading } = useWallet();
  const { orders, loading: oLoading } = useOrders();
  const { activeCount, outOfStockCount, loading: pLoading } = useProducts();

  const today = new Date().toISOString().slice(0, 10);
  const ordersToday = orders.filter((o) => o.created_at?.slice(0, 10) === today).length;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const revenueThisMonth = orders
    .filter((o) => o.created_at?.slice(0, 7) === thisMonth)
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const stats = [
    {
      label: "Wallet Balance",
      value: wLoading ? null : `SAR ${(wallet?.balance ?? 0).toLocaleString("en", { minimumFractionDigits: 2 })}`,
      icon: "account_balance_wallet",
      loading: wLoading,
    },
    {
      label: "Orders Today",
      value: oLoading ? null : `${ordersToday}`,
      icon: "receipt_long",
      loading: oLoading,
    },
    {
      label: "Active Products",
      value: pLoading ? null : `${activeCount}`,
      detail: pLoading ? null : `${outOfStockCount} out of stock`,
      icon: "inventory_2",
      loading: pLoading,
    },
    {
      label: "Revenue This Month",
      value: oLoading ? null : `SAR ${revenueThisMonth.toLocaleString("en")}`,
      icon: "trending_up",
      loading: oLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center">
              <Icon name={stat.icon} className="text-accent text-base" />
            </div>
          </div>
          <div className="text-xs text-text-secondary mb-0.5">{stat.label}</div>
          {stat.loading ? (
            <Skeleton className="h-7 w-28 mt-1" />
          ) : (
            <div className="text-xl font-bold text-text">{stat.value}</div>
          )}
          {stat.detail && !stat.loading && (
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
  const { orders, loading } = useOrders();
  const recent = orders.slice(0, 5);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text">Recent Orders</h3>
        <a href="/dashboard/orders" className="text-xs text-accent hover:underline">
          View All →
        </a>
      </div>
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            No orders yet — they'll appear here when customers buy.
          </div>
        ) : (
          recent.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-text">#{order.store_order_id}</div>
                <div className="text-xs text-text-secondary">{order.customer_info?.name || "Customer"}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-text">SAR {order.total_amount}</div>
                <Badge variant={statusVariant[order.status] || "neutral"}>
                  {order.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { icon: "download", label: "Import Products", href: "/dashboard/products/discover" },
    { icon: "sync", label: "Sync Stock", href: "#" },
    { icon: "receipt_long", label: "View Orders", href: "/dashboard/orders" },
    { icon: "add_card", label: "Top Up Wallet", href: "/dashboard/wallet" },
  ];

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-text mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <a
            key={a.label}
            href={a.href}
            className="p-3 rounded-md border border-border-subtle flex flex-col items-center gap-2 hover:bg-surface-sunken transition-colors text-center"
          >
            <Icon name={a.icon} className="text-accent text-lg" />
            <span className="text-xs font-medium text-text-secondary">{a.label}</span>
          </a>
        ))}
      </div>
    </Card>
  );
}

function AlertsPanel() {
  const { wallet } = useWallet();
  const { orders } = useOrders();

  const failedCount = orders.filter((o) => o.status === "failed").length;
  const lowBalance = wallet && wallet.balance < (wallet.low_balance_alert || 50);

  const alerts: { icon: string; text: string; type: "warning" | "error" | "info" }[] = [];

  if (lowBalance) {
    alerts.push({ icon: "warning", text: "Low wallet balance — Top up recommended", type: "warning" });
  }
  if (failedCount > 0) {
    alerts.push({ icon: "error", text: `${failedCount} order(s) failed to fulfill`, type: "error" });
  }
  if (alerts.length === 0) {
    alerts.push({ icon: "info", text: "All systems operational", type: "info" });
  }

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-text mb-4">Alerts</h3>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-md border ${
              alert.type === "error"
                ? "bg-error/5 border-error/20"
                : alert.type === "warning"
                  ? "bg-warning/5 border-warning/20"
                  : "bg-accent/5 border-accent/20"
            }`}
          >
            <Icon
              name={alert.icon}
              className={`text-base ${
                alert.type === "error"
                  ? "text-error"
                  : alert.type === "warning"
                    ? "text-warning"
                    : "text-accent"
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
