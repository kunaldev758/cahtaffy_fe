import { HelpCircle } from 'lucide-react'
import React from 'react'

const emailHint = 'Hit Enter or use comma to add multiple email addresses.'

type EmailFieldProps = {
  label: string
  tags: string[]
  inputValue: string
  onInputChange: (nextValue: string) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onRemoveTag: (tag: string) => void
  onBlur: () => void
}

export default function EmailField({ label, tags, inputValue, onInputChange, onKeyDown, onRemoveTag, onBlur }: EmailFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#1F2937]">
        {label}
        {/* <HelpCircle className="h-3.5 w-3.5 text-[#6B7280]" /> */}
      </label>
      <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-md border border-[#E5E7EB] px-3 py-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-2 rounded-md bg-[#EEF2FF] px-2 py-1 text-[12px] text-[#374151]"
          >
            {tag}
            <button
              type="button"
              className="cursor-pointer text-[#6B7280]"
              onClick={() => onRemoveTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              x
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder={emailHint}
          className="min-w-[260px] flex-1 bg-transparent text-[12px] text-[#374151] outline-none placeholder:text-[#9CA3AF]"
        />
      </div>
    </div>
  )
}