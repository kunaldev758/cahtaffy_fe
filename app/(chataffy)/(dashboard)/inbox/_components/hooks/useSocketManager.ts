// hooks/useSocketManager.ts
import { useRef, useEffect, useCallback } from "react";
import { io, Socket } from 'socket.io-client';

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

  // Current state values
  status: string;
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
  status,
  openConversationId,
  openVisitorId,
  isAIChat,
}: SocketManagerProps) => {
  // const { socket } = useSocket();
  const socketRef = useRef<Socket | null>(null);
  const isInitializingRef = useRef(false);

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
        const socketInstance = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
          query: {
            token: localStorage.getItem('token'),
          },
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
      setConversationMessages((prev: any) => ({
        ...prev,
        data: [...prev.data, data.chatMessage],
      }));
    };

    const handleNewMessageCount = (data: any) => {
      console.log("New message count triggered:", data);
      const userId = localStorage.getItem("userId");

      if (status === "open") {
        socket.emit("get-open-conversations-list", { userId });
      } else {
        socket.emit("get-close-conversations-list", { userId });
      }
    };

    const handleNoteAppendMessage = ({ note }: any) => {
      console.log(note, "new note data");

      setNotesList((prev: any) => [
        ...prev,
        { message: note.message, createdAt: note.createdAt || Date.now() }
      ]);

      // Include all note fields, especially agentId with name and avatar
      const noteMessage = {
        ...note,
        is_note: 'true',
        sender_type: "agent",
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        // Ensure agentId is included if it exists
        agentId: note.agentId || null
      };

      setConversationMessages((prev: any) => ({
        ...prev,
        data: [...prev.data, noteMessage],
      }));
    };

    const handleAiResponse = () => {
      setIsAIChat(false);
    };

    const handleConversationClose = (data: any) => {
      console.log("Conversation closed event received:", data);
      setOpenConversationStatus("close");
      
      // Refresh conversation lists to reflect the closed status
      const userId = localStorage.getItem("userId");
      if (userId) {
        // Refresh open conversations list (conversation will be removed)
        socket.emit("get-open-conversations-list", { userId });
        // Refresh closed conversations list (conversation will be added)
        socket.emit("get-close-conversations-list", { userId });
      }
    };

    const handleVisitorBlocked = (data: any) => {
      console.log("Visitor blocked event received:", data);
      setOpenConversationStatus("close");
    };

    // Register event listeners
    socket.on("conversation-append-message", handleAppendMessage);
    socket.on("new-message-count", handleNewMessageCount);
    socket.on("note-append-message", handleNoteAppendMessage);
    socket.on("ai-response-update", handleAiResponse);
    socket.on('conversation-close-triggered', handleConversationClose);
    socket.on('visitor-blocked', handleVisitorBlocked);
    socket.on('visitor-conversation-close', handleConversationClose);

    // Handle agent connection notifications
    const handleAgentConnectionNotification = (data: any) => {
      console.log("Agent connection notification received:", data);
      // Play notification sound
      try {
        // Construct audio path with basePath support for production
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/chataffy/cahtaffy_fe';
        const audioPath = `${basePath}/audio/notification.mp3`;
        const audio = new Audio(audioPath);
        audio.play().catch((err) => {
          console.error("Failed to play notification sound", err);
        });
      } catch (e) {
        console.error("Audio play error", e);
      }

      // Determine the correct inbox URL based on user role and current path
      const userRole = localStorage.getItem("role");
      const baseUrl = window.location.origin;
      const currentPath = window.location.pathname;
      const basePathPrefix = "/chataffy/cahtaffy_fe";
      
      // Normalize current path for checking
      const normalizedCurrentPath = currentPath.replace(basePathPrefix, '');
      
      // Determine inbox path: check current path first, then role, then agent data
      let inboxPath = "/inbox"; // default
      if (normalizedCurrentPath.startsWith("/agent-inbox")) {
        inboxPath = "/agent-inbox";
      } else if (normalizedCurrentPath.startsWith("/inbox")) {
        inboxPath = "/inbox";
      } else {
        // Fallback to role check
        const agentData = localStorage.getItem("agent");
        const isAgent = userRole === "agent" || (agentData && agentData !== "null" && agentData !== "undefined");
        inboxPath = isAgent ? "/agent-inbox" : "/inbox";
      }
      
      // Detect if we're in production by checking if current pathname has base path prefix
      const isProduction = currentPath.startsWith(basePathPrefix);
      
      // Construct URL - only include base path if we're in production
      const chatUrl = isProduction 
        ? `${baseUrl}${basePathPrefix}${inboxPath}?conversationId=${data.conversationId}`
        : `${baseUrl}${inboxPath}?conversationId=${data.conversationId}`;
      
      console.log("Agent connection notification - URL:", chatUrl, "Role:", userRole, "CurrentPath:", currentPath, "InboxPath:", inboxPath, "ConversationId:", data.conversationId);

      // Show browser notification if permission granted
      const showNotification = () => {
        // Store the URL in sessionStorage as a fallback
        sessionStorage.setItem('pendingAgentConnectionUrl', chatUrl);
        
        const notification = new Notification("New Agent Connection Request", {
          body: "A visitor requested to connect to an agent. Click to open chat.",
          icon: "/favicon.ico",
          tag: `agent-connection-${data.conversationId}`, // Tag to replace previous notifications for same conversation
          requireInteraction: false,
          data: { url: chatUrl, conversationId: data.conversationId }, // Store URL in notification data
        });

        // Handle notification click to navigate to chat
        notification.onclick = (event) => {
          console.log("Notification clicked, navigating to:", chatUrl);
          event.preventDefault();
          notification.close();
          
          // Remove stored URL since we're navigating now
          sessionStorage.removeItem('pendingAgentConnectionUrl');
          
          // Focus the window first - this is critical for navigation to work
          if (window.focus) {
            window.focus();
          }
          
          // Check if we're already on the inbox page - if so, just update the query param
          const currentPath = window.location.pathname;
          // Normalize paths for comparison (remove trailing slashes and base path)
          const normalizePath = (path: string) => path.replace(/\/chataffy\/cahtaffy_fe/, '').replace(/\/$/, '');
          const normalizedCurrent = normalizePath(currentPath);
          const normalizedInbox = normalizePath(inboxPath);
          const isOnInboxPage = normalizedCurrent === normalizedInbox;
          
          if (isOnInboxPage) {
            // Already on inbox page - just update the URL without full reload
            try {
              const url = new URL(chatUrl);
              window.history.pushState({}, '', url.pathname + url.search);
              // Dispatch a custom event to trigger conversation opening
              window.dispatchEvent(new CustomEvent('notification-navigate-to-conversation', { 
                detail: { conversationId: data.conversationId } 
              }));
            } catch (error) {
              console.error("Error updating URL:", error);
              // Fallback to full navigation
              window.location.href = chatUrl;
            }
          } else {
            // Not on inbox page - navigate using window.location
            // Use a small delay to ensure window is focused
            setTimeout(() => {
              try {
                console.log("Navigating to:", chatUrl);
                // Direct navigation - this will cause full page reload
                // The middleware should allow /agent-inbox with query params
                window.location.href = chatUrl;
              } catch (error) {
                console.error("Navigation error:", error);
                window.location.assign(chatUrl);
              }
            }, 100);
          }
        };
        
        // Also handle window focus event as a fallback
        const handleWindowFocus = () => {
          const pendingUrl = sessionStorage.getItem('pendingAgentConnectionUrl');
          if (pendingUrl && pendingUrl === chatUrl) {
            sessionStorage.removeItem('pendingAgentConnectionUrl');
            window.location.assign(pendingUrl);
            window.removeEventListener('focus', handleWindowFocus);
          }
        };
        
        // Listen for window focus (in case notification click doesn't work)
        window.addEventListener('focus', handleWindowFocus);
        
        // Clean up listener after 30 seconds
        setTimeout(() => {
          window.removeEventListener('focus', handleWindowFocus);
          sessionStorage.removeItem('pendingAgentConnectionUrl');
        }, 30000);
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

      // Store notification data (you might want to add state for this)
      // For now, we'll emit a custom event that the inbox component can listen to
      window.dispatchEvent(new CustomEvent('agent-connection-notification', { detail: data }));
    };

    const handleAgentConnectionCancelled = (data: any) => {
      console.log("Agent connection cancelled:", data);
      window.dispatchEvent(new CustomEvent('agent-connection-cancelled', { detail: data }));
    };

    socket.on("agent-connection-notification", handleAgentConnectionNotification);
    socket.on("agent-connection-cancelled", handleAgentConnectionCancelled);

    return () => {
      socket.off("conversation-append-message", handleAppendMessage);
      socket.off("new-message-count", handleNewMessageCount);
      socket.off("agent-connection-notification", handleAgentConnectionNotification);
      socket.off("agent-connection-cancelled", handleAgentConnectionCancelled);
      socket.off("note-append-message", handleNoteAppendMessage);
      socket.off("ai-response-update", handleAiResponse);
      socket.off('conversation-close-triggered', handleConversationClose);
      socket.off('visitor-blocked', handleVisitorBlocked);
      socket.off('visitor-conversation-close', handleConversationClose);
    };
  }, [status, setConversationMessages, setNotesList, setIsAIChat, setOpenConversationStatus]);

  const setupConversationListHandlers = useCallback(() => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    const handleOpenConversationsListResponse = async (data: any) => {
      console.log("Open conversations list received:", data);
      const filteredConversations = data.conversations.filter((conv: any) => conv.is_started === true);
      setIsConversationAvailable(filteredConversations.length > 0);
      setConversationsList({ 
        data: filteredConversations, 
        loading: false 
      });

      if (!openConversationId && filteredConversations[0]) {
        setOpenConversationId(filteredConversations[0].id);
      }
    };

    const handleCloseConversationsListResponse = async (data: any) => {
      console.log("Close conversations list received:", data);
      const filteredConversations = data.conversations.filter((conv: any) => conv.is_started === true);
      setIsConversationAvailable(filteredConversations.length > 0);
      setConversationsList({ 
        data: filteredConversations, 
        loading: false 
      });

      if (!openConversationId && filteredConversations[0]) {
        setOpenConversationId(filteredConversations[0].id);
      }
    };

    const handleOpenConversationsListUpdateResponse = async (data: any) => {
      status === 'open' && setConversationsList({ 
        data: data.conversations.filter((conv: any) => conv.is_started === true), 
        loading: false 
      });
    };

    const handleVisitorConnectListUpdate = () => {
      // Only update if socket is connected and we're on open status
      if (!socket.connected) {
        console.log("Socket not connected, skipping visitor connect list update");
        return;
      }
      const userId = localStorage.getItem("userId");
      if (userId && status === "open") {
        socket.emit("get-open-conversations-list", { userId });
      }
    };

    socket.on("get-open-conversations-list-response", handleOpenConversationsListResponse);
    socket.on("get-close-conversations-list-response", handleCloseConversationsListResponse);
    socket.on("visitor-connect-list-update", handleVisitorConnectListUpdate);

    // For update responses
    socket.on("get-open-conversations-list-response", handleOpenConversationsListUpdateResponse);

    return () => {
      socket.off("get-open-conversations-list-response", handleOpenConversationsListResponse);
      socket.off("get-close-conversations-list-response", handleCloseConversationsListResponse);
      socket.off("visitor-connect-list-update", handleVisitorConnectListUpdate);
      socket.off("get-open-conversations-list-response", handleOpenConversationsListUpdateResponse);
    };
  }, [status, openConversationId, setConversationsList, setIsConversationAvailable, setOpenConversationId]);

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
    // const { socket } = useSocket();
    if (!socket) return;

    const userId = localStorage.getItem("userId");
    if (status === "open") {
      socket.emit("get-open-conversations-list", { userId });
    } else {
      socket.emit("get-close-conversations-list", { userId });
    }
  }, [status]);

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

  const emitSendMessage = useCallback((messageData: { message: string; visitorId: string }, callback?: (response: any) => void) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit("client-send-message", messageData, callback);
  }, []);

  const emitSendNote = useCallback((noteData: { message: string; visitorId: string; conversationId: string }) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit("client-send-add-note", noteData);
  }, []);

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
  }, [setupMessageHandlers, setupConversationListHandlers, setupTagsHandler]);

  // Auto-fetch conversations list when status changes
  useEffect(() => {
    emitGetConversationsList();
  }, [status, isAIChat, emitGetConversationsList]);

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