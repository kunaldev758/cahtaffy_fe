// hooks/useSocketManager.ts
import { useRef, useEffect, useCallback, useState } from "react";
import { io, Socket } from 'socket.io-client';

// Dedup guard – prevents processing the same agent-connection-notification twice
// when the socket receives it due to backend room membership overlap.
const recentNotificationIds = new Set<string>();
const NOTIF_DEDUP_TTL_MS = 3000;

// import { useSocket } from "@/app/socketContext"

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

  // Current state values
  status: string;
  rating: string;
  handledBy: string;
  openConversationId: string | null;
  openVisitorId: string | null;
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
  status,
  rating,
  handledBy,
  openConversationId,
  openVisitorId,
  isAIChat,
}: SocketManagerProps) => {
  // const { socket } = useSocket();
  const socketRef = useRef<Socket | null>(null);
  const isInitializingRef = useRef(false);
  // Incremented every time the socket is re-created (e.g. on agent switch)
  // so that dependent effects re-run with the new socket instance.
  const [socketVersion, setSocketVersion] = useState(0);

    // Socket initialization
    const initializeSocket = useCallback(() => {
      // Prevent multiple simultaneous initializations
      if (isInitializingRef.current) {
        return;
      }

      // If socket already exists and is connected, don't reinitialize
      if (socketRef.current && socketRef.current.connected) {
        console.log("Socket already connected, skipping reinitialization");
        return;
      }

      // If socket exists but not connected, disconnect it first
      if (socketRef.current) {
        console.log("Disconnecting existing socket before reinitialization");
        socketRef.current.removeAllListeners(); // Remove all listeners to prevent memory leaks
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      isInitializingRef.current = true;
  
      try {
        const token = localStorage.getItem('token');
        let humanAgentId: string | undefined;
        let agentId: string | undefined;

        // Human agent login: humanAgentId and agentId from agent/humanAgentId/currentAgentId
        const storedHumanAgentId = localStorage.getItem('humanAgentId');
        const agentData = localStorage.getItem('agent');
        const currentAgentId = localStorage.getItem('currentAgentId');

        if (storedHumanAgentId) {
          humanAgentId = storedHumanAgentId;
        } else if (agentData) {
          try {
            const parsedAgent = JSON.parse(agentData);
            humanAgentId = parsedAgent?.id || parsedAgent?._id;
          } catch {}
        }

        if (!humanAgentId && localStorage.getItem('clientAgent')) {
          const clientAgent = JSON.parse(localStorage.getItem('clientAgent') || '{}');
          humanAgentId = clientAgent._id;
        }
        if (!humanAgentId) {
          const agents = localStorage.getItem('agents');
          if (agents) {
            const parsedAgents = JSON.parse(agents);
            humanAgentId = parsedAgents[0]?._id;
          }
        }

        // agentId is required for socket rooms so inbox receives visitor messages
        agentId = currentAgentId || undefined;
        if (!agentId && agentData) {
          try {
            const parsedAgent = JSON.parse(agentData);
            const firstAssigned = parsedAgent?.assignedAgents?.[0];
            agentId = firstAssigned?.toString?.() || firstAssigned;
          } catch {}
        }
        if (!agentId) {
          const agents = localStorage.getItem('agents');
          if (agents) {
            const parsedAgents = JSON.parse(agents);
            agentId = parsedAgents[0]?._id;
          }
        }

        const query: Record<string, string> = { token: token || '' };
        if (humanAgentId) query.humanAgentId = humanAgentId;
        if (agentId) query.agentId = agentId;

        const socketInstance = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
          query,
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          forceNew: false, // Reuse existing connection if available
        });
  
        socketInstance.on("connect", () => {
          console.log("Socket connected successfully");
          isInitializingRef.current = false;
        });
  
        socketInstance.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          isInitializingRef.current = false;
        });

        socketInstance.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          // Only reconnect if it wasn't a manual disconnect
          if (reason === "io server disconnect") {
            // Server disconnected, reconnect manually
            socketInstance.connect();
          } else if (reason === "io client disconnect") {
            // Client disconnected manually, don't reconnect
            console.log("Client manually disconnected, not reconnecting");
          }
        });

        socketInstance.on("reconnect", (attemptNumber) => {
          console.log("Socket reconnected after", attemptNumber, "attempts");
          // Re-join conversation room if we have an open conversation
          // The event handlers should persist, but we need to re-join rooms
          setTimeout(() => {
            if (socketRef.current && socketRef.current.connected && openConversationId) {
              socketRef.current.emit("set-conversation-id", { conversationId: openConversationId }, (response: any) => {
                if (response && response.success) {
                  console.log("Rejoined conversation room after reconnect:", openConversationId);
                }
              });
            }
          }, 100);
        });

        socketInstance.on("reconnect_attempt", (attemptNumber) => {
          console.log("Socket reconnection attempt", attemptNumber);
        });

        socketInstance.on("reconnect_error", (error) => {
          console.error("Socket reconnection error:", error);
        });

        socketInstance.on("reconnect_failed", () => {
          console.error("Socket reconnection failed after all attempts");
          isInitializingRef.current = false;
        });
  
        socketRef.current = socketInstance;
      } catch (error) {
        console.error("Error initializing socket:", error);
        isInitializingRef.current = false;
      }
    }, []);

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
      if (conversationId) {
        // Patch the feedback fields on the matching conversation in the list
        setConversationsList((prev: any) => ({
          ...prev,
          data: prev.data?.map((conv: any) =>
            conv._id === conversationId || conv._id?.toString() === conversationId?.toString()
              ? { ...conv, feedback, ...(comment !== undefined ? { comment } : {}) }
              : conv
          ),
        }));
        // Dispatch a window event so the open conversation panel can also react if needed
        window.dispatchEvent(
          new CustomEvent("conversation-feedback-update", { detail: data })
        );
      }
    };

    // Register event listeners
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

    // Handle agent connection notifications
    const handleAgentConnectionNotification = (data: any) => {
      // Dedup sound + browser notification only. Always forward to window so Inbox can show
      // the popup when opening from a notification (check-pending often fires within 3s).
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
          const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/chataffy/cahtaffy_fe';
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
        // Determine the correct inbox URL based on user role and current path
        const userRole = localStorage.getItem("role");
        const baseUrl = window.location.origin;
        const currentPath = window.location.pathname;
        const basePathPrefix = "/chataffy/cahtaffy_fe";

        const normalizedCurrentPath = currentPath.replace(basePathPrefix, "");

        let inboxPath = "/inbox";
        if (normalizedCurrentPath.startsWith("/agent-inbox")) {
          inboxPath = "/agent-inbox";
        } else if (normalizedCurrentPath.startsWith("/inbox")) {
          inboxPath = "/inbox";
        } else {
          const agentData = localStorage.getItem("agent");
          const isAgent = userRole === "agent" || (agentData && agentData !== "null" && agentData !== "undefined");
          inboxPath = isAgent ? "/agent-inbox" : "/inbox";
        }

        const isProduction = currentPath.startsWith(basePathPrefix);

        const chatUrl = isProduction
          ? `${baseUrl}${basePathPrefix}${inboxPath}?conversationId=${data.conversationId}`
          : `${baseUrl}${inboxPath}?conversationId=${data.conversationId}`;

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
            const normalizePath = (path: string) => path.replace(/\/chataffy\/cahtaffy_fe/, "").replace(/\/$/, "");
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

      // Always forward so Inbox can show the accept/decline popup (e.g. after opening from notification).
      window.dispatchEvent(new CustomEvent("agent-connection-notification", { detail: data }));
    };

    const handleAgentConnectionCancelled = (data: any) => {
      console.log("Agent connection cancelled:", data);
      window.dispatchEvent(new CustomEvent('agent-connection-cancelled', { detail: data }));
    };

    const handleAgentConnectionTimeout = (data: any) => {
      window.dispatchEvent(new CustomEvent("agent-connection-timeout", { detail: data }));
    };

    /** When any agent accepts, visitor + all sockets in conversation room get this — inbox must hide the popup for other agents too. */
    const handleAgentConnectionAccepted = (data: any) => {
      window.dispatchEvent(new CustomEvent("agent-connection-accepted", { detail: data }));
    };

    socket.on("agent-connection-notification", handleAgentConnectionNotification);
    socket.on("agent-connection-cancelled", handleAgentConnectionCancelled);
    socket.on("agent-connection-timeout", handleAgentConnectionTimeout);
    socket.on("agent-connection-accepted", handleAgentConnectionAccepted);

    return () => {
      socket.off("conversation-append-message", handleAppendMessage);
      socket.off("intermediate-response", handleIntermediateResponse);
      socket.off("new-message-count", handleNewMessageCount);
      socket.off("agent-connection-notification", handleAgentConnectionNotification);
      socket.off("agent-connection-cancelled", handleAgentConnectionCancelled);
      socket.off("agent-connection-timeout", handleAgentConnectionTimeout);
      socket.off("agent-connection-accepted", handleAgentConnectionAccepted);
      socket.off("note-append-message", handleNoteAppendMessage);
      socket.off("ai-chat-status-update", handleAiChatStatusUpdate);
      socket.off("conversation-close-triggered", handleConversationClose);
      socket.off("visitor-blocked", handleVisitorBlocked);
      socket.off("visitor-conversation-close", handleConversationClose);
      socket.off("visitor-close-chat", handleVisitorCloseChat);
      socket.off("conversation-feedback-update", handleConversationFeedbackUpdate);
    };
  }, [status, rating, handledBy, openConversationId, setConversationMessages, setNotesList, setIsAIChat, setOpenConversationStatus, setIsConversationAvailable, setConversationsList, setAITyping, setIsVisitorClosed]);

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

  const emitGetVisitorOldConversations = useCallback((visitorId: string) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit(
      "get-visitor-old-conversations",
      { visitorId },
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

  // Initialize socket on mount - only once
  useEffect(() => {
    // Only initialize if socket doesn't exist or isn't connected
    if (!socketRef.current || !socketRef.current.connected) {
      initializeSocket();
    }

    return () => {
      // Only disconnect on unmount, not on re-renders
      if (socketRef.current) {
        console.log("Cleaning up socket on unmount");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Re-initialize socket when the active agent changes so the inbox
  // is connected to the correct agent room and fetches its conversations.
  useEffect(() => {
    const handleAgentChanged = () => {
      // Force disconnect existing socket so initializeSocket will reconnect fresh
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      isInitializingRef.current = false;
      initializeSocket();
      // Bump version so handlers-setup and conversations-fetch effects re-run
      // with the new socket after it connects.
      setSocketVersion((v) => v + 1);
    };

    window.addEventListener("agent-changed", handleAgentChanged);
    return () => window.removeEventListener("agent-changed", handleAgentChanged);
  }, [initializeSocket]);

  // Setup event handlers - only when socket is available and connected
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    let cleanupFunctions: Array<(() => void) | undefined> = [];

    const setupHandlers = () => {
      // Clean up existing handlers first to prevent duplicates
      cleanupFunctions.forEach(cleanup => cleanup?.());
      cleanupFunctions = [];

      if (socketRef.current && socketRef.current.connected) {
        const cleanup1 = setupMessageHandlers();
        const cleanup2 = setupConversationListHandlers();
        const cleanup3 = setupTagsHandler();
        cleanupFunctions = [cleanup1, cleanup2, cleanup3];
      }
    };

    // If socket is already connected, set up handlers immediately
    if (socket.connected) {
      setupHandlers();
    } else {
      // Wait for socket to connect before setting up handlers
      const onConnect = () => {
        setupHandlers();
      };
      socket.once("connect", onConnect);
      
      return () => {
        socket.off("connect", onConnect);
        cleanupFunctions.forEach(cleanup => cleanup?.());
      };
    }

    // Return cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup?.());
    };
  }, [setupMessageHandlers, setupConversationListHandlers, setupTagsHandler, socketVersion]);

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
      emitGetVisitorOldConversations(openVisitorId);
    }
  }, [openConversationId, openVisitorId, emitGetAllNotes, emitGetConversationTags, emitGetVisitorOldConversations, setNotesList]);

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
  };
};