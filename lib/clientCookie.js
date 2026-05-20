/**
 * Multi-platform / multi-client auth cookie naming (mirrors backend).
 */

const TOKEN_KEYS = {
  shopify: "SP_TOKEN",
  bigcommerce: "BC_TOKEN",
  web: "WEB_TOKEN",
};

/** Legacy base keys still recognized when reading cookies. */
const LEGACY_COOKIE_BASE_KEYS = ["SF_TOKEN", "TOKEN"];

const LEGACY_TOKEN_COOKIE = "WEB_TOKEN";
const TOKEN_PREFIXES = [
  ...new Set([...Object.values(TOKEN_KEYS), ...LEGACY_COOKIE_BASE_KEYS]),
];

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
  if (resolvedPlatform === "web") {
    return baseKey; // WEB_TOKEN (stable; no suffix)
  }
  const safeClientId = sanitizeClientId(clientId != null ? clientId : getClientId());
  return `${baseKey}_${safeClientId}`;
}

function isAuthTokenCookieName(name) {
  if (!name) return false;
  return TOKEN_PREFIXES.some(
    (prefix) => name === prefix || name.startsWith(`${prefix}_`),
  );
}

function readAllTokensFromCookieStore(cookieStore) {
  if (!cookieStore) return [];

  const seen = new Set();
  const tokens = [];

  const add = (value) => {
    const v = typeof value === "string" ? value.trim() : "";
    if (!v || seen.has(v)) return;
    seen.add(v);
    tokens.push(v);
  };

  add(cookieStore.get?.(LEGACY_TOKEN_COOKIE)?.value);

  const all = cookieStore.getAll?.() || [];
  for (const cookie of all) {
    if (cookie?.value && isAuthTokenCookieName(cookie.name)) {
      add(cookie.value);
    }
  }

  return tokens;
}

function readTokenFromCookieStore(cookieStore) {
  const tokens = readAllTokensFromCookieStore(cookieStore);
  if (tokens.length) return tokens[0];

  const named = cookieStore?.get?.(
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

function isWebAuthCookieName(name) {
  if (!name) return false;
  if (name === LEGACY_TOKEN_COOKIE) return true;
  return (
    name === TOKEN_KEYS.web ||
    name.startsWith(`${TOKEN_KEYS.web}_`) ||
    name === "TOKEN" ||
    name.startsWith("TOKEN_")
  );
}

function hasWebAuthTokenCookie(requestOrStore) {
  if (!requestOrStore) return false;

  if (requestOrStore.cookies?.getAll) {
    return requestOrStore.cookies.getAll().some(
      (cookie) => cookie.value && isWebAuthCookieName(cookie.name),
    );
  }

  const legacy = requestOrStore.get?.(LEGACY_TOKEN_COOKIE)?.value;
  if (legacy) return true;

  const all = requestOrStore.getAll?.() || [];
  return all.some((cookie) => cookie?.value && isWebAuthCookieName(cookie.name));
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
  readAllTokensFromCookieStore,
  readTokenFromCookieStore,
  hasAuthTokenCookie,
  hasWebAuthTokenCookie,
};
