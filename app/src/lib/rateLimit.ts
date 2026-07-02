import { createAdminClient } from "@/lib/supabase/server";

/**
 * Per-merchant rate limiting backed by the Postgres rl_hit() function (HIGH-9).
 * Returns true when the call is allowed, false when the merchant is over the
 * limit for the current window. Fails OPEN on limiter errors (availability over
 * strict enforcement) — logged for visibility.
 */
export async function checkRateLimit(
  userId: string,
  bucket: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("rl_hit", {
      p_user: userId,
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[rateLimit] rl_hit failed:", error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.error("[rateLimit] unexpected error:", e);
    return true;
  }
}

/** Standard 429 body. */
export function rateLimitedResponse() {
  return { error: "Rate limit exceeded. Please slow down and try again shortly." };
}
