// /**
//  * Multi-platform / multi-client auth cookie naming (mirrors backend).
//  */

// const TOKEN_KEYS = {
//   shopify: "SP_TOKEN",
//   bigcommerce: "BC_TOKEN",
//   web: "WEB_TOKEN",
// };

// /** Legacy base keys still recognized when reading cookies. */
// const LEGACY_COOKIE_BASE_KEYS = ["SF_TOKEN", "TOKEN"];

// const LEGACY_TOKEN_COOKIE = "token";
// const TOKEN_PREFIXES = [
//   ...new Set([...Object.values(TOKEN_KEYS), ...LEGACY_COOKIE_BASE_KEYS]),
// ];

// function sanitizeClientId(clientId) {
//   const safe = String(clientId ?? "default")
//     .trim()
//     .replace(/[^a-zA-Z0-9_-]/g, "");
//   return safe || "default";
// }

// /**
//  * Client-side platform detection (uses browser APIs)
//  */
// function getPlatform() {
//   if (typeof window === "undefined") return "web";

//   const provider = window.localStorage?.getItem("provider");
//   if (provider === "shopify" || provider === "bigcommerce") {
//     return provider;
//   }

//   const host = window.location.hostname;
//   if (host.includes("myshopify")) return "shopify";
//   if (host.includes("bigcommerce")) return "bigcommerce";

//   return "web";
// }

// /**
//  * Server-side platform detection (uses hostname from URL)
//  * Call this in middleware/server actions when window is undefined
//  */
// function getPlatformFromHostname(hostname) {
//   if (!hostname) return "web";
  
//   if (hostname.includes("myshopify")) return "shopify";
//   if (hostname.includes("bigcommerce")) return "bigcommerce";
  
//   return "web";
// }

// function getClientId(platformOverride) {
//   if (typeof window === "undefined") return "default";

//   const platform = platformOverride || getPlatform();
//   if (platform === "shopify") {
//     return sanitizeClientId(
//       window.localStorage?.getItem("shopifyShop") || "default",
//     );
//   }
//   if (platform === "bigcommerce") {
//     return sanitizeClientId(
//       window.localStorage?.getItem("bcStoreHash") || "default",
//     );
//   }

//   return sanitizeClientId(
//     window.localStorage?.getItem("clientId") || "default",
//   );
// }

// /** Which platform session to end on logout (web redirect tab vs embedded store). */
// function getLogoutPlatform() {
//   if (typeof window === "undefined") return "web";

//   const scoped = window.localStorage?.getItem("logoutPlatform");
//   if (scoped === "web" || scoped === "shopify" || scoped === "bigcommerce") {
//     return scoped;
//   }

//   const provider = window.localStorage?.getItem("provider");
//   if (provider === "shopify" || provider === "bigcommerce") {
//     return provider;
//   }

//   return "web";
// }

// function clearRedirectWebAuthLocalStorage() {
//   if (typeof window === "undefined") return;

//   const keys = [
//     "logoutPlatform",
//     "userId",
//     "agents",
//     "currentAgentId",
//     "client",
//     "user",
//     "clientAgent",
//     "agent",
//   ];
//   for (const key of keys) {
//     window.localStorage.removeItem(key);
//   }
// }

// function getTokenCookieName({ platform, clientId } = {}) {
//   const resolvedPlatform = platform || getPlatform();
//   const baseKey = TOKEN_KEYS[resolvedPlatform] || TOKEN_KEYS.web;
//   if (resolvedPlatform === "web") {
//     return baseKey; // WEB_TOKEN (stable; no suffix)
//   }
//   const safeClientId = sanitizeClientId(clientId != null ? clientId : getClientId());
//   return `${baseKey}_${safeClientId}`;
// }

// function isAuthTokenCookieName(name) {
//   if (!name) return false;
//   return TOKEN_PREFIXES.some(
//     (prefix) => name === prefix || name.startsWith(`${prefix}_`),
//   );
// }

