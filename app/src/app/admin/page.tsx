import React from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";

/* ================================================================
   SUPER ADMIN DASHBOARD — Platform-wide KPIs
   ================================================================ */

export default function AdminDashboardPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Platform Overview</h2>
        <p className="text-sm text-on-surface-variant">Real-time metrics across all merchants</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Merchants", value: "5,247", icon: "group", change: "+12%", color: "text-primary" },
          { label: "Active Subscriptions", value: "3,891", icon: "card_membership", change: "+8%", color: "text-secondary" },
          { label: "Platform Revenue", value: "SAR 1.2M", icon: "account_balance", change: "+24%", color: "text-tertiary" },
          { label: "Orders Today", value: "8,432", icon: "receipt_long", change: "+15%", color: "text-primary" },
        ].map((s) => (
          <GlassCard key={s.label} hover className="p-5 rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center ${s.color}`}>
                <Icon name={s.icon} size="md" />
              </div>
              <Badge variant="success">{s.change}</Badge>
            </div>
            <div className="text-xs text-on-surface-variant mb-1">{s.label}</div>
            <div className="text-2xl font-bold">{s.value}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Transfers", value: "14", icon: "hourglass_top", variant: "warning" as const },
          { label: "Failed Orders", value: "23", icon: "error_outline", variant: "failed" as const },
          { label: "Low Balance Merchants", value: "67", icon: "warning", variant: "warning" as const },
          { label: "Active n8n Workflows", value: "7/7", icon: "check_circle", variant: "success" as const },
        ].map((s) => (
          <GlassCard key={s.label} hover className="p-5 rounded-xl">
            <div className="flex items-center gap-3">
              <Icon name={s.icon} size="md" className={s.variant === "success" ? "text-tertiary" : s.variant === "warning" ? "text-yellow-400" : "text-error"} />
              <div>
                <div className="text-xs text-on-surface-variant">{s.label}</div>
                <div className="text-lg font-bold">{s.value}</div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart Placeholder */}
        <GlassCard className="p-6 rounded-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Revenue Overview</h3>
            <select className="bg-surface-container rounded-lg px-3 py-1.5 text-sm border border-outline-variant/20">
              <option>Last 30 Days</option><option>Last 90 Days</option><option>This Year</option>
            </select>
          </div>
          <div className="h-56 flex items-end gap-2 px-4">
            {[45, 62, 38, 75, 52, 88, 71, 94, 66, 80, 55, 92].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full primary-gradient rounded-t-md transition-all hover:opacity-80" style={{ height: `${h}%` }} />
                <span className="text-[10px] text-on-surface-variant">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/5 text-sm">
            <div><span className="text-on-surface-variant">Subscriptions:</span> <span className="font-semibold">SAR 842K</span></div>
            <div><span className="text-on-surface-variant">Commissions:</span> <span className="font-semibold">SAR 358K</span></div>
          </div>
        </GlassCard>

        {/* System Health */}
        <GlassCard className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-3">
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
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm">{s.label}</span>
                <span className={`flex items-center gap-1 text-xs font-medium ${s.ok ? "text-tertiary" : "text-yellow-400"}`}>
                  <Icon name={s.ok ? "check_circle" : "warning"} size="sm" filled />
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <GlassCard className="p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Recent Platform Activity</h3>
        <div className="space-y-3">
          {[
            { time: "2 min ago", event: "New merchant registered", detail: "Fatima H. — fatima@store.sa", icon: "person_add", color: "text-primary" },
            { time: "8 min ago", event: "Bank transfer pending", detail: "Omar A. — SAR 5,000 receipt uploaded", icon: "account_balance", color: "text-yellow-400" },
            { time: "15 min ago", event: "Order fulfillment failed", detail: "Order #DL-2847 — AliExpress API timeout", icon: "error_outline", color: "text-error" },
            { time: "22 min ago", event: "Merchant upgraded plan", detail: "Sara M. — Starter → Growth", icon: "upgrade", color: "text-tertiary" },
            { time: "1h ago", event: "Bulk stock sync completed", detail: "1,247 products checked across 89 merchants", icon: "sync", color: "text-secondary" },
          ].map((a) => (
            <div key={a.time} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
              <div className={`w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center ${a.color}`}>
                <Icon name={a.icon} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.event}</p>
                <p className="text-xs text-on-surface-variant truncate">{a.detail}</p>
              </div>
              <span className="text-xs text-on-surface-variant shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  );
}
