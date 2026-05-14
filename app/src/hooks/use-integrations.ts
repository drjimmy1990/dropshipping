"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Store, SupplierAccount } from "@/lib/supabase/types";

interface IntegrationsState {
  stores: Store[];
  suppliers: SupplierAccount[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches the current merchant's connected stores and supplier accounts.
 */
export function useIntegrations(): IntegrationsState {
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [storesRes, suppliersRes] = await Promise.all([
      supabase.from("stores").select("*").eq("merchant_id", user.id),
      supabase.from("supplier_accounts").select("*").eq("merchant_id", user.id),
    ]);

    if (storesRes.error) { setError(storesRes.error.message); }
    else { setStores(storesRes.data as Store[]); }

    if (suppliersRes.error) { setError(suppliersRes.error.message); }
    else { setSuppliers(suppliersRes.data as SupplierAccount[]); }

    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stores, suppliers, loading, error, refetch: fetch };
}
