const SECRET_KEYS = /^(access_token|refresh_token|partner_token|client_secret|app_secret|password|api_key|webhook_secret)$/i;

/**
 * Safe to log. Replaces secret-shaped values with a marker, recursively.
 *
 * NOTE: plain-object/array input only. Any other object — Error, Date, Map, Set,
 * Buffer — is rebuilt from its OWN ENUMERABLE keys, so an Error collapses to `{}`
 * (message/stack are non-enumerable) and a Date to `{}`. Never wrap a caught error
 * in redact(): log the error directly, and redact only parsed response/config bodies.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) =>
      SECRET_KEYS.test(k) ? [k, v ? "[redacted]" : v] : [k, redact(v, depth + 1)]
    )
  );
}
