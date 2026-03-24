"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Bot } from "lucide-react";
import { useSocket } from "@/app/socketContext";
import { useRouter, usePathname } from "next/navigation";

interface NotificationItem {
  _id: string;
  message: string;
  type: string;
  isSeen: boolean;
  createdAt: string;
  conversationId:
    | {
        _id: string;
        visitor?: any;
      }
    | string;
  visitorId?: {
    visitorDetails?: Array<{ field: string; value: string }>;
  };
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "JUST NOW";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}M AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}D AGO`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}W AGO`;
  const months = Math.floor(days / 30);
  return `${months}MO AGO`;
}

function getVisitorName(notif: NotificationItem): string {
  const details = notif.visitorId?.visitorDetails;
  if (!details) return "Visitor";
  const nameField = details.find((d) => d.field === "Name");
  return nameField?.value || "Visitor";
}

function getConversationId(notif: NotificationItem): string {
  if (typeof notif.conversationId === "string") return notif.conversationId;
  return notif.conversationId?._id || "";
}

function getInboxPath(pathname: string): string {
  if (pathname?.includes("/agent-inbox")) return "/agent-inbox";
  return "/inbox";
}

type NotificationBellProps = {
  /** Top bar mock uses a dot; inbox-style header can use numeric badge */
  badgeStyle?: "count" | "dot";
};

export default function NotificationBell({ badgeStyle = "count" }: NotificationBellProps) {
  const { socket } = useSocket();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [humanAgentId, setHumanAgentId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const seenDedup = useRef(new Set<string>());
  // Timestamp of when the dropdown was last opened – used to prevent click-through
  // where a click on the bell causes the first notification item to also receive the click.
  const openedAtRef = useRef<number>(0);

  const unseen = notifications.filter((n) => !n.isSeen);
  const unseenCount = unseen.length;

  // Resolve humanAgentId from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("humanAgentId");
    if (stored) { setHumanAgentId(stored); return; }
    try {
      const agentRaw = localStorage.getItem("agent");
      if (agentRaw) {
        const parsed = JSON.parse(agentRaw);
        const id = parsed?.id || parsed?._id;
        if (id) { setHumanAgentId(id); return; }
      }
    } catch {}
    try {
      const clientRaw = localStorage.getItem("clientAgent");
      if (clientRaw) {
        const parsed = JSON.parse(clientRaw);
        if (parsed?._id) { setHumanAgentId(parsed._id); return; }
      }
    } catch {}
  }, []);

  const apiBase = `${process.env.NEXT_PUBLIC_API_HOST || ""}/api/`;

  // Fetch notifications from REST API and merge with any existing optimistic entries.
  // If the API returns an empty array we deliberately keep the current state so that
  // real-time optimistic entries (added via socket events) are never wiped out.
  const fetchNotifications = useCallback(async () => {
    if (!humanAgentId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${apiBase}notifications/agent/${humanAgentId}`,
        { headers: { Authorization: token || "" } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return; // keep existing state

      setNotifications((prev) => {
        // Collect conversationIds already covered by the API response so we don't
        // duplicate optimistic entries that now have a real DB record.
        const apiConvIds = new Set(
          data.map((n: any) => {
            const cid = n.conversationId;
            return (typeof cid === "string" ? cid : cid?._id)?.toString() ?? "";
          })
        );
        // Keep optimistic entries whose conversation is NOT yet in the API response
        const orphaned = prev.filter(
          (n) =>
            n._id.startsWith("tmp-") &&
            !apiConvIds.has(
              (typeof n.conversationId === "string"
                ? n.conversationId
                : "")?.toString() ?? ""
            )
        );
        return [...data, ...orphaned];
      });
    } catch {}
  }, [humanAgentId, apiBase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time agent connection notifications via socket
  useEffect(() => {
    if (!socket) return;

    const handleNew = (data: any) => {
      const convId = data?.conversationId?.toString?.() || data?.conversationId || "";
      if (convId && seenDedup.current.has(convId)) return;
      if (convId) {
        seenDedup.current.add(convId);
        setTimeout(() => seenDedup.current.delete(convId), 3000);
      }
      // Build an optimistic notification entry so it appears immediately
      const optimistic: NotificationItem = {
        _id: `tmp-${Date.now()}`,
        message: data?.message || "Visitor requested to connect to an agent",
        type: "agent-connection-request",
        isSeen: false,
        createdAt: new Date().toISOString(),
        conversationId: convId,
        visitorId: data?.visitor ? { visitorDetails: data.visitor?.visitorDetails } : undefined,
      };
      setNotifications((prev) => [optimistic, ...prev]);
    };

    socket.on("agent-connection-notification", handleNew);
    return () => {
      socket.off("agent-connection-notification", handleNew);
    };
  }, [socket]);

  // Also listen to the custom window event dispatched by useSocketManager
  useEffect(() => {
    const handleWindowEvent = (e: Event) => {
      const data = (e as CustomEvent).detail;
      const convId = data?.conversationId?.toString?.() || data?.conversationId || "";
      if (convId && seenDedup.current.has(convId)) return;
      if (convId) {
        seenDedup.current.add(convId);
        setTimeout(() => seenDedup.current.delete(convId), 3000);
      }
      const optimistic: NotificationItem = {
        _id: `tmp-${Date.now()}`,
        message: data?.message || "Visitor requested to connect to an agent",
        type: "agent-connection-request",
        isSeen: false,
        createdAt: new Date().toISOString(),
        conversationId: convId,
        visitorId: data?.visitor ? { visitorDetails: data.visitor?.visitorDetails } : undefined,
      };
      setNotifications((prev) => [optimistic, ...prev]);
    };

    window.addEventListener("agent-connection-notification", handleWindowEvent);
    return () => window.removeEventListener("agent-connection-notification", handleWindowEvent);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAsSeen = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isSeen: true } : n))
    );
    if (id.startsWith("tmp-")) return; // optimistic entries have no DB id yet
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${apiBase}notifications/${id}/seen`,
        { method: "PUT", headers: { Authorization: token || "" } }
      );
    } catch {}
  };

  const markAllSeen = async () => {
    if (!humanAgentId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isSeen: true })));
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${apiBase}notifications/agent/${humanAgentId}/seen-all`,
        { method: "PUT", headers: { Authorization: token || "" } }
      );
    } catch {}
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    // Ignore clicks that happen within 300 ms of the dropdown opening.
    // This prevents the bell-click event from "falling through" onto the first
    // notification item when it renders right beneath the cursor.
    if (Date.now() - openedAtRef.current < 300) return;

    await markAsSeen(notif._id);
    setIsOpen(false);
    const convId = getConversationId(notif);
    if (!convId) return;
    const inboxPath = getInboxPath(pathname || "");
    router.push(`${inboxPath}?conversationId=${convId}`);
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => {
          const opening = !isOpen;
          setIsOpen((prev) => !prev);
          if (opening) {
            openedAtRef.current = Date.now();
            fetchNotifications();
          }
        }}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-[#fff] hover:bg-gray-100 transition-colors"
        aria-label={
          unseenCount > 0
            ? `Notifications, ${unseenCount} unread`
            : "Notifications"
        }
      >
        <Bell className="w-4 h-4 text-[#64748B]" />
        {unseenCount > 0 && badgeStyle === "dot" && (
          <span
            className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
            aria-hidden
          />
        )}
        {unseenCount > 0 && badgeStyle === "count" && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unseenCount > 99 ? "99+" : unseenCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[360px] rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-[15px] font-bold text-[#111827]">Notification</span>
            <div className="flex items-center gap-2">
              {unseenCount > 0 && (
                <span className="text-xs font-semibold text-[#7C3AED] bg-[#EDE9FE] px-2.5 py-0.5 rounded-full">
                  {unseenCount} New
                </span>
              )}
              {unseenCount > 0 && (
                <button
                  type="button"
                  onClick={markAllSeen}
                  className="text-xs text-[#94A3B8] hover:text-[#4B56F2] transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const visitorName = getVisitorName(notif);
                return (
                  <button
                    key={notif._id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors ${
                      !notif.isSeen ? "bg-[#FAFAFF]" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#EDE9FE]">
                      <Bot className="w-5 h-5 text-[#7C3AED]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[13px] font-semibold text-[#111827] truncate">
                          Agent Connection Request
                        </span>
                        <span className="text-[11px] text-[#94A3B8] whitespace-nowrap shrink-0">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#64748B] leading-snug line-clamp-2">
                        <span className="font-semibold text-[#374151]">{visitorName}</span>{" "}
                        requested to connect to an agent
                      </p>
                    </div>

                    {/* Unseen dot */}
                    {!notif.isSeen && (
                      <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-[#7C3AED]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  fetchNotifications();
                }}
                className="text-xs text-[#4B56F2] hover:underline font-medium"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
