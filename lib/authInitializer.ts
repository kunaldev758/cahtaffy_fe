

import { dispatchAuthStorageSync } from "@/app/socketContext";
import { storage } from "@/lib/sessionStorageHelper";

import { cookies } from 'next/headers';

type AuthRole = "client" | "agent";

type TokenValidation = {
  valid: boolean;
  role?: AuthRole;
  agent?: Record<string, any> | null;
  userId?: string;
  humanAgentId?: string;
  currentAgentId?: string;
  agents?: Array<Record<string, any>>;
};

type InitializeAuthSessionResult =
  | { restored: true; role: AuthRole | string }
  | { restored: false; role: null; action?: undefined; loginPath?: undefined }
  | {
    restored: false;
    role: null;
    action: 'redirect-to-login';
    loginPath: string;
  };

const PUBLIC_AUTH_BYPASS_PREFIXES = [
  '/openai/widget',
  '/tensorflow/widget',
  '/_api/widget-embed',
  '/w/',
  '/wid=',
  '/widget-loader.js',
];

const PUBLIC_AUTH_BYPASS_PATHS = new Set([
  '/',
  '/verify-email',
]);

const shouldBypassAuthInitialization = (currentPath: string) => {
  const path = currentPath.split('?')[0].replace(/\/$/, '') || '/';
  return (
    PUBLIC_AUTH_BYPASS_PATHS.has(path) ||
    PUBLIC_AUTH_BYPASS_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
};

export const initializeAuthSession = async (
  currentPath: string,
): Promise<InitializeAuthSessionResult> => {
  if (typeof window === 'undefined') {
    return { restored: false, role: null };
  }

  if (shouldBypassAuthInitialization(currentPath)) {
    return { restored: false, role: null };
  }

  storage.init();

  // Determine if current path is agent or client
  const isAgentPath = currentPath.startsWith('/agent');

  // Check if session already exists in sessionStorage
  const sessionRole = storage.getSession('role');
  const sessionAgent = storage.getSession('agent');
  const sessionUserId = storage.getSession('userId');

  // If session exists and matches current path, all good
  if (sessionRole) {
    const isSessionAgent = sessionRole === 'agent';
    const hasRequiredSessionData = isSessionAgent ? !!sessionAgent : !!sessionUserId;
    if (hasRequiredSessionData && isSessionAgent === isAgentPath) {
      console.log('✅ Session valid - continuing as:', sessionRole);
      return { restored: true, role: sessionRole };
    }
  }

  // Session missing or mismatched - need to restore or clear
  console.log('⚠️ Session mismatch or missing - path is agent?', isAgentPath);

  // Clear old session data to prevent auto-login as wrong user
  storage.clearAllSession();

  // Try to validate cookies match current path
  try {
    const tokenValidation = await validateTokenWithBackend(
      isAgentPath ? 'agent' : 'client',
    );

    if (!tokenValidation.valid) {
      // No valid token - redirect to appropriate login
      return {
        restored: false,
        role: null,
        action: 'redirect-to-login',
        loginPath: isAgentPath ? '/agent-login' : '/login'
      };
    }

    // Token is valid - restore session based on token type
    const role = tokenValidation.role === 'agent' ? 'agent' : 'client';

    // Verify token role matches path
    if ((role === 'agent') !== isAgentPath) {
      console.warn('🔴 Token role mismatch! Clearing and redirecting to login');
      // Token is for wrong user type - logout
      await clearAuthData();
      return {
        restored: false,
        role: null,
        action: 'redirect-to-login',
        loginPath: isAgentPath ? '/agent-login' : '/login'
      };
    }

    // Restore session with validated data
    restoreValidatedSession({ ...tokenValidation, role });
    dispatchAuthStorageSync();

    console.log('✅ Session restored from cookies as:', role);
    return { restored: true, role };

  } catch (error) {
    console.error('Auth validation error:', error);
    // On error, assume not logged in
    await clearAuthData();
    return {
      restored: false,
      role: null,
      action: 'redirect-to-login',
      loginPath: isAgentPath ? '/agent-login' : '/login'
    };
  }
};

const isLocalRuntime = () => {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local');
};

const getBackendValidateTokenUrl = () => {
  const rawBase = process.env.NEXT_PUBLIC_API_HOST?.trim();
  if (!rawBase) return null;

  const base = rawBase.replace(/\/+$/, '');
  return base.endsWith('/api') ? `${base}/validate-token` : `${base}/api/validate-token`;
};

// Helper to validate token with backend
const validateTokenWithBackend = async (portal: AuthRole): Promise<TokenValidation> => {

  const cookieStore = await cookies();

  const token =
    portal === 'agent'
      ? cookieStore.get('AGENT_TOKEN')?.value
      : cookieStore.get('CLIENT_TOKEN')?.value;

  console.log('Validating token for portal:', portal, 'Token found:', !!token);

  try {
    const response = isLocalRuntime()
      ? await fetch(`/api/auth/validate?portal=${portal}`, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      }) : await (async () => {
        const validateUrl = getBackendValidateTokenUrl();

        if (!validateUrl) return null;

        return fetch(validateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ portal }),
        });
      })();

    if (!response) return { valid: false };

    if (!response.ok) return { valid: false };

    const data = await response.json();
    return {
      valid: data.valid !== false,
      role: data.role === 'agent' ? 'agent' : 'client',
      agent: data.agent,
      userId: data.userId,
      humanAgentId: data.humanAgentId,
      currentAgentId: data.currentAgentId,
      agents: data.agents,
    };
  } catch {
    return { valid: false };
  }
};

const normalizeId = (value: any) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value?.toString === 'function') return value.toString();
  return String(value);
};

const restoreValidatedSession = (session: TokenValidation & { role: AuthRole }) => {
  storage.setSession('role', session.role);

  if (session.userId) {
    storage.setSession('userId', normalizeId(session.userId));
  }

  if (session.agents) {
    storage.setSessionJSON('agents', session.agents);
  }

  if (session.currentAgentId) {
    storage.setSession('currentAgentId', normalizeId(session.currentAgentId));
  } else if (session.agents?.[0]?._id) {
    storage.setSession('currentAgentId', normalizeId(session.agents[0]._id));
  }

  if (session.agent) {
    const humanAgentId = normalizeId(
      session.humanAgentId || session.agent._id || session.agent.id,
    );
    storage.setSessionJSON('agent', { ...session.agent, _id: humanAgentId });
    if (humanAgentId) storage.setSession('humanAgentId', humanAgentId);
  }
};

// Clear all auth data
export const clearAuthData = async () => {
  storage.clearAllSession();
  dispatchAuthStorageSync();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch { }
};