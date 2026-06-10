const FALLBACK_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

type IntlWithSupportedValuesOf = typeof Intl & {
  supportedValuesOf(key: 'timeZone'): string[]
}

export function getAllTimezones(): string[] {
  try {
    const intl = Intl as IntlWithSupportedValuesOf
    if (typeof intl.supportedValuesOf === 'function') {
      return [...intl.supportedValuesOf('timeZone')].sort()
    }
  } catch {
    // fall through
  }
  return [...FALLBACK_TIMEZONES]
}

export function isValidTimezone(timezone: string): boolean {
  if (!timezone) return false
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

export function formatTimezoneLabel(timezone: string): string {
  const label = timezone.replace(/_/g, ' ')
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date())
    const offset = parts.find((part) => part.type === 'timeZoneName')?.value
    return offset ? `${label} (${offset})` : label
  } catch {
    return label
  }
}

export function groupTimezones(timezones: string[]): { region: string; zones: string[] }[] {
  const groups = new Map<string, string[]>()

  for (const timezone of timezones) {
    const region = timezone.includes('/') ? timezone.split('/')[0] : 'Other'
    const existing = groups.get(region) ?? []
    existing.push(timezone)
    groups.set(region, existing)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([region, zones]) => ({ region, zones }))
}

export function resolveWidgetTimezone(
  data?: {
    timezone?: string
    settings?: {
      timezone?: string
      workingHours?: { timezone?: string }
    }
  } | null,
): string {
  const candidate =
    data?.timezone ??
    data?.settings?.timezone ??
    data?.settings?.workingHours?.timezone

  if (candidate && isValidTimezone(candidate)) return candidate
  return getBrowserTimezone()
}
