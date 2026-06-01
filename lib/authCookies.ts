/**
 * Dual session cookies: CLIENT_TOKEN and AGENT_TOKEN on AUTH_COOKIE_DOMAIN (.chataffy.com).
 */

export const CLIENT_TOKEN = "CLIENT_TOKEN";
export const AGENT_TOKEN = "AGENT_TOKEN";
export const LEGACY_TOKEN = "token";
export const PLATFORM_COOKIE = "platform";
export const SF_TOKEN = "sf_token";
export const BC_TOKEN = "bc_token";

type CookieReader = {
  get: (name: string) => { value?: string } | undefined;
};

/** Ordered client JWT candidates when `platform` may be stale across browser tabs. */
export function getClientAuthTokenCandidates(reader: CookieReader): string[] {
  const platform = reader.get(PLATFORM_COOKIE)?.value || "local";
  const sf = reader.get(SF_TOKEN)?.value;
  const bc = reader.get(BC_TOKEN)?.value;
  const client =
    reader.get(CLIENT_TOKEN)?.value || reader.get(LEGACY_TOKEN)?.value;

  const ordered =
    platform === "shopify"
      ? [sf, bc, client]
      : platform === "bigcommerce"
        ? [bc, sf, client]
        : [client, bc, sf];

  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const token of ordered) {
    if (!token || seen.has(token)) continue;
    seen.add(token);
    candidates.push(token);
  }
  return candidates;
}

/** First available client session token (platform-aware with cross-tab fallbacks). */
export function selectClientAuthToken(reader: CookieReader): string | null {
  return getClientAuthTokenCandidates(reader)[0] ?? null;
}

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
