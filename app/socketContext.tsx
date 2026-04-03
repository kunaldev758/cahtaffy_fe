"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import initializeSocket from "./socket";
import { Socket } from "socket.io-client";

interface SocketContextProps {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
});

/** Fired after login/logout (or any auth localStorage change) so the provider re-reads storage and connects the socket. */
export const AUTH_STORAGE_SYNC_EVENT = "chataffy-auth-storage-sync";

export function dispatchAuthStorageSync() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_STORAGE_SYNC_EVENT));
  }
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [humanAgentId, setHumanAgentId] = useState<string | null>(null);
  const lastHumanAgentProfileSocketKey = useRef<string>("");

  const readAndSetIdentifiers = () => {
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    const storedAgentId = localStorage.getItem("currentAgentId");
    const storedHumanAgentId = localStorage.getItem("humanAgentId");
    const clientAgent = localStorage.getItem("clientAgent");
    const agent = localStorage.getItem("agent");

    if (storedHumanAgentId) {
      setHumanAgentId(storedHumanAgentId);
    } else if (agent) {
      try {
        const parsedAgent = JSON.parse(agent);
        if (parsedAgent?.id || parsedAgent?._id) {
          setHumanAgentId(parsedAgent.id || parsedAgent._id);
        }
      } catch {}
    } else if (clientAgent) {
      const parsedClientAgent = JSON.parse(clientAgent);
      setHumanAgentId(parsedClientAgent._id);
    } else {
      const agents = localStorage.getItem("agents");
      if (agents) {
        const parsedAgents = JSON.parse(agents);
        setHumanAgentId(parsedAgents[0]?._id);
      }
    }

    setToken(storedToken);
    setUserId(storedUserId);
    setAgentId(storedAgentId);
  };

  useEffect(() => {
    readAndSetIdentifiers();

    const syncFromStorage = () => readAndSetIdentifiers();
    window.addEventListener(AUTH_STORAGE_SYNC_EVENT, syncFromStorage);

    const handleAgentChanged = (event: CustomEvent) => {
      const newAgentId = event.detail?.agentId ?? localStorage.getItem("currentAgentId");
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

  // Keep human agent session storage in sync when an admin updates name / websites / status (socket payload must use plain string ids).
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
        const raw = localStorage.getItem("agent");
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

        localStorage.setItem("agent", JSON.stringify(updatedAgentData));

        const ids = ((updatedAgentData.assignedAgents as string[]) || []).map((x) => String(x));
        const cur = localStorage.getItem("currentAgentId");
        if (cur && ids.length > 0 && !ids.includes(cur)) {
          const next = ids[0];
          localStorage.setItem("currentAgentId", next);
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

export const useSocket = () => useContext(SocketContext);