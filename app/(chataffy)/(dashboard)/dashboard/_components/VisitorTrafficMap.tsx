'use client'

import Image from 'next/image'
import { Chart } from 'react-google-charts'

type Props = {
  /** [["Country", "Chat Count"], ["US", 3], ...] from dashboard API */
  data: (string | number)[][]
}

export function VisitorTrafficMap({ data }: Props) {
  const chartRows = data.filter((row, i) => {
    if (i === 0) return true
    const code = String(row[0] ?? '').trim().toUpperCase()
    if (!code || code === 'UNKNOWN') return false
    return true
  })

  const hasData = chartRows.length > 1

  if (!hasData) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-[#E8E8E8] bg-[#F8FAFC] px-4 text-center text-[13px] text-[#64748B]">
        No visitor location data for this period
      </div>
    )
  }

  const counts = chartRows.slice(1).map((r) => Number(r[1]) || 0)
  const max = Math.max(...counts, 1)

  // Country rows sorted by chat count descending (for the flag list)
  const countryRows = chartRows
    .slice(1)
    .map((r) => ({ code: String(r[0]).trim().toUpperCase(), count: Number(r[1]) || 0 }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Geo chart */}
        <div className="flex-1 overflow-hidden rounded-xl border border-[#E8E8E8] bg-[#FAFBFC]">
          <Chart
            chartType="GeoChart"
            width="100%"
            height="280px"
            data={chartRows}
            options={{
              region: 'world',
              resolution: 'countries',
              colorAxis: {
                colors: ['#93A8F4', '#4B56F2'],
                minValue: 0,
                maxValue: max,
              },
              backgroundColor: 'transparent',
              datalessRegionColor: '#F1F5F9',
              defaultColor: '#F1F5F9',
              legend: {
                numberFormat: '#,###',
                textStyle: { color: '#64748B', fontSize: 11 },
              },
            }}
          />
        </div>

        {/* Country breakdown list with flags */}
        <div className="w-full lg:w-[220px] flex-shrink-0">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">By Country</p>
          <div className="flex flex-col gap-[10px] max-h-[300px] overflow-y-auto pr-1">
            {countryRows.map(({ code, count }) => (
              <div key={code} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex h-[14px] w-[21px] flex-shrink-0 overflow-hidden rounded-[2px] border border-[#E5E7EB]">
                    <Image
                      src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`}
                      alt={code}
                      width={21}
                      height={14}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </span>
                  <span className="text-[13px] font-medium text-[#111827] truncate">{code}</span>
                </div>
                <span className="text-[13px] font-bold text-[#4B56F2] tabular-nums flex-shrink-0">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
