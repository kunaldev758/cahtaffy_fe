const AUTH_STORAGE_KEYS = [
  "token",
  "role",
  "agent",
  "userId",
  "humanAgentId",
  "currentAgentId",
  "clientAgent",
  "client",
  "user",
  "agents",
] as const;

/** Removes app auth keys only (keeps e.g. visitorId for the widget). */
export function clearAuthLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    for (const key of AUTH_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
