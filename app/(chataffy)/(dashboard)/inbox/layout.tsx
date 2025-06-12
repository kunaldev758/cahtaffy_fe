import Navigation from './_components/navigation'

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="main-content">
        {/* <Navigation /> */}
        {children}
      </div>
    </>
  )
}