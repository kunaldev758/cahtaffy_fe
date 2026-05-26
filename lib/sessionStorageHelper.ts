/**
 * Universal Storage Wrapper
 * - Uses sessionStorage for sensitive auth data (isolated per tab)
 * - Uses localStorage for non-sensitive app data
 * - Automatic migration from localStorage on first load
 */

const SESSION_KEYS = {
  // Sensitive auth data - use sessionStorage
  agent: 'agent',
  agents: 'agents',
  currentAgentId: 'currentAgentId',
  humanAgentId: 'humanAgentId',
  userId: 'userId',
  role: 'role',
  token: 'token',
} as const;

const LOCAL_KEYS = {
  // Non-sensitive data - can stay in localStorage
  theme: 'theme',
  preferences: 'preferences',
} as const;

type SessionKey = keyof typeof SESSION_KEYS;
type LocalKey = keyof typeof LOCAL_KEYS;

class StorageManager {
  private migrated = false;

  /**
   * Initialize: Migrate old localStorage data to sessionStorage on first load
   * Run this once in your root layout
   */
  init() {
    if (this.migrated || typeof window === 'undefined') return;
    this.migrated = true;

    // Migrate session auth data from localStorage to sessionStorage
    Object.entries(SESSION_KEYS).forEach(([key, value]) => {
      const oldValue = localStorage.getItem(value);
      if (oldValue && !sessionStorage.getItem(value)) {
        console.log(`🔄 Migrating ${value} to sessionStorage`);
        sessionStorage.setItem(value, oldValue);
        localStorage.removeItem(value);
      }
    });

    console.log('✅ Storage initialization complete');
  }

  // ===== SESSION STORAGE (Auth Data) =====
  getSession(key: SessionKey): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(SESSION_KEYS[key]);
  }

  setSession(key: SessionKey, value: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(SESSION_KEYS[key], value);
  }

  removeSession(key: SessionKey): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SESSION_KEYS[key]);
  }

  getSessionJSON<T>(key: SessionKey): T | null {
    if (typeof window === 'undefined') return null;
    const value = sessionStorage.getItem(SESSION_KEYS[key]);
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  setSessionJSON<T>(key: SessionKey, value: T): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(SESSION_KEYS[key], JSON.stringify(value));
  }

  clearAllSession(): void {
    if (typeof window === 'undefined') return;
    Object.values(SESSION_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  }

  // ===== LOCAL STORAGE (App Data) =====
  getLocal(key: LocalKey): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LOCAL_KEYS[key]);
  }

  setLocal(key: LocalKey, value: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_KEYS[key], value);
  }

  removeLocal(key: LocalKey): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOCAL_KEYS[key]);
  }

  getLocalJSON<T>(key: LocalKey): T | null {
    if (typeof window === 'undefined') return null;
    const value = localStorage.getItem(LOCAL_KEYS[key]);
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  setLocalJSON<T>(key: LocalKey, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_KEYS[key], JSON.stringify(value));
  }

  // ===== HELPERS =====
  isAuthenticated(): boolean {
    return !!(this.getSession('token') || this.getSession('role'));
  }

  getAuthRole(): 'agent' | 'client' | null {
    const role = this.getSession('role');
    return role as any || null;
  }

  clearAll(): void {
    this.clearAllSession();
    Object.values(LOCAL_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const storage = new StorageManager();

