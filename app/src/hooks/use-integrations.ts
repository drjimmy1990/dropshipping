"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Store, SupplierAccount } from "@/lib/supabase/types";

interface IntegrationsState {
  stores: Store[];
  suppliers: SupplierAccount[];
  maxStores: number;
  planName: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches the current merchant's connected stores, supplier accounts, and plan limits.
 */
export function useIntegrations(): IntegrationsState {
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierAccount[]>([]);
  const [maxStores, setMaxStores] = useState<number>(1);
  const [planName, setPlanName] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [storesRes, suppliersRes, merchantRes] = await Promise.all([
      supabase.from("stores").select("*").eq("merchant_id", user.id),
      supabase.from("supplier_accounts").select("*").eq("merchant_id", user.id),
      supabase.from("merchants").select("plan").eq("id", user.id).maybeSingle(),
    ]);

    if (storesRes.error) { setError(storesRes.error.message); }
    else { setStores(storesRes.data as Store[]); }

    if (suppliersRes.error) { setError(suppliersRes.error.message); }
    else { setSuppliers(suppliersRes.data as SupplierAccount[]); }

    let currentPlan = "free";
    if (!merchantRes.error && merchantRes.data?.plan) {
      currentPlan = merchantRes.data.plan;
      setPlanName(currentPlan);
    }

    const { data: tierData } = await supabase
      .from("subscription_tiers")
      .select("max_stores")
      .ilike("name", currentPlan)
      .single();

    if (tierData?.max_stores) {
      setMaxStores(tierData.max_stores);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stores, suppliers, maxStores, planName, loading, error, refetch: fetch };
}