// function readAllTokensFromCookieStore(cookieStore) {
//   if (!cookieStore) return [];

//   const legacy = cookieStore.get?.(LEGACY_TOKEN_COOKIE)?.value;
//   if (legacy) return legacy;

//   const all = cookieStore.getAll?.() || [];
//   for (const cookie of all) {
//     if (cookie?.value && isAuthTokenCookieName(cookie.name)) {
//       return cookie.value;
//     }
//   }

//   const named = cookieStore.get?.(
//     getTokenCookieName({
//       platform: getPlatform(),
//       clientId: getClientId(),
//     }),
//   )?.value;
//   return named || null;
// }

// /**
//  * Read token from cookie store - PLATFORM AWARE
//  * 
//  * Priority order:
//  * 1. Platform-specific token (BC_TOKEN_*, SP_TOKEN_*)
//  * 2. Web token (WEB_TOKEN)
//  * 3. Legacy tokens
//  * 
//  * @param {Object} cookieStore - Cookie store object (from request.cookies or NextResponse.cookies)
//  * @param {string} detectedPlatform - Platform detected from server (e.g., from hostname)
//  * @returns {string|null} - The auth token value or null
//  */
// function readTokenFromCookieStore(cookieStore, detectedPlatform) {
//   if (!cookieStore) return null;

//   const platform = detectedPlatform || (typeof window !== "undefined" ? getPlatform() : "web");
  
//   // If server-side (no window), platform should have been passed explicitly
//   // Try to read platform-specific token first
//   if (platform && platform !== "web") {
//     const baseKey = TOKEN_KEYS[platform];
//     if (baseKey) {
//       const all = cookieStore.getAll?.() || [];
      
//       // Look for platform-specific tokens (e.g., BC_TOKEN_store123, SP_TOKEN_shop)
//       for (const cookie of all) {
//         if (cookie?.value && (
//           cookie.name === baseKey || 
//           cookie.name.startsWith(`${baseKey}_`)
//         )) {
//           return cookie.value;
//         }
//       }
//     }
//   }

//   // Fallback: read all tokens and return the first one
//   const tokens = readAllTokensFromCookieStore(cookieStore);
//   if (tokens.length) return tokens[0];

//   // Last resort: try web token by name
//   const webToken = cookieStore?.get?.(TOKEN_KEYS.web)?.value;
//   if (webToken) return webToken;

//   return null;
// }

// function hasAuthTokenCookie(requestOrStore, detectedPlatform) {
//   if (!requestOrStore) return false;

//   if (requestOrStore.cookies?.has) {
//     if (requestOrStore.cookies.has(LEGACY_TOKEN_COOKIE)) return true;
//     return requestOrStore.cookies
//       .getAll()
//       .some((cookie) => isAuthTokenCookieName(cookie.name));
//   }

//   return Boolean(readTokenFromCookieStore(requestOrStore, detectedPlatform));
// }

// function isWebAuthCookieName(name) {
//   if (!name) return false;
//   if (name === LEGACY_TOKEN_COOKIE) return true;
//   return (
//     name === TOKEN_KEYS.web ||
//     name.startsWith(`${TOKEN_KEYS.web}_`) ||
//     name === "TOKEN" ||
//     name.startsWith("TOKEN_")
//   );
// }

// function hasWebAuthTokenCookie(requestOrStore) {
//   if (!requestOrStore) return false;

//   if (requestOrStore.cookies?.getAll) {
//     return requestOrStore.cookies.getAll().some(
//       (cookie) => cookie.value && isWebAuthCookieName(cookie.name),
//     );
//   }

//   const legacy = requestOrStore.get?.(LEGACY_TOKEN_COOKIE)?.value;
//   if (legacy) return true;

//   const all = requestOrStore.getAll?.() || [];
//   return all.some((cookie) => cookie?.value && isWebAuthCookieName(cookie.name));
// }

// module.exports = {
//   TOKEN_KEYS,
//   LEGACY_TOKEN_COOKIE,
//   getPlatform,
//   getPlatformFromHostname,
//   getClientId,
//   getLogoutPlatform,
//   clearRedirectWebAuthLocalStorage,
//   getTokenCookieName,
//   isAuthTokenCookieName,
//   readTokenFromCookieStore,
//   hasAuthTokenCookie,
//   hasWebAuthTokenCookie,
// };


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

/**
 * Client-side platform detection (uses browser APIs)
 */
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

/**
 * Server-side platform detection (uses hostname from URL)
 * Call this in middleware/server actions when window is undefined
 */
function getPlatformFromHostname(hostname) {
  if (!hostname) return "web";
  
  if (hostname.includes("myshopify")) return "shopify";
  if (hostname.includes("bigcommerce")) return "bigcommerce";
  
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

/**
 * Read all auth tokens from cookie store
 */
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

/**
 * Read token from cookie store - PLATFORM AWARE
 * 
 * Priority order:
 * 1. Platform-specific token (BC_TOKEN_*, SP_TOKEN_*)
 * 2. Web token (WEB_TOKEN)
 * 3. Legacy tokens
 * 
 * @param {Object} cookieStore - Cookie store object (from request.cookies or NextResponse.cookies)
 * @param {string} detectedPlatform - Platform detected from server (e.g., from hostname)
 * @returns {string|null} - The auth token value or null
 */
function readTokenFromCookieStore(cookieStore, detectedPlatform) {
  if (!cookieStore) return null;

  const platform = detectedPlatform || (typeof window !== "undefined" ? getPlatform() : "web");
  
  // If server-side (no window), platform should have been passed explicitly
  // Try to read platform-specific token first
  if (platform && platform !== "web") {
    const baseKey = TOKEN_KEYS[platform];
    if (baseKey) {
      const all = cookieStore.getAll?.() || [];
      
      // Look for platform-specific tokens (e.g., BC_TOKEN_store123, SP_TOKEN_shop)
      for (const cookie of all) {
        if (cookie?.value && (
          cookie.name === baseKey || 
          cookie.name.startsWith(`${baseKey}_`)
        )) {
          console.log("[Token Reading] ✅ Found platform-specific token:", {
            platform,
            tokenName: cookie.name,
            hasValue: !!cookie.value
          });
          return cookie.value;
        }
      }
      console.log("[Token Reading] ⚠️ No platform-specific token found for:", platform);
    }
  }

  // Second priority: WEB_TOKEN
  const webToken = cookieStore.get?.(TOKEN_KEYS.web)?.value;
  if (webToken) {
    console.log("[Token Reading] ✅ Found web token (fallback)");
    return webToken;
  }

  // Fallback: read all tokens and return the first one
  const tokens = readAllTokensFromCookieStore(cookieStore);
  if (tokens.length) {
    console.log("[Token Reading] ✅ Found legacy token (fallback)");
    return tokens[0];
  }

  console.log("[Token Reading] ❌ No auth token found");
  return null;
}

function hasAuthTokenCookie(requestOrStore, detectedPlatform) {
  if (!requestOrStore) return false;

  // For request objects (middleware)
  if (requestOrStore.cookies?.has) {
    const hasLegacy = requestOrStore.cookies.has(LEGACY_TOKEN_COOKIE);
    const hasAny = requestOrStore.cookies.getAll().some(
      (cookie) => isAuthTokenCookieName(cookie.name)
    );
    
    const result = hasLegacy || hasAny;
    console.log("[hasAuthTokenCookie] Check result:", {
      detectedPlatform,
      hasLegacy,
      hasAny,
      result,
      cookies: requestOrStore.cookies.getAll().map(c => c.name)
    });
    return result;
  }

  // For cookie store objects
  const hasToken = Boolean(readTokenFromCookieStore(requestOrStore, detectedPlatform));
  console.log("[hasAuthTokenCookie] Store check result:", {
    detectedPlatform,
    hasToken
  });
  return hasToken;
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
  getPlatformFromHostname,
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