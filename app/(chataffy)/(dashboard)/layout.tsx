import Navigation from './_components/navigation'
import AgentSwitcherBar from './_components/AgentSwitcherBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <section className="main-area pl-[256px]">
        <Navigation />
        <div className="flex flex-col flex-1 min-h-screen">
          <AgentSwitcherBar />
          {children}
        </div>
      </section>
    </>
  )
}