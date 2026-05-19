/**
 * Multi-platform / multi-client auth cookie naming (mirrors backend).
 */

const TOKEN_KEYS = {
  shopify: "SF_TOKEN",
  bigcommerce: "BC_TOKEN",
  web: "TOKEN",
};

const LEGACY_TOKEN_COOKIE = "token";
const TOKEN_PREFIXES = Object.values(TOKEN_KEYS);

function sanitizeClientId(clientId) {
  const safe = String(clientId ?? "default")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return safe || "default";
}

function getPlatform() {
  if (typeof window === "undefined") return "web";

  const provider = window.localStorage?.getItem("provider");
  if (provider === "shopify" || provider === "bigcommerce") {
    return provider;
  }

  const host = window.location.hostname;
  if (host.includes("myshopify")) return "shopify";
  if (host.includes("bigcommerce")) return "bigcommerce";

  return "web";
}

function getClientId(platformOverride) {
  if (typeof window === "undefined") return "default";

  const platform = platformOverride || getPlatform();
  if (platform === "shopify") {
    return sanitizeClientId(
      window.localStorage?.getItem("shopifyShop") || "default",
    );
  }
  if (platform === "bigcommerce") {
    return sanitizeClientId(
      window.localStorage?.getItem("bcStoreHash") || "default",
    );
  }

  return sanitizeClientId(
    window.localStorage?.getItem("clientId") || "default",
  );
}

/** Which platform session to end on logout (web redirect tab vs embedded store). */
function getLogoutPlatform() {
  if (typeof window === "undefined") return "web";

  const scoped = window.localStorage?.getItem("logoutPlatform");
  if (scoped === "web" || scoped === "shopify" || scoped === "bigcommerce") {
    return scoped;
  }

  const provider = window.localStorage?.getItem("provider");
  if (provider === "shopify" || provider === "bigcommerce") {
    return provider;
  }

  return "web";
}

function clearRedirectWebAuthLocalStorage() {
  if (typeof window === "undefined") return;

  const keys = [
    "logoutPlatform",
    "userId",
    "agents",
    "currentAgentId",
    "client",
    "user",
    "clientAgent",
    "agent",
  ];
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

function getTokenCookieName({ platform, clientId } = {}) {
  const resolvedPlatform = platform || getPlatform();
  const baseKey = TOKEN_KEYS[resolvedPlatform] || TOKEN_KEYS.web;
  const safeClientId = sanitizeClientId(
    clientId != null ? clientId : getClientId(),
  );
  return `${baseKey}_${safeClientId}`;
}

function isAuthTokenCookieName(name) {
  if (!name) return false;
  return TOKEN_PREFIXES.some(
    (prefix) => name === prefix || name.startsWith(`${prefix}_`),
  );
}

function readTokenFromCookieStore(cookieStore) {
  if (!cookieStore) return null;

  const legacy = cookieStore.get?.(LEGACY_TOKEN_COOKIE)?.value;
  if (legacy) return legacy;

  const all = cookieStore.getAll?.() || [];
  for (const cookie of all) {
    if (cookie?.value && isAuthTokenCookieName(cookie.name)) {
      return cookie.value;
    }
  }

  const named = cookieStore.get?.(
    getTokenCookieName({
      platform: getPlatform(),
      clientId: getClientId(),
    }),
  )?.value;
  return named || null;
}

function hasAuthTokenCookie(requestOrStore) {
  if (!requestOrStore) return false;

  if (requestOrStore.cookies?.has) {
    if (requestOrStore.cookies.has(LEGACY_TOKEN_COOKIE)) return true;
    return requestOrStore.cookies
      .getAll()
      .some((cookie) => isAuthTokenCookieName(cookie.name));
  }

  return Boolean(readTokenFromCookieStore(requestOrStore));
}

function hasWebAuthTokenCookie(requestOrStore) {
  if (!requestOrStore) return false;

  const webPrefix = `${TOKEN_KEYS.web}_`;

  if (requestOrStore.cookies?.getAll) {
    return requestOrStore.cookies.getAll().some(
      (cookie) =>
        cookie.value &&
        (cookie.name === LEGACY_TOKEN_COOKIE ||
          cookie.name === TOKEN_KEYS.web ||
          cookie.name.startsWith(webPrefix)),
    );
  }

  const legacy = requestOrStore.get?.(LEGACY_TOKEN_COOKIE)?.value;
  if (legacy) return true;

  const all = requestOrStore.getAll?.() || [];
  return all.some(
    (cookie) =>
      cookie?.value &&
      (cookie.name === TOKEN_KEYS.web || cookie.name.startsWith(webPrefix)),
  );
}

module.exports = {
  TOKEN_KEYS,
  LEGACY_TOKEN_COOKIE,
  getPlatform,
  getClientId,
  getLogoutPlatform,
  clearRedirectWebAuthLocalStorage,
  getTokenCookieName,
  isAuthTokenCookieName,
  readTokenFromCookieStore,
  hasAuthTokenCookie,
  hasWebAuthTokenCookie,
};
