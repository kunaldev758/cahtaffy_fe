import TopHead from '../_components/TopHead'
import Navigation from './_components/navigation'

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="min-h-screen bg-[#F8FAFC]">
        <TopHead
          title="Setup"
          subtitle="Manage you widget setup."
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