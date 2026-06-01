'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { clearWebAuthStorage } from '@/app/(chataffy)/_lib/embeddedSession';
import { clearSocketToken } from '@/lib/socketSession';
import { dispatchAuthStorageSync } from '@/app/socketContext';
import { SESSION_EXPIRED_QUERY } from '@/lib/apiAuth';
import { resolvePortalFromPathname } from '@/lib/sessionExpired';

/** Clears sessionStorage after server-side 401 redirect (cookies already cleared). */
export default function SessionExpiredCleanup() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get(SESSION_EXPIRED_QUERY) !== '1') return;

    const portal = resolvePortalFromPathname(pathname);
    clearWebAuthStorage();
    clearSocketToken(portal);
    dispatchAuthStorageSync();

    const next = new URLSearchParams(searchParams.toString());
    next.delete(SESSION_EXPIRED_QUERY);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, pathname, router]);

  return null;
}
