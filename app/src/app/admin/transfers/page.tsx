"use client";
import React, { useState } from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";

/* ================================================================
   BANK TRANSFER APPROVALS — Approve/reject pending deposits
   ================================================================ */

const TRANSFERS = [
  { id: 1, merchant: "Ahmed K.", email: "ahmed@salla.sa", amount: "5,000", date: "May 14, 2024", bank: "Al Rajhi Bank", ref: "TXN-7842", note: "Monthly top-up", status: "pending" },
  { id: 2, merchant: "Sara M.", email: "sara@zid.store", amount: "2,500", date: "May 14, 2024", bank: "SNB", ref: "TXN-7843", note: "", status: "pending" },
  { id: 3, merchant: "Fatima H.", email: "fatima@outlook.com", amount: "10,000", date: "May 13, 2024", bank: "Al Rajhi Bank", ref: "TXN-7839", note: "Urgent — orders on hold", status: "pending" },
  { id: 4, merchant: "Omar A.", email: "omar@gmail.com", amount: "3,000", date: "May 13, 2024", bank: "Riyad Bank", ref: "TXN-7835", note: "", status: "approved" },
  { id: 5, merchant: "Noor S.", email: "noor@store.sa", amount: "1,500", date: "May 12, 2024", bank: "Al Ahli Bank", ref: "TXN-7830", note: "", status: "approved" },
  { id: 6, merchant: "Khalid R.", email: "khalid@yahoo.com", amount: "500", date: "May 12, 2024", bank: "Al Rajhi Bank", ref: "TXN-7828", note: "Test transfer", status: "rejected" },
];

export default function TransfersPage() {
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const data = tab === "pending" ? TRANSFERS.filter((t) => t.status === "pending") : TRANSFERS;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Bank Transfer Approvals</h2>
          <p className="text-sm text-on-surface-variant">{TRANSFERS.filter((t) => t.status === "pending").length} pending approvals</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["pending", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "primary-gradient text-white" : "text-on-surface-variant hover:bg-white/5"}`}>
            {t === "pending" ? `Pending (${TRANSFERS.filter((x) => x.status === "pending").length})` : "All Transfers"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {data.map((t) => (
          <GlassCard key={t.id} className="p-5 rounded-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">
                  <Icon name="receipt" size="md" className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{t.merchant}</span>
                    <span className="text-xs text-on-surface-variant">{t.email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-2">
                    <span>🏦 {t.bank}</span>
                    <span>Ref: {t.ref}</span>
                    <span>{t.date}</span>
                  </div>
                  {t.note && <p className="text-xs text-on-surface-variant italic">&quot;{t.note}&quot;</p>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold mb-2">SAR {t.amount}</div>
                {t.status === "pending" ? (
                  <div className="flex gap-2">
                    <GradientButton size="sm">Approve</GradientButton>
                    <GradientButton size="sm" variant="outline" className="!border-error/30 !text-error hover:!bg-error/10">Reject</GradientButton>
                  </div>
                ) : (
                  <Badge variant={t.status === "approved" ? "success" : "failed"}>{t.status}</Badge>
                )}
              </div>
            </div>
            {t.status === "pending" && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                <button className="flex items-center gap-1 text-xs text-secondary hover:underline">
                  <Icon name="image" size="sm" />View Receipt
                </button>
                <button className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface">
                  <Icon name="history" size="sm" />Transaction History
                </button>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </>
  );
}
