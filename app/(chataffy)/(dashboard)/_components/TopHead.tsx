'use client'

import { DatePickerWithRange } from '@/components/datepicker'
import { type DateRange } from 'react-day-picker'
import NotificationBell from './NotificationBell'
import WebsiteSelect from './WebsiteSelect'

type TopHeadProps = {
  dateRange?: DateRange
  onDateChange?: (range: DateRange | undefined) => void
  trainingStatus?: number
  title?: string
  subtitle?: string
  showStatusBadge?: boolean
  showWebsiteSelect?: boolean
  showDatePicker?: boolean
  showNotificationBell?: boolean
}

export default function TopHead({
  dateRange,
  onDateChange,
  trainingStatus,
  title = 'Overview',
  subtitle = "Welcome back, here's what's happening across your agents.",
  showStatusBadge = true,
  showWebsiteSelect = true,
  showDatePicker = true,
  showNotificationBell = true,
}: TopHeadProps) {
  return (
    <header className="flex flex-col gap-5 bg-[#F9F9F9] pr-[20px] py-[20px] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-[14px]">
          <h1 className="text-[24px] font-bold leading-5 text-[#111827]">{title}</h1>
          {showStatusBadge && (
            <span
              className={`inline-flex h-[22px] items-center gap-1 rounded-[4px] border px-[10px] text-center text-[12px] font-medium leading-[18px] ${
                trainingStatus === 1
                  ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]'
                  : 'border-[#34D399] bg-[#ECFDF5] text-[#059669]'
              }`}
            >
              <CheckCircleIcon className="h-[13px] w-[13px]" />
              {trainingStatus === 1 ? 'Training in progress' : 'No training in progress'}
            </span>
          )}
        </div>
        {subtitle ? (
          <p className="text-[13px] leading-5 text-[#64748B]">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-[16px] lg:justify-end">
        {showWebsiteSelect && <WebsiteSelect />}
        {showDatePicker && dateRange && onDateChange && (
          <DatePickerWithRange value={dateRange} onDateChange={onDateChange} />
        )}
        {showNotificationBell && <NotificationBell />}
      </div>
    </header>
  )
}

function CheckCircleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 6.89137 17.1086 2.75 12 2.75ZM10.72 15.78L7.47 12.53L8.53 11.47L10.72 13.66L15.47 8.91L16.53 9.97L10.72 15.78Z" />
    </svg>
  )
}
