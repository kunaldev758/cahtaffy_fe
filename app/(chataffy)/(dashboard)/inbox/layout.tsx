import Navigation from './_components/navigation'
import TopHead from '../_components/TopHead'

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* <Navigation /> */}
        <TopHead
          title="Inbox"
          subtitle="View and respond to messages from your customers."
          showDatePicker={false}
          showWebsiteSelect={true}
          showNotificationBell={true}
          showStatusBadge={false}
        />
        {children}
      </div>
    </>
  )
}