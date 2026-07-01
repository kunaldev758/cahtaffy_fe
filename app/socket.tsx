import { io, Socket } from "socket.io-client";

/** Auto-end widget conversations after this much continuous visitor away time. */
export const VISITOR_AWAY_TIMEOUT_MS = 5 * 60 * 1000;

interface SocketOptions {
  token?: string;
  visitorId?:string,
  widgetAuthToken?:string,
  widgetId?:string,
  userId?: string,
  agentId?: string,
  humanAgentId?: string,
}

export interface WidgetSocketQuery {
  widgetId: string;
  widgetAuthToken: string;
  agentId?: string | null;
  visitorId?: string | null;
}

const attachSocketLifecycleLogs = (socket: Socket) => {
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
};

const initializeSocket = (options: SocketOptions): Socket => {
  const socket = io(process.env.NEXT_PUBLIC_SOCKET_HOST as string, {
    query: options,
    transports: ["websocket", "polling"], // Ensure compatibility
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    timeout: 20000,
  });
  attachSocketLifecycleLogs(socket);
  return socket;
};

/** Widget iframe socket — stays connected while the visitor is away (< 5 min). */
export const createWidgetSocket = (
  host: string,
  query: WidgetSocketQuery,
): Socket => {
  const socket = io(host, {
    query: {
      widgetId: query.widgetId,
      widgetAuthToken: query.widgetAuthToken,
      agentId: query.agentId || undefined,
      visitorId: query.visitorId || undefined,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    timeout: 20000,
  });
  attachSocketLifecycleLogs(socket);
  return socket;
};

export default initializeSocket;