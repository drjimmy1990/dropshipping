"use client";

import React from "react";
import { GlassCard, GradientButton, Icon } from "@/components/shared";
import { WALLET_TRANSACTIONS } from "@/data/mockData";

/* ================================================================
   WALLET — Balance, Top-Up, Transaction History
   ================================================================ */

export default function WalletPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Wallet</h2>
        <p className="text-sm text-on-surface-variant">Manage your balance and view transaction history</p>
      </div>

      {/* Balance Card */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <GlassCard variant="active" className="p-8 rounded-xl md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 primary-gradient opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative">
            <div className="text-sm text-on-surface-variant mb-2">Available Balance</div>
            <div className="text-5xl font-bold mb-4 tracking-tight">SAR 12,450.00</div>
            <div className="flex gap-3">
              <GradientButton size="md">
                <span className="flex items-center gap-2">
                  <Icon name="add" size="sm" />
                  Top Up Wallet
                </span>
              </GradientButton>
              <GradientButton variant="outline" size="md">
                <span className="flex items-center gap-2">
                  <Icon name="history" size="sm" />
                  View Statement
                </span>
              </GradientButton>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="trending_up" className="text-tertiary" size="md" />
              <span className="text-sm text-on-surface-variant">This Month Spent</span>
            </div>
            <div className="text-2xl font-bold">SAR 8,320</div>
          </GlassCard>
          <GlassCard className="p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="receipt" className="text-secondary" size="md" />
              <span className="text-sm text-on-surface-variant">Pending Orders</span>
            </div>
            <div className="text-2xl font-bold">SAR 1,240</div>
          </GlassCard>
        </div>
      </div>

      {/* Transaction History */}
      <GlassCard className="rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <div className="flex gap-2">
            <select className="bg-surface-container-low text-on-surface-variant text-sm rounded-lg px-3 py-1.5 border border-outline-variant/30 outline-none">
              <option>All Types</option>
              <option>Top Up</option>
              <option>Deduction</option>
              <option>Refund</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["Date", "Description", "Type", "Amount", "Balance"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WALLET_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-6 py-4 text-on-surface-variant">{tx.date}</td>
                  <td className="px-6 py-4">{tx.description}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === "top_up"
                        ? "bg-tertiary/10 text-tertiary"
                        : tx.type === "refund"
                          ? "bg-secondary/10 text-secondary"
                          : "bg-error/10 text-error"
                    }`}>
                      <Icon
                        name={tx.type === "top_up" ? "arrow_upward" : tx.type === "refund" ? "replay" : "arrow_downward"}
                        size="sm"
                      />
                      {tx.type === "top_up" ? "Top Up" : tx.type === "refund" ? "Refund" : "Deduction"}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-semibold ${tx.amount > 0 ? "text-tertiary" : "text-error"}`}>
                    {tx.amount > 0 ? "+" : ""}SAR {Math.abs(tx.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">SAR {tx.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}
