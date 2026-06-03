'use client';

import { useEffect } from 'react';
import { setClientAuthSurfaceCookie, setClientViewModeCookie } from '@/lib/clientAuthContext';

/** Top-level web tab: only CLIENT_TOKEN may authenticate (not sf_token/bc_token). */
export default function WebViewModeSync() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.self !== window.top) return;

    const applyStandalone = () => {
      setClientViewModeCookie('standalone');
      setClientAuthSurfaceCookie('web');
    };

    applyStandalone();
    window.addEventListener('focus', applyStandalone);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') applyStandalone();
    });

    return () => {
      window.removeEventListener('focus', applyStandalone);
    };
  }, []);

  return null;
}
