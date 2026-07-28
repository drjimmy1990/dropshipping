"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStoreLimit } from "@/lib/plan/storeLimit";
import type { Store, SupplierAccount } from "@/lib/supabase/types";

interface IntegrationsState {
  stores: Store[];
  suppliers: SupplierAccount[];
  /** `null` means "unknown" — a failed lookup must never read as at-limit. */
  maxStores: number | null;
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
  const [maxStores, setMaxStores] = useState<number | null>(null);
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
      supabase
        .from("stores")
        .select("id, merchant_id, platform, store_name, store_url, is_active, last_sync, created_at, updated_at")
        .eq("merchant_id", user.id),
      supabase
        .from("supplier_accounts")
        .select("id, merchant_id, supplier, is_active, is_default, last_health_check, created_at, updated_at")
        .eq("merchant_id", user.id),
      supabase.from("merchants").select("plan").eq("id", user.id).maybeSingle(),
    ]);

    if (storesRes.error) { setError(storesRes.error.message); }
    else { setStores(storesRes.data as Store[]); }

    if (suppliersRes.error) { setError(suppliersRes.error.message); }
    else { setSuppliers(suppliersRes.data as SupplierAccount[]); }

    if (!merchantRes.error && merchantRes.data?.plan) {
      setPlanName(merchantRes.data.plan);
    }

    // Single source of truth for the store cap. `null` = unknown, never "at limit".
    const limit = await getStoreLimit(supabase, user.id);
    if ("error" in limit) {
      console.error("[useIntegrations] plan limit lookup failed:", limit.error);
      setError(limit.error);
      setMaxStores(null);
    } else {
      setMaxStores(limit.maxStores);
      setPlanName(limit.planName);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stores, suppliers, maxStores, planName, loading, error, refetch: fetch };
}
