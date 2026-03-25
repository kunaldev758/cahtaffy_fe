'use client'

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
  const min = Math.min(...counts)

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[640px] overflow-hidden rounded-xl border border-[#E8E8E8] bg-[#FAFBFC]">
        <Chart
          chartType="GeoChart"
          width="100%"
          height="280px"
          data={chartRows}
          options={{
            region: 'world',
            resolution: 'countries',
            colorAxis: {
              colors: ['#EEF2FF', '#4B56F2'],
              minValue: min,
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
      <div className="mt-4 flex max-w-[200px] flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#64748B]">Chat count</p>
        <div className="flex items-center gap-2">
          <span className="min-w-[1.5rem] text-right text-[11px] tabular-nums text-[#64748B]">{min}</span>
          <div
            className="h-2 flex-1 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #EEF2FF 0%, #4B56F2 100%)',
            }}
          />
          <span className="min-w-[1.5rem] text-[11px] tabular-nums text-[#64748B]">{max}</span>
        </div>
      </div>
    </div>
  )
}
