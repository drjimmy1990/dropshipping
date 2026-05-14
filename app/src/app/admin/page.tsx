import React from "react";
import { Card, Badge, Icon } from "@/components/shared";

export default function AdminDashboardPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Platform Overview</h1>
        <p className="text-sm text-text-secondary">Real-time metrics across all merchants</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total Merchants", value: "5,247", icon: "group", change: "+12%" },
          { label: "Active Subscriptions", value: "3,891", icon: "card_membership", change: "+8%" },
          { label: "Platform Revenue", value: "SAR 1.2M", icon: "account_balance", change: "+24%" },
          { label: "Orders Today", value: "8,432", icon: "receipt_long", change: "+15%" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center">
                <Icon name={s.icon} className="text-accent text-base" />
              </div>
              <Badge variant="success">{s.change}</Badge>
            </div>
            <div className="text-xs text-text-secondary mb-0.5">{s.label}</div>
            <div className="text-xl font-bold text-text">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Transfers", value: "14", icon: "hourglass_top", type: "warning" },
          { label: "Failed Orders", value: "23", icon: "error_outline", type: "error" },
          { label: "Low Balance Merchants", value: "67", icon: "warning", type: "warning" },
          { label: "Active Workflows", value: "7/7", icon: "check_circle", type: "success" },
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
        {/* Revenue Chart */}
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
          <div className="flex gap-6 mt-4 pt-4 border-t border-border-subtle text-sm">
            <div><span className="text-text-secondary">Subscriptions:</span> <span className="font-medium text-text">SAR 842K</span></div>
            <div><span className="text-text-secondary">Commissions:</span> <span className="font-medium text-text">SAR 358K</span></div>
          </div>
        </Card>

        {/* System Health */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-text mb-4">System Health</h3>
          <div className="space-y-1">
            {[
              { label: "n8n Engine", status: "Operational", ok: true },
              { label: "AliExpress API", status: "Operational", ok: true },
              { label: "CJ API", status: "Degraded", ok: false },
              { label: "Supabase", status: "Operational", ok: true },
              { label: "Stripe Gateway", status: "Operational", ok: true },
              { label: "Moyasar Gateway", status: "Operational", ok: true },
              { label: "Salla Webhooks", status: "Operational", ok: true },
              { label: "Zid Webhooks", status: "Maintenance", ok: false },
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

      {/* Recent Activity */}
      <Card className="p-5">
        <h3 className="text-base font-semibold text-text mb-4">Recent Platform Activity</h3>
        <div className="space-y-1">
          {[
            { time: "2 min ago", event: "New merchant registered", detail: "Fatima H. — fatima@store.sa", icon: "person_add", type: "info" },
            { time: "8 min ago", event: "Bank transfer pending", detail: "Omar A. — SAR 5,000 receipt uploaded", icon: "account_balance", type: "warning" },
            { time: "15 min ago", event: "Order fulfillment failed", detail: "Order #DL-2847 — AliExpress API timeout", icon: "error_outline", type: "error" },
            { time: "22 min ago", event: "Merchant upgraded plan", detail: "Sara M. — Starter → Growth", icon: "upgrade", type: "success" },
            { time: "1h ago", event: "Bulk stock sync completed", detail: "1,247 products checked across 89 merchants", icon: "sync", type: "info" },
          ].map((a) => (
            <div key={a.time} className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                a.type === "error" ? "bg-error-subtle text-error"
                : a.type === "warning" ? "bg-warning-subtle text-warning"
                : a.type === "success" ? "bg-success-subtle text-success"
                : "bg-info-subtle text-info"
              }`}>
                <Icon name={a.icon} className="text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">{a.event}</p>
                <p className="text-xs text-text-secondary truncate">{a.detail}</p>
              </div>
              <span className="text-xs text-text-muted shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
