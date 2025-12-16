// components/Inbox.tsx (Main refactored component)
"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getConversationMessages, getOldConversationMessages, getClientData } from "@/app/_api/dashboard/action";
import { useSocketManager } from "./hooks/useSocketManager";

// Component imports
import ConversationsList from "./ConversationsList";
import ChatHeader from "./ChatHeader";
import MessagesArea from "./MessagesArea";
import MessageInput from "./MessageInput";
import DetailsPanel from "./DetailsPanel";
import EmptyState from "./EmptyState";
import AgentConnectionRequest from "./AgentConnectionRequest";

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
    loading: true,
    conversationId: null,
    visitorName: "",
  });
  const [inputMessage, setInputMessage] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const MAX_WORDS = 100;
  const [openVisitorId, setOpenVisitorId] = useState<any>(null);
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
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("lastActivity");
  const [addTag, setAddTag] = useState<boolean>(false);
  const [inputAddTag, setInputAddTag] = useState<string>("");
  const [tags, setTags] = useState<any>([]);
  const [openConversationStatus, setOpenConversationStatus] = useState<any>("close");
  const [isAIChat, setIsAIChat] = useState(true);
  const [agentConnectionRequest, setAgentConnectionRequest] = useState<{
    conversationId: string;
    visitorName?: string;
  } | null>(null);
  const [agent, setAgent] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [currentConversation, setCurrentConversation] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Get agent data from localStorage (for agent-inbox context)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const agentData = localStorage.getItem('agent');
      if (agentData) {
        try {
          const parsedAgent = JSON.parse(agentData);
          setAgent(parsedAgent);
        } catch (error) {
          console.error('Error parsing agent data:', error);
        }
      }
    }
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
    console.log('🔍 canReply calculation started', { agent: !!agent, client: client?.isActive, agentId: agent?.id });
    
    // Check if this is a client acting as agent (has agent record with isClient: true)
    const isClientAgent = agent && agent.isClient === true;
    
    // If agent exists and is a client agent, use agent logic
    if (agent) {
      // For client agents, check their isActive status
      if (isClientAgent) {
        console.log('👤 Client agent found:', { id: agent.id, isActive: agent.isActive });
      } else {
        console.log('👤 Regular agent found:', { id: agent.id, isActive: agent.isActive });
      }
    } else if (client) {
      // If no agent but client agent data exists, check client agent status
      console.log('👤 Client agent data found (no agent in localStorage):', { id: client._id, isActive: client.isActive });
      // Use client agent data for canReply calculation
      if (client.isActive === false) {
        console.log('❌ Client agent is offline - blocking reply');
        return false;
      }
      // Continue with agent logic using client agent data
    } else {
      // No agent or client data - default to allowing (for initial load)
      console.log('✅ No agent/client context - allowing reply (default)');
      return true;
    }

    // Use agent or client agent data
    const activeAgent = agent || (client && client.isClient ? client : null);
    if (!activeAgent) {
      console.log('❌ No active agent found');
      return false;
    }
    
    console.log('👤 Agent found:', { id: activeAgent.id || activeAgent._id, isActive: activeAgent.isActive, isClient: activeAgent.isClient });

    // Find current conversation
    const currentConversation = conversationsList?.data?.find(
      (conv: any) => conv._id === openConversationId || conv._id?.toString() === openConversationId?.toString()
    );

    if (!currentConversation) {
      console.log('⚠️ No conversation found - checking isActive');
      // If no conversation found, only allow if agent is active
      return activeAgent.isActive === true;
    }

    console.log('💬 Conversation found:', { 
      conversationId: currentConversation._id, 
      agentId: currentConversation.agentId,
      agentIdType: typeof currentConversation.agentId 
    });

    // Get conversation agentId (could be string ID or populated object)
    const conversationAgentId = currentConversation.agentId;
    
    // Extract agentId string for comparison
    const agentIdString = typeof conversationAgentId === 'string' 
      ? conversationAgentId 
      : conversationAgentId?._id?.toString() || conversationAgentId?.id?.toString() || conversationAgentId?.toString();
    
    const agentIdForComparison = activeAgent.id?.toString() || activeAgent._id?.toString() || activeAgent.id;
    
    console.log('🔍 Comparing agentIds:', {
      conversationAgentId: agentIdString,
      agentId: agentIdForComparison,
      match: agentIdString === agentIdForComparison
    });

    // Condition 1: If agent isActive is true AND (conversation is unassigned OR assigned to this agent)
    if (activeAgent.isActive === true) {
      // Allow if conversation is unassigned
      if (conversationAgentId === null || conversationAgentId === undefined) {
        console.log('✅ Agent isActive=true AND conversation is unassigned - allowing reply');
        return true;
      }
      
      // Allow if conversation is assigned to this agent
      if (agentIdString === agentIdForComparison) {
        console.log('✅ Agent isActive=true AND conversation assigned to this agent - allowing reply');
        return true;
      }
      
      // For client agents (isClient: true), allow reply even if conversation is assigned to different agent
      // This handles the case when client accepts a chat
      if (isClientAgent) {
        console.log('✅ Client agent isActive=true - allowing reply (client can accept any conversation)');
        return true;
      }
      
      // Block if conversation is assigned to a different agent (for regular agents)
      console.log('❌ Agent isActive=true BUT conversation assigned to different agent - blocking reply');
      return false;
    }

    // Condition 2: If agent isActive is false, check if conversation is assigned to this agent
    if (activeAgent.isActive === false) {
      console.log('❌ Agent isActive is false - checking conversation assignment');
      
      // For client agents, block if offline (they need to be online to accept chats)
      if (isClientAgent) {
        console.log('❌ Client agent is offline - blocking reply');
        return false;
      }
      
      // Allow reply if conversation agentId is null/undefined (unassigned)
      if (conversationAgentId === null || conversationAgentId === undefined) {
        console.log('✅ Conversation is unassigned (agentId is null/undefined) - allowing reply');
        return true;
      }

      // Allow reply if conversation agentId matches agent id
      if (agentIdString === agentIdForComparison) {
        console.log('✅ Conversation assigned to this agent - allowing reply');
        return true;
      }

      console.log('❌ Conversation not assigned to this agent - blocking reply');
      return false;
    }

    // Fallback: If agent isActive is not explicitly true/false, check conversation assignment
    // Allow reply if conversation agentId is null/undefined (unassigned) or matches agent id
    if (conversationAgentId === null || conversationAgentId === undefined) {
      console.log('✅ Conversation is unassigned (fallback) - allowing reply');
      return true;
    }
    
    if (agentIdString === agentIdForComparison) {
      console.log('✅ Conversation assigned to this agent (fallback) - allowing reply');
      return true;
    }

    // Default: block reply
    console.log('❌ Default case - blocking reply');
    return false;
  }, [agent, client, conversationsList?.data, openConversationId]);

  // Listen for agent connection notifications
  useEffect(() => {
    const handleAgentConnectionNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      console.log("Agent connection notification received:", data);
      
      // If this is for the currently open conversation, show the request
      if (data.conversationId === openConversationId) {
        setAgentConnectionRequest({
          conversationId: data.conversationId,
          visitorName: data.visitor?.visitorDetails?.find((d: any) => d.field === 'Name')?.value || 'Visitor',
        });
      } else {
        // If not the current conversation, navigate to it or show notification
        // For now, we'll just show it if user opens that conversation
      }
    };

    const handleAgentConnectionCancelled = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      if (data.conversationId === openConversationId) {
        setAgentConnectionRequest(null);
      }
    };

    window.addEventListener('agent-connection-notification', handleAgentConnectionNotification);
    window.addEventListener('agent-connection-cancelled', handleAgentConnectionCancelled);

    return () => {
      window.removeEventListener('agent-connection-notification', handleAgentConnectionNotification);
      window.removeEventListener('agent-connection-cancelled', handleAgentConnectionCancelled);
    };
  }, [openConversationId]);

  // Initialize socket manager
  const {
    socketRef,
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
    status,
    openConversationId,
    openVisitorId,
    isAIChat,
  });

  // Listen for socket events to update agent status in real-time
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !agent) return;

    const handleAgentStatusUpdate = (updatedAgent: any) => {
      console.log('Agent status updated via socket in inbox:', updatedAgent);
      // Check if this update is for the current agent
      const agentId = agent.id?.toString() || agent.id;
      const updatedId = updatedAgent.id?.toString() || updatedAgent.id;
      
      if (agentId === updatedId) {
        // Update localStorage and state
        setAgent((prevAgent: any) => {
          const updatedAgentData = {
            ...prevAgent,
            isActive: updatedAgent.isActive,
            lastActive: updatedAgent.lastActive,
          };
          localStorage.setItem('agent', JSON.stringify(updatedAgentData));
          return updatedAgentData;
        });
      }
    };

    // Listen for agent status updates
    socket.on('agent-status-updated', handleAgentStatusUpdate);

    // Cleanup listener on unmount
    return () => {
      if (socket) {
        socket.off('agent-status-updated', handleAgentStatusUpdate);
      }
    };
  }, [agent]);

  // Listen for socket events to update client agent status in real-time
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleClientStatusUpdate = (updatedClientAgent: any) => {
      console.log('Client agent status updated via socket in inbox:', updatedClientAgent);
      
      // Update client agent state
      setClient((prevClient: any) => {
        const updatedClientData = {
          ...(prevClient || {}),
          _id: updatedClientAgent._id || prevClient?._id,
          userId: updatedClientAgent.userId || prevClient?.userId,
          email: updatedClientAgent.email || prevClient?.email,
          name: updatedClientAgent.name || prevClient?.name,
          isActive: updatedClientAgent.isActive,
          lastActive: updatedClientAgent.lastActive,
          isClient: true,
        };
        localStorage.setItem('clientAgent', JSON.stringify(updatedClientData));
        
        // Also update agent localStorage if it exists and is a client agent
        const agentData = localStorage.getItem('agent');
        if (agentData) {
          try {
            const parsedAgent = JSON.parse(agentData);
            if (parsedAgent.isClient) {
              const updatedAgent = { ...parsedAgent, ...updatedClientData };
              localStorage.setItem('agent', JSON.stringify(updatedAgent));
              // Update agent state if it matches
              if (agent && agent.id === updatedClientAgent._id) {
                setAgent(updatedAgent);
              }
            }
          } catch (error) {
            console.error('Error updating agent data:', error);
          }
        }
        
        console.log('Updated client agent state from socket:', updatedClientData);
        return updatedClientData;
      });
    };

    // Listen for both client-status-updated and agent-status-updated (for client agents)
    socket.on('client-status-updated', handleClientStatusUpdate);
    socket.on('agent-status-updated', (updatedAgent: any) => {
      // Only handle if it's a client agent
      if (updatedAgent.isClient) {
        handleClientStatusUpdate(updatedAgent);
      }
    });

    // Cleanup listener on unmount
    return () => {
      if (socket) {
        socket.off('client-status-updated', handleClientStatusUpdate);
        socket.off('agent-status-updated', handleClientStatusUpdate);
      }
    };
  }, [agent]);

  // Business logic functions (cleaner now without socket code)
  const openConversation = async (ConversationData: any, visitorName: string, index: any) => {
    try {
      const visitorId = ConversationData?.visitor?._id;
      setOpenVisitorId(visitorId);
      setOpenVisitorName(visitorName);

      const data = await getConversationMessages(visitorId);
      if (data) {
        const conversationId = data.chatMessages[0]?.conversation_id;
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

        // Use socket manager to join conversation
        emitJoinConversation(conversationId);

        // Check for pending agent connection request
        emitCheckPendingAgentRequest(conversationId, (response: any) => {
          // The backend will emit agent-connection-notification if there's a pending request
          // The event listener will handle setting the state
        });

        // Update conversation list to mark as read
        setConversationsList((prev: any) => ({
          ...prev,
          data: prev.data?.map((d: any) =>
            d._id === conversationId ? { ...d, newMessage: 0 } : d
          ),
        }));

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
        setConversationMessages({
          data: data.chatMessages,
          loading: false,
          conversationId: data.chatMessages[0]?.conversation_id,
          visitorName,
        });
        setOpenConversationStatus(data.conversationOpenStatus);
        setOpenConversationId(data.chatMessages[0]?.conversation_id);

        // Find and set the conversation data from the list
        const conversationFromList = conversationsList?.data?.find(
          (conv: any) => conv._id === conversationId || conv._id?.toString() === conversationId?.toString()
        );
        if (conversationFromList) {
          // Update with feedback data if available
          setCurrentConversation({
            ...conversationFromList,
            feedback: data.conversationFeedback?.feedback,
            comment: data.conversationFeedback?.comment
          });
        } else {
          // If not in list, try to get from old conversations
          const oldConv = oldConversationList?.data?.find(
            (conv: any) => conv._id === conversationId || conv._id?.toString() === conversationId?.toString()
          );
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

        emitJoinConversation(conversationId);
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
      const conversation = conversationsList?.data?.find((conv: any) => conv._id === conversationId || conv.id === conversationId);
      
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

    const messageData = { message: inputMessage, visitorId: openVisitorId };
    emitSendMessage(messageData, (response: any) => {
      if (response?.chatMessage) {
        setInputMessage("");
      }
    });
  };

  const handleAddNote = () => {
    if (!inputMessage.trim()) return;

    const noteData = {
      message: inputMessage,
      visitorId: openVisitorId,
      conversationId: openConversationId,
    };
    emitSendNote(noteData);
    setInputMessage("");
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

  const scrollToMessage = (index: any) => {
    const messageIndex = conversationMessages.data.findIndex(
      (msg: any) => msg._id === index
    );
    if (messageIndex !== -1) {
      const messageElement = messageRefs.current[messageIndex];
      if (messageElement && containerRef.current) {
        containerRef.current.scrollTop =
          messageElement.offsetTop - containerRef.current.offsetTop;
      }
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

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
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

  // Open first conversation when data loads
  useEffect(() => {
    const openFirstConversation = async () => {
      if (currentConversationId) {
        let conv = await conversationsList?.data.find((con: any) => con._id === currentConversationId);
        await openConversation(conv, conv?.visitor?.name, 0);
      } else if (conversationsList?.data?.length > 0 && status === "open") {
        console.log(conversationsList?.data[0], "conversationsList?.data[0] hello");
        await openConversation(conversationsList?.data[0], conversationsList?.data[0]?.visitor?.name, 0);
      }
    };
    
    openFirstConversation();
  }, [status, conversationsList?.data?.length]);

  // Mark messages as seen when conversation changes
  useEffect(() => {
    if (openConversationId && conversationsList?.data) {
      const hasNewMessages = conversationsList.data.some(
        (conv: any) => conv._id === openConversationId && conv.newMessage >= 1
      );
      
      if (hasNewMessages) {
        setConversationsList((prev: any) => ({
          ...prev,
          data: prev.data?.map((d: any) =>
            d._id === openConversationId ? { ...d, newMessage: 0 } : d
          ),
        }));
        emitMarkMessagesSeen(openConversationId);
      }
    }
  }, [openConversationId, conversationsList?.data, emitMarkMessagesSeen]);

  console.log(openConversationStatus, "openConversationStatus status");
  console.log(openConversationId, "openConversationId the id");

  return (
    <div className="flex h-screen bg-gray-50">
      <ConversationsList
        conversationsList={conversationsList}
        searchConversationsList={searchConversationsList}
        openConversationId={openConversationId}
        searchText={searchText}
        status={status}
        sortBy={sortBy}
        onConversationClick={handleConversationClick}
        onSearchInputChange={handleSearchInputChange}
        onSearchInputClick={handleSearchInputClick}
        onStatusChange={handleStatusChange}
        onSortChange={handleSortChange}
      />

      {isConversationAvailable ? (
        <>
          {conversationMessages?.data?.length > 1 ? (
            <div className="flex-1 flex flex-col">
              <ChatHeader
                visitorName={conversationMessages.visitorName}
                isAIChat={isAIChat}
                openConversationStatus={openConversationStatus}
                tags={tags}
                addTag={addTag}
                inputAddTag={inputAddTag}
                onToggleAI={handleToggle}
                onCloseConversation={handleCloseConversation}
                onBlockVisitor={handleBlockVisitor}
                onAddTag={handleAddTag}
                onAddTagClick={handleAddTagClick}
                onTagDelete={handleTagDelete}
                onInputAddTagChange={handleInputAddTagChange}
                setAddTag={setAddTag}
                canReply={canReply}
              />

              <MessagesArea
                ref={containerRef}
                conversationMessages={conversationMessages}
                expandedSources={expandedSources}
                setExpandedSources={setExpandedSources}
                messageRefs={messageRefs}
                currentConversation={currentConversation}
              />

              {agentConnectionRequest && agentConnectionRequest.conversationId === openConversationId && (
                <AgentConnectionRequest
                  conversationId={agentConnectionRequest.conversationId}
                  visitorName={agentConnectionRequest.visitorName}
                  socketRef={socketRef}
                  onAccept={() => {
                    setAgentConnectionRequest(null);
                    setIsAIChat(false);
                  }}
                  onDecline={() => {
                    setAgentConnectionRequest(null);
                  }}
                />
              )}
              <MessageInput
                inputMessage={inputMessage}
                wordCount={wordCount}
                maxWords={MAX_WORDS}
                isNoteActive={isNoteActive}
                isAIChat={isAIChat}
                openConversationStatus={openConversationStatus}
                conversationId={openConversationId}
                visitorId={openVisitorId}
                socketRef={socketRef}
                onInputChange={handleInputChange}
                onMessageSend={handleMessageSend}
                onAddNote={handleAddNote}
                setIsNoteActive={setIsNoteActive}
                canReply={canReply}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
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
          />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}