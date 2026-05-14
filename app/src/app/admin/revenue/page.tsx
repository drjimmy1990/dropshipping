"use client";
import React, { useState } from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";

/* ================================================================
   REVENUE & COMMISSION CONFIG — Monetization Control Center
   ================================================================ */

export default function RevenuePage() {
  const [mode, setMode] = useState<"commission" | "subscription">("commission");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Revenue & Commission</h2>
        <p className="text-sm text-on-surface-variant">Configure how the platform generates revenue</p>
      </div>

      {/* Revenue Mode Toggle */}
      <GlassCard className="p-6 rounded-xl mb-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Model</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <button onClick={() => setMode("commission")} className={`p-5 rounded-xl border-2 text-left transition-all ${mode === "commission" ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20"}`}>
            <div className="flex items-center gap-3 mb-2">
              <Icon name="percent" size="md" className={mode === "commission" ? "text-primary" : "text-on-surface-variant"} />
              <span className="font-semibold">Commission-Based</span>
              {mode === "commission" && <Badge variant="success">Active</Badge>}
            </div>
            <p className="text-xs text-on-surface-variant">Charge a percentage per fulfilled order. Commission rate varies by subscription tier.</p>
          </button>
          <button onClick={() => setMode("subscription")} className={`p-5 rounded-xl border-2 text-left transition-all ${mode === "subscription" ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20"}`}>
            <div className="flex items-center gap-3 mb-2">
              <Icon name="card_membership" size="md" className={mode === "subscription" ? "text-primary" : "text-on-surface-variant"} />
              <span className="font-semibold">Subscription Only</span>
              {mode === "subscription" && <Badge variant="success">Active</Badge>}
            </div>
            <p className="text-xs text-on-surface-variant">No per-order commission. Revenue comes only from subscription plans.</p>
          </button>
        </div>
      </GlassCard>

      {/* Subscription Tiers */}
      <GlassCard className="p-6 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Subscription Tiers</h3>
          <GradientButton size="sm"><span className="flex items-center gap-1"><Icon name="add" size="sm" />Add Tier</span></GradientButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10">
              {["Tier", "Monthly", "Yearly", "Max Stores", "Max Products", mode === "commission" ? "Commission %" : "", "Merchants", "Status", ""].filter(Boolean).map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                { name: "Free", monthly: 0, yearly: 0, stores: 1, products: 50, commission: "8%", merchants: 1240, active: true },
                { name: "Starter", monthly: 49, yearly: 39, stores: 1, products: 500, commission: "5%", merchants: 2103, active: true },
                { name: "Growth", monthly: 149, yearly: 119, stores: 3, products: 2000, commission: "3%", merchants: 1547, active: true },
                { name: "Pro", monthly: 349, yearly: 279, stores: 999, products: 999999, commission: "1%", merchants: 357, active: true },
              ].map((t) => (
                <tr key={t.name} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">SAR {t.monthly}</td>
                  <td className="px-4 py-3">SAR {t.yearly}</td>
                  <td className="px-4 py-3">{t.stores === 999 ? "∞" : t.stores}</td>
                  <td className="px-4 py-3">{t.products === 999999 ? "∞" : t.products.toLocaleString()}</td>
                  {mode === "commission" && <td className="px-4 py-3 font-semibold text-tertiary">{t.commission}</td>}
                  <td className="px-4 py-3">{t.merchants.toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge variant={t.active ? "success" : "warning"}>{t.active ? "Active" : "Draft"}</Badge></td>
                  <td className="px-4 py-3"><button className="p-1.5 hover:bg-white/5 rounded-lg"><Icon name="edit" size="sm" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Revenue Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Total Subscription Revenue", value: "SAR 842,300", period: "This month", change: "+12%", icon: "credit_card" },
          { label: "Total Commission Revenue", value: "SAR 358,100", period: "This month", change: "+24%", icon: "payments" },
          { label: "Platform Revenue", value: "SAR 1,200,400", period: "This month", change: "+18%", icon: "account_balance" },
        ].map((r) => (
          <GlassCard key={r.label} hover className="p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary"><Icon name={r.icon} size="md" /></div>
              <Badge variant="success">{r.change}</Badge>
            </div>
            <div className="text-xs text-on-surface-variant mb-1">{r.label}</div>
            <div className="text-xl font-bold mb-1">{r.value}</div>
            <div className="text-xs text-on-surface-variant">{r.period}</div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
