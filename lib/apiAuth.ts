/** Returned from dashboard server actions when the session is invalid (401). */
export const AUTH_API_ERROR = 'error' as const;

export type AuthApiError = typeof AUTH_API_ERROR;

export const SESSION_EXPIRED_QUERY = 'sessionExpired';

export function loginPathForPortal(portal: 'agent' | 'client'): string {
  return portal === 'agent' ? '/agent-login' : '/login';
}

export function isAuthApiError(
  result: unknown,
): result is AuthApiError {
  return result === AUTH_API_ERROR;
}

export function isUnauthorizedResponse(
  response: Response,
  data: { status_code?: number } | null | undefined,
): boolean {
  return response.status === 401 || data?.status_code === 401;
}

/** True when a dashboard server action returned a successful API payload. */
export function isApiSuccess(result: unknown): boolean {
  if (isAuthApiError(result) || result == null || typeof result !== 'object') {
    return false;
  }
  const payload = result as {
    status?: boolean;
    status_code?: number;
    message?: string;
  };
  if (payload.status === true || payload.status_code === 200) return true;
  if (payload.status === false || (payload.status_code != null && payload.status_code >= 400)) {
    return false;
  }
  const msg = payload.message?.toLowerCase() ?? '';
  return msg.includes('success');
}
