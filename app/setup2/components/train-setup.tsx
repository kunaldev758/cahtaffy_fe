"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"

type TrainingRow = {
  id: string
  url: string
  isMain?: boolean
}

type TrainSetupProps = {
  onContinue: () => void
}

const initialRows: TrainingRow[] = [
  { id: "1", url: "https://chataffy.com/", isMain: true },
  { id: "2", url: "https://chataffy.com/pricing" },
  { id: "3", url: "https://chataffy.com/features" },
  { id: "4", url: "https://chataffy.com/blog/ai-training-guide" },
  { id: "5", url: "https://chataffy.com/contact" },
  { id: "6", url: "https://chataffy.com/docs/api-reference" },
  { id: "7", url: "https://chataffy.com/terms-of-service" },
  { id: "8", url: "https://chataffy.com/privacy-policy" },
  { id: "9", url: "https://chataffy.com/cookie-policy" },
  { id: "10", url: "https://chataffy.com/sitemap.xml" },
  { id: "11", url: "https://chataffy.com/robots.txt" },
  { id: "12", url: "https://chataffy.com/humans.txt" },
  { id: "13", url: "https://chataffy.com/404" },
  { id: "14", url: "https://chataffy.com/500" },
  { id: "15", url: "https://chataffy.com/604" },
  { id: "16", url: "https://chataffy.com/704" },
  { id: "17", url: "https://chataffy.com/804" },
  { id: "18", url: "https://chataffy.com/904" },
  { id: "19", url: "https://chataffy.com/1004" },
  { id: "20", url: "https://chataffy.com/1104" },
  { id: "21", url: "https://chataffy.com/1204" },
  { id: "22", url: "https://chataffy.com/1304" },
  { id: "23", url: "https://chataffy.com/1404" },
  { id: "24", url: "https://chataffy.com/1504" },
  { id: "25", url: "https://chataffy.com/1604" },
  { id: "26", url: "https://chataffy.com/1704" },
  { id: "27", url: "https://chataffy.com/1804" },
  { id: "28", url: "https://chataffy.com/1904" },
  { id: "29", url: "https://chataffy.com/2004" },
]

const TrainSetup = ({ onContinue }: TrainSetupProps) => {
  const checkboxUiClass =
    "h-[20px] w-[20px] rounded-[8px] border border-[#CBD5E1] shadow-none data-[state=checked]:border-[#4686FE] data-[state=checked]:bg-[#4686FE] data-[state=checked]:text-white data-[state=indeterminate]:border-[#4686FE] data-[state=indeterminate]:bg-[#4686FE] data-[state=indeterminate]:text-white [&_svg]:h-[14px] [&_svg]:w-[14px]"
  const headerCheckboxUiClass =
    `${checkboxUiClass} data-[state=indeterminate]:border-[#CBD5E1] data-[state=indeterminate]:bg-white data-[state=indeterminate]:text-[#111827]`

  const [searchValue, setSearchValue] = useState("")
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>(
    () =>
      initialRows.reduce(
        (acc, row) => ({ ...acc, [row.id]: true }),
        {} as Record<string, boolean>
      )
  )

  const filteredRows = useMemo(() => {
    if (!searchValue.trim()) return initialRows

    const keyword = searchValue.toLowerCase()
    return initialRows.filter((row) => row.url.toLowerCase().includes(keyword))
  }, [searchValue])

  const allSelected =
    filteredRows.length > 0 && filteredRows.every((row) => selectedRows[row.id])
  const hasPartialSelection =
    filteredRows.some((row) => selectedRows[row.id]) && !allSelected
  const selectedCount = initialRows.filter((row) => selectedRows[row.id]).length

  return (
    <div>
      <div className="flex justify-between items-start md:items-center gap-3 md:gap-2 p-[20px] flex-col md:flex-row">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-bold text-[#111827]">
            Select pages to Train
          </h2>
          <p className="text-[13px] text-[#64748B]">
            Found 48 pages on zenconnex.com
          </p>
        </div>

        <div className="h-[40px] rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] flex items-center gap-2 w-full md:w-72">
          <span className="material-symbols-outlined text-[#64748B] !text-[20px]">
            search
          </span>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search Pages"
            className="text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8] w-full"
            type="text"
          />
        </div>
      </div>

      <div className="border-y border-[#F1F5F9]">
        <div className="h-[48px] bg-[#F8FAFC] border-b border-[#F1F5F9] px-4 flex items-center">
          <div className="w-full flex items-center gap-3">
            <Checkbox
              className={headerCheckboxUiClass}
              checked={allSelected ? true : hasPartialSelection ? "indeterminate" : false}
              onCheckedChange={(checked) => {
                const shouldSelect = checked === true
                const updated: Record<string, boolean> = { ...selectedRows }
                filteredRows.forEach((row) => {
                  updated[row.id] = shouldSelect
                })
                setSelectedRows(updated)
              }}
            />
            <span className="text-[12px] font-medium leading-5 text-[#94A3B8]">
              URL PATH
            </span>
          </div>
        </div>

        <div className="h-[calc(100vh-370px)] min-h-[300px] overflow-y-auto overflow-x-hidden">
          <div className="divide-y divide-[#E2E8F0]">
            {filteredRows.map((row) => (
              <div key={row.id} className="h-[50px] px-4 flex items-center hover:bg-[#F8FAFC]">
                <div className="w-full flex items-center gap-3">
                  <Checkbox
                    className={checkboxUiClass}
                    checked={!!selectedRows[row.id]}
                    onCheckedChange={(checked) => {
                      setSelectedRows((prev) => ({ ...prev, [row.id]: checked === true }))
                    }}
                  />

                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[#EEF2FF]"
                    aria-label={`Open ${row.url}`}
                  >
                    <span className="material-symbols-outlined !text-[18px] text-[#94A3B8]">
                      link
                    </span>
                  </a>

                  <p className="text-[13px] text-[#111827] truncate">
                    {row.url}
                  </p>

                  {row.isMain && (
                    <Badge className="ml-auto rounded-[6px] bg-[#F1F5F9] text-[12px] text-[#64748B] shadow-none hover:bg-[#F1F5F9]">
                      Main
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {filteredRows.length === 0 && (
              <div className="px-4 py-6 text-[14px] text-[#64748B]">No matching pages found.</div>
            )}
          </div>
        </div>

        <div className="bg-[#F8FAFC] p-[20px]">
          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 md:gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="md:text-base font-bold text-[#111827]">
                {selectedCount} pages selected
              </h2>
              <p className="text-[13px] text-[#64748B]">
                Selection will be processed immediately
              </p>
            </div>

            <div className="">
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={onContinue}
                className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:cursor-not-allowed disabled:hover:bg-[#CBD5E1]"
              >
                <span>Train & Continue</span>
                <Image src="/images/new/sparkle-icon.svg" alt="Arrow Forward" width={18} height={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainSetup