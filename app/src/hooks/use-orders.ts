"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/supabase/types";

interface OrdersState {
  orders: Order[];
  counts: Record<OrderStatus | "all", number>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches the current merchant's orders with optional status filter.
 */
export function useOrders(statusFilter?: OrderStatus | null): OrdersState {
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<OrderStatus | "all", number>>({
    all: 0, new: 0, processing: 0, ordered: 0, shipped: 0,
    delivered: 0, failed: 0, held: 0, cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Fetch all orders for counts
    const { data: allOrders, error: err } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (err) { setError(err.message); setLoading(false); return; }

    const typed = (allOrders || []) as Order[];

    // Calculate counts
    const newCounts: Record<string, number> = { all: typed.length };
    for (const o of typed) {
      newCounts[o.status] = (newCounts[o.status] || 0) + 1;
    }
    setCounts(newCounts as Record<OrderStatus | "all", number>);

    // Apply filter
    if (statusFilter) {
      setOrders(typed.filter((o) => o.status === statusFilter));
    } else {
      setOrders(typed);
    }

    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  return { orders, counts, loading, error, refetch: fetch };
}
