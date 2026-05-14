"use client";
import React, { useState } from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";

/* ================================================================
   MERCHANT MANAGEMENT — View, search, suspend merchants
   ================================================================ */

const MERCHANTS = [
  { id: 1, name: "Ahmed K.", email: "ahmed@salla.sa", business: "Ahmed Electronics", platform: "Salla", plan: "Growth", wallet: "12,450", orders: 247, products: 89, status: "active", joined: "Jan 2024" },
  { id: 2, name: "Sara M.", email: "sara@zid.store", business: "Sara Beauty", platform: "Zid", plan: "Starter", wallet: "3,200", orders: 89, products: 34, status: "active", joined: "Feb 2024" },
  { id: 3, name: "Omar A.", email: "omar@gmail.com", business: "Omar Fashion", platform: "Salla", plan: "Pro", wallet: "45,800", orders: 1240, products: 156, status: "active", joined: "Nov 2023" },
  { id: 4, name: "Fatima H.", email: "fatima@outlook.com", business: "Fatima Home", platform: "Zid", plan: "Growth", wallet: "120", orders: 56, products: 23, status: "low_balance", joined: "Mar 2024" },
  { id: 5, name: "Khalid R.", email: "khalid@yahoo.com", business: "Khalid Tech", platform: "Salla", plan: "Starter", wallet: "0", orders: 12, products: 5, status: "suspended", joined: "Apr 2024" },
  { id: 6, name: "Noor S.", email: "noor@store.sa", business: "Noor Accessories", platform: "Salla", plan: "Growth", wallet: "8,750", orders: 412, products: 67, status: "active", joined: "Dec 2023" },
  { id: 7, name: "Yusuf B.", email: "yusuf@zid.store", business: "Yusuf Gadgets", platform: "Zid", plan: "Pro", wallet: "22,300", orders: 890, products: 112, status: "active", joined: "Oct 2023" },
];

export default function MerchantsPage() {
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");

  const filtered = MERCHANTS.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === "all" || m.plan.toLowerCase() === filterPlan;
    return matchSearch && matchPlan;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Merchant Management</h2>
          <p className="text-sm text-on-surface-variant">{MERCHANTS.length} total merchants</p>
        </div>
        <GradientButton size="sm"><span className="flex items-center gap-1"><Icon name="person_add" size="sm" />Add Merchant</span></GradientButton>
      </div>

      {/* Filters */}
      <GlassCard className="p-4 rounded-xl mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full bg-surface-container-lowest rounded-lg pl-10 pr-4 py-2.5 text-sm border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors" />
          </div>
          <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm border border-outline-variant/30">
            <option value="all">All Plans</option><option value="starter">Starter</option><option value="growth">Growth</option><option value="pro">Pro</option>
          </select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10">
              {["Merchant", "Business", "Platform", "Plan", "Wallet", "Orders", "Products", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div><p className="font-medium">{m.name}</p><p className="text-xs text-on-surface-variant">{m.email}</p></div>
                  </td>
                  <td className="px-4 py-3">{m.business}</td>
                  <td className="px-4 py-3"><Badge variant="info">{m.platform}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={m.plan === "Pro" ? "info" : m.plan === "Growth" ? "success" : "warning"}>{m.plan}</Badge></td>
                  <td className="px-4 py-3 font-medium">SAR {m.wallet}</td>
                  <td className="px-4 py-3">{m.orders}</td>
                  <td className="px-4 py-3">{m.products}</td>
                  <td className="px-4 py-3"><Badge variant={m.status === "active" ? "success" : m.status === "suspended" ? "failed" : "warning"}>{m.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{m.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"><Icon name="visibility" size="sm" /></button>
                      <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"><Icon name="edit" size="sm" /></button>
                      <button className="p-1.5 hover:bg-error/10 rounded-lg transition-colors text-error"><Icon name="block" size="sm" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}
