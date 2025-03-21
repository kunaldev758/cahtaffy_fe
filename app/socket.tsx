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
    forceNew: true, // Prevent connection reuse
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

    // Join the user's room after successful connection
    if (options.userId) {
      socket.emit('join', options.userId);
      console.log(`Attempting to join room for user: ${options.userId}`);
    }

  socket.on("disconnect", () => {
    console.log("Socket disconnected.");
  });

  return socket;
};

export default initializeSocket;