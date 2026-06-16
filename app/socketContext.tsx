"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import initializeSocket from "./socket";
import { Socket } from "socket.io-client";
import { getClientToken, getAgentToken } from "./_api/dashboard/action";
import { portalFromHostname, type AuthPortal } from "@/lib/authCookies";
import {
  getSocketTokenFromSession,
  resolveHumanAgentIdForSocket,
} from "@/lib/socketSession";
import { usePathname } from "next/navigation";

interface SocketContextProps {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
});

export const AUTH_STORAGE_SYNC_EVENT = "chataffy-auth-storage-sync";

export function dispatchAuthStorageSync() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_STORAGE_SYNC_EVENT));
  }
}

async function resolveSocketToken(portal: AuthPortal): Promise<string> {
  if (portal === "agent") {
    const fromSession = getSocketTokenFromSession("agent");
    if (fromSession) return fromSession;
    return (await getAgentToken()) || "";
  }
  const fromCookie = await getClientToken();
  if (fromCookie) return fromCookie;
  return getSocketTokenFromSession("client");
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [humanAgentId, setHumanAgentId] = useState<string | null>(null);
  const lastHumanAgentProfileSocketKey = useRef<string>("");

  const pathname = usePathname()

  const readAndSetIdentifiers = async () => {
    const portal: AuthPortal =
      typeof window !== "undefined"
        ? portalFromHostname(window.location.hostname) === "agent"
          ? "agent"
          : pathname.includes("agent")
            ? "agent"
            : "client"
        : "client";

    const storedToken = (await resolveSocketToken(portal)) || "";
    const storedUserId = sessionStorage.getItem("userId");
    const storedAgentId = sessionStorage.getItem("currentAgentId");
    const resolvedHumanAgentId = resolveHumanAgentIdForSocket(portal);

    setToken(storedToken);
    setUserId(storedUserId);
    setAgentId(storedAgentId);
    setHumanAgentId(resolvedHumanAgentId ?? null);
  };

  useEffect(() => {
    readAndSetIdentifiers();

    const syncFromStorage = () => readAndSetIdentifiers();
    window.addEventListener(AUTH_STORAGE_SYNC_EVENT, syncFromStorage);

    const handleAgentChanged = (event: CustomEvent) => {
      const newAgentId = event.detail?.agentId ?? sessionStorage.getItem("currentAgentId");
      setAgentId(newAgentId);
    };

    window.addEventListener("agent-changed", handleAgentChanged as EventListener);
    return () => {
      window.removeEventListener(AUTH_STORAGE_SYNC_EVENT, syncFromStorage);
      window.removeEventListener("agent-changed", handleAgentChanged as EventListener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token || !userId) {
      setSocket(null);
      return;
    }

    const socketInstance = initializeSocket({
      token,
      userId,
      agentId: agentId || undefined,
      humanAgentId: humanAgentId || undefined,
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, userId, agentId, humanAgentId]);

  useEffect(() => {
    if (!socket) return;

    const normalizeId = (v: unknown): string => {
      if (v == null || v === "") return "";
      if (typeof v === "string") return v;
      if (typeof v === "object" && v !== null) {
        const o = v as { toString?: () => string; toHexString?: () => string; _id?: unknown; $oid?: unknown };
        if (typeof o.toHexString === "function") return o.toHexString();
        if (typeof o.toString === "function" && o.constructor?.name === "ObjectId") return o.toString();
        if ("$oid" in o && o.$oid != null) return String(o.$oid);
        if (o._id !== undefined) return normalizeId(o._id);
      }
      return String(v);
    };

    const mergeAssigned = (arr: unknown, fallback: unknown): unknown => {
      if (!Array.isArray(arr)) return fallback;
      return arr.map((x) => normalizeId(x)).filter(Boolean);
    };

    const applyHumanAgentProfileFromSocket = (updatedAgent: Record<string, unknown>) => {
      try {
        const raw = sessionStorage.getItem("agent");
        if (!raw) return;
        const current = JSON.parse(raw) as Record<string, unknown>;
        if (current.isClient) return;

        const selfId = normalizeId(current.id ?? current._id);
        const updId = normalizeId(updatedAgent.id ?? updatedAgent._id);
        if (!selfId || !updId || selfId !== updId) return;

        const dedupeKey = `${updId}:${JSON.stringify(updatedAgent.assignedAgents)}:${String(updatedAgent.name)}:${String(updatedAgent.isActive)}:${String(updatedAgent.status)}:${String(updatedAgent.avatar)}`;
        if (lastHumanAgentProfileSocketKey.current === dedupeKey) return;
        lastHumanAgentProfileSocketKey.current = dedupeKey;

        const nextAssigned =
          updatedAgent.assignedAgents != null
            ? mergeAssigned(updatedAgent.assignedAgents, current.assignedAgents)
            : current.assignedAgents;

        const updatedAgentData = {
          ...current,
          name: updatedAgent.name ?? current.name,
          email: updatedAgent.email ?? current.email,
          isActive: updatedAgent.isActive ?? current.isActive,
          lastActive:
            updatedAgent.lastActive !== undefined ? updatedAgent.lastActive : current.lastActive,
          avatar: updatedAgent.avatar !== undefined ? updatedAgent.avatar : current.avatar,
          status: updatedAgent.status ?? current.status,
          assignedAgents: nextAssigned,
        };

        sessionStorage.setItem("agent", JSON.stringify(updatedAgentData));

        const ids = ((updatedAgentData.assignedAgents as string[]) || []).map((x) => String(x));
        const cur = sessionStorage.getItem("currentAgentId");
        if (cur && ids.length > 0 && !ids.includes(cur)) {
          const next = ids[0];
          sessionStorage.setItem("currentAgentId", next);
          window.dispatchEvent(new CustomEvent("agent-changed", { detail: { agentId: next } }));
        }

        window.dispatchEvent(new CustomEvent("agent-status-updated"));
      } catch (e) {
        console.error("applyHumanAgentProfileFromSocket:", e);
      }
    };

    socket.on("human-agent-status-updated", applyHumanAgentProfileFromSocket);
    socket.on("agent-status-updated", applyHumanAgentProfileFromSocket);
    return () => {
      socket.off("human-agent-status-updated", applyHumanAgentProfileFromSocket);
      socket.off("agent-status-updated", applyHumanAgentProfileFromSocket);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket(): SocketContextProps {
  return useContext(SocketContext);
}
