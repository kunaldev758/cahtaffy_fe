

import { dispatchAuthStorageSync } from "@/app/socketContext";
import { storage } from "@/lib/sessionStorageHelper";

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

  // Session missing or mismatched — validate cookies before clearing UI session (avoids logged-out flash).
  console.log('⚠️ Session mismatch or missing - path is agent?', isAgentPath);

  try {
    const tokenValidation = await validateTokenWithBackend(
      isAgentPath ? 'agent' : 'client',
    );
    
    if (!tokenValidation.valid) {
      storage.clearAllSession();
      return {
        restored: false,
        role: null,
        action: 'redirect-to-login',
        loginPath: isAgentPath ? '/agent-login' : '/login'
      };
    }

    const role = tokenValidation.role === 'agent' ? 'agent' : 'client';
    
    if ((role === 'agent') !== isAgentPath) {
      console.warn('🔴 Token role mismatch! Clearing and redirecting to login');
      await clearAuthData();
      return {
        restored: false,
        role: null,
        action: 'redirect-to-login',
        loginPath: isAgentPath ? '/agent-login' : '/login'
      };
    }

    storage.clearAllSession();
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

// Validate via Next BFF: reads HttpOnly cookies server-side and forwards Bearer token to backend.
const validateTokenWithBackend = async (portal: AuthRole): Promise<TokenValidation> => {
  try {
    const response = await fetch(`/api/auth/validate?portal=${portal}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
  } catch {}
};