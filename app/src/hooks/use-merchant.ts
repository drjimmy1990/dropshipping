"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Merchant } from "@/lib/supabase/types";

interface MerchantState {
  merchant: Merchant | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  update: (updates: Partial<Merchant>) => Promise<boolean>;
  refetch: () => void;
}

/**
 * Fetches and updates the current merchant's profile.
 */
export function useMerchant(): MerchantState {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error: err } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", user.id)
      .single();

    if (err) { setError(err.message); }
    else { setMerchant(data as Merchant); }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = useCallback(async (updates: Partial<Merchant>): Promise<boolean> => {
    if (!merchant) return false;
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const { error: err } = await supabase
      .from("merchants")
      .update(updates)
      .eq("id", merchant.id);

    setSaving(false);
    if (err) { setError(err.message); return false; }

    setMerchant({ ...merchant, ...updates } as Merchant);
    return true;
  }, [merchant]);

  return { merchant, loading, error, saving, update, refetch: fetch };
}
