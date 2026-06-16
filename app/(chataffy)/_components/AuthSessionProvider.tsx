'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { initializeAuthSession } from '@/lib/authInitializer';
import { SocketProvider } from '@/app/socketContext';

/**
 * Restores sessionStorage from HttpOnly cookies before the socket connects.
 * Fixes new-tab navigation where cookies are valid but per-tab sessionStorage is empty.
 */
export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const currentPath = pathname || window.location.pathname;
        const result = await initializeAuthSession(currentPath);
        if (cancelled) return;

        if (!result.restored && result.action === 'redirect-to-login') {
          window.location.href = result.loginPath!;
          return;
        }

        setReady(true);
      } catch (error) {
        console.error('Auth session initialization failed:', error);
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!ready) return null;

  return <SocketProvider>{children}</SocketProvider>;
}
