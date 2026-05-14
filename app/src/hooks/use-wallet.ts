"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Wallet, Transaction } from "@/lib/supabase/types";

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches the current merchant's wallet + recent transactions.
 */
export function useWallet(): WalletState {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Wallet
    const { data: w, error: wErr } = await supabase
      .from("wallets")
      .select("*")
      .eq("merchant_id", user.id)
      .single();

    if (wErr) { setError(wErr.message); setLoading(false); return; }
    setWallet(w as Wallet);

    // Transactions (last 50)
    const { data: txns, error: tErr } = await supabase
      .from("transactions")
      .select("*")
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (tErr) { setError(tErr.message); }
    else { setTransactions(txns as Transaction[]); }

    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { wallet, transactions, loading, error, refetch: fetch };
}
