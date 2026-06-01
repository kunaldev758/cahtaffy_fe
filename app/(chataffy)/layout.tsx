import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/app/fonts.css'
import '@/app/globals.css'
import { Suspense } from 'react';
import { SocketProvider } from '../socketContext';
import { GoogleOAuthProvider } from '@react-oauth/google'
import PlanProvider from '../planContext';
import PlatformSessionSync from './_components/PlatformSessionSync';
import SessionExpiredCleanup from './_components/SessionExpiredCleanup';

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

  console.log('DashboardLayout rendered with GOOGLE_CLIENT_ID:', googleClientId);

  return (
    <>
    {/* <div className={inter.className}> */}
    <PlatformSessionSync />
    <Suspense fallback={null}>
      <SessionExpiredCleanup />
    </Suspense>
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