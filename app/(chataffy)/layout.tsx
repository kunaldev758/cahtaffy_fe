
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/app/fonts.css'
import '@/app/globals.css'
import { ToastContainer, toast } from 'react-toastify';
import { SocketProvider } from '../socketContext';

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
  return (
    <>
    {/* <div className={inter.className}> */}
    <SocketProvider>
      {children}
      <ToastContainer />
      </SocketProvider>
    {/* </div> */}

    </>
  )
}