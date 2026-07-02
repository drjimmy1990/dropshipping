"use client";

import React, { useState, useRef } from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useWallet } from "@/hooks/use-wallet";
import { createClient } from "@/lib/supabase/client";

/* ================================================================
   WALLET PAGE — Balance, Top-Up, Transaction History
   ================================================================ */

function BankTransferForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const amount = Number(form.get("amount"));
    const bankName = form.get("bank_name") as string;
    const senderName = form.get("sender_name") as string;
    const referenceNumber = form.get("reference_number") as string;
    const file = fileRef.current?.files?.[0];

    if (!amount || amount <= 0) { setError("Enter a valid amount"); setSubmitting(false); return; }
    if (!file) { setError("Please upload a receipt image"); setSubmitting(false); return; }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setSubmitting(false); return; }

    // Upload receipt to Supabase Storage
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `receipts/${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("bank-receipts")
      .upload(filePath, file);

    let receiptUrl = filePath;
    if (uploadErr) {
      // If storage bucket doesn't exist, save a placeholder
      console.warn("Storage upload failed (bucket may not exist yet):", uploadErr.message);
      receiptUrl = `pending-upload/${filePath}`;
    }

    // Insert bank transfer record
    const { error: insertErr } = await supabase
      .from("bank_transfers")
      .insert({
        merchant_id: user.id,
        amount,
        receipt_url: receiptUrl,
        bank_name: bankName || null,
        sender_name: senderName || null,
        reference_number: referenceNumber || null,
        status: "pending",
      });

    setSubmitting(false);
    if (insertErr) { setError(insertErr.message); return; }
    onSuccess();
  }

  const inputClass = "w-full bg-surface rounded-md px-3 py-2.5 text-text text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 mx-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text">
          <Icon name="close" className="text-lg" />
        </button>
        <h3 className="text-lg font-semibold text-text mb-1">Bank Transfer Top-Up</h3>
        <p className="text-sm text-text-secondary mb-5">Upload your transfer receipt for admin approval</p>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
            <Icon name="error" className="text-base" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Amount (SAR) *</label>
            <input name="amount" type="number" step="0.01" min="1" placeholder="500.00" className={inputClass} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Bank Name</label>
              <input name="bank_name" type="text" placeholder="Al Rajhi" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Sender Name</label>
              <input name="sender_name" type="text" placeholder="Ahmed Mohammed" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Reference Number</label>
            <input name="reference_number" type="text" placeholder="TRN-123456" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Receipt Image *</label>
            <div className="relative">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                required
              />
              <div className="flex items-center gap-3 p-3 rounded-md border border-dashed border-border-subtle bg-surface-sunken text-sm text-text-secondary hover:border-accent transition-colors">
                <Icon name="cloud_upload" className="text-xl text-text-muted" />
                <span>Click or drag receipt image here</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Submitting…" : "Submit Transfer"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function WalletPage() {
  const { wallet, transactions, loading, error, refetch } = useWallet();
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const balance = wallet?.balance ?? 0;
  const reserved = wallet?.reserved ?? 0;
  // Available = total balance minus funds reserved against pending orders.
  const available = Math.max(0, balance - reserved);

  // Calculate month's spending from transactions
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthSpent = transactions
    .filter((t) => t.type === "deduction" && t.created_at?.slice(0, 7) === thisMonth)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  function handleTransferSuccess() {
    setShowTransferForm(false);
    setSuccessMsg("Bank transfer submitted! Admin will review and approve your deposit.");
    refetch();
    setTimeout(() => setSuccessMsg(null), 8000);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Wallet</h1>
        <p className="text-sm text-text-secondary">Manage your balance and view transaction history</p>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="mb-4 p-3 rounded-md bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2">
          <Icon name="check_circle" className="text-base" />
          {successMsg}
        </div>
      )}

      {/* Balance + Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 md:col-span-2">
          <div className="text-sm text-text-secondary mb-1">Available Balance</div>
          {loading ? (
            <Skeleton className="h-10 w-48 mb-4" />
          ) : (
            <div className="text-4xl font-bold text-text mb-4 tracking-tight">
              SAR {available.toLocaleString("en", { minimumFractionDigits: 2 })}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="md" onClick={() => setShowTransferForm(true)}>
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

      {/* Transfer Form Modal */}
      {showTransferForm && (
        <BankTransferForm
          onSuccess={handleTransferSuccess}
          onClose={() => setShowTransferForm(false)}
        />
      )}
    </>
  );
}
