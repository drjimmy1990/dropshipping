import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";

/**
 * OAuth callback protection helpers (CRIT-7).
 *
 * - resolveOrigin: pin the callback/redirect origin to PUBLIC_BASE_URL when set,
 *   so a spoofed x-forwarded-host cannot redirect OAuth codes to another origin.
 * - buildOAuthState / setOAuthNonce: bind the OAuth `state` to the merchant id
 *   and a random CSRF nonce stored in an HttpOnly cookie (double-submit pattern).
 * - verifyOAuthCallback: require a logged-in user whose id matches the state,
 *   AND a state nonce that matches the HttpOnly cookie. Both are MANDATORY:
 *   a colon-free (nonce-less) state used to short-circuit the comparison, so an
 *   attacker who knew a victim's user UUID could bind their own store to it.
 *   Missing separator / missing cookie / length mismatch all fail closed.
 */

const NONCE_MAX_AGE = 600; // seconds

export function resolveOrigin(request: NextRequest): string {
  const pinned = process.env.PUBLIC_BASE_URL;
  if (pinned) return pinned.replace(/\/+$/, "");
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "droplinker.asra3.com";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export function buildOAuthState(userId: string): { state: string; nonce: string } {
  const nonce = crypto.randomBytes(16).toString("hex");
  return { state: `${userId}:${nonce}`, nonce };
}

export function setOAuthNonce(res: NextResponse, cookieName: string, nonce: string): void {
  res.cookies.set(cookieName, nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: NONCE_MAX_AGE,
  });
}

export function clearOAuthNonce(res: NextResponse, cookieName: string): void {
  res.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Returns the verified merchant id when the callback is legitimate, else null.
 */
export function verifyOAuthCallback(
  request: NextRequest,
  cookieName: string,
  state: string,
  sessionUserId: string | undefined
): string | null {
  const sep = state.indexOf(":");
  if (sep === -1) return null;                      // nonce is now MANDATORY
  const stateUserId = state.slice(0, sep);
  const stateNonce  = state.slice(sep + 1);

  if (!sessionUserId || sessionUserId !== stateUserId) return null;

  const cookieNonce = request.cookies.get(cookieName)?.value;
  if (!cookieNonce) return null;

  const a = Buffer.from(stateNonce);
  const b = Buffer.from(cookieNonce);
  if (a.length !== b.length) return null;           // timingSafeEqual THROWS on length mismatch
  if (!crypto.timingSafeEqual(a, b)) return null;

  return stateUserId;
}
