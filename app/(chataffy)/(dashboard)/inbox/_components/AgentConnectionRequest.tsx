"use client";
import { CheckCircle, XCircle } from "lucide-react";
import { Socket } from 'socket.io-client';

interface AgentConnectionRequestProps {
  conversationId: string;
  visitorName?: string;
  socketRef: React.RefObject<Socket | null>;
  onAccept: () => void;
  onDecline: () => void;
}

export default function AgentConnectionRequest({
  conversationId,
  visitorName,
  socketRef,
  onAccept,
  onDecline,
}: AgentConnectionRequestProps) {
  const handleAccept = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("accept-agent-connection", { conversationId }, (response: any) => {
      if (response?.success) {
        onAccept();
      } else {
        console.error("Failed to accept agent connection:", response?.error);
      }
    });
  };

  const handleDecline = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("decline-agent-connection", { conversationId }, (response: any) => {
      if (response?.success) {
        onDecline();
      } else {
        console.error("Failed to decline agent connection:", response?.error);
      }
    });
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-semibold text-blue-900">
              Agent Connection Request
            </h3>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            {visitorName ? `${visitorName} requested to connect to an agent` : "Visitor requested to connect to an agent"}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAccept}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Accept</span>
            </button>
            <button
              onClick={handleDecline}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              <XCircle className="w-4 h-4" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

