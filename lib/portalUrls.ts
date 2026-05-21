/**
 * Multi-subdomain portal URLs (marketing / dashboard / agent).
 * Set NEXT_PUBLIC_*_URL in production; localhost skips host enforcement in middleware.
 */

export const LEGACY_BASE_PATH = '/chataffy/cahtaffy_fe'

export type Portal = 'marketing' | 'dashboard' | 'agent'

function trimUrl(url: string | undefined, fallback: string): string {
  const v = (url || fallback).trim()
  return v.endsWith('/') ? v : `${v}/`
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function hostsFromEnv(url: string | undefined, extra: string[] = []): string[] {
  const h = hostFromUrl(url || '')
  return Array.from(new Set([h, ...extra].filter(Boolean)))
}

export function getMarketingUrl(): string {
  return trimUrl(
    process.env.NEXT_PUBLIC_MARKETING_URL,
    'https://chataffy.com/',
  )
}

export function getDashboardUrl(): string {
  return trimUrl(
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
    process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.chataffy.com/',
  )
}

export function getAgentUrl(): string {
  return trimUrl(
    process.env.NEXT_PUBLIC_AGENT_URL,
    'https://agent.chataffy.com/',
  )
}

/** @deprecated Use getDashboardUrl() — kept for gradual migration */
export function getAppUrl(): string {
  return getDashboardUrl()
}

export function portalUrl(portal: Portal, path = ''): string {
  const base =
    portal === 'marketing'
      ? getMarketingUrl()
      : portal === 'agent'
        ? getAgentUrl()
        : getDashboardUrl()
  const p = path.startsWith('/') ? path.slice(1) : path
  return `${base}${p}`
}

export function isLocalDevHost(host: string): boolean {
  const h = host.split(':')[0].toLowerCase()
  return h === 'localhost' || h === '127.0.0.1' || h === '::1'
}

export function isProductionPortalRouting(): boolean {
  return (
    process.env.APP_ENV === 'production' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'production'
  )
}

export function getPortalFromHost(host: string): Portal | 'all' {
  if (!isProductionPortalRouting() || isLocalDevHost(host)) {
    return 'all'
  }
  const h = host.split(':')[0].toLowerCase()
  const marketingHosts = hostsFromEnv(process.env.NEXT_PUBLIC_MARKETING_URL, [
    'chataffy.com',
    'www.chataffy.com',
  ])
  const dashboardHosts = hostsFromEnv(process.env.NEXT_PUBLIC_DASHBOARD_URL, [
    'dashboard.chataffy.com',
  ])
  const agentHosts = hostsFromEnv(process.env.NEXT_PUBLIC_AGENT_URL, [
    'agent.chataffy.com',
  ])
  if (marketingHosts.includes(h)) return 'marketing'
  if (dashboardHosts.includes(h)) return 'dashboard'
  if (agentHosts.includes(h)) return 'agent'
  return 'all'
}

const AGENT_PATH_PREFIXES = [
  '/agent-login',
  '/agent-inbox',
  '/agent-accept-invite',
]

export function isAgentPath(pathname: string): boolean {
  return AGENT_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function isMarketingOnlyPath(pathname: string): boolean {
  return pathname === '/'
}

export function stripLegacyBasePath(pathname: string): string {
  if (!pathname.startsWith(LEGACY_BASE_PATH)) return pathname
  return pathname.slice(LEGACY_BASE_PATH.length) || '/'
}

export function absolutePortalUrl(
  portal: Portal,
  path: string,
  search = '',
): string {
  const u = new URL(path.startsWith('/') ? path : `/${path}`, portalUrl(portal))
  if (search) {
    const q = search.startsWith('?') ? search.slice(1) : search
    u.search = q
  }
  return u.toString()
}
