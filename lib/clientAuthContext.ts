/**
 * Multi-surface auth: web vs Shopify vs BigCommerce on a shared cookie domain.
 * `auth_surface` indicates which token middleware / server actions should use.
 */

import {
  BC_TOKEN,
  CLIENT_TOKEN,
  EMBEDDED_PROVIDER_COOKIE,
  AUTH_SURFACE_COOKIE,
  LEGACY_TOKEN,
  SF_TOKEN,
  VIEW_MODE_COOKIE,
  type AuthSurface,
} from "@/lib/authCookies";

export type { AuthSurface };

export type ViewMode = "standalone" | "embedded";

type CookieGetter = {
  get: (name: string) => { value?: string } | undefined;
};

function readCookie(getter: CookieGetter, name: string): string | undefined {
  const value = getter.get(name)?.value;
  return value && value.length > 0 ? value : undefined;
}

/** Infer active auth surface from Referer (Shopify/BigC admin embedding). */
export function authSurfaceFromReferer(referer: string | null): AuthSurface | null {
  const r = (referer || "").toLowerCase();
  if (
    r.includes("myshopify.com") ||
    r.includes("admin.shopify.com") ||
    r.includes("shopify.com")
  ) {
    return "shopify";
  }
  if (r.includes("bigcommerce.com")) {
    return "bigcommerce";
  }
  return null;
}

/** Infer surface from /load entry query params. */
export function authSurfaceFromLoadPath(
  pathname: string,
  searchParams: URLSearchParams,
): AuthSurface | null {
  if (pathname !== "/load") return null;
  if (searchParams.has("shop") || searchParams.has("host")) return "shopify";
  if (searchParams.has("signed_payload_jwt")) return "bigcommerce";
  return null;
}

export function detectAuthSurface(input: {
  cookies: CookieGetter;
  referer?: string | null;
  secFetchDest?: string | null;
  pathname?: string;
  searchParams?: URLSearchParams;
}): AuthSurface {
  if (input.pathname && input.searchParams) {
    const fromLoad = authSurfaceFromLoadPath(input.pathname, input.searchParams);
    if (fromLoad) return fromLoad;
  }

  const fromReferer = authSurfaceFromReferer(input.referer ?? null);
  if (fromReferer) return fromReferer;

  const fromCookie = readCookie(input.cookies, AUTH_SURFACE_COOKIE) as
    | AuthSurface
    | undefined;
  if (fromCookie === "shopify" || fromCookie === "bigcommerce") {
    return fromCookie;
  }

  const fetchDest = (input.secFetchDest || "").toLowerCase();
  if (fetchDest === "iframe") {
    const embedded = readCookie(input.cookies, EMBEDDED_PROVIDER_COOKIE);
    if (embedded === "shopify" || embedded === "bigcommerce") {
      return embedded;
    }
  }

  return "web";
}

export function selectClientTokenForSurface(
  surface: AuthSurface,
  cookies: CookieGetter,
): string | undefined {
  if (surface === "shopify") {
    return readCookie(cookies, SF_TOKEN);
  }
  if (surface === "bigcommerce") {
    return readCookie(cookies, BC_TOKEN);
  }
  return readCookie(cookies, CLIENT_TOKEN) || readCookie(cookies, LEGACY_TOKEN);
}

function readWebClientToken(cookies: CookieGetter): string | undefined {
  return readCookie(cookies, CLIENT_TOKEN) || readCookie(cookies, LEGACY_TOKEN);
}

/**
 * Pick session token for middleware / validate.
 * Standalone (web tab) always requires CLIENT_TOKEN — never sf_token/bc_token.
 */
export function resolveClientSessionToken(input: {
  cookies: CookieGetter;
  referer?: string | null;
  secFetchDest?: string | null;
  pathname?: string;
  searchParams?: URLSearchParams;
}): string | undefined {
  const viewMode = readCookie(input.cookies, VIEW_MODE_COOKIE) as
    | ViewMode
    | undefined;

  if (viewMode === "standalone") {
    return readWebClientToken(input.cookies);
  }

  if (viewMode === "embedded") {
    const surface = detectAuthSurface(input);
    return selectClientTokenForSurface(surface, input.cookies);
  }

  // No view_mode yet: default to web-only (safe for standalone tabs).
  return readWebClientToken(input.cookies);
}

function writeClientCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=None${secure}`;
}

/** Set auth_surface synchronously in the browser (before async session sync). */
export function setClientAuthSurfaceCookie(surface: AuthSurface) {
  writeClientCookie(AUTH_SURFACE_COOKIE, surface);
}

export function setClientViewModeCookie(mode: ViewMode) {
  writeClientCookie(VIEW_MODE_COOKIE, mode);
}
