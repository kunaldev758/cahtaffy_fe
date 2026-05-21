"use client"
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/app/fonts.css'
import '@/app/globals.css'
import { SocketProvider } from '../socketContext';
import { GoogleOAuthProvider } from '@react-oauth/google'
import PlanProvider from '../planContext';
import PlatformSessionSync from './_components/PlatformSessionSync';
import { useEffect, useState } from 'react';

// import { Inter } from 'next/font/google'

// const inter = Inter({
//   subsets: [],
//   weight: ['400', '500', '700'],
//   display: 'swap',
// })

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string | undefined

  const [isEmbedded, setIsEmbedded] = useState(false)

  useEffect(() => {
    setIsEmbedded(window.self !== window.top)
  }, [])

  return (
    <>
    {/* <div className={inter.className}> */}
        {isEmbedded && process.env.NEXT_PUBLIC_SHOPIFY_API_KEY && (
          <>
            <meta
              name="shopify-api-key"
              content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}
            />
            <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
          </>
        )}
    <PlatformSessionSync />
    <SocketProvider>
      <PlanProvider>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
        </GoogleOAuthProvider>
      ) : (
        children
      )}
      </PlanProvider>
      </SocketProvider>
    {/* </div> */}

    </>
  )
}