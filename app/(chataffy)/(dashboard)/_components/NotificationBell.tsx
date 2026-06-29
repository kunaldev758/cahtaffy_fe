"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Bell, Bot, RefreshCcw } from "lucide-react";
import { useSocket } from "@/app/socketContext";
import { useRouter, usePathname } from "next/navigation";
import { getToken, getAgentToken } from "@/app/_api/dashboard/action";
import { isAgentPath } from "@/lib/portalUrls";
import { handleSessionExpired } from "@/lib/sessionExpired";
import { Skeleton } from "@/components/ui/skeleton";
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
  agentId?: string;
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
  if (details?.length) {
    const nameField = details.find(
      (d) => d.field?.trim().toLowerCase() === "name"
    );
    if (nameField?.value) return nameField.value;
  }
  const populatedName = (notif.visitorId as { name?: string } | undefined)?.name;
  if (populatedName) return populatedName;
  return "Visitor";
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

const globalSeenDedup = new Set<string>();

const apiBase = `${process.env.NEXT_PUBLIC_API_HOST || ""}/api/`;

export default function NotificationBell({ badgeStyle = "count" }: NotificationBellProps) {
  const { socket } = useSocket();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [humanAgentId, setHumanAgentId] = useState<string | null>(null);
  const [isAgentLogin, setIsAgentLogin] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const seenDedup = useRef(new Set<string>());
  // Timestamp of when the dropdown was last opened – used to prevent click-through
  // where a click on the bell causes the first notification item to also receive the click.
  const openedAtRef = useRef<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const isFetchingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasMore = useRef(true);
  const page = useRef(1);

  const unseenCount = useMemo(
    () => notifications.filter((n) => !n.isSeen).length,
    [notifications]
  );

  // Resolve humanAgentId from sessionStorage and detect if agent or client login
  useEffect(() => {
    // Check if this is an agent login
    const agentRaw = sessionStorage.getItem("agent");
    // const isAgent = agentRaw && agentRaw !== 'null' && agentRaw !== 'undefined';

    // ✅ PRIMARY: URL-based detection
    const pathBasedIsAgent = isAgentPath(window.location.pathname);

    console.log("Path-based agent detection:", pathBasedIsAgent, "current path:", window.location.pathname);

    // ✅ FALLBACK: sessionStorage-based detection  
    const storageBasedIsAgent = agentRaw && agentRaw !== 'null' && agentRaw !== 'undefined';

    // ✅ COMBINED: Either condition = agent
    const isAgent = pathBasedIsAgent || storageBasedIsAgent;

    console.log("agent to be set : ", !!isAgent)

    console.log("is agent : ", isAgent, "pathBasedIsAgent:", pathBasedIsAgent, "storageBasedIsAgent:", storageBasedIsAgent, "agentRaw:", agentRaw);
    setIsAgentLogin(!!isAgent);


    const stored = sessionStorage.getItem("humanAgentId");
    if (stored) { setHumanAgentId(stored); return; }
    try {
      if (agentRaw) {
        const parsed = JSON.parse(agentRaw);
        const id = parsed?.id || parsed?._id;
        if (id) { setHumanAgentId(id); return; }
      }
    } catch { }
    try {
      const clientRaw = sessionStorage.getItem("clientAgent");
      if (clientRaw) {
        const parsed = JSON.parse(clientRaw);
        if (parsed?._id) { setHumanAgentId(parsed._id); return; }
      }
    } catch { }
  }, []);

  // const apiBase = `${process.env.NEXT_PUBLIC_API_HOST || ""}/api/`;

  // console.log("api base url  : ",apiBase);

  // Get the correct token based on login type
  const getCorrectToken = useCallback(async () => {
    if (isAgentLogin) {
      return await getAgentToken() || '';
    } else {
      return await getToken() || '';
    }
  }, [isAgentLogin]);


  

  // Fetch notifications from REST API and merge with any existing optimistic entries.
  // If the API returns an empty array we deliberately keep the current state so that
  // real-time optimistic entries (added via socket events) are never wiped out.
  const fetchNotifications = useCallback(async (reset = false) => {

    console.log("fetch notifications check: ",humanAgentId)

    let updatedHumanAgentId = humanAgentId ? humanAgentId : sessionStorage.getItem("humanAgentId");
    if (!updatedHumanAgentId) return;
    if (reset) {
      page.current = 1;
      hasMore.current = true;
      isFetchingRef.current = false;
    }
    try {
      const token = await getCorrectToken();
      if (!token) {
        console.warn("No token available for fetching notifications");
        return;
      }

      const currentPage = page.current;
      const res = await fetch(
        `${apiBase}notifications/agent/${updatedHumanAgentId}?page=${currentPage}&limit=20`,
        { headers: { Authorization: token } }
      );

      if (!res.ok) {
        console.error("Failed to fetch notifications:", res.status, res.statusText);
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data?.data) || data?.data?.length === 0) {
        hasMore.current = false;
        return;
      }
      hasMore.current = data?.hasMore || false;
      if (hasMore.current) {
        page.current = currentPage + 1;
      }
      setNotifications((prev) => {
        // Collect conversationIds already covered by the API response so we don't
        // duplicate optimistic entries that now have a real DB record.
        const apiConvIds = new Set(
          data?.data?.map((n: any) => {
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
        return [...(data?.data || []), ...orphaned];
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [humanAgentId, apiBase, getCorrectToken]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchMoreNotifications = useCallback(async () => {

    let updatedHumanAgentId = humanAgentId ? humanAgentId : sessionStorage.getItem("humanAgentId");
    if (!updatedHumanAgentId || isFetchingRef.current || !hasMore.current) return;
    isFetchingRef.current = true;

    try {
      const token = await getCorrectToken();
      if (!token) {
        console.warn("No token available for fetching more notifications");
        return;
      }

      const res = await fetch(
        `${apiBase}notifications/agent/${updatedHumanAgentId}?page=${page.current}&limit=20`,
        { headers: { Authorization: token } }
      );
      if (!res.ok) {
        console.error("Failed to fetch more notifications data:", res.status);

        if (res?.status === 401) {
          await handleSessionExpired(pathname);
          return;
        }
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data?.data) || data.data.length === 0) {
        hasMore.current = false;
        return;
      }

      hasMore.current = data?.hasMore || false;
      page.current += 1;

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n._id));
        const newItems = data.data.filter(
          (n: NotificationItem) => !existingIds.has(n._id)
        );
        return [...prev, ...newItems];
      });
    } catch (err) {
      console.error("fetchMoreNotifications failed:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [humanAgentId, apiBase, getCorrectToken]);

  useEffect(() => {
    if (!bottomRef.current || !listRef.current || !isOpen) return;

    observer.current?.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreNotifications();
        }
      },
      {
        root: listRef.current,
        rootMargin: "0px 0px 120px 0px",
        threshold: 0.1,
      }
    );

    observer.current.observe(bottomRef.current);
    return () => observer.current?.disconnect();
  }, [fetchMoreNotifications, isOpen, notifications.length]);

  // Listen for real-time agent connection notifications via socket
  useEffect(() => {
    if (!socket) return;

    const handleNew = (data: any) => {
      const dedupKey =
        data?.requestStartedAt?.toString() ||
        data?.notificationId ||
        data?.conversationId ||
        "";

      if (dedupKey && globalSeenDedup.has(dedupKey)) return;
      if (dedupKey) {
        globalSeenDedup.add(dedupKey);
        setTimeout(() => globalSeenDedup.delete(dedupKey), 20000);
      }

      const convId = data?.conversationId?.toString?.() || "";

      const optimistic: NotificationItem = {
        _id: data?.notificationId ?? `tmp-${Date.now()}`,
        message: data?.message || "Visitor requested to connect to an agent",
        type: "agent-connection-request",
        isSeen: false,
        createdAt: new Date().toISOString(),
        conversationId: convId,
        visitorId: data?.visitor
          ? { visitorDetails: data.visitor?.visitorDetails }
          : undefined,
        agentId: data?.agentId
      };

      setNotifications((prev) => {
        const alreadyExists = data?.notificationId
          ? prev.some((n) => n._id === data.notificationId)
          : false;
        if (alreadyExists) return prev;
        return [optimistic, ...prev];
      });
    };

    socket.on("agent-connection-notification", handleNew);
    return () => {
      socket.off("agent-connection-notification", handleNew);
    };
}, [socket]);
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

  const markAsSeen = (id: string) => {
    if (id.startsWith("tmp-")) return; // skip optimistic entries

    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isSeen: true } : n))
    );

    void (async () => {
      try {
        const token = await getCorrectToken();
        await fetch(`${apiBase}notifications/${id}/seen`, {
          method: "PUT",
          headers: { Authorization: token },
        });
      } catch (error) {
        console.error("Error marking notification as seen:", error);
      }
    })();
  };

  const markAllSeen = async () => {
    if (!humanAgentId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isSeen: true })));
    try {
      const token = await getCorrectToken();
      if (!token) {
        console.warn("No token available for marking all notifications as seen");
        return;
      }

      const res = await fetch(
        `${apiBase}notifications/agent/${humanAgentId}/seen-all`,
        { method: "PUT", headers: { Authorization: token } }
      );

      if (!res.ok) {
        console.error("Failed to mark all notifications as seen:", res.status);
      }
    } catch (error) {
      console.error("Error marking all notifications as seen:", error);
    }
  };

  const handleRefreshNotifications = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    listRef.current?.scrollTo({ top: 0, behavior: "instant" });
    try {
      await fetchNotifications(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchNotifications]);

  const handleNotificationClick = (notif: NotificationItem) => {
    // Ignore clicks that happen within 300 ms of the dropdown opening.
    // This prevents the bell-click event from "falling through" onto the first
    // notification item when it renders right beneath the cursor.
    if (Date.now() - openedAtRef.current < 300) return;

    if (!notif.isSeen) {
      markAsSeen(notif._id);
    }
    const nextAgentId = notif.agentId;
    const currentAgentId = sessionStorage.getItem("currentAgentId");
    const didSwitchAgent = !!(nextAgentId && nextAgentId !== currentAgentId);
    if (didSwitchAgent) {
      window.dispatchEvent(
        new CustomEvent("agent-changed", { detail: { agentId: nextAgentId } })
      );
      sessionStorage.setItem("currentAgentId", nextAgentId);
    }
    setIsOpen(false);
    const convId = getConversationId(notif);
    if (!convId) return;
    const inboxPath = getInboxPath(pathname || "");

    const visitorName = getVisitorName(notif);
    const params = new URLSearchParams({ conversationId: convId });
    if (visitorName && visitorName !== "Visitor") {
      params.set("visitorName", visitorName);
    }
    const targetUrl = `${inboxPath}?${params.toString()}`;
    router.replace(targetUrl);

    const isAlreadyOnInbox = !!(pathname?.includes(inboxPath));
    if (isAlreadyOnInbox) {
      const emitConversationNavigate = () =>
        window.dispatchEvent(
          new CustomEvent("notification-navigate-to-conversation", {
            detail: { conversationId: convId, visitorName },
          })
        );

      setTimeout(emitConversationNavigate, didSwitchAgent ? 400 : 50);
    }
  };

  // useEffect(() => {
  //   console.log("Notifications updated:", notifications);
  //   unseen = notifications.filter((n) => !n.isSeen);
  //   unseenCount = unseen.length;
  // }, [notifications])

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
            // fetchNotifications(true);
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
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-[#111827]">
                Notification
              </span>
              <button
                type="button"
                className="cursor-pointer text-[#64748B] transition-colors hover:text-[#4B56F2] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Refresh notifications"
                onClick={handleRefreshNotifications}
                disabled={isRefreshing}
                title={isRefreshing ? "Refreshing notifications..." : "Refresh notifications"}
              >
                <RefreshCcw
                  className={`${isRefreshing ? "animate-spin" : ""}`}
                  size={14}
                />
              </button>
            </div>
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
          <div
            ref={listRef}
            className="max-h-[360px] overflow-y-auto divide-y divide-gray-50"
          >
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : isRefreshing ? (
              // skeleton loading
              <div className="flex flex-col gap-2">
                {
                  Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="w-full flex items-start gap-3 px-4 py-3.5">
                      <Skeleton className="flex-shrink-0 w-10 h-10 rounded-full bg-[#EDE9FE]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <Skeleton className="h-4 w-32 rounded" />
                          <Skeleton className="h-3 w-14 rounded" />
                        </div>
                        <Skeleton className="h-3 w-40 rounded my-1" />
                      </div>
                    </div>
                  ))
                }
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
                        <span className="font-semibold text-[#374151]">
                          {visitorName}
                        </span>{" "}
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

            <div ref={bottomRef} />
          </div>

          {/* Footer */}
          {/* {notifications.length > 0 && (
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
          )} */}
        </div>
      )}
    </div>
  );
}
