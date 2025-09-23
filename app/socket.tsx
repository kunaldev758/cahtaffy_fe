import { io, Socket } from "socket.io-client";

interface SocketOptions {
  token?: string;
  visitorId?:string,
  widgetAuthToken?:string,
  widgetId?:string,
  userId?: string,
}

const initializeSocket = (options: SocketOptions): Socket => {
  const socket = io(process.env.NEXT_PUBLIC_SOCKET_HOST as string, {
    query: options,
    transports: ["websocket", "polling"], // Ensure compatibility
  });
  socket.on("connect_error", (err) => {
    console.error("Connection error:", err);
  });
  
  socket.on("connect_timeout", () => {
    console.error("Connection timeout.");
  });
  

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);

  });
  socket.on("disconnect", () => {
    console.log("Socket disconnected.");
  });

  return socket;
};

export default initializeSocket;