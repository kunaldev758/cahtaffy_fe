// hooks/useSocketManager.ts
import { useRef, useEffect, useCallback, useState } from "react";
import { Socket } from "socket.io-client";
import { useSocket } from "@/app/socketContext";
import { initializeAuthSession } from "@/lib/authInitializer";

// Dedup guard – prevents processing the same agent-connection-notification twice
// when the socket receives it due to backend room membership overlap.
const recentNotificationIds = new Set<string>();
const NOTIF_DEDUP_TTL_MS = 3000;

interface SocketManagerProps {
  // State setters
  setConversationMessages: (value: any) => void;
  setConversationsList: (value: any) => void;
  setSearchConversationsList: (value: any) => void;
  setNotesList: (value: any) => void;
  setOldConversationList: (value: any) => void;
  setTags: (value: any) => void;
  setOpenConversationStatus: (value: any) => void;
  setIsAIChat: (value: boolean) => void;
  setOpenConversationId: (value: any) => void;
  setIsConversationAvailable: (value: boolean) => void;
  setAITyping?: (value: boolean) => void;
  setIsVisitorClosed: (value: boolean) => void;
  setCurrentConversation: (value: any) => void;

  // Current state values
  status: string;
  rating: string;
  handledBy: string;
  openConversationId: string | null;
  openVisitorId: string | null;
  openVisitorIp?: string | null;
  isAIChat: boolean;
}
// const { socket } = useSocket();
export const useSocketManager = ({
  setConversationMessages,
  setConversationsList,
  setSearchConversationsList,
  setNotesList,
  setOldConversationList,
  setTags,
  setOpenConversationStatus,
  setIsAIChat,
  setOpenConversationId,
  setIsConversationAvailable,
  setAITyping,
  setIsVisitorClosed,
  setCurrentConversation,
  status,
  rating,
  handledBy,
  openConversationId,
  openVisitorId,
  openVisitorIp,
  isAIChat,
}: SocketManagerProps) => {
  const { socket } = useSocket();
  const socketRef = useRef<Socket | null>(null);
  socketRef.current = socket;

  const openConversationIdRef = useRef(openConversationId);
  openConversationIdRef.current = openConversationId;

  const lastSocketInstanceRef = useRef<Socket | null>(null);
  const [socketVersion, setSocketVersion] = useState(0);

  // Auth check on inbox mount (socket connection is owned by SocketProvider)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const authStatus = await initializeAuthSession(window.location.pathname);
        if (
          !cancelled &&
          !authStatus.restored &&
          authStatus.action === "redirect-to-login"
        ) {
          window.location.href = authStatus.loginPath;
        }
      } catch (error) {
        console.error("Error initializing auth session:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-run inbox handlers when SocketProvider creates a new socket instance
  useEffect(() => {
    if (socket !== lastSocketInstanceRef.current) {
      lastSocketInstanceRef.current = socket;
      if (socket) {
        setSocketVersion((v) => v + 1);
      }
    }
  }, [socket]);

  // Socket event handlers
  const setupMessageHandlers = useCallback(() => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    const handleAppendMessage = (data: any) => {
      const chatMsg = data?.chatMessage;
      if (chatMsg && (chatMsg.sender_type === 'ai' || chatMsg.sender_type === 'system')) {
        setAITyping?.(false);
      }
      if (chatMsg) {
        setConversationMessages((prev: any) => ({
          ...prev,
          data: [...prev.data, chatMsg],
        }));
      }
    };

    const handleIntermediateResponse = (data: any) => {
      const convId = data?.conversationId?.toString?.() || data?.conversationId;
      const openId = openConversationId?.toString?.() || openConversationId;
      if (convId && openId && convId === openId) {
        setAITyping?.(true);
      }
    };

    const handleNewMessageCount = (data: any) => {
      // Backend now sends { conversationId, lastMessage } — patch only that conversation's
      // count and lastMessage in local state instead of re-fetching the entire list.
      const { conversationId, lastMessage } = data || {};
      if (conversationId) {
        setConversationsList((prev: any) => ({
          ...prev,
          data: prev.data?.map((conv: any) =>
            conv._id === conversationId || conv._id?.toString() === conversationId?.toString()
              ? {
                ...conv,
                newMessage: (conv.newMessage || 0) + 1,
                ...(lastMessage !== undefined ? { lastMessage } : {}),
              }
              : conv
          ),
        }));
      }
    };

    const handleNoteAppendMessage = ({ note }: any) => {
      console.log(note, "new note data");

      // setNotesList((prev: any) => [
      //   ...prev,
      //   { message: note.message, createdAt: note.createdAt || Date.now() }
      // ]);
      const noteRow = {
        ...note,
        message: note.message,
        createdAt: note.createdAt ?? Date.now(),
      };
      setNotesList((prev: any) => [...prev, noteRow]);

      // Include all note fields; use note's sender_type from backend (humanAgent/client)
      const noteMessage = {
        ...note,
        is_note: 'true',
        sender_type: note.sender_type || "humanAgent",
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        // Ensure agentId is included if it exists
        agentId: note.agentId || null
      };

      setConversationMessages((prev: any) => ({
        ...prev,
        data: [...prev.data, noteMessage],
      }));
    };

    const handleAiChatStatusUpdate = (data: any) => {
      setIsAIChat(data?.aiChat ?? false);
    };

    const handleConversationClose = (data: any) => {
      console.log("Conversation closed event received:", data);
      setOpenConversationStatus("close");

      socket.emit(
        "get-filtered-conversations-list",
        { status, rating, handledBy },
        (response: any) => {
          if (response?.success) {
            const filtered = response.conversations.filter((conv: any) => conv.is_started === true);
            setIsConversationAvailable(filtered.length > 0);
            setConversationsList({ data: filtered, loading: false });
          }
        }
      );
    };

    const handleVisitorBlocked = (data: any) => {
      console.log("Visitor blocked event received:", data);
      setOpenConversationStatus("close");
    };

    const handleVisitorCloseChat = (data: any) => {
      console.log("Visitor closed chat event received:", data);
      // Conversation stays open for the agent (conversationOpenStatus unchanged in DB).
      // Mark visitorClosed so agent chat sends stay disabled for this thread.
      setIsVisitorClosed(true);

      // Refresh the conversations list
      socket.emit(
        "get-filtered-conversations-list",
        { status, rating, handledBy },
        (response: any) => {
          if (response?.success) {
            const filtered = response.conversations.filter((conv: any) => conv.is_started === true);
            setIsConversationAvailable(filtered.length > 0);
            setConversationsList({ data: filtered, loading: false });
          }
        }
      );
    };

    const handleConversationFeedbackUpdate = (data: any) => {
      const { conversationId, feedback, comment } = data || {};
      console.log("Conversation feedback update received:", data);
      if (!conversationId) return;

      const matchesConv = (conv: any) =>
        conv._id === conversationId || conv._id?.toString() === conversationId?.toString();
      const patch = (conv: any) => ({
        ...conv,
        feedback,
        ...(comment !== undefined ? { comment } : {}),
      });

      setConversationsList((prev: any) => ({
        ...prev,
        data: prev.data?.map((conv: any) => (matchesConv(conv) ? patch(conv) : conv)),
      }));
      setOldConversationList((prev: any) => ({
        ...prev,
        data: prev.data?.map((conv: any) => (matchesConv(conv) ? patch(conv) : conv)),
      }));

      const openId = openConversationIdRef.current;
      if (openId && String(openId) === String(conversationId)) {
        setCurrentConversation((prev: any) => (prev ? patch(prev) : prev));
      }
    };

    // Register event listeners (WITHOUT agent-connection handlers)
    socket.on("conversation-append-message", handleAppendMessage);
    socket.on("intermediate-response", handleIntermediateResponse);
    socket.on("new-message-count", handleNewMessageCount);
    socket.on("note-append-message", handleNoteAppendMessage);
    socket.on("ai-chat-status-update", handleAiChatStatusUpdate);
    socket.on("conversation-close-triggered", handleConversationClose);
    socket.on("visitor-blocked", handleVisitorBlocked);
    socket.on("visitor-conversation-close", handleConversationClose);
    socket.on("visitor-close-chat", handleVisitorCloseChat);
    socket.on("conversation-feedback-update", handleConversationFeedbackUpdate);

    return () => {
      socket.off("conversation-append-message", handleAppendMessage);
      socket.off("intermediate-response", handleIntermediateResponse);
      socket.off("new-message-count", handleNewMessageCount);
      socket.off("note-append-message", handleNoteAppendMessage);
      socket.off("ai-chat-status-update", handleAiChatStatusUpdate);
      socket.off("conversation-close-triggered", handleConversationClose);
      socket.off("visitor-blocked", handleVisitorBlocked);
      socket.off("visitor-conversation-close", handleConversationClose);
      socket.off("visitor-close-chat", handleVisitorCloseChat);
      socket.off("conversation-feedback-update", handleConversationFeedbackUpdate);
    };
  }, [status, rating, handledBy, openConversationId, setConversationMessages, setNotesList, setIsAIChat, setOpenConversationStatus, setIsConversationAvailable, setConversationsList, setOldConversationList, setCurrentConversation, setAITyping, setIsVisitorClosed]);

  // ✅ NEW: Separate persistent agent-connection handlers (NEVER removed)
  const setupAgentConnectionHandlers = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log("🔌 Setting up persistent agent-connection handlers");

    const handleAgentConnectionNotification = (data: any) => {
      const dedupKey = data?.conversationId?.toString?.() || data?.conversationId || '';
      const isDup = !!(dedupKey && recentNotificationIds.has(dedupKey));
      if (!isDup && dedupKey) {
        recentNotificationIds.add(dedupKey);
        setTimeout(() => recentNotificationIds.delete(dedupKey), NOTIF_DEDUP_TTL_MS);
      }
      if (isDup) {
        console.log("Duplicate agent-connection-notification (sound skipped):", dedupKey);
      } else {
        console.log("Agent connection notification received:", data);
        // Play notification sound (first delivery only)
        try {
          const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
          const audioPath = `${basePath}/audio/notification.mp3`;
          const audio = new Audio(audioPath);
          audio.play().catch((err) => {
            console.error("Failed to play notification sound", err);
          });
        } catch (e) {
          console.error("Audio play error", e);
        }
      }

      if (!isDup) {
        const userRole = sessionStorage.getItem("role");
        const baseUrl = window.location.origin;
        const currentPath = window.location.pathname;

        let inboxPath = "/inbox";
        if (currentPath.startsWith("/agent-inbox")) {
          inboxPath = "/agent-inbox";
        } else if (currentPath.startsWith("/inbox")) {
          inboxPath = "/inbox";
        } else {
          const agentData = sessionStorage.getItem("agent");
          const isAgent = userRole === "agent" || (agentData && agentData !== "null" && agentData !== "undefined");
          inboxPath = isAgent ? "/agent-inbox" : "/inbox";
        }

        const chatUrl = `${baseUrl}${inboxPath}?conversationId=${data.conversationId}`;

        console.log("Agent connection notification - URL:", chatUrl, "Role:", userRole, "CurrentPath:", currentPath, "InboxPath:", inboxPath, "ConversationId:", data.conversationId);

        const showNotification = () => {
          const notification = new Notification("New Agent Connection Request", {
            body: "A visitor requested to connect to an agent. Click to open chat.",
            icon: "/favicon.ico",
            tag: `agent-connection-${data.conversationId}`,
            requireInteraction: false,
            data: { url: chatUrl, conversationId: data.conversationId },
          });

          notification.onclick = (event) => {
            console.log("Notification clicked, navigating to:", chatUrl);
            event.preventDefault();
            notification.close();

            if (window.focus) {
              window.focus();
            }

            const pathNow = window.location.pathname;
            const normalizePath = (path: string) => path.replace(/\/$/, "");
            const normalizedCurrent = normalizePath(pathNow);
            const normalizedInbox = normalizePath(inboxPath);
            const isOnInboxPage = normalizedCurrent === normalizedInbox;

            if (isOnInboxPage) {
              try {
                const url = new URL(chatUrl);
                window.history.pushState({}, "", url.pathname + url.search);
                window.dispatchEvent(
                  new CustomEvent("notification-navigate-to-conversation", {
                    detail: { conversationId: data.conversationId },
                  })
                );
              } catch (error) {
                console.error("Error updating URL:", error);
                window.location.href = chatUrl;
              }
            } else {
              setTimeout(() => {
                window.location.href = chatUrl;
              }, 100);
            }
          };
        };

        if ("Notification" in window && Notification.permission === "granted") {
          showNotification();
        } else if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              showNotification();
            }
          });
        }
      }

      // Always forward so Inbox can show the accept/decline popup
      window.dispatchEvent(new CustomEvent("agent-connection-notification", { detail: data }));
    };

    const handleAgentConnectionCancelled = (data: any) => {
      console.log("Agent connection cancelled:", data);
      window.dispatchEvent(new CustomEvent('agent-connection-cancelled', { detail: data }));
    };

    const handleAgentConnectionTimeout = (data: any) => {
      console.log("Agent connection timeout:", data);
      window.dispatchEvent(new CustomEvent("agent-connection-timeout", { detail: data }));
    };

    const handleAgentConnectionAccepted = (data: any) => {
      console.log("Agent connection accepted:", data);
      window.dispatchEvent(new CustomEvent("agent-connection-accepted", { detail: data }));
    };

    socket.on("agent-connection-notification", handleAgentConnectionNotification);
    socket.on("agent-connection-cancelled", handleAgentConnectionCancelled);
    socket.on("agent-connection-timeout", handleAgentConnectionTimeout);
    socket.on("agent-connection-accepted", handleAgentConnectionAccepted);

    return () => {
      socket.off("agent-connection-notification", handleAgentConnectionNotification);
      socket.off("agent-connection-cancelled", handleAgentConnectionCancelled);
      socket.off("agent-connection-timeout", handleAgentConnectionTimeout);
      socket.off("agent-connection-accepted", handleAgentConnectionAccepted);
    };
  }, []);

  const setupConversationListHandlers = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleVisitorConnectListUpdate = () => {
      if (!socket.connected) return;
      socket.emit(
        "get-filtered-conversations-list",
        { status, rating, handledBy },
        (response: any) => {
          if (response?.success) {
            const filtered = response.conversations.filter((conv: any) => conv.is_started === true);
            setIsConversationAvailable(filtered.length > 0);
            setConversationsList({ data: filtered, loading: false });
          }
        }
      );
    };

    socket.on("visitor-connect-list-update", handleVisitorConnectListUpdate);

    return () => {
      socket.off("visitor-connect-list-update", handleVisitorConnectListUpdate);
    };
  }, [status, rating, handledBy, setConversationsList, setIsConversationAvailable]);

  const setupTagsHandler = useCallback(() => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    const getConvTags = (data: any) => {
      if (data && data.tags) {
        console.log("Received tags:", data.tags);
        setTags(data.tags);
      } else {
        console.error("Received invalid tag data:", data);
      }
    };

    socket.on("get-tags-response", getConvTags);

    return () => {
      socket.off("get-tags-response", getConvTags);
    };
  }, [setTags]);

  // Socket emission functions
  const emitGetConversationsList = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const doEmit = () => {
      socket.emit(
        "get-filtered-conversations-list",
        { status, rating, handledBy },
        (response: any) => {
          if (response?.success) {
            const filtered = response.conversations.filter((conv: any) => conv.is_started === true);
            setIsConversationAvailable(filtered.length > 0);
            setConversationsList({ data: filtered, loading: false });
          } else {
            setConversationsList({ data: [], loading: false });
          }
        }
      );
    };

    if (socket.connected) {
      doEmit();
    } else {
      socket.once("connect", doEmit);
    }
  }, [status, rating, handledBy, setConversationsList, setIsConversationAvailable]);

  const emitGetConversationsListRef = useRef(emitGetConversationsList);
  emitGetConversationsListRef.current = emitGetConversationsList;
  const hasConnectedOnceRef = useRef(false);

  // Refresh list and rejoin open conversation room after reconnect / tab wake
  useEffect(() => {
    if (!socket) return;

    hasConnectedOnceRef.current = false;

    const rejoinOpenConversation = () => {
      const convId = openConversationIdRef.current;
      if (!convId || !socket.connected) return;
      setTimeout(() => {
        socket.emit(
          "set-conversation-id",
          { conversationId: convId },
          (response: { success?: boolean }) => {
            if (response?.success) {
              console.log("Rejoined conversation room after reconnect:", convId);
            }
          }
        );
      }, 100);
    };

    const recoverAfterReconnect = () => {
      emitGetConversationsListRef.current();
      rejoinOpenConversation();
    };

    const onConnect = () => {
      if (!hasConnectedOnceRef.current) {
        hasConnectedOnceRef.current = true;
        return;
      }
      recoverAfterReconnect();
    };

    socket.on("connect", onConnect);
    return () => {
      socket.off("connect", onConnect);
    };
  }, [socket]);

  const emitGetConversationTags = useCallback((conversationId?: string) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    const convId = conversationId || openConversationId;

    if (!socket || !convId) {
      console.log("Cannot fetch tags: missing socket or conversation ID");
      return;
    }

    socket.emit("get-conversation-tags", { conversationId: convId }, (response: any) => {
      if (response && response.success) {
        console.log(response.tags, "response.tags");
        setTags(response.tags);
      } else {
        console.error("Failed to fetch tags:", response?.error || "Unknown error");
      }
    });
  }, [openConversationId, setTags]);

  const emitJoinConversation = useCallback((conversationId: string, callback?: (response: any) => void, shouldMarkAsSeen: boolean = false) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit("set-conversation-id", { conversationId }, (response: any) => {
      if (response && response.success) {
        console.log("Successfully joined conversation room:", conversationId);

        // Only mark messages as seen if there are actually new messages
        // This prevents updating the conversation's updatedAt timestamp unnecessarily
        if (shouldMarkAsSeen) {
          socket.emit("message-seen", { conversationId }, (seenResponse: any) => {
            if (seenResponse && !seenResponse.success) {
              console.error("Failed to mark messages as seen:", seenResponse.error);
            }
          });
        }

        // Fetch conversation tags
        emitGetConversationTags(conversationId);
      } else {
        console.error("Failed to join conversation room:", response?.error || "Unknown error");
      }

      callback?.(response);
    });
  }, [emitGetConversationTags]);

  const emitCheckPendingAgentRequest = useCallback((conversationId: string, callback?: (response: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("check-pending-agent-request", { conversationId }, (response: any) => {
      if (response && response.success) {
        console.log("Checked for pending agent request:", response.hasPendingRequest);
      } else {
        console.error("Failed to check pending agent request:", response?.error || "Unknown error");
      }
      callback?.(response);
    });
  }, []);

  // Marks every notification tied to this conversation as seen for the current human agent.
  // Called when the agent opens a chat so the unread badge clears across the UI.
  const emitMarkConversationNotificationsSeen = useCallback(
    (conversationId: string, callback?: (response: any) => void) => {
      const socket = socketRef.current;
      if (!socket || !conversationId) return;

      socket.emit(
        "mark-conversation-notifications-seen",
        { conversationId },
        (response: any) => {
          if (response && !response.success) {
            console.error(
              "Failed to mark conversation notifications as seen:",
              response?.error || "Unknown error"
            );
          }
          callback?.(response);
        }
      );
    },
    []
  );

  const emitSendMessage = useCallback((messageData: { message: string; visitorId: string; replyTo?: string | null }, callback?: (response: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("client-send-message", messageData, callback);
  }, []);

  const emitSendNote = useCallback(
    (
      noteData: { message: string; visitorId: string; conversationId: string; replyTo?: string | null },
      callback?: (response: any) => void
    ) => {
      const socket = socketRef.current;
      if (!socket) return;

      socket.emit("client-send-add-note", noteData, callback);
    },
    []
  );

  const emitAddTag = useCallback((tagName: string, conversationId: string, callback?: (response: any) => void) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit(
      "add-conversation-tag",
      { name: tagName.trim(), conversationId },
      (response: any) => {
        if (response && response.success) {
          console.log("Tag added successfully");
          emitGetConversationTags();
        } else {
          console.error("Failed to add tag:", response?.error || "Unknown error");
        }
        callback?.(response);
      }
    );
  }, [emitGetConversationTags]);

  const emitDeleteTag = useCallback((tagId: string, conversationId: string) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit(
      "remove-conversation-tag",
      { id: tagId, conversationId },
      (response: any) => {
        if (response && response.success) {
          console.log("Tag deleted successfully");
          emitGetConversationTags();
        } else {
          console.error("Failed to delete tag:", response?.error || "Unknown error");
        }
      }
    );
  }, [emitGetConversationTags]);

  const emitCloseConversation = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit(
      "close-conversation",
      { conversationId, status: "close" },
      (response: any) => {
        if (response && response.success) {
          console.log("Conversation closed successfully");
          setOpenConversationStatus("close");
        } else {
          console.error("Failed to close conversation:", response?.error || "Unknown error");
        }
      }
    );
  }, [setOpenConversationStatus]);

  const emitBlockVisitor = useCallback((visitorId: string, conversationId: string) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit(
      "block-visitor",
      { visitorId, conversationId },
      (response: any) => {
        if (response && response.success) {
          console.log("Visitor blocked successfully");
          setOpenConversationStatus("close");
        } else {
          console.error("Failed to block visitor:", response?.error || "Unknown error");
        }
      }
    );
  }, [setOpenConversationStatus]);

  const emitSearchConversations = useCallback((query: string, status: string) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit(
      "search-conversations",
      { query, status },
      (response: any) => {
        if (response.success) {
          setSearchConversationsList({ data: response.data, loading: false });
        } else {
          console.error("Search Error:", response.error);
        }
      }
    );
  }, [setSearchConversationsList]);

  const emitCloseAIResponse = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit("close-ai-response", { conversationId });
  }, []);

  const emitGetAllNotes = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit(
      "get-all-note-messages",
      { conversationId },
      (response: any) => {
        if (response.success) {
          setNotesList(response.notes);
        } else {
          console.error("Error fetching notes:", response.error);
        }
      }
    );
  }, [setNotesList]);

  const emitGetVisitorOldConversations = useCallback((visitorId: string, ip?: string | null) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit(
      "get-visitor-old-conversations",
      { visitorId, ip },
      (response: any) => {
        if (response.success) {
          setOldConversationList({
            data: response.conversations,
            loading: false,
          });
        } else {
          console.error("Error fetching old conversations:", response.error);
        }
      }
    );
  }, [setOldConversationList]);

  const emitMarkMessagesSeen = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit("message-seen", { conversationId }, (seenResponse: any) => {
      if (seenResponse && !seenResponse.success) {
        console.error("Failed to mark messages as seen:", seenResponse.error);
      }
    });
  }, []);

  // When agent changes, SocketProvider reconnects; refresh inbox handlers and list
  useEffect(() => {
    const handleAgentChanged = () => {
      setSocketVersion((v) => v + 1);
    };

    window.addEventListener("agent-changed", handleAgentChanged);
    return () => window.removeEventListener("agent-changed", handleAgentChanged);
  }, []);

  // Setup event handlers - only when shared socket is available
  useEffect(() => {
    if (!socket) {
      return;
    }

    let cleanupFunctions: Array<(() => void) | undefined> = [];

    const setupHandlers = () => {
      // Clean up existing handlers first to prevent duplicates
      cleanupFunctions.forEach(cleanup => cleanup?.());
      cleanupFunctions = [];

      if (socket.connected) {
        const cleanup1 = setupMessageHandlers();
        const cleanup2 = setupConversationListHandlers();
        const cleanup3 = setupTagsHandler();
        cleanupFunctions = [cleanup1, cleanup2, cleanup3];
      }
    };

    if (socket.connected) {
      setupHandlers();
    } else {
      const onConnect = () => {
        setupHandlers();
      };
      socket.once("connect", onConnect);

      return () => {
        socket.off("connect", onConnect);
        cleanupFunctions.forEach((cleanup) => cleanup?.());
      };
    }

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup?.());
    };
  }, [socket, setupMessageHandlers, setupConversationListHandlers, setupTagsHandler, socketVersion]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    let cleanupAgentHandlers: (() => void) | undefined;

    const attachAgentHandlers = () => {
      cleanupAgentHandlers?.();
      cleanupAgentHandlers = setupAgentConnectionHandlers();
    };

    if (socket.connected) {
      attachAgentHandlers();
    } else {
      const onConnect = () => attachAgentHandlers();
      socket.once("connect", onConnect);
      return () => {
        socket.off("connect", onConnect);
        cleanupAgentHandlers?.();
      };
    }

    return () => {
      cleanupAgentHandlers?.();
    };
  }, [socket, setupAgentConnectionHandlers, socketVersion]);

  // Auto-fetch conversations list when filters change or socket is re-created
  useEffect(() => {
    emitGetConversationsList();
  }, [status, rating, handledBy, isAIChat, emitGetConversationsList, socketVersion]);

  // Auto-fetch notes and old conversations when conversation changes
  useEffect(() => {
    if (openConversationId) {
      emitGetAllNotes(openConversationId);
      emitGetConversationTags();
    } else {
      setNotesList([]);
    }

    if (openVisitorId) {
      emitGetVisitorOldConversations(openVisitorId, openVisitorIp);
    }
  }, [openConversationId, openVisitorId, openVisitorIp, emitGetAllNotes, emitGetConversationTags, emitGetVisitorOldConversations, setNotesList]);

  return {
    socketRef,
    // Emit functions
    // socket,
    emitJoinConversation,
    emitSendMessage,
    emitSendNote,
    emitGetConversationTags,
    emitAddTag,
    emitDeleteTag,
    emitCloseConversation,
    emitBlockVisitor,
    emitSearchConversations,
    emitCloseAIResponse,
    emitGetAllNotes,
    emitGetVisitorOldConversations,
    emitMarkMessagesSeen,
    emitGetConversationsList,
    emitCheckPendingAgentRequest,
    emitMarkConversationNotificationsSeen,
  };
};
