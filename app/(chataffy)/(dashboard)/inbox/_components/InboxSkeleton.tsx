import { Skeleton } from '@/components/ui/skeleton'

function ConversationsListSkeleton() {
  return (
    <div className="flex w-[220px] shrink-0 flex-col rounded-[20px] bg-white px-3 py-4">
      {/* Search bar */}
      <div className="mb-4 flex items-center gap-2 px-1">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      </div>

      {/* Filter row */}
      <div className="mb-4 flex items-center gap-2 px-1">
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>

      {/* Conversation rows */}
      <div className="flex flex-col gap-3 px-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-2.5 w-8 rounded" />
              </div>
              <Skeleton className="h-2.5 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatAreaSkeleton() {
  return (
    <div className="flex flex-1 flex-col rounded-[20px] bg-white">
      {/* Chat header */}
      <div className="flex h-[56px] items-center justify-between border-b border-[#F1F5F9] px-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-2.5 w-24 rounded" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-5 py-4">
        {/* Visitor bubble right */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-52 rounded-[18px] rounded-tr-sm" />
        </div>

        {/* Agent bubble left */}
        <div className="flex items-end gap-2">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-60 rounded-[18px] rounded-tl-sm" />
        </div>

        {/* Visitor bubble right */}
        <div className="flex justify-end">
          <Skeleton className="h-14 w-64 rounded-[18px] rounded-tr-sm" />
        </div>

        {/* Agent bubble left */}
        <div className="flex items-end gap-2">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
          <Skeleton className="h-8 w-44 rounded-[18px] rounded-tl-sm" />
        </div>

        {/* Visitor bubble right */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-48 rounded-[18px] rounded-tr-sm" />
        </div>

        {/* Agent bubble left */}
        <div className="flex items-end gap-2">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
          <Skeleton className="h-16 w-72 rounded-[18px] rounded-tl-sm" />
        </div>
      </div>

      {/* Notes tab + input */}
      <div className="border-t border-[#F1F5F9] px-5 pb-4 pt-3">
        <div className="mb-3 flex gap-3">
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="mt-2 flex justify-end">
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      </div>
    </div>
  )
}

function DetailsPanelSkeleton() {
  return (
    <div className="flex w-[260px] shrink-0 flex-col gap-4 rounded-[20px] bg-white px-4 py-4">
      {/* Visitor card */}
      <div className="flex items-center gap-3 rounded-xl border border-[#F1F5F9] px-3 py-3">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-2.5 w-24 rounded" />
        </div>
      </div>

      {/* Notes section */}
      <div className="rounded-xl border border-[#F1F5F9] px-3 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
        <Skeleton className="h-3 w-28 rounded" />
      </div>

      {/* Recent chats section */}
      <div className="rounded-xl border border-[#F1F5F9] px-3 py-3">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-2.5 w-12 rounded" />
                <Skeleton className="h-2.5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-2.5 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function InboxSkeleton() {
  return (
    <div className="rounded-tl-[30px] bg-[#F3F4F6] px-4 pb-[33px] pt-6 lg:px-6 flex gap-6 h-[calc(100vh-89px)]">
      <ConversationsListSkeleton />
      <ChatAreaSkeleton />
      <DetailsPanelSkeleton />
    </div>
  )
}
