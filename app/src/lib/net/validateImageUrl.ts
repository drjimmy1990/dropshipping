import dns from "dns";
import net from "net";

/**
 * SSRF guard for server-side image fetches (HIGH-3).
 *
 * The Zid push downloads product image URLs server-side and re-uploads them.
 * Those URLs are merchant-controlled, so without a guard a merchant could point
 * them at internal services (169.254.169.254, localhost, private ranges).
 *
 * Defense: require https, restrict to known supplier CDNs, and — as a second
 * layer — reject hosts that resolve to loopback/private/link-local IPs.
 */

const ALLOWED_HOST_SUFFIXES = [
  "alicdn.com",
  "aliexpress-media.com",
  "cjdropshipping.com",
  "cjdropshipping.net",
];

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suffix) => h === suffix || h.endsWith(`.${suffix}`));
}

function ipIsPrivate(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // link-local
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return ipIsPrivate(mapped[1]);
    return false;
  }
  return true; // unknown format → treat as unsafe
}

export async function isSafeImageUrl(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (!isAllowedHost(url.hostname)) return false;

  try {
    const addrs = await dns.promises.lookup(url.hostname, { all: true });
    if (addrs.length === 0) return false;
    for (const a of addrs) {
      if (ipIsPrivate(a.address)) return false;
    }
  } catch {
    return false;
  }
  return true;
}
