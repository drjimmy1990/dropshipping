"use client";
import React, { useState } from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useAdminMerchants } from "@/hooks/use-admin";

export default function MerchantsPage() {
  const { merchants, loading, error } = useAdminMerchants();
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");

  const filtered = merchants.filter((m) => {
    const matchSearch = m.business_name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === "all" || m.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Merchant Management</h1>
          <p className="text-sm text-text-secondary">{loading ? "…" : `${merchants.length} total merchants`}</p>
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
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
          </select>
        </div>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
          <Icon name="error" className="text-base" />{error}
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Merchant", "Business", "Plan", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-sunken">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted text-sm">No merchants found.</td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border-subtle hover:bg-surface-sunken transition-colors">
                    <td className="px-4 py-3">
                      <div><p className="font-medium text-text">{m.business_name}</p><p className="text-xs text-text-secondary">{m.email}</p></div>
                    </td>
                    <td className="px-4 py-3 text-text">{m.business_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.plan === "pro" ? "accent" : m.plan === "growth" ? "success" : "neutral"}>
                        {m.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={m.is_active ? "success" : "error"}>
                        {m.is_active ? "active" : "inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(m.created_at).toLocaleDateString("en", { month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm"><Icon name="visibility" className="text-sm" /></Button>
                        <Button variant="ghost" size="sm"><Icon name="edit" className="text-sm" /></Button>
                        <button className="p-1.5 rounded-md hover:bg-error/10 transition-colors text-error"><Icon name="block" className="text-sm" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
