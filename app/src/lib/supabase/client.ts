import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for browser/client components.
 * Uses the anon key — all queries go through RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
