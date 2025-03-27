import { SocketProvider } from '@/app/socketContext'
import Navigation from './_components/navigation'


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <section className="main-area">
        <Navigation />
        <SocketProvider>{children}</SocketProvider>
        
      </section>
    </>
  )
}