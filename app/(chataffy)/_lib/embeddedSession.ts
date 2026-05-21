/** Keys needed to re-auth Shopify/BigCommerce after a web-tab session overwrote shared cookies. */
export const EMBEDDED_SESSION_KEYS = [
  'provider',
  'signedPayloadJwt',
  'bcStoreHash',
  'shopifyShop',
  'sf_params',
  'userId',
  'agents',
  'currentAgentId',
] as const;

/** Clears web auth localStorage but keeps embedded-app session keys for other tabs. */
export function clearWebAuthStorage() {
  if (typeof window === 'undefined') return;

  const preserved: Record<string, string> = {};
  for (const key of EMBEDDED_SESSION_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) preserved[key] = value;
  }

  localStorage.clear();

  for (const [key, value] of Object.entries(preserved)) {
    localStorage.setItem(key, value);
  }

  localStorage.removeItem('token');
}
