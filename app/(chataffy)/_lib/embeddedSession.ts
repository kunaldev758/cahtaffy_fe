/** Keys needed to re-auth Shopify/BigCommerce after a web-tab session overwrote shared cookies. */
export const EMBEDDED_SESSION_KEYS = [
  'provider',
  'signedPayloadJwt',
  'bcStoreHash',
  'bcStoreUrl',
  'shopifyShop',
  'sf_params',
  'userId',
  'agents',
  'currentAgentId',
] as const;

/** Clears web auth sessionStorage but keeps embedded-app session keys for other tabs. */
export function clearWebAuthStorage() {
  if (typeof window === 'undefined') return;

  const preserved: Record<string, string> = {};
  for (const key of EMBEDDED_SESSION_KEYS) {
    const value = sessionStorage.getItem(key);
    if (value !== null) preserved[key] = value;
  }

  sessionStorage.clear();

  for (const [key, value] of Object.entries(preserved)) {
    sessionStorage.setItem(key, value);
  }

  sessionStorage.removeItem('token');
}
