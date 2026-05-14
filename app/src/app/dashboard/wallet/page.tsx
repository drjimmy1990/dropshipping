"use client";

import React from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";
import { WALLET_TRANSACTIONS } from "@/data/mockData";

export default function WalletPage() {
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
          <div className="text-4xl font-bold text-text mb-4 tracking-tight">SAR 12,450.00</div>
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
            <div className="text-xl font-bold text-text">SAR 8,320</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-1">
              <Icon name="receipt" className="text-info text-base" />
              <span className="text-sm text-text-secondary">Pending Orders</span>
            </div>
            <div className="text-xl font-bold text-text">SAR 1,240</div>
          </Card>
        </div>
      </div>

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
              {WALLET_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="border-b border-border-subtle hover:bg-surface-sunken transition-colors">
                  <td className="px-5 py-3 text-text-secondary">{tx.date}</td>
                  <td className="px-5 py-3 text-text">{tx.description}</td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={tx.type === "top_up" ? "success" : tx.type === "refund" ? "info" : "error"}
                      icon={tx.type === "top_up" ? "arrow_upward" : tx.type === "refund" ? "replay" : "arrow_downward"}
                    >
                      {tx.type === "top_up" ? "Top Up" : tx.type === "refund" ? "Refund" : "Deduction"}
                    </Badge>
                  </td>
                  <td className={`px-5 py-3 font-medium ${tx.amount > 0 ? "text-success" : "text-error"}`}>
                    {tx.amount > 0 ? "+" : ""}SAR {Math.abs(tx.amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">SAR {tx.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
