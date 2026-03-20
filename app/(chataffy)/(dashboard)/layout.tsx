import { SocketProvider } from '@/app/socketContext'
import Navigation from './_components/navigation'
import AgentSwitcherBar from './_components/AgentSwitcherBar'


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <section className="main-area">
        <Navigation />
        <SocketProvider>
          <div className="flex flex-col flex-1 min-h-screen">
            <AgentSwitcherBar />
            {children}
          </div>
        </SocketProvider>
      </section>
    </>
  )
}