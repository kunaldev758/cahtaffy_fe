/**
 * Full-page redirect after login so httpOnly cookies are sent on the next request
 * (client router.replace can run before middleware sees new cookies).
 */

function trimBase(url: string | undefined, fallback: string): string {
  const v = (url || fallback).trim();
  return v.endsWith('/') ? v.slice(0, -1) : v;
}

function isLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

/** Navigate to a client dashboard path (onboarding or dashboard). */
export function redirectAfterClientLogin(isOnboarded: boolean): void {
  if (typeof window === 'undefined') return;

  const path = isOnboarded ? '/dashboard' : '/onboarding';
  const host = window.location.hostname;
  const onDashboard =
    host.startsWith('dashboard.') || isLocalHost(host);

  if (onDashboard) {
    window.location.href = path;
    return;
  }

  const base = trimBase(
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
    'https://dashboard.chataffy.com',
  );
  window.location.href = `${base}${path}`;
}

/** Navigate to agent inbox after agent login. */
export function redirectAfterAgentLogin(): void {
  if (typeof window === 'undefined') return;

  const path = '/agent-inbox';
  const host = window.location.hostname;
  const onAgent = host.startsWith('agent.') || isLocalHost(host);

  if (onAgent) {
    window.location.href = path;
    return;
  }

  const base = trimBase(
    process.env.NEXT_PUBLIC_AGENT_URL,
    'https://agent.chataffy.com',
  );
  window.location.href = `${base}${path}`;
}
