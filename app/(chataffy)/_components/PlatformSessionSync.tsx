'use client';

import { useEffect, useRef } from 'react';
import axios from 'axios';
import { dispatchAuthStorageSync } from '@/app/socketContext';
import { usePathname } from 'next/navigation';
import { bcAuthLoadApi, setPlatformCookie, sfAuthLoadApi } from '@/app/_api/login/action';

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


//  Re-applies Shopify/BigCommerce cookies when the embedded tab regains focus.
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

       // window.self === window.top it means the user is on the web tab not in the embedded tab
      if (window.self === window.top) {
        syncingRef.current = true;
        setClientPlatformCookie('local');
        await setPlatformCookie();
        syncingRef.current = false;
        return;
      };

      // do not sync platform session for load page
      if (pathnameRef.current === "/load") return;


      // const provider = sessionStorage.getItem('provider');
    // 2. We are in an iframe. Grab URL params to identify the platform.
      const urlParams = new URLSearchParams(window.location.search);
      const shopUrl = urlParams.get('shop'); 

      // 3. Detect provider using URL params or existing sessionStorage keys
      let provider = 'local';
      
      if (shopUrl || sessionStorage.getItem('shopifyShop') || sessionStorage.getItem('sf_params')) {
        provider = 'shopify';
      } else if (sessionStorage.getItem('signedPayloadJwt') || urlParams.has('signed_payload_jwt')) {
        provider = 'bigcommerce';
      }

      if (provider !== 'shopify' && provider !== 'bigcommerce') return;

      const apiBase = process.env.NEXT_PUBLIC_API_HOST;
      if (!apiBase) return;

      syncingRef.current = true;
      try {
        if (provider === 'bigcommerce') {
          const signedPayloadJwt = sessionStorage.getItem('signedPayloadJwt');
          if (!signedPayloadJwt) return;

          setClientPlatformCookie('bigcommerce');
          await bcAuthLoadApi(signedPayloadJwt);
        } else {
          const shop = sessionStorage.getItem('shopifyShop');
          const sfParams = sessionStorage.getItem('sf_params');
          if (!shop && !sfParams) return;

          const params: Record<string, string> = sfParams
            ? Object.fromEntries(new URLSearchParams(sfParams))
            : {};

          if (shop) params.shop = shop;

          if (window.shopify?.idToken) {
            try {
              params.id_token = await window.shopify.idToken();
            } catch {
              // Fall back to saved params when App Bridge is unavailable
            }
          }

          setClientPlatformCookie('shopify');
          await sfAuthLoadApi(params);
        }

        dispatchAuthStorageSync();
      } catch (err) {
        console.warn('[PlatformSessionSync] Failed to restore platform session:', err);
      } finally {
        syncingRef.current = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void syncPlatformSession();
      }
    };

    void syncPlatformSession();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', syncPlatformSession);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', syncPlatformSession);
    };
  }, []);

  return null;
}
