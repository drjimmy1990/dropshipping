"use client";
import React, { useState } from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";

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
          <h1 className="text-xl font-semibold text-text">Merchant Management</h1>
          <p className="text-sm text-text-secondary">{MERCHANTS.length} total merchants</p>
        </div>
        <Button size="sm">
          <Icon name="person_add" className="text-sm" />
          Add Merchant
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full bg-surface rounded-md pl-9 pr-3 py-2 text-sm border border-border focus:border-accent outline-none transition-colors text-text placeholder:text-text-muted" />
          </div>
          <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="bg-surface rounded-md px-3 py-2 text-sm border border-border text-text-secondary outline-none">
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Merchant", "Business", "Platform", "Plan", "Wallet", "Orders", "Products", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-sunken">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-border-subtle hover:bg-surface-sunken transition-colors">
                  <td className="px-4 py-3">
                    <div><p className="font-medium text-text">{m.name}</p><p className="text-xs text-text-secondary">{m.email}</p></div>
                  </td>
                  <td className="px-4 py-3 text-text">{m.business}</td>
                  <td className="px-4 py-3"><Badge variant="info">{m.platform}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={m.plan === "Pro" ? "accent" : m.plan === "Growth" ? "success" : "neutral"}>{m.plan}</Badge></td>
                  <td className="px-4 py-3 font-medium text-text">SAR {m.wallet}</td>
                  <td className="px-4 py-3 text-text">{m.orders}</td>
                  <td className="px-4 py-3 text-text">{m.products}</td>
                  <td className="px-4 py-3"><Badge variant={m.status === "active" ? "success" : m.status === "suspended" ? "error" : "warning"}>{m.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3 text-xs text-text-muted">{m.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm"><Icon name="visibility" className="text-sm" /></Button>
                      <Button variant="ghost" size="sm"><Icon name="edit" className="text-sm" /></Button>
                      <button className="p-1.5 rounded-md hover:bg-error-subtle transition-colors text-error"><Icon name="block" className="text-sm" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
