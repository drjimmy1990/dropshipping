"use client";

import React from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useWallet } from "@/hooks/use-wallet";

export default function WalletPage() {
  const { wallet, transactions, loading, error } = useWallet();

  const balance = wallet?.balance ?? 0;
  const reserved = wallet?.reserved ?? 0;

  // Calculate month's spending from transactions
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthSpent = transactions
    .filter((t) => t.type === "deduction" && t.created_at?.slice(0, 7) === thisMonth)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Wallet</h1>
        <p className="text-sm text-text-secondary">Manage your balance and view transaction history</p>
      </div>

      {/* Balance + Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 md:col-span-2">
          <div className="text-sm text-text-secondary mb-1">Available Balance</div>
          {loading ? (
            <Skeleton className="h-10 w-48 mb-4" />
          ) : (
            <div className="text-4xl font-bold text-text mb-4 tracking-tight">
              SAR {balance.toLocaleString("en", { minimumFractionDigits: 2 })}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="md">
              <Icon name="add" className="text-sm" />
              Top Up Wallet
            </Button>
            <Button variant="secondary" size="md">
              <Icon name="history" className="text-sm" />
              View Statement
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-1">
              <Icon name="trending_up" className="text-warning text-base" />
              <span className="text-sm text-text-secondary">This Month Spent</span>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-xl font-bold text-text">SAR {monthSpent.toLocaleString()}</div>
            )}
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-1">
              <Icon name="receipt" className="text-info text-base" />
              <span className="text-sm text-text-secondary">Reserved</span>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-xl font-bold text-text">SAR {reserved.toLocaleString()}</div>
            )}
          </Card>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
          <Icon name="error" className="text-base" />
          {error}
        </div>
      )}

      {/* Transaction History */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-base font-semibold text-text">Transaction History</h3>
          <select className="bg-surface text-text-secondary text-sm rounded-md px-3 py-1.5 border border-border outline-none">
            <option>All Types</option>
            <option>Top Up</option>
            <option>Deduction</option>
            <option>Refund</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Date", "Description", "Type", "Amount", "Balance"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-sunken">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-text-muted text-sm">
                    No transactions yet. Top up your wallet to get started.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border-subtle hover:bg-surface-sunken transition-colors">
                    <td className="px-5 py-3 text-text-secondary">
                      {new Date(tx.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-text">{tx.description || "—"}</td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={tx.type === "deposit" ? "success" : tx.type === "refund" ? "info" : "error"}
                        icon={tx.type === "deposit" ? "arrow_upward" : tx.type === "refund" ? "replay" : "arrow_downward"}
                      >
                        {tx.type === "deposit" ? "Top Up" : tx.type === "refund" ? "Refund" : "Deduction"}
                      </Badge>
                    </td>
                    <td className={`px-5 py-3 font-medium ${tx.amount > 0 ? "text-success" : "text-error"}`}>
                      {tx.amount > 0 ? "+" : ""}SAR {Math.abs(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-text-secondary">SAR {tx.balance_after.toLocaleString()}</td>
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
