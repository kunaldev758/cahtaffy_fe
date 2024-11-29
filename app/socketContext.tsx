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

  useEffect(() => {
    // Ensure localStorage is accessed on the client side only
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []); // Runs only once when the component mounts

  useEffect(() => {
    if (token) {
      console.log(token, "This is token");

      const socketInstance = initializeSocket({
        token,
        embedType: "openai",
        // widgetId: localStorage.getItem("widgetId"),
        // widgetAuthToken: localStorage.getItem("widgetAuthToken"), 
        // visitorId: localStorage.getItem("openaiVisitorId"),
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [token]); // Runs when the token is set

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);