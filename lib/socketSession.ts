/**
 * Socket.IO auth uses query params (not httpOnly cookies).
 * Session storage holds the JWT for the socket handshake until cookies are readable.
 */

import type { AuthPortal } from "./authCookies";

export const CLIENT_SOCKET_TOKEN_KEY = "chataffy-client-socket-token";
export const AGENT_SOCKET_TOKEN_KEY = "chataffy-agent-socket-token";

export function setSocketToken(portal: AuthPortal, token: string) {
  if (typeof window === "undefined" || !token) return;
  const key =
    portal === "agent" ? AGENT_SOCKET_TOKEN_KEY : CLIENT_SOCKET_TOKEN_KEY;
  sessionStorage.setItem(key, token);
}

export function getSocketTokenFromSession(portal: AuthPortal): string {
  if (typeof window === "undefined") return "";
  const key =
    portal === "agent" ? AGENT_SOCKET_TOKEN_KEY : CLIENT_SOCKET_TOKEN_KEY;
  return sessionStorage.getItem(key) || "";
}

export function clearSocketToken(portal: AuthPortal) {
  if (typeof window === "undefined") return;
  const key =
    portal === "agent" ? AGENT_SOCKET_TOKEN_KEY : CLIENT_SOCKET_TOKEN_KEY;
  sessionStorage.removeItem(key);
}

export function clearAllSocketTokens() {
  clearSocketToken("client");
  clearSocketToken("agent");
}

/** Resolve HumanAgent _id for socket query (never use AI Agent id as humanAgentId). */
export function resolveHumanAgentIdForSocket(portal: AuthPortal): string | undefined {
  if (typeof window === "undefined") return undefined;

  if (portal === "agent") {
    const stored = sessionStorage.getItem("humanAgentId");
    if (stored) return stored;
    const agentRaw = sessionStorage.getItem("agent");
    if (agentRaw) {
      try {
        const parsed = JSON.parse(agentRaw) as { id?: string; _id?: string };
        const id = parsed?.id || parsed?._id;
        if (id) return String(id);
      } catch {
        /* ignore */
      }
    }
    return undefined;
  }

  const stored = sessionStorage.getItem("humanAgentId");
  if (stored) return stored;

  const clientAgentRaw = sessionStorage.getItem("clientAgent");
  if (clientAgentRaw) {
    try {
      const parsed = JSON.parse(clientAgentRaw) as { id?: string; _id?: string };
      const id = parsed?.id || parsed?._id;
      if (id) return String(id);
    } catch {
      /* ignore */
    }
  }

  return undefined;
}
