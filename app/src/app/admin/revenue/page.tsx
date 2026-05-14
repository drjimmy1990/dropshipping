"use client";
import React, { useState } from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";

export default function RevenuePage() {
  const [mode, setMode] = useState<"commission" | "subscription">("commission");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Revenue & Commission</h1>
        <p className="text-sm text-text-secondary">Configure how the platform generates revenue</p>
      </div>

      {/* Revenue Mode */}
      <Card className="p-5 mb-4">
        <h3 className="text-base font-semibold text-text mb-4">Revenue Model</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <button onClick={() => setMode("commission")} className={`p-4 rounded-md border-2 text-left transition-all ${mode === "commission" ? "border-accent bg-accent-subtle" : "border-border hover:border-border"}`}>
            <div className="flex items-center gap-3 mb-1">
              <Icon name="percent" className={`text-base ${mode === "commission" ? "text-accent" : "text-text-secondary"}`} />
              <span className="font-medium text-text">Commission-Based</span>
              {mode === "commission" && <Badge variant="success">Active</Badge>}
            </div>
            <p className="text-xs text-text-secondary">Charge a percentage per fulfilled order.</p>
          </button>
          <button onClick={() => setMode("subscription")} className={`p-4 rounded-md border-2 text-left transition-all ${mode === "subscription" ? "border-accent bg-accent-subtle" : "border-border hover:border-border"}`}>
            <div className="flex items-center gap-3 mb-1">
              <Icon name="card_membership" className={`text-base ${mode === "subscription" ? "text-accent" : "text-text-secondary"}`} />
              <span className="font-medium text-text">Subscription Only</span>
              {mode === "subscription" && <Badge variant="success">Active</Badge>}
            </div>
            <p className="text-xs text-text-secondary">Revenue comes only from subscription plans.</p>
          </button>
        </div>
      </Card>

      {/* Subscription Tiers */}
      <Card className="overflow-hidden mb-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-base font-semibold text-text">Subscription Tiers</h3>
          <Button size="sm"><Icon name="add" className="text-sm" />Add Tier</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Tier", "Monthly", "Yearly", "Max Stores", "Max Products", ...(mode === "commission" ? ["Commission %"] : []), "Merchants", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-sunken">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Free", monthly: 0, yearly: 0, stores: 1, products: 50, commission: "8%", merchants: 1240, active: true },
                { name: "Starter", monthly: 49, yearly: 39, stores: 1, products: 500, commission: "5%", merchants: 2103, active: true },
                { name: "Growth", monthly: 149, yearly: 119, stores: 3, products: 2000, commission: "3%", merchants: 1547, active: true },
                { name: "Pro", monthly: 349, yearly: 279, stores: 999, products: 999999, commission: "1%", merchants: 357, active: true },
              ].map((t) => (
                <tr key={t.name} className="border-b border-border-subtle hover:bg-surface-sunken transition-colors">
                  <td className="px-4 py-3 font-medium text-text">{t.name}</td>
                  <td className="px-4 py-3 text-text">SAR {t.monthly}</td>
                  <td className="px-4 py-3 text-text">SAR {t.yearly}</td>
                  <td className="px-4 py-3 text-text">{t.stores === 999 ? "∞" : t.stores}</td>
                  <td className="px-4 py-3 text-text">{t.products === 999999 ? "∞" : t.products.toLocaleString()}</td>
                  {mode === "commission" && <td className="px-4 py-3 font-medium text-success">{t.commission}</td>}
                  <td className="px-4 py-3 text-text">{t.merchants.toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge variant={t.active ? "success" : "warning"}>{t.active ? "Active" : "Draft"}</Badge></td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm"><Icon name="edit" className="text-sm" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Revenue Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Subscription Revenue", value: "SAR 842,300", period: "This month", change: "+12%", icon: "credit_card" },
          { label: "Commission Revenue", value: "SAR 358,100", period: "This month", change: "+24%", icon: "payments" },
          { label: "Platform Revenue", value: "SAR 1,200,400", period: "This month", change: "+18%", icon: "account_balance" },
        ].map((r) => (
          <Card key={r.label} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center">
                <Icon name={r.icon} className="text-accent text-base" />
              </div>
              <Badge variant="success">{r.change}</Badge>
            </div>
            <div className="text-xs text-text-secondary mb-0.5">{r.label}</div>
            <div className="text-xl font-bold text-text mb-0.5">{r.value}</div>
            <div className="text-xs text-text-muted">{r.period}</div>
          </Card>
        ))}
      </div>
    </>
  );
}
