// components/Inbox.tsx (Main refactored component)
"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getConversationMessages, getOldConversationMessages, getClientData } from "@/app/_api/dashboard/action";
import { useSocketManager } from "./hooks/useSocketManager";
import ReviseAnswerModal from "./ReviseAnswerModal";

// Component imports
import ConversationsList from "./ConversationsList";
import ChatHeader from "./ChatHeader";
import MessagesArea from "./MessagesArea";
import MessageInput from "./MessageInput";
import DetailsPanel from "./DetailsPanel";
import EmptyState from "./EmptyState";
import AgentConnectionRequest from "./AgentConnectionRequest";
import InboxSkeleton from "./InboxSkeleton";

export default function Inbox(Props: any) {
  const searchParams:any = useSearchParams();
  const currentConversationId = searchParams.get('conversationId');
  
  // State variables
  const [expandedSources, setExpandedSources] = useState<null | number>(null);
  const [isConversationAvailable, setIsConversationAvailable] = useState(true);
  const [conversationsList, setConversationsList] = useState<any>({
    data: [],
    loading: true,
  });
  const [searchConversationsList, setSearchConversationsList] = useState<any>({
    data: [],
    loading: true,
  });
  const [conversationMessages, setConversationMessages] = useState<any>({
    data: [],
    loading: false,
    conversationId: null,
    visitorName: "",
  });
  const [inputMessage, setInputMessage] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const MAX_WORDS = 100;
  const [openVisitorId, setOpenVisitorId] = useState<any>(null);
  const [openVisitorIp, setOpenVisitorIp] = useState<string | null>(null);
  const [openVisitorName, setOpenVisitorName] = useState<any>(null);
  const [openConversationId, setOpenConversationId] = useState<any>(currentConversationId ?? null);
  const [isNoteActive, setIsNoteActive] = useState<boolean>(false);
  const [notesList, setNotesList] = useState<any>([]);
  const [oldConversationList, setOldConversationList] = useState<any>({
    data: [],
    loading: true,
  });
  const [visitorDetails, setVisitorDetails] = useState<any>();
  const [status, setStatus] = useState("open");
  const [rating, setRating] = useState("all");
  const [handledBy, setHandledBy] = useState("both");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("lastActivity");
  const [addTag, setAddTag] = useState<boolean>(false);
  const [inputAddTag, setInputAddTag] = useState<string>("");
  const [tags, setTags] = useState<any>([]);
  const [openConversationStatus, setOpenConversationStatus] = useState<any>("close");
  const [isAIChat, setIsAIChat] = useState(true);
  const [isVisitorClosed, setIsVisitorClosed] = useState(false);
  const [agentConnectionRequest, setAgentConnectionRequest] = useState<{
    conversationId: string;
    visitorName?: string;
    requestStartedAt?: number;
  } | null>(null);
  const [agent, setAgent] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [currentConversation, setCurrentConversation] = useState<any>(null);
  const [isAITyping, setIsAITyping] = useState(false);
  const [reviseAnswerModal, setReviseAnswerModal] = useState<{
    visitorMessage: string;
    agentResponse: string;
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    _id?: string;
    message: string;
    sender_type: string;
    senderName?: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // Prevents the auto-open logic from resetting the active conversation whenever
  // the list length changes (e.g. a new visitor connects).
  const hasOpenedFirstRef = useRef(false);
  // Keeps latest open conversation for socket/window handlers (avoids stale closure vs ObjectId/string ids)
  const openConversationIdRef = useRef<any>(null);
  openConversationIdRef.current = openConversationId;
  // Avoid parallel openConversation() for the same URL id (list/socket can retrigger the effect)
  const urlConversationOpenInFlightRef = useRef<string | null>(null);

  // Get agent data from localStorage (for agent-inbox context); re-sync when admin updates profile via socket
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadAgentFromStorage = () => {
      const agentData = localStorage.getItem('agent');
      if (agentData) {
        try {
          const parsedAgent = JSON.parse(agentData);
          setAgent(parsedAgent);
        } catch (error) {
          console.error('Error parsing agent data:', error);
        }
      }
    };

    loadAgentFromStorage();
    window.addEventListener('agent-status-updated', loadAgentFromStorage);
    return () => window.removeEventListener('agent-status-updated', loadAgentFromStorage);
  }, []);

  // Get client agent data from localStorage and API (for client-inbox context)
  useEffect(() => {
    if (typeof window !== 'undefined' && !agent) {
      const clientAgentData = localStorage.getItem('clientAgent');
      if (clientAgentData) {
        try {
          const parsedClientAgent = JSON.parse(clientAgentData);
          console.log('Loading client agent from localStorage:', parsedClientAgent);
          setClient(parsedClientAgent);
        } catch (error) {
          console.error('Error parsing client agent data:', error);
        }
      }
      
      // Always fetch client data from API to ensure we have the latest status
      const fetchClientData = async () => {
        try {
          const data = await getClientData();
          console.log('Fetched client data from API:', data);
          // Use clientAgent if available, otherwise fallback to client
          if (data && data.clientAgent) {
            const clientAgentInfo = {
              _id: data.clientAgent._id,
              userId: data.clientAgent.userId,
              email: data.clientAgent.email,
              name: data.clientAgent.name,
              isActive: data.clientAgent.isActive !== undefined ? data.clientAgent.isActive : false,
              lastActive: data.clientAgent.lastActive,
              isClient: true,
            };
            console.log('Setting client agent state:', clientAgentInfo);
            setClient(clientAgentInfo);
            localStorage.setItem('clientAgent', JSON.stringify(clientAgentInfo));
          } else if (data && data.client) {
            // Fallback: if no clientAgent, try to get from agent localStorage
            const agentData = localStorage.getItem('agent');
            if (agentData) {
              try {
                const parsedAgent = JSON.parse(agentData);
                if (parsedAgent.isClient) {
                  setClient(parsedAgent);
                  localStorage.setItem('clientAgent', JSON.stringify(parsedAgent));
                }
              } catch (error) {
                console.error('Error parsing agent data:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching client data:', error);
        }
      };
      
      // Fetch from API to get latest status
      fetchClientData();
    }
  }, [agent]);

  // Listen for client status changes from profile menu
  useEffect(() => {
    const handleClientStatusChange = (event: CustomEvent) => {
      const updatedClient = event.detail;
      console.log('Client status changed event received:', updatedClient);
      setClient((prevClient: any) => {
        const newClient = { ...prevClient, ...updatedClient };
        console.log('Updating client state:', newClient);
        return newClient;
      });
    };

    window.addEventListener('client-status-changed', handleClientStatusChange as EventListener);

    return () => {
      window.removeEventListener('client-status-changed', handleClientStatusChange as EventListener);
    };
  }, []);

  // Calculate if agent/client can reply based on conditions
  const canReply = useMemo(() => {
    // Client agent: owner acting as agent (from agent or client state, isClient: true)
    const isClientAgent = (agent && agent.isClient === true) || (client && client.isClient === true);
    // Human agent: employee with assignedAgents (from agent-inbox, has assignedAgents)
    const isHumanAgent = agent && agent.isClient !== true && agent.assignedAgents;

    if (agent) {
      if (agent.isClient === true) {
        if (agent.isActive === false) return false;
        return true;
      }
      if (isHumanAgent) {
        if (agent.isActive === false) return false;
        const currentConversation = conversationsList?.data?.find(
          (conv: any) => conv._id === openConversationId || conv._id?.toString() === openConversationId?.toString()
        );
        if (!currentConversation) return true;
        const convAgentId = currentConversation.agentId;
        const convAgentIdStr = typeof convAgentId === 'string' ? convAgentId : convAgentId?._id?.toString?.() || convAgentId?.toString?.();
        const assigned = agent.assignedAgents || [];
        const isAssignedToThisAgent = assigned.some((aid: any) => (aid?.toString?.() || aid) === convAgentIdStr);
        return isAssignedToThisAgent;
      }
    }

    // Client dashboard: client from localStorage/API (clientAgent with isClient: true)
    if (client && client.isClient === true) {
      if (client.isActive === false) return false;
      return true;
    }

    // Fallback: no agent/client context
    return true;
  }, [agent, client, conversationsList?.data, openConversationId]);

  /**
   * Client: ClientProfileMenu Accept Chats. Human agent: agent-inbox sidebar Status (Active/Inactive).
   * When off/inactive, agent connection Accept/Decline are disabled.
   */
  const acceptChatsEnabled = useMemo(() => {
    if (agent?.isClient === true) return agent.isActive !== false;
    if (agent && agent.isClient !== true && agent.assignedAgents) {
      return agent.isActive !== false;
    }
    if (client?.isClient === true) return client.isActive !== false;
    return true;
  }, [agent, client]);

  // Clear AI typing when conversation changes
  useEffect(() => {
    setIsAITyping(false);
  }, [openConversationId]);

  // Listen for agent connection notifications (ref = always current id; string compare for Mongo/ObjectId)
  useEffect(() => {
    const sameConversation = (a: any, b: any) =>
      a != null && b != null && String(a) === String(b);

    const handleAgentConnectionNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      console.log("Agent connection notification received:", data);

      // Always store pending request for this conversation (do not require the chat to be
      // open yet). The popup only renders when openConversationId matches — fixes opening
      // from a notification / URL before join + openConversation finishes.
      const cid = String(data.conversationId);
      const dismissed = typeof window !== "undefined"
        ? sessionStorage.getItem(`agentConnectionDismissed:${cid}`)
        : null;
      const startedAt = data.requestStartedAt;
      // Skip popup if this agent already declined (sessionStorage matches requestStartedAt), or if
      // a replay omitted requestStartedAt but we still have a dismiss key (legacy server / edge).
      if (
        dismissed != null &&
        (startedAt == null || String(startedAt) === dismissed)
      ) {
        return;
      }
      setAgentConnectionRequest({
        conversationId: data.conversationId,
        visitorName:
          data.visitor?.visitorDetails?.find((d: any) => d.field === "Name")?.value || "Visitor",
        requestStartedAt: startedAt,
      });
    };

    const handleAgentConnectionCancelled = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      if (sameConversation(data.conversationId, openConversationIdRef.current)) {
        setAgentConnectionRequest(null);
      }
    };

    const handleAgentConnectionTimeout = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      if (sameConversation(data?.conversationId, openConversationIdRef.current)) {
        setAgentConnectionRequest(null);
      }
    };

    /** Another agent (or client-agent) accepted — hide this inbox popup too. */
    const handleAgentConnectionAccepted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      if (sameConversation(data?.conversationId, openConversationIdRef.current)) {
        setAgentConnectionRequest(null);
      }
    };

    window.addEventListener("agent-connection-notification", handleAgentConnectionNotification);
    window.addEventListener("agent-connection-cancelled", handleAgentConnectionCancelled);
    window.addEventListener("agent-connection-timeout", handleAgentConnectionTimeout);
    window.addEventListener("agent-connection-accepted", handleAgentConnectionAccepted);

    return () => {
      window.removeEventListener("agent-connection-notification", handleAgentConnectionNotification);
      window.removeEventListener("agent-connection-cancelled", handleAgentConnectionCancelled);
      window.removeEventListener("agent-connection-timeout", handleAgentConnectionTimeout);
      window.removeEventListener("agent-connection-accepted", handleAgentConnectionAccepted);
    };
  }, []);

  const dismissAgentConnectionPopup = useCallback(() => {
    setAgentConnectionRequest(null);
  }, []);

  useEffect(() => {
    if (!isVisitorClosed || !openConversationId) return;
    setAgentConnectionRequest((prev) => {
      if (!prev) return prev;
      if (String(prev.conversationId) !== String(openConversationId)) return prev;
      return null;
    });
  }, [isVisitorClosed, openConversationId]);

  // Reset all conversation state when the active agent changes
  useEffect(() => {
    const handleAgentChanged = () => {
      setConversationsList({ data: [], loading: true });
      setSearchConversationsList({ data: [], loading: true });
      setConversationMessages({ data: [], loading: false, conversationId: null, visitorName: '' });
      setOpenConversationId(null);
      setOpenVisitorId(null);
      setOpenVisitorIp(null);
      setOpenVisitorName(null);
      setNotesList([]);
      setOldConversationList({ data: [], loading: false });
      setTags([]);
      setOpenConversationStatus('close');
      setAgentConnectionRequest(null);
      hasOpenedFirstRef.current = false;
    };
    window.addEventListener('agent-changed', handleAgentChanged);
    return () => window.removeEventListener('agent-changed', handleAgentChanged);
  }, []);

  // Initialize socket manager
  const {
    socketRef,
    socketConnected,
    // socket,
    emitJoinConversation,
    emitSendMessage,
    emitSendNote,
    emitAddTag,
    emitDeleteTag,
    emitCloseConversation,
    emitBlockVisitor,
    emitSearchConversations,
    emitCloseAIResponse,
    emitMarkMessagesSeen,
    emitCheckPendingAgentRequest,
  } = useSocketManager({
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
    setAITyping: setIsAITyping,
    setIsVisitorClosed,
    status,
    rating,
    handledBy,
    openConversationId,
    openVisitorId,
    openVisitorIp,
    isAIChat,
  });

  // Unified listener for both regular agent and client-agent status updates.
  // Using named handlers so socket.off reliably removes them.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleAgentStatusUpdate = (updatedAgent: any) => {
      if (updatedAgent.isClient) {
        // Client-agent path: update client state + sync agent localStorage if needed
        setClient((prevClient: any) => {
          const updatedClientData = {
            ...(prevClient || {}),
            _id: updatedAgent._id || prevClient?._id,
            userId: updatedAgent.userId || prevClient?.userId,
            email: updatedAgent.email || prevClient?.email,
            name: updatedAgent.name || prevClient?.name,
            isActive: updatedAgent.isActive,
            lastActive: updatedAgent.lastActive,
            isClient: true,
          };
          localStorage.setItem('clientAgent', JSON.stringify(updatedClientData));

          const agentData = localStorage.getItem('agent');
          if (agentData) {
            try {
              const parsedAgent = JSON.parse(agentData);
              if (parsedAgent.isClient) {
                const merged = { ...parsedAgent, ...updatedClientData };
                localStorage.setItem('agent', JSON.stringify(merged));
                setAgent(merged);
              }
            } catch (e) {
              console.error('Error syncing agent data:', e);
            }
          }

          return updatedClientData;
        });
      } else {
        // Human team agent: merge full profile (admin edits name / websites / status from dashboard)
        setAgent((prevAgent: any) => {
          if (!prevAgent) return prevAgent;
          const prevId = prevAgent.id?.toString() || prevAgent._id?.toString();
          const updId = updatedAgent.id?.toString() || updatedAgent._id?.toString();
          if (prevId !== updId) return prevAgent;
          const normalizeAssigned = (arr: any, fb: any) => {
            if (!Array.isArray(arr)) return fb;
            return arr.map((x: any) =>
              typeof x === "string" ? x : String(x?._id ?? x?.id ?? x ?? "")
            );
          };
          const merged = {
            ...prevAgent,
            name: updatedAgent.name ?? prevAgent.name,
            email: updatedAgent.email ?? prevAgent.email,
            isActive: updatedAgent.isActive ?? prevAgent.isActive,
            lastActive:
              updatedAgent.lastActive !== undefined ? updatedAgent.lastActive : prevAgent.lastActive,
            avatar: updatedAgent.avatar !== undefined ? updatedAgent.avatar : prevAgent.avatar,
            status: updatedAgent.status ?? prevAgent.status,
            assignedAgents:
              updatedAgent.assignedAgents != null
                ? normalizeAssigned(updatedAgent.assignedAgents, prevAgent.assignedAgents)
                : prevAgent.assignedAgents,
          };
          localStorage.setItem("agent", JSON.stringify(merged));
          const ids = (merged.assignedAgents || []).map((x: string) => String(x));
          const cur = localStorage.getItem("currentAgentId");
          if (cur && ids.length > 0 && !ids.includes(cur)) {
            localStorage.setItem("currentAgentId", ids[0]);
            window.dispatchEvent(new CustomEvent("agent-changed", { detail: { agentId: ids[0] } }));
          }
          window.dispatchEvent(new CustomEvent("agent-status-updated"));
          return merged;
        });
      }
    };

    const handleClientStatusUpdate = (updatedClientAgent: any) => {
      handleAgentStatusUpdate({ ...updatedClientAgent, isClient: true });
    };

    socket.on('agent-status-updated', handleAgentStatusUpdate);
    socket.on('client-status-updated', handleClientStatusUpdate);

    return () => {
      socket.off('agent-status-updated', handleAgentStatusUpdate);
      socket.off('client-status-updated', handleClientStatusUpdate);
    };
  }, []);

  // Business logic functions (cleaner now without socket code)
  const openConversation = async (ConversationData: any, visitorName: string, index: any) => {
    try {
      const visitorId = ConversationData?.visitor?._id;
      const visitorIp = ConversationData?.visitor?.ip || null;
      const conversationId = ConversationData?._id;
      setOpenVisitorId(visitorId);
      setOpenVisitorIp(visitorIp);
      setOpenVisitorName(visitorName);

      const data = await getConversationMessages(conversationId);
      if (data) {
        // const conversationId = data.chatMessages[0]?.conversation_id;
        history.pushState(null, '', `?conversationId=${conversationId}`);
        
        setConversationMessages({
          data: data.chatMessages,
          loading: false,
          conversationId: conversationId,
          visitorName,
        });
        setOpenConversationStatus(data.conversationOpenStatus);
        setOpenConversationId(conversationId);
        
        // Update current conversation with feedback if available
        if (data.conversationFeedback && ConversationData) {
          setCurrentConversation({
            ...ConversationData,
            feedback: data.conversationFeedback.feedback,
            comment: data.conversationFeedback.comment
          });
        }

        // Check if conversation has new messages before marking as seen
        // Only mark as seen if there are actually new messages to prevent updating updatedAt unnecessarily
        const hasNewMessages = ConversationData?.newMessage > 0;

        // Use socket manager to join conversation
        emitJoinConversation(conversationId, undefined, hasNewMessages);

        // Check for pending agent connection request
        emitCheckPendingAgentRequest(conversationId, (response: any) => {
          if (response?.success && response?.hasPendingRequest === false && typeof window !== "undefined") {
            sessionStorage.removeItem(`agentConnectionDismissed:${String(conversationId)}`);
          }
        });

        // Update conversation list to mark as read (only if there were new messages)
        if (hasNewMessages) {
          setConversationsList((prev: any) => ({
            ...prev,
            data: prev.data?.map((d: any) =>
              d._id === conversationId ? { ...d, newMessage: 0 } : d
            ),
          }));
        }

        // Transform visitor details
        const transformedVisitorDetails =
          ConversationData?.visitor?.visitorDetails?.reduce(
            (acc: any, { field, value }: { field: string; value: string }) => {
              acc[field.toLowerCase()] = value;
              return acc;
            },
            {
              location: ConversationData?.visitor?.location,
              ip: ConversationData?.visitor?.ip,
            }
          );

        setVisitorDetails(transformedVisitorDetails);
        setIsAIChat(ConversationData.aiChat);
        setIsVisitorClosed(ConversationData.visitorClosed === true);
        setCurrentConversation(ConversationData);
      }
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
    }
  };

  const openOldConversation = async (conversationId: any, visitorName: string) => {
    try {
      const data = await getOldConversationMessages({ conversationId });
      if (data) {
        const conversationFromList = conversationsList?.data?.find(
          (conv: any) => conv._id === conversationId || conv._id?.toString() === conversationId?.toString()
        );
        const oldConversationFromList = oldConversationList?.data?.find(
          (conv: any) => conv._id === conversationId || conv._id?.toString() === conversationId?.toString()
        );
        const selectedConversation = conversationFromList || oldConversationFromList;
        const resolvedVisitorName =
          selectedConversation?.visitor?.name ||
          selectedConversation?.visitorName ||
          visitorName ||
          "Visitor";

        history.pushState(null, '', `?conversationId=${conversationId}`);
        setConversationMessages({
          data: data.chatMessages,
          loading: false,
          conversationId: conversationId,
          // visitorName,
          visitorName: resolvedVisitorName,
        });
        setOpenConversationStatus(data.conversationOpenStatus);
        setOpenConversationId(conversationId);
        setOpenVisitorName(resolvedVisitorName);
        setOpenVisitorId(selectedConversation?.visitor?._id || null);
        setOpenVisitorIp(selectedConversation?.visitor?.ip || null);

        // Find and set the conversation data from the list
        let oldConv: any = null;
        if (conversationFromList) {
          // Update with feedback data if available
          setCurrentConversation({
            ...conversationFromList,
            feedback: data.conversationFeedback?.feedback,
            comment: data.conversationFeedback?.comment
          });
        } else {
          // If not in list, try to get from old conversations
          oldConv = oldConversationFromList;
          if (oldConv) {
            // Update with feedback data if available
            setCurrentConversation({
              ...oldConv,
              feedback: data.conversationFeedback?.feedback,
              comment: data.conversationFeedback?.comment
            });
          } else if (data.conversationFeedback) {
            // If conversation not found in lists, create a minimal object with feedback
            setCurrentConversation({
              _id: conversationId,
              feedback: data.conversationFeedback.feedback,
              comment: data.conversationFeedback.comment
            });
          }
        }

        // Check if conversation has new messages before marking as seen
        // Only mark as seen if there are actually new messages to prevent updating updatedAt unnecessarily
        const conversationData = conversationFromList || oldConv;
        const hasNewMessages = conversationData?.newMessage > 0;

        emitJoinConversation(conversationId, undefined, hasNewMessages);
      }
    } catch (error) {
      console.error("Error fetching old conversation messages:", error);
    }
  };

  // Handle notification navigation when already on inbox page
  useEffect(() => {
    const handleNotificationNavigate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { conversationId } = customEvent.detail;
      console.log("Notification navigate to conversation:", conversationId);
      
      // Find the conversation in the list
      const conversation = conversationsList?.data?.find(
        (conv: any) =>
          String(conv._id) === String(conversationId) || String(conv.id) === String(conversationId)
      );
      
      if (conversation) {
        const visitorName = conversation.visitor?.visitorDetails?.find((d: any) => d.field === 'Name')?.value || 
                           conversation.visitorName || 
                           'Visitor';
        await openConversation(conversation, visitorName, 0);
      } else {
        // If conversation not found in list, try to open it directly by ID
        // This might be an old conversation or one that needs to be fetched
        try {
          const data = await getOldConversationMessages({ conversationId });
          if (data && data.chatMessages && data.chatMessages.length > 0) {
            const visitorName = data.visitorName || 'Visitor';
            await openOldConversation(conversationId, visitorName);
          }
        } catch (error) {
          console.error("Error opening conversation from notification:", error);
        }
      }
    };

    window.addEventListener('notification-navigate-to-conversation', handleNotificationNavigate);

    return () => {
      window.removeEventListener('notification-navigate-to-conversation', handleNotificationNavigate);
    };
  }, [conversationsList]);

  const handleMessageSend = () => {
    if (!inputMessage.trim()) return;
    if (isVisitorClosed || isAIChat || openConversationStatus !== "open") return;

    const messageData = {
      message: inputMessage,
      visitorId: openVisitorId,
      conversationId: openConversationId,
      replyTo: replyingTo?._id || null,
    };
    emitSendMessage(messageData, (response: any) => {
      if (response?.chatMessage) {
        setInputMessage("");
        setReplyingTo(null);
      }
    });
  };

  const handleAddNote = () => {
    if (!inputMessage.trim()) return;

    const noteData = {
      message: inputMessage,
      visitorId: openVisitorId,
      conversationId: openConversationId,
      replyTo: replyingTo?._id || null,
    };
    emitSendNote(noteData, (response: any) => {
      if (response?.success) {
        setInputMessage("");
        setReplyingTo(null);
      }
    });
  };

  const handleAddTagClick = async () => {
    try {
      if (!openConversationId || !inputAddTag.trim()) {
        console.error("Cannot add tag: missing conversation ID or tag name");
        return;
      }

      if (tags.length >= 6) {
        console.error("Maximum number of tags (6) reached");
        return;
      }

      setAddTag(false);
      emitAddTag(inputAddTag, openConversationId, () => {
        setInputAddTag("");
      });
    } catch (err) {
      console.error("Error adding tag:", err);
    }
  };

  const handleTagDelete = (id: any) => {
    if (!openConversationId || !id) {
      console.error("Cannot delete tag: missing conversation ID or tag ID");
      return;
    }
    emitDeleteTag(id, openConversationId);
  };

  const handleCloseConversation = async () => {
    if (!openConversationId) {
      console.error("Cannot close conversation: missing conversation ID");
      return;
    }
    emitCloseConversation(openConversationId);
  };

  const handleBlockVisitor = async () => {
    if (!openVisitorId || !openConversationId) {
      console.error("Cannot block visitor: missing visitor ID or conversation ID");
      return;
    }
    emitBlockVisitor(openVisitorId, openConversationId);
  };

  const handleSearchConversations = (searchText: string) => {
    emitSearchConversations(searchText, status);
  };

  const handleToggle = () => {
    if (isAIChat === true) {
      emitCloseAIResponse(openConversationId);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const messageIndex = conversationMessages.data.findIndex(
      (msg: any) =>
        msg._id === messageId ||
        msg._id?.toString?.() === messageId?.toString?.()
    );
    if (messageIndex !== -1) {
      const messageElement = messageRefs.current[messageIndex];
      messageElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Handler functions for child components
  const handleConversationClick = async (conversation: any, visitorName: string, index: number) => {
    await openConversation(conversation, visitorName, index);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearchText(searchValue);
    if (searchValue.trim().length <= 0) {
      setSearchConversationsList({ data: [], loading: false });
    }
  };

  const handleSearchInputClick = () => {
    if (searchText.trim().length > 0) {
      handleSearchConversations(searchText);
    }
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
  };

  const handleRatingChange = (value: string) => {
    setRating(value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length <= MAX_WORDS) {
      setInputMessage(text);
      setWordCount(words.length);
    }
  };

  const handleScrollToMessage = (id: string) => {
    scrollToMessage(id);
  };

  const handleOldConversationClick = async (conversationId: string, visitorName: string) => {
    setOpenConversationId(conversationId);
    await openOldConversation(conversationId, visitorName);
  };

  const handleInputAddTagChange = (value: string) => {
    setInputAddTag(value);
  };

  const handleAddTag = () => {
    setAddTag(true);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollTimeout = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 100);

    return () => clearTimeout(scrollTimeout);
  }, [conversationMessages?.data]);

  // Reset the guard whenever the user switches tabs so the first conversation of
  // the new tab is auto-opened, but do NOT reset it on list-length changes (new
  // visitor connects / disconnects) — that was the main flicker source.
  useEffect(() => {
    hasOpenedFirstRef.current = false;
  }, [status]);

  // Open chat from ?conversationId= whenever URL or list updates (e.g. notification bell router.push).
  // Otherwise open the first conversation once (no URL param).
  useEffect(() => {
    if (conversationsList.loading) return;

    const visitorDisplayName = (conv: any) =>
      conv?.visitor?.visitorDetails?.find((d: any) => d.field === "Name")?.value ||
      conv?.visitor?.name ||
      "Visitor";

    const run = async () => {
      if (currentConversationId) {
        const cid = String(currentConversationId);
        const conv = conversationsList?.data?.find((con: any) => String(con._id) === cid);
        if (!conv) return;
        // Do NOT skip just because openConversationId was hydrated from the URL on first paint.
        // We must still run openConversation() to load messages, join the socket room, and run
        // emitCheckPendingAgentRequest (accept/decline popup) — e.g. when opening inbox from another tab.
        const messagesLoadedForUrl =
          String(conversationMessages?.conversationId ?? "") === cid &&
          !conversationMessages?.loading;
        if (messagesLoadedForUrl) return;
        if (urlConversationOpenInFlightRef.current === cid) return;
        urlConversationOpenInFlightRef.current = cid;
        try {
          await openConversation(conv, visitorDisplayName(conv), 0);
        } finally {
          if (urlConversationOpenInFlightRef.current === cid) {
            urlConversationOpenInFlightRef.current = null;
          }
        }
        return;
      }

      if (hasOpenedFirstRef.current) return;
      if (!conversationsList?.data?.length) return;
      if (!(status === "open" || status === "all")) return;

      hasOpenedFirstRef.current = true;
      const first = conversationsList.data[0];
      await openConversation(first, visitorDisplayName(first), 0);
    };

    void run();
  }, [
    currentConversationId,
    conversationMessages?.conversationId,
    conversationMessages?.loading,
    status,
    conversationsList.loading,
    conversationsList?.data,
  ]);

  // Mark messages as seen only when the open conversation changes — not on every
  // list update. Removing conversationsList?.data from deps prevents spurious
  // re-fires when another conversation's count increments.
  useEffect(() => {
    if (!openConversationId) return;

    setConversationsList((prev: any) => {
      const hasNewMessages = prev.data?.some(
        (conv: any) => conv._id === openConversationId && conv.newMessage >= 1
      );
      if (!hasNewMessages) return prev;

      emitMarkMessagesSeen(openConversationId);
      return {
        ...prev,
        data: prev.data?.map((d: any) =>
          d._id === openConversationId ? { ...d, newMessage: 0 } : d
        ),
      };
    });
  }, [openConversationId, emitMarkMessagesSeen]);

  // Find the visitor's last message preceding a given AI message index
  const getVisitorMessageBefore = (aiMessageIndex: number): string => {
    const messages = conversationMessages?.data || [];
    for (let i = aiMessageIndex - 1; i >= 0; i--) {
      if (messages[i]?.sender_type === 'visitor') {
        const raw = messages[i].message || '';
        // Strip HTML tags for cleaner display
        return raw.replace(/<[^>]+>/g, '').trim();
      }
    }
    return '';
  };

  const handleReply = (messageData: any) => {
    const human = messageData.humanAgentId;
    const humanName =
      human && typeof human === 'object' && 'name' in human ? human.name : undefined;
    const agent = messageData.agentId;
    const agentDisplay =
      agent && typeof agent === 'object'
        ? agent.name || agent.agentName
        : undefined;
    const senderName =
      messageData.sender_type === 'visitor'
        ? conversationMessages?.visitorName || 'Visitor'
        : humanName || agentDisplay || 'Agent';
    setReplyingTo({
      _id: messageData._id,
      message: messageData.message || '',
      sender_type: messageData.sender_type,
      senderName,
    });
  };

  const handleReviseAnswer = (messageData: any) => {
    // messageData has .message (AI response). Find preceding visitor message from the messages list.
    const messages = conversationMessages?.data || [];
    const idx = messages.findIndex((m: any) => m._id === messageData._id);
    const visitorMessage = idx >= 0 ? getVisitorMessageBefore(idx) : '';
    const agentResponse = messageData.message || '';
    setReviseAnswerModal({ visitorMessage, agentResponse });
  };

  console.log(openConversationStatus, "openConversationStatus status");
  console.log(openConversationId, "openConversationId the id");

  return (
    <>
    {(!socketConnected || conversationsList.loading || (openConversationId && conversationMessages.loading)) && <InboxSkeleton />}
    <div className={`rounded-tl-[30px] bg-[#F3F4F6] px-4 pb-[33px] pt-6 lg:px-6 flex gap-6 h-[calc(100vh-89px)] ${(!socketConnected || conversationsList.loading || (openConversationId && conversationMessages.loading)) ? 'hidden' : ''}`}>
      <ConversationsList
        conversationsList={conversationsList}
        searchConversationsList={searchConversationsList}
        openConversationId={openConversationId}
        searchText={searchText}
        status={status}
        rating={rating}
        sortBy={sortBy}
        onConversationClick={handleConversationClick}
        onSearchInputChange={handleSearchInputChange}
        onSearchInputClick={handleSearchInputClick}
        onStatusChange={handleStatusChange}
        onRatingChange={handleRatingChange}
        onSortChange={handleSortChange}
      />

      {isConversationAvailable ? (
        <>
          {conversationMessages?.data?.length > 1 ? (
            <div className="flex-1 flex flex-col relative bg-white rounded-[20px]">
              <ChatHeader
                visitorName={conversationMessages.visitorName}
                isAIChat={isAIChat}
                isVisitorClosed={isVisitorClosed}
                openConversationStatus={openConversationStatus}
                tags={tags}
                inputAddTag={inputAddTag}
                onToggleAI={handleToggle}
                onCloseConversation={handleCloseConversation}
                onBlockVisitor={handleBlockVisitor}
                onAddTagClick={handleAddTagClick}
                onTagDelete={handleTagDelete}
                onInputAddTagChange={handleInputAddTagChange}
                canReply={canReply}
              />

              {agentConnectionRequest &&
                String(agentConnectionRequest.conversationId) === String(openConversationId) && (
                <AgentConnectionRequest
                  conversationId={agentConnectionRequest.conversationId}
                  visitorName={agentConnectionRequest.visitorName}
                  requestStartedAt={agentConnectionRequest.requestStartedAt}
                  socketRef={socketRef}
                  acceptChatsEnabled={acceptChatsEnabled}
                  onExpired={dismissAgentConnectionPopup}
                  onAccept={() => {
                    if (typeof window !== "undefined" && agentConnectionRequest?.conversationId != null) {
                      sessionStorage.removeItem(
                        `agentConnectionDismissed:${String(agentConnectionRequest.conversationId)}`
                      );
                    }
                    setAgentConnectionRequest(null);
                    setIsAIChat(false);
                  }}
                  onDecline={() => {
                    if (
                      typeof window !== "undefined" &&
                      agentConnectionRequest?.requestStartedAt != null &&
                      agentConnectionRequest.conversationId != null
                    ) {
                      sessionStorage.setItem(
                        `agentConnectionDismissed:${String(agentConnectionRequest.conversationId)}`,
                        String(agentConnectionRequest.requestStartedAt)
                      );
                    }
                    setAgentConnectionRequest(null);
                  }}
                />
              )}

              <MessagesArea
                ref={containerRef}
                conversationMessages={conversationMessages}
                expandedSources={expandedSources}
                setExpandedSources={setExpandedSources}
                messageRefs={messageRefs}
                currentConversation={currentConversation}
                isAITyping={isAITyping}
                onReviseAnswer={handleReviseAnswer}
                onReply={handleReply}
                onJumpToReply={handleScrollToMessage}
              />
              <MessageInput
                inputMessage={inputMessage}
                wordCount={wordCount}
                maxWords={MAX_WORDS}
                isNoteActive={isNoteActive}
                isAIChat={isAIChat}
                isVisitorClosed={isVisitorClosed}
                openConversationStatus={openConversationStatus}
                conversationId={openConversationId}
                visitorId={openVisitorId}
                socketRef={socketRef}
                onInputChange={handleInputChange}
                onMessageSend={handleMessageSend}
                onAddNote={handleAddNote}
                setIsNoteActive={setIsNoteActive}
                canReply={canReply}
                replyingTo={replyingTo}
                onClearReply={() => setReplyingTo(null)}
                onJumpToReplyPreview={handleScrollToMessage}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white rounded-[20px]">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Conversation</h3>
                <p className="text-sm text-gray-500">This conversation is currently closed or not available.</p>
              </div>
            </div>
          )}

          <DetailsPanel
            visitorDetails={visitorDetails}
            notesList={notesList}
            oldConversationList={oldConversationList}
            openConversationId={openConversationId}
            openVisitorName={openVisitorName}
            onScrollToMessage={handleScrollToMessage}
            onOldConversationClick={handleOldConversationClick}
            currentConversation={currentConversation}
            openConversationStatus={openConversationStatus}
            isAIChat={isAIChat}
          />
        </>
      ) : (
        <EmptyState />
      )}

      {/* Revise Answer Modal */}
      {reviseAnswerModal && (
        <ReviseAnswerModal
          visitorMessage={reviseAnswerModal.visitorMessage}
          agentResponse={reviseAnswerModal.agentResponse}
          agentId={
            (typeof currentConversation?.agentId === 'string'
              ? currentConversation.agentId
              : currentConversation?.agentId?._id) || ''
          }
          userId={
            (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') || ''
          }
          onClose={() => setReviseAnswerModal(null)}
          onSuccess={() => {/* answer stored, Qdrant updated */}}
        />
      )}
    </div>
    </>
  );
}