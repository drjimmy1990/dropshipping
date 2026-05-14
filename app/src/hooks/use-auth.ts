"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Merchant } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  merchant: Merchant | null;
  loading: boolean;
  error: string | null;
}

/**
 * Reads the current Supabase Auth session + the merchant row.
 * Use in any client component that needs to know "who is logged in".
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    merchant: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setState({ user: null, merchant: null, loading: false, error: authError?.message || null });
        return;
      }

      const { data: merchant, error: dbError } = await supabase
        .from("merchants")
        .select("*")
        .eq("id", user.id)
        .single();

      setState({
        user,
        merchant: dbError ? null : (merchant as Merchant),
        loading: false,
        error: dbError?.message || null,
      });
    }

    load();

    // Listen for auth state changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
