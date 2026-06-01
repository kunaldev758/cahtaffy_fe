'use client';

import { clearAuthData } from '@/lib/authInitializer';
import { clearWebAuthStorage } from '@/app/(chataffy)/_lib/embeddedSession';
import { clearSocketToken } from '@/lib/socketSession';
import { dispatchAuthStorageSync } from '@/app/socketContext';
import { isAgentPath } from '@/lib/portalUrls';
import { loginPathForPortal } from '@/lib/apiAuth';

export function resolvePortalFromPathname(pathname: string): 'agent' | 'client' {
  return isAgentPath(pathname) ? 'agent' : 'client';
}

/** Clears client session state and navigates to the correct login page. */
export async function handleSessionExpired(pathname?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const path = pathname ?? window.location.pathname;
  const portal = resolvePortalFromPathname(path);

  clearWebAuthStorage();
  clearSocketToken(portal);
  dispatchAuthStorageSync();
  await clearAuthData();

  window.location.href = loginPathForPortal(portal);
}
