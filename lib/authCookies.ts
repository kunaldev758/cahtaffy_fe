/**
 * Dual session cookies: CLIENT_TOKEN and AGENT_TOKEN on AUTH_COOKIE_DOMAIN (.chataffy.com).
 */

export const CLIENT_TOKEN = "CLIENT_TOKEN";
export const AGENT_TOKEN = "AGENT_TOKEN";
export const LEGACY_TOKEN = "token";
export const PLATFORM_COOKIE = "platform";
export const SF_TOKEN = "sf_token";
export const BC_TOKEN = "bc_token";
export const EMBEDDED_PROVIDER_COOKIE = "embedded_provider";
/** Which login surface is active (web / shopify / bigcommerce). */
export const AUTH_SURFACE_COOKIE = "auth_surface";
/** standalone = top-level web tab; embedded = Shopify/BigC iframe */
export const VIEW_MODE_COOKIE = "view_mode";

export type AuthPortal = "client" | "agent";
export type AuthSurface = "web" | "shopify" | "bigcommerce";

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
  const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();
  const secure =
    process.env.APP_ENV === "production" ||
    process.env.NEXT_PUBLIC_APP_ENV === "production";
  return {
    httpOnly: true,
    maxAge: SEVEN_DAYS_IN_SECONDS,
    sameSite: "none",
    secure:true,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}
