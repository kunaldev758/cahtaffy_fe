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
    // Ensure localStorage is accessed on the client side only
    readAndSetIdentifiers();

    // Re-read agentId whenever it is updated from onboarding or agent switching
    const handleAgentChanged = (event: CustomEvent) => {
      const newAgentId = event.detail?.agentId ?? localStorage.getItem("currentAgentId");
      setAgentId(newAgentId);
    };

    window.addEventListener("agent-changed", handleAgentChanged as EventListener);
    return () => {
      window.removeEventListener("agent-changed", handleAgentChanged as EventListener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs only once when the component mounts
console.log(agentId,humanAgentId,"agentId and humanAgentId");
  useEffect(() => {
    if (token && userId) {
      console.log(token, `This is token  userId: ${userId}`);

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
    }
  }, [token,userId,agentId,humanAgentId]); // Runs when the token is set

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);