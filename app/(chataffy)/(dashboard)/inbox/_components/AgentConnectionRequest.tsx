"use client";
import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { Socket } from "socket.io-client";

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
  const [countdown, setCountdown] = useState(20);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCountdown(20);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          countdownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  // Auto-dismiss card when countdown expires
  useEffect(() => {
    if (countdown === 0) {
      onDecline();
    }
  }, [countdown, onDecline]);

  const handleAccept = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("accept-agent-connection", { conversationId }, (response: any) => {
      if (response?.success) onAccept();
      else console.error("Failed to accept agent connection:", response?.error);
    });
  };

  const handleDecline = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("decline-agent-connection", { conversationId }, (response: any) => {
      if (response?.success) onDecline();
      else console.error("Failed to decline agent connection:", response?.error);
    });
  };

  return (
    <div className="absolute top-14 right-4 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Red urgency dot */}
      <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500" />

      <div className="p-4">
        {/* Title */}
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-900">
            Agent Connection Request
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-2 leading-snug">
          <span className="font-semibold text-gray-900">
            {visitorName || "Visitor"}
          </span>{" "}
          requested to connect to an agent
        </p>

        {/* Countdown */}
        <p className="text-sm text-gray-500 mb-4">
          Time remaining:{" "}
          <span
            className={`font-bold ${
              countdown <= 5 ? "text-red-500" : "text-blue-600"
            }`}
          >
            {countdown}s
          </span>
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Accept
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-gray-800 text-sm font-medium rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
