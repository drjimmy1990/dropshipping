"use client";

import React from "react";
import { Card, Badge, Icon, Skeleton } from "@/components/shared";
import { useAdminMerchants, useAdminOrders, useAdminTransfers } from "@/hooks/use-admin";

export default function AdminDashboardPage() {
  const { merchants, loading: mLoad } = useAdminMerchants();
  const { orders, loading: oLoad } = useAdminOrders();
  const { transfers, loading: tLoad } = useAdminTransfers();

  const pendingTransfers = transfers.filter((t) => t.status === "pending").length;
  const failedOrders = orders.filter((o) => o.status === "failed").length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Platform Overview</h1>
        <p className="text-sm text-text-secondary">Real-time metrics across all merchants</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total Merchants", value: mLoad ? null : `${merchants.length}`, icon: "group" },
          { label: "Active Subscriptions", value: mLoad ? null : `${merchants.filter((m) => m.is_active).length}`, icon: "card_membership" },
          { label: "Total Orders", value: oLoad ? null : `${orders.length}`, icon: "receipt_long" },
          { label: "Pending Transfers", value: tLoad ? null : `${pendingTransfers}`, icon: "hourglass_top" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center">
                <Icon name={s.icon} className="text-accent text-base" />
              </div>
            </div>
            <div className="text-xs text-text-secondary mb-0.5">{s.label}</div>
            {s.value === null ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <div className="text-xl font-bold text-text">{s.value}</div>
            )}
          </Card>
        ))}
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Transfers", value: tLoad ? "…" : `${pendingTransfers}`, icon: "hourglass_top", type: "warning" },
          { label: "Failed Orders", value: oLoad ? "…" : `${failedOrders}`, icon: "error_outline", type: "error" },
          { label: "Inactive Merchants", value: mLoad ? "…" : `${merchants.filter((m) => !m.is_active).length}`, icon: "warning", type: "warning" },
          { label: "System Status", value: "OK", icon: "check_circle", type: "success" },
        ].map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <Icon
              name={s.icon}
              className={`text-base ${
                s.type === "success" ? "text-success" : s.type === "warning" ? "text-warning" : "text-error"
              }`}
            />
            <div>
              <div className="text-xs text-text-secondary">{s.label}</div>
              <div className="text-lg font-bold text-text">{s.value}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Revenue Chart (still illustrative) */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text">Revenue Overview</h3>
            <select className="bg-surface-sunken text-text-secondary text-xs rounded-md px-2.5 py-1.5 border border-border outline-none">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-48 flex items-end gap-1.5 px-2">
            {[45, 62, 38, 75, 52, 88, 71, 94, 66, 80, 55, 92].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-accent rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-text-muted">
                  {["J","F","M","A","M","J","J","A","S","O","N","D"][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* System Health */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-text mb-4">System Health</h3>
          <div className="space-y-1">
            {[
              { label: "n8n Engine", status: "Operational", ok: true },
              { label: "AliExpress API", status: "Operational", ok: true },
              { label: "CJ API", status: "Ready", ok: true },
              { label: "Supabase", status: "Operational", ok: true },
              { label: "Salla Webhooks", status: "Ready", ok: true },
              { label: "Zid Webhooks", status: "Ready", ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                <span className="text-sm text-text">{s.label}</span>
                <span className={`flex items-center gap-1 text-xs font-medium ${s.ok ? "text-success" : "text-warning"}`}>
                  <Icon name={s.ok ? "check_circle" : "warning"} className="text-sm" />
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Merchants */}
      <Card className="p-5">
        <h3 className="text-base font-semibold text-text mb-4">Recent Merchants</h3>
        <div className="space-y-1">
          {mLoad ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-2.5"><Skeleton className="h-4 w-64" /></div>
            ))
          ) : (
            merchants.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0">
                <div className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
                  <span className="text-accent text-sm font-medium">{m.business_name?.[0] || "M"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{m.business_name}</p>
                  <p className="text-xs text-text-secondary truncate">{m.email}</p>
                </div>
                <Badge variant={m.is_active ? "success" : "warning"}>
                  {m.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-text-muted shrink-0">
                  {new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
}
