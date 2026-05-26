"use client";

import { useEffect } from 'react';
import { initializeAuthSession } from '@/lib/authInitializer';
import { isAgentPath } from "@/lib/portalUrls";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/app/fonts.css'
import '@/app/globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'


const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

    useEffect(() => {
    // On app startup, validate and restore auth session
    if (typeof window !== 'undefined') {
      initializeAuthSession(window.location.pathname).then(authStatus => {
        if (
          !authStatus.restored &&
          authStatus.action === 'redirect-to-login' &&
          authStatus.loginPath &&
          window.location.pathname !== authStatus.loginPath
        ) {
          window.location.href = authStatus.loginPath;
        }
      }).catch(err => {
        console.error('Auth initialization failed:', err);
      });
    }
  }, []);


  return (
    <html lang="en" >
      <head>
        {process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ? (
          <>
            <meta
              name="shopify-api-key"
              content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}
              />
            <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
          </>
        ) : null}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      
      <body className={jakarta.className}>
        {children}
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  )
}
