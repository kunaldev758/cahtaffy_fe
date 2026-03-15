"use client"

import { useMemo, useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"

type TrainingRow = {
  id: string
  url: string
  isMain?: boolean
}

type TrainSetupProps = {
  urls: string[]
  sourceDomain?: string
  onContinue: (selectedUrls: string[]) => void | Promise<void>
  isTraining?: boolean
}

const TrainSetup = ({ urls, sourceDomain, onContinue, isTraining }: TrainSetupProps) => {
  const checkboxUiClass =
    "h-[20px] w-[20px] rounded-[8px] border border-[#CBD5E1] shadow-none data-[state=checked]:border-[#4686FE] data-[state=checked]:bg-[#4686FE] data-[state=checked]:text-white data-[state=indeterminate]:border-[#4686FE] data-[state=indeterminate]:bg-[#4686FE] data-[state=indeterminate]:text-white [&_svg]:h-[14px] [&_svg]:w-[14px]"
  const headerCheckboxUiClass =
    `${checkboxUiClass} data-[state=indeterminate]:border-[#CBD5E1] data-[state=indeterminate]:bg-white data-[state=indeterminate]:text-[#111827]`

  const [searchValue, setSearchValue] = useState("")

  const rows: TrainingRow[] = useMemo(() =>
    urls.map((url, i) => ({
      id: String(i),
      url,
      isMain: i === 0,
    })),
    [urls]
  )

  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (rows.length > 0) {
      setSelectedRows(rows.reduce((acc, row) => ({ ...acc, [row.id]: true }), {} as Record<string, boolean>))
    }
  }, [rows])

  const filteredRows = useMemo(() => {
    if (!searchValue.trim()) return rows
    const keyword = searchValue.toLowerCase()
    return rows.filter((row) => row.url.toLowerCase().includes(keyword))
  }, [rows, searchValue])

  const allSelected =
    filteredRows.length > 0 && filteredRows.every((row) => selectedRows[row.id])
  const hasPartialSelection =
    filteredRows.some((row) => selectedRows[row.id]) && !allSelected
  const selectedCount = rows.filter((row) => selectedRows[row.id]).length

  const handleContinue = async () => {
    const selectedUrls = rows.filter((row) => selectedRows[row.id]).map((r) => r.url)
    await onContinue(selectedUrls)
  }

  return (
    <div>
      <div className="flex justify-between items-start md:items-center gap-3 md:gap-2 p-[20px] flex-col md:flex-row">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-bold text-[#111827]">
            Select pages to Train
          </h2>
          <p className="text-[13px] text-[#64748B]">
            Found {rows.length} pages{sourceDomain ? ` on ${sourceDomain}` : ''}
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
                disabled={selectedCount === 0 || isTraining}
                onClick={handleContinue}
                className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:cursor-not-allowed disabled:hover:bg-[#CBD5E1]"
              >
                {isTraining ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Training...
                  </>
                ) : (
                  <>
                    <span>Train & Continue</span>
                    <Image src="/images/new/sparkle-icon.svg" alt="Arrow Forward" width={18} height={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainSetup
