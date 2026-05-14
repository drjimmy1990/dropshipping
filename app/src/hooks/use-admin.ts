"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Merchant,
  Order,
  BankTransfer,
  PlatformConfig,
  SubscriptionTier,
} from "@/lib/supabase/types";

// ---------- Admin Merchants ----------

export function useAdminMerchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("merchants")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) setError(err.message);
    else setMerchants(data as Merchant[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { merchants, loading, error, refetch: fetch };
}

// ---------- Admin Orders (all merchants) ----------

export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (err) setError(err.message);
    else setOrders(data as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { orders, loading, error, refetch: fetch };
}

// ---------- Admin Transfers ----------

export function useAdminTransfers() {
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("bank_transfers")
      .select("*, merchant:merchants(id, email, business_name)")
      .order("created_at", { ascending: false });

    if (err) setError(err.message);
    else setTransfers(data as BankTransfer[]);
    setLoading(false);
  }, []);

  const approve = useCallback(async (transferId: string, adminId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("bank_transfers")
      .update({ status: "approved", approved_by: adminId, reviewed_at: new Date().toISOString() })
      .eq("id", transferId);
    if (!error) fetch();
    return !error;
  }, [fetch]);

  const reject = useCallback(async (transferId: string, adminId: string, notes: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("bank_transfers")
      .update({ status: "rejected", approved_by: adminId, admin_notes: notes, reviewed_at: new Date().toISOString() })
      .eq("id", transferId);
    if (!error) fetch();
    return !error;
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { transfers, loading, error, approve, reject, refetch: fetch };
}

// ---------- Admin Revenue ----------

export function useAdminRevenue() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("subscription_tiers")
      .select("*")
      .order("sort_order", { ascending: true });

    if (err) setError(err.message);
    else setTiers(data as SubscriptionTier[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { tiers, loading, error, refetch: fetch };
}

// ---------- Platform Config ----------

export function usePlatformConfig() {
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("platform_config")
      .select("*");

    if (err) { setError(err.message); }
    else {
      const obj: Record<string, unknown> = {};
      (data as PlatformConfig[]).forEach((row) => {
        obj[row.key] = row.value;
      });
      setConfig(obj);
    }
    setLoading(false);
  }, []);

  const updateConfig = useCallback(async (key: string, value: unknown): Promise<boolean> => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("platform_config")
      .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
      .eq("key", key);

    setSaving(false);
    if (error) { setError(error.message); return false; }
    setConfig((prev) => ({ ...prev, [key]: value }));
    return true;
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { config, loading, saving, error, updateConfig, refetch: fetch };
}
