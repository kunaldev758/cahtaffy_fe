'use client';

import { useEffect, useRef } from 'react';
import { dispatchAuthStorageSync } from '@/app/socketContext';
import { usePathname } from 'next/navigation';
import { bcAuthLoadApi, setAuthSurface, sfAuthLoadApi } from '@/app/_api/login/action';
import { setClientAuthSurfaceCookie, setClientViewModeCookie } from '@/lib/clientAuthContext';

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

    console.log("use effect check : ",window);
    
    if (typeof window === 'undefined') return;

    const syncPlatformSession = async () => {

      console.log('[PlatformSessionSync] Attempting to sync platform session...');

      if (syncingRef.current) return;

      console.log('[PlatformSessionSync] Attempting to sync platform session check 2...');
      // window.self === window.top it means the user is on the web tab not in the embedded tab

      console.log("window top and self check : ", window.self === window.top);

      if (window.self === window.top) {
        // Do not mutate shared auth cookies on standalone tab focus.
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

      console.log(`[PlatformSessionSync] Detected provider check1: ${provider}`);

      if (provider !== 'shopify' && provider !== 'bigcommerce') return;

      console.log(`[PlatformSessionSync] Detected provider check2 : ${provider}`);

      const apiBase = process.env.NEXT_PUBLIC_API_HOST;
      if (!apiBase) return;

      // Set view mode + surface before async sync so middleware uses embedded tokens only.
      setClientViewModeCookie('embedded');
      setClientAuthSurfaceCookie(provider);
      void setAuthSurface(provider);

      syncingRef.current = true;
      try {
        if (provider === 'bigcommerce') {
          const signedPayloadJwt = sessionStorage.getItem('signedPayloadJwt');
          if (!signedPayloadJwt) return;

          // await axios.get(`${apiBase}/api/bigcommerce/auth/load`, {
          //   params: { signed_payload_jwt: signedPayloadJwt },
          //   withCredentials: true,
          // });
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

          // await axios.get(`${apiBase}/api/shopify/auth/load`, {
          //   params,
          //   withCredentials: true,
          // });
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
