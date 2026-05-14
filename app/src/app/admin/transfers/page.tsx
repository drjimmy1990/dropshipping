"use client";
import React, { useState } from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useAdminTransfers } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";

export default function TransfersPage() {
  const { transfers, loading, error, approve, reject } = useAdminTransfers();
  const { user } = useAuth();
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const data = tab === "pending" ? transfers.filter((t) => t.status === "pending") : transfers;
  const pendingCount = transfers.filter((t) => t.status === "pending").length;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Bank Transfer Approvals</h1>
          <p className="text-sm text-text-secondary">{loading ? "…" : `${pendingCount} pending approvals`}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {(["pending", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? "bg-accent text-accent-on" : "text-text-secondary hover:bg-surface-sunken"}`}>
            {t === "pending" ? `Pending (${loading ? "…" : pendingCount})` : "All Transfers"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm">
          <Icon name="error" className="text-base" /> {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-16 w-full" /></Card>
          ))
        ) : data.length === 0 ? (
          <Card className="p-8 text-center text-text-muted text-sm">No transfers found.</Card>
        ) : (
          data.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
                    <Icon name="receipt" className="text-accent text-base" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-text">
                        {(t.merchant as any)?.business_name || t.sender_name || "Merchant"}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {(t.merchant as any)?.email || ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted mb-1">
                      {t.bank_name && <span>🏦 {t.bank_name}</span>}
                      {t.reference_number && <span>Ref: {t.reference_number}</span>}
                      <span>{new Date(t.created_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-text mb-2">SAR {t.amount.toLocaleString()}</div>
                  {t.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => user && approve(t.id, user.id)}>Approve</Button>
                      <Button size="sm" variant="secondary" className="!border-error/30 !text-error hover:!bg-error/10" onClick={() => user && reject(t.id, user.id, "Rejected by admin")}>Reject</Button>
                    </div>
                  ) : (
                    <Badge variant={t.status === "approved" ? "success" : "error"}>{t.status}</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
