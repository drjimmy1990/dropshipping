"use client";
import React, { useState } from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";

const TRANSFERS = [
  { id: 1, merchant: "Ahmed K.", email: "ahmed@salla.sa", amount: "5,000", date: "May 14, 2026", bank: "Al Rajhi Bank", ref: "TXN-7842", note: "Monthly top-up", status: "pending" },
  { id: 2, merchant: "Sara M.", email: "sara@zid.store", amount: "2,500", date: "May 14, 2026", bank: "SNB", ref: "TXN-7843", note: "", status: "pending" },
  { id: 3, merchant: "Fatima H.", email: "fatima@outlook.com", amount: "10,000", date: "May 13, 2026", bank: "Al Rajhi Bank", ref: "TXN-7839", note: "Urgent — orders on hold", status: "pending" },
  { id: 4, merchant: "Omar A.", email: "omar@gmail.com", amount: "3,000", date: "May 13, 2026", bank: "Riyad Bank", ref: "TXN-7835", note: "", status: "approved" },
  { id: 5, merchant: "Noor S.", email: "noor@store.sa", amount: "1,500", date: "May 12, 2026", bank: "Al Ahli Bank", ref: "TXN-7830", note: "", status: "approved" },
  { id: 6, merchant: "Khalid R.", email: "khalid@yahoo.com", amount: "500", date: "May 12, 2026", bank: "Al Rajhi Bank", ref: "TXN-7828", note: "Test transfer", status: "rejected" },
];

export default function TransfersPage() {
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const data = tab === "pending" ? TRANSFERS.filter((t) => t.status === "pending") : TRANSFERS;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Bank Transfer Approvals</h1>
          <p className="text-sm text-text-secondary">{TRANSFERS.filter((t) => t.status === "pending").length} pending approvals</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {(["pending", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? "bg-accent text-accent-on" : "text-text-secondary hover:bg-surface-sunken"}`}>
            {t === "pending" ? `Pending (${TRANSFERS.filter((x) => x.status === "pending").length})` : "All Transfers"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {data.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
                  <Icon name="receipt" className="text-accent text-base" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text">{t.merchant}</span>
                    <span className="text-xs text-text-secondary">{t.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted mb-1">
                    <span>🏦 {t.bank}</span>
                    <span>Ref: {t.ref}</span>
                    <span>{t.date}</span>
                  </div>
                  {t.note && <p className="text-xs text-text-secondary italic">&quot;{t.note}&quot;</p>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-text mb-2">SAR {t.amount}</div>
                {t.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button size="sm">Approve</Button>
                    <Button size="sm" variant="secondary" className="!border-error/30 !text-error hover:!bg-error-subtle">Reject</Button>
                  </div>
                ) : (
                  <Badge variant={t.status === "approved" ? "success" : "error"}>{t.status}</Badge>
                )}
              </div>
            </div>
            {t.status === "pending" && (
              <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-3">
                <button className="flex items-center gap-1 text-xs text-accent hover:underline">
                  <Icon name="image" className="text-sm" />View Receipt
                </button>
                <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text">
                  <Icon name="history" className="text-sm" />Transaction History
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
