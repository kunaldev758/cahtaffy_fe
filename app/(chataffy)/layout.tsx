
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/app/fonts.css'
import '@/app/globals.css'
import { ToastContainer, toast } from 'react-toastify';
import { SocketProvider } from '../socketContext';
import { GoogleOAuthProvider } from '@react-oauth/google'

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
  return (
    <>
    {/* <div className={inter.className}> */}
    <SocketProvider>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
        </GoogleOAuthProvider>
      ) : (
        children
      )}
      <ToastContainer />
      </SocketProvider>
    {/* </div> */}

    </>
  )
}