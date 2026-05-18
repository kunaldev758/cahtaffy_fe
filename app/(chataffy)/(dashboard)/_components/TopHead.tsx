'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
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
  rightContent?: React.ReactNode
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
  rightContent,
}: TopHeadProps) {
  const [provider, setProvider] = useState<string | null>(null)

  useEffect(() => {
    setProvider(localStorage.getItem('provider'))
  }, [])

  const showOfficialWebsiteButton =
    (provider === 'shopify' || provider === 'bigcommerce') && window.self !== window.top

    const handleOpenWebsite = async () => {
      const shop = localStorage.getItem('shopifyShop')
      const signedPayloadJwt = localStorage.getItem('signedPayloadJwt') 
      const id_token = localStorage.getItem('id_token')
      const userId = localStorage.getItem('clientAgent') ? JSON.parse(localStorage.getItem('clientAgent') || '{}').userId : null
      const params = new URLSearchParams()
    
      if (provider === 'shopify') {
        if (shop) params.set('shop', shop)
    
        if (id_token) params.set('id_token', id_token)
      }
    
      if (provider === 'bigcommerce') {
        if (signedPayloadJwt) params.set('signed_payload_jwt', signedPayloadJwt)
      }
      params.set('userId', userId || '')
    
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/platform-login?${params.toString()}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }

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
        {showOfficialWebsiteButton && (
          <button
            type="button"
            onClick={() => { handleOpenWebsite() }}
            title="Open website"
            className="inline-flex h-[40px] items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] font-medium text-[#111827] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-[#64748B]" aria-hidden="true" />
          </button>
        )}
        {rightContent}
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
