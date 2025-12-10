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

    // Socket initialization
    const initializeSocket = useCallback(() => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
  
      try {
        const socketInstance = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
          query: {
            token: localStorage.getItem('token'),
          },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });
  
        socketInstance.on("connect", () => {
          console.log("Socket connected successfully");
        });
  
        socketInstance.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
        });
  
        socketRef.current = socketInstance;
      } catch (error) {
        console.error("Error initializing socket:", error);
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

      // Determine the correct inbox URL based on user role
      const userRole = localStorage.getItem("role");
      const baseUrl = window.location.origin;
      const inboxPath = userRole === "agent" ? "/agent-inbox" : "/inbox";
      let chatUrl = "";
      if(process.env.APP_ENV === "development") {
         chatUrl = `${baseUrl}${inboxPath}?conversationId=${data.conversationId}`;
      } else {
         chatUrl = `${baseUrl}/chataffy/cahtaffy_fe${inboxPath}?conversationId=${data.conversationId}`;
      }
      // const chatUrl = `${baseUrl}${inboxPath}?conversationId=${data.conversationId}`;
      
      console.log("Agent connection notification - URL:", chatUrl, "Role:", userRole, "ConversationId:", data.conversationId);

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
          
          // Small delay to ensure window is focused before navigation
          setTimeout(() => {
            try {
              console.log("Attempting navigation to:", chatUrl);
              // Use window.location.assign which is more reliable than href
              window.location.assign(chatUrl);
            } catch (error) {
              console.error("Navigation error:", error);
              // Fallback to href
              window.location.href = chatUrl;
            }
          }, 100);
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
      const userId = localStorage.getItem("userId");
      socket.emit("get-open-conversations-list", { userId });
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

  const emitJoinConversation = useCallback((conversationId: string, callback?: (response: any) => void) => {
    const socket = socketRef.current;
    // const { socket } = useSocket();
    if (!socket) return;

    socket.emit("set-conversation-id", { conversationId }, (response: any) => {
      if (response && response.success) {
        console.log("Successfully joined conversation room:", conversationId);

        socket.emit("message-seen", { conversationId }, (seenResponse: any) => {
          if (seenResponse && !seenResponse.success) {
            console.error("Failed to mark messages as seen:", seenResponse.error);
          }
        });

        // Fetch conversation tags
        emitGetConversationTags(conversationId);
      } else {
        console.error("Failed to join conversation room:", response?.error || "Unknown error");
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

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [initializeSocket]);

  // Setup event handlers
  useEffect(() => {
    const cleanup1 = setupMessageHandlers();
    const cleanup2 = setupConversationListHandlers();
    const cleanup3 = setupTagsHandler();

    return () => {
      cleanup1?.();
      cleanup2?.();
      cleanup3?.();
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
  };
};