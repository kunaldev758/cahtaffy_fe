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
