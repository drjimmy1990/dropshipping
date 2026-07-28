import type { SupabaseClient } from "@supabase/supabase-js";

/** Single source of truth for a merchant's store cap. Fails CLOSED. */
export async function getStoreLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ maxStores: number; planName: string } | { error: string }> {
  const { data: m, error: merchantError } = await supabase
    .from("merchants").select("plan").eq("id", userId).maybeSingle();

  // A *failed* read must not silently resolve to "free" — that would pick whichever
  // tier happens to be smallest rather than failing closed on purpose.
  // A *missing* row (data null, no error) legitimately means "free".
  if (merchantError) return { error: merchantError.message };

  const planName = m?.plan ?? "free";

  const { data: tier, error } = await supabase
    .from("subscription_tiers").select("max_stores").ilike("name", planName).maybeSingle();

  if (error) return { error: error.message };
  if (!tier) return { error: `no subscription_tier row matches plan "${planName}"` };
  return { maxStores: tier.max_stores, planName };
}
