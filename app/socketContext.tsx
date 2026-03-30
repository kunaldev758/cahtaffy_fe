"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);