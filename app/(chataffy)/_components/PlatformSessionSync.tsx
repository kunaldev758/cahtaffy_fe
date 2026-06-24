'use client';

import { useEffect, useRef } from 'react';
import { dispatchAuthStorageSync } from '@/app/socketContext';
import { usePathname } from 'next/navigation';
import { setPlatformCookie } from '@/app/_api/login/action';

// declare global {
//   interface Window {
//     shopify?: {
//       idToken: () => Promise<string>;
//       config: {
//         shop: string;
//         locale: string;
//         version: string;
//       };
//     };
//   }
// }


//  Re-applies platform cookies when this browser tab becomes visible again.
//  Shared cookies are overwritten when the user opens the standalone web app in another tab.
export default function PlatformSessionSync() {
  const syncingRef = useRef(false);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setClientPlatformCookie = (value: string) => {
      const domain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim();
      const domainAttr = domain ? `; domain=${domain}` : '';
      const maxAgeAttr = `; max-age=${7 * 24 * 60 * 60}`;
      document.cookie = `platform=${value}${domainAttr}${maxAgeAttr}; path=/; SameSite=None; Secure`;
    };

    const syncPlatformSession = async () => {
      if (syncingRef.current) return;

      // window.self === window.top means the user is on the web tab, not in the embedded tab
      if (window.self === window.top) {
        syncingRef.current = true;
        try {
          setClientPlatformCookie('local');
          // await setPlatformCookie();
        } catch (err) {
          console.warn('[PlatformSessionSync] Failed to restore local platform session:', err);
        } finally {
          syncingRef.current = false;
        }
        return;
      }

      // do not sync platform session for load page
      if (pathnameRef.current === '/load') return;

      // const urlParams = new URLSearchParams(window.location.search);
      // const shopUrl = urlParams.get('shop');
      const location = window.location.ancestorOrigins[0]
      console.log("location is : ",location);
      let provider = 'local';

      if (location.includes('shopify.com') || sessionStorage.getItem('shopifyShop') || sessionStorage.getItem('sf_params')) {
        provider = 'shopify';
      } else if (location.includes('mybigcommerce.com') || sessionStorage.getItem('signedPayloadJwt')) {
        provider = 'bigcommerce';
      }

      if (provider !== 'shopify' && provider !== 'bigcommerce') return;

      const apiBase = process.env.NEXT_PUBLIC_API_HOST;
      if (!apiBase) return;

      syncingRef.current = true;
      try {
        if (provider === 'bigcommerce') {
          // const signedPayloadJwt = sessionStorage.getItem('signedPayloadJwt');
          // if (!signedPayloadJwt) return;

          setClientPlatformCookie('bigcommerce');
        } else {
          // const shop = sessionStorage.getItem('shopifyShop');
          // const sfParams = sessionStorage.getItem('sf_params');
          // if (!shop && !sfParams) return;

          setClientPlatformCookie('shopify');
        }

        dispatchAuthStorageSync();
      } catch (err) {
        console.warn('[PlatformSessionSync] Failed to restore platform session:', err);
      } finally {
        syncingRef.current = false;
      }
    };

    const scheduleSync = () => {
      // Defer until the tab is fully active (visibilitychange can fire slightly early).
      requestAnimationFrame(() => {
        void syncPlatformSession();
      });
    };

    // Embedded iframes may not fire visibilitychange on browser tab switches.
    // Poll only while hidden so we detect becoming visible with zero cost while active.
    const isEmbedded = window.self !== window.top;
    let hiddenPollId: number | null = null;

    const stopHiddenPoll = () => {
      if (hiddenPollId !== null) {
        window.clearInterval(hiddenPollId);
        hiddenPollId = null;
      }
    };

    const startHiddenPoll = () => {
      if (!isEmbedded || hiddenPollId !== null) return;

      hiddenPollId = window.setInterval(() => {
        if (!document.hidden) {
          stopHiddenPoll();
          scheduleSync();
        }
      }, 500);
    };

    const onTabVisible = () => {
      if (document.visibilityState === 'visible') {
        stopHiddenPoll();
        scheduleSync();
      } else {
        startHiddenPoll();
      }
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted || document.visibilityState === 'visible') {
        stopHiddenPoll();
        scheduleSync();
      }
    };

    void syncPlatformSession();

    document.addEventListener('visibilitychange', onTabVisible);
    window.addEventListener('pageshow', onPageShow);

    if (document.hidden) {
      startHiddenPoll();
    }

    return () => {
      document.removeEventListener('visibilitychange', onTabVisible);
      window.removeEventListener('pageshow', onPageShow);
      stopHiddenPoll();
    };
  }, []);

  return null;
}
