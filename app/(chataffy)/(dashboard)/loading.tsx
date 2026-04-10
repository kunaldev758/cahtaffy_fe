

export default function Loading() {
  return (
    <div className="w-full bg-[#F3F4F6] flex items-center justify-center h-screen">
      <div
        className="flex items-center justify-center"
        aria-label="Loading"
        role="status"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#111827]" />
      </div>
    </div>
  )
}