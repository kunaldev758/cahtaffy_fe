/**
 * Dual session cookies: CLIENT_TOKEN and AGENT_TOKEN on AUTH_COOKIE_DOMAIN (.chataffy.com).
 */

export const CLIENT_TOKEN = "CLIENT_TOKEN";
export const AGENT_TOKEN = "AGENT_TOKEN";
export const LEGACY_TOKEN = "token";

export type AuthPortal = "client" | "agent";

export function portalFromHostname(hostname: string): AuthPortal | "marketing" {
  const h = hostname.split(":")[0].toLowerCase();
  if (h === "localhost" || h === "127.0.0.1") return "client";
  if (h.startsWith("agent.")) return "agent";
  if (h.startsWith("dashboard.")) return "client";
  return "marketing";
}

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

/** Options for Next.js `cookies().set` on auth session cookies. */
export function serverAuthCookieOpts() {
  const domain = (process.env.AUTH_COOKIE_DOMAIN || process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN)?.trim();
  const secure =
    process.env.APP_ENV === "production" ||
    process.env.NEXT_PUBLIC_APP_ENV === "production";
  return {
    httpOnly: true,
    maxAge: SEVEN_DAYS_IN_SECONDS,
    sameSite: "none" as const,
    secure: true,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

/**
 * Same as `serverAuthCookieOpts` but Partitioned (CHIPS). Use for Shopify/BigCommerce
 * embedded sessions: the app runs in a third-party iframe, where browsers that block
 * third-party cookies (Chrome Incognito, Safari, Brave) only accept partitioned cookies.
 */
export function serverEmbeddedAuthCookieOpts() {
  return { ...serverAuthCookieOpts(), partitioned: true as const };
}

/** Options for Next.js `cookies().set` on platform routing cookies (not httpOnly so JS can access). */
export function serverPlatformCookieOpts() {
  const domain = (process.env.AUTH_COOKIE_DOMAIN || process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN)?.trim();
  const secure =
    process.env.APP_ENV === "production" ||
    process.env.NEXT_PUBLIC_APP_ENV === "production";
  return {
    httpOnly: false,
    maxAge: SEVEN_DAYS_IN_SECONDS,
    sameSite: "none" as const,
    secure: true,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

/** Partitioned (CHIPS) variant of `serverPlatformCookieOpts` for embedded Shopify/BigCommerce. */
export function serverEmbeddedPlatformCookieOpts() {
  return { ...serverPlatformCookieOpts(), partitioned: true as const };
}
