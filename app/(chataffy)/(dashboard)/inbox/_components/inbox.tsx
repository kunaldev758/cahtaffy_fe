"use client";
import Image from "next/image";
import searchIconImage from "@/images/search-icon.svg";
import closeSmallImage from "@/images/close-small.svg";
import sendIconImage from "@/images/send-icon.svg";
import chatMessageIconImage from "@/images/chat-message-icon.svg";
import chatNoteIconImage from "@/images/chat-note-icon.svg";
import micIconImage from "@/images/mic-icon.svg";
import { useState, useRef, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Message from "./message";
import { io, Socket } from 'socket.io-client';
import { formatDistanceToNow, format } from "date-fns";
import { 
  Search, 
  Send, 
  Mic, 
  X, 
  Plus, 
  MessageCircle, 
  StickyNote, 
  Settings,
  Phone,
  Clock,
  Tag,
  ChevronDown,
  UserX,
  PhoneOff,
  MoreVertical,
  MapPin,
  Globe
} from "lucide-react";

import {
  getConversationMessages,
  getOldConversationMessages,
} from "@/app/_api/dashboard/action";

export default function Inbox(Props: any) {
  const [expandedSources, setExpandedSources] = useState<null | number>(null);
  const [credit, setCredit] = useState({ used: 0, total: 0 });
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
  const [openConversationId, setOpenConversationId] = useState<any>(null);
  const [isNoteActive, setIsNoteActive] = useState<boolean>(false);
  const [notesList, setNotesList] = useState<any>([]);
  const [oldConversationList, setOldConversationList] = useState<any>({
    data: [],
    loading: true,
  });
  const [visitorDetails, setVisitorDetails] = useState<any>();
  const [status, setStatus] = useState("open");
  const [searchText, setSearchText] = useState("");
  const [addTag, setAddTag] = useState<boolean>(false);
  const [inputAddTag, setInputAddTag] = useState<string>("");
  const [tags, setTags] = useState<any>([]);
  const [openConversationStatus, setOpenConversationStatus] = useState<any>("close");
  const [isAIChat, setIsAIChat] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  console.log(openConversationStatus,"openConversationStatus status")
  // All your original useEffects and functions remain the same
  useEffect(() => {
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

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const openConversation = async (ConversationData: any, visitorName: string, index: any) => {
    try {
      const socket = socketRef.current;
      if (!socket) return;
      console.log(ConversationData,"ConversationData")

      const visitorId = ConversationData?.visitor?._id;
      setOpenVisitorId(visitorId);
      setOpenVisitorName(visitorName);

      const data = await getConversationMessages(visitorId);
      if (data) {
        const conversationId = data.chatMessages[0]?.conversation_id;

        setConversationMessages({
          data: data.chatMessages,
          loading: false,
          conversationId: conversationId,
          visitorName,
        });
        setOpenConversationStatus(data.conversationOpenStatus);
        setOpenConversationId(conversationId);

        socket.emit("set-conversation-id", { conversationId }, (response: any) => {
          if (response && response.success) {
            console.log("Successfully joined conversation room:", conversationId);

            socket.emit("message-seen", { conversationId }, (seenResponse: any) => {
              if (seenResponse && !seenResponse.success) {
                console.error("Failed to mark messages as seen:", seenResponse.error);
              }
            });

            fetchConversationTags(conversationId);
          } else {
            console.error("Failed to join conversation room:", response?.error || "Unknown error");
          }
        });

        setConversationsList((prev: any) => ({
          ...prev,
          data: prev.data?.map((d: any) =>
            d._id === conversationId ? { ...d, newMessage: 0 } : d
          ),
        }));

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
      }
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
    }
  };

  const openOldConversation = async (conversationId: any, visitorName: string) => {
    try {
      const socket = socketRef.current;
      if (!socket) return;
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

        socket.emit("set-conversation-id", { conversationId }, (response: any) => {
          if (response && response.success) {
            console.log("Successfully joined conversation room:", conversationId);
          } else {
            console.error("Failed to join conversation room:", response?.error || "Unknown error");
          }
        });

      }
    } catch (error) {
      console.error("Error fetching old conversation messages:", error);
    }
  };

  const handleMessageSend = () => {
    const socket = socketRef.current;
    if (!inputMessage.trim() || !socket) return;

    const messageData = { message: inputMessage, visitorId: openVisitorId };
    socket.emit("client-send-message", messageData, (response: any) => {
      if (response?.chatMessage) {
        setInputMessage("");
      }
    });
  };

  const handleAddNote = () => {
    const socket = socketRef.current;
    if (!inputMessage.trim() || !socket) return;

    const noteData = {
      message: inputMessage,
      visitorId: openVisitorId,
      conversationId: openConversationId,
    };
    socket.emit("client-send-add-note", noteData);
    setInputMessage("");
  };

  const fetchConversationTags = (conversationId?: string) => {
    const socket = socketRef.current;
    const convId = conversationId || openConversationId;

    if (!socket || !convId) {
      console.log("Cannot fetch tags: missing socket or conversation ID");
      return;
    }

    socket.emit("get-conversation-tags", { conversationId: convId }, (response: any) => {
      if (response && response.success) {
        console.log(response.tags,"response.tags")
        setTags(response.tags);
      } else {
        console.error("Failed to fetch tags:", response?.error || "Unknown error");
      }
    });
  };

  const handleAddTagClick = async () => {
    try {
      const socket = socketRef.current;
      if (!socket || !openConversationId || !inputAddTag.trim()) {
        console.error("Cannot add tag: missing socket, conversation ID, or tag name");
        return;
      }
console.log(tags.length,"tags.length")
      if (tags.length >= 6) {
        console.error("Maximum number of tags (6) reached");
        return;
      }

      setAddTag(false);

      socket.emit(
        "add-conversation-tag",
        { name: inputAddTag.trim(), conversationId: openConversationId },
        (response: any) => {
          setInputAddTag("");

          if (response && response.success) {
            console.log("Tag added successfully");
            fetchConversationTags();
          } else {
            console.error("Failed to add tag:", response?.error || "Unknown error");
          }
        }
      );
    } catch (err) {
      console.error("Error adding tag:", err);
    }
  };

  const handleTagDelete = (id: any) => {
    try {
      const socket = socketRef.current;
      if (!socket || !openConversationId || !id) {
        console.error("Cannot delete tag: missing socket, conversation ID, or tag ID");
        return;
      }

      socket.emit(
        "remove-conversation-tag",
        { id, conversationId: openConversationId },
        (response: any) => {
          if (response && response.success) {
            console.log("Tag deleted successfully");
            fetchConversationTags();
          } else {
            console.error("Failed to delete tag:", response?.error || "Unknown error");
          }
        }
      );
    } catch (err) {
      console.error("Error deleting tag:", err);
    }
  };

  const handleCloseConversation = async () => {
    try {
      const socket = socketRef.current;
      if (!socket || !openConversationId) {
        console.error("Cannot close conversation: missing socket or conversation ID");
        return;
      }

      socket.emit(
        "close-conversation",
        { conversationId: openConversationId, status: "close" },
        (response: any) => {
          if (response && response.success) {
            console.log("Conversation closed successfully");
            setOpenConversationStatus("close");
          } else {
            console.error("Failed to close conversation:", response?.error || "Unknown error");
          }
        }
      );
    } catch (err) {
      console.error("Error closing conversation:", err);
    }
  };

  const handleBlockVisitor = async () => {
    try {
      const socket = socketRef.current;
      if (!socket || !openVisitorId || !openConversationId) {
        console.error("Cannot block visitor: missing socket, visitor ID, or conversation ID");
        return;
      }

      socket.emit(
        "block-visitor",
        { visitorId: openVisitorId, conversationId: openConversationId },
        (response: any) => {
          if (response && response.success) {
            console.log("Visitor blocked successfully");
            setOpenConversationStatus("close");
          } else {
            console.error("Failed to block visitor:", response?.error || "Unknown error");
          }
        }
      );
    } catch (err) {
      console.error("Error blocking visitor:", err);
    }
  };

  const handleSearchConversations = (searchText: string) => {
    try {
      const socket = socketRef.current;
      socket?.emit(
        "search-conversations",
        { query: searchText, status: status },
        (response: any) => {
          if (response.success) {
            setSearchConversationsList({ data: response.data, loading: false });
          } else {
            console.error("Search Error:", response.error);
          }
        }
      );
    } catch (err) {
      console.error("Error in search:", err);
    }
  };

  const handleSearchInputChange = (e: any) => {
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

  const handleChange = (event: any) => {
    setStatus(event.target.value);
  };

  const handleAddTag = () => {
    setAddTag(true);
  };

  const handleToggle = () => {
    try {
      const socket = socketRef.current;
      if (isAIChat === true) {
        socket?.emit(
          "close-ai-response",
          { conversationId: openConversationId }
        );
      }
    } catch (err) {
      console.error("Error blocking visitor:", err);
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

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-purple-100 text-purple-600",
      "bg-blue-100 text-blue-600", 
      "bg-green-100 text-green-600",
      "bg-yellow-100 text-yellow-600",
      "bg-pink-100 text-pink-600",
      "bg-indigo-100 text-indigo-600"
    ];
    return colors[index % colors.length];
  };

  // All other useEffects remain the same...
  useEffect(() => {
    const socket = socketRef.current;
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

    socket.on("new-message-count", handleNewMessageCount);
    socket.on("conversation-append-message", handleAppendMessage);

    return () => {
      socket.off("conversation-append-message", handleAppendMessage);
      socket.off("visitor-close-chat");
    };
  }, [socketRef.current]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const userId = localStorage.getItem("userId");

    if (status == "open") {
      socket.emit("get-open-conversations-list", { userId });
      socket.on("get-open-conversations-list-response", handleOpenConversationsListResponse);

      return () => {
        socket.off("get-open-conversations-list-response", handleOpenConversationsListResponse);
      };
    } else {
      socket.emit("get-close-conversations-list", { userId });
      socket.on("get-close-conversations-list-response", handleCloseConversationsListResponse);

      return () => {
        socket.off("get-close-conversations-list-response", handleCloseConversationsListResponse);
      };
    }
  }, [status, socketRef.current,isAIChat]);

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
    status == 'open' && setConversationsList({ 
      data: data.conversations.filter((conv: any) => conv.is_started === true), 
      loading: false 
    });
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const userId = localStorage.getItem("userId");

    socket.on("visitor-connect-list-update", () => {
      socket.emit("get-open-conversations-list", { userId });
    });

    socket.on(
      "get-open-conversations-list-response",
      handleOpenConversationsListUpdateResponse
    );

    return () => {
      socket.off(
        "get-open-conversations-list-response",
        handleOpenConversationsListUpdateResponse
      );
    };
  }, [socketRef.current]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNoteAppendMessage = ({ note }: any) => {
      console.log(note, "new note data");

      setNotesList((prev: any) => [
        ...prev,
        { message: note.message, createdAt: Date.now() }
      ]);

      setConversationMessages((prev: any) => ({
        ...prev,
        data: [...prev.data, {
          message: note.message,
          is_note: 'true',
          sender_type: "agent",
          createdAt: Date.now()
        }],
      }));
    };

    socket.on("note-append-message", handleNoteAppendMessage);
    return () => {
      socket.off("note-append-message", handleNoteAppendMessage);
    };
  }, [socketRef.current]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (openConversationId) {
      socket.emit(
        "get-all-note-messages",
        { conversationId: openConversationId },
        (response: any) => {
          if (response.success) {
            setNotesList(response.notes);
          } else {
            console.error("Error fetching notes:", response.error);
          }
        }
      );
    }
    if (openVisitorId) {
      socket.emit(
        "get-visitor-old-conversations",
        { visitorId: openVisitorId },
        (response: any) => {
          if (response.success) {
            setOldConversationList({
              data: response.conversations,
              loading: false,
            });
          } else {
            console.error("Error fetching notes:", response.error);
          }
        }
      );
    }
    if(!openConversationId){
      setNotesList([])
    }
  }, [socketRef.current, openConversationId, openVisitorId]);

  const getConvTags = (data: any) => {
    if (data && data.tags) {
      console.log("Received tags:", data.tags);
      setTags(data.tags);
    } else {
      console.error("Received invalid tag data:", data);
    }
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("get-tags-response", getConvTags);

    return () => {
      socket.off("get-tags-response", getConvTags);
    };
  }, [socketRef.current]);

  useEffect(() => {
    if (openConversationId) {
      fetchConversationTags();
    }
  }, [openConversationId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleConversationClose = (data: any) => {
      console.log("Conversation closed event received:", data);
      setOpenConversationStatus("close");
    };

    const handleVisitorBlocked = (data: any) => {
      console.log("Visitor blocked event received:", data);
      setOpenConversationStatus("close");
    };

    socket.on('conversation-close-triggered', handleConversationClose);
    socket.on('visitor-blocked', handleVisitorBlocked);
    socket.on('visitor-conversation-close', handleConversationClose);

    return () => {
      socket.off('conversation-close-triggered', handleConversationClose);
      socket.off('visitor-blocked', handleVisitorBlocked);
      socket.off('visitor-conversation-close', handleConversationClose);
    };
  }, [socketRef.current]);

  useEffect(() => {
    const scrollTimeout = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 100);

    return () => clearTimeout(scrollTimeout);
  }, [conversationMessages?.data]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handleAiResponse = () => {
      setIsAIChat(false);
    }
    socket.on("ai-response-update", handleAiResponse);
  }, [socketRef.current]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length <= MAX_WORDS) {
      setInputMessage(text);
      setWordCount(words.length);
    }
  };
  useEffect(() => {
    const openFirstConversation = async () => {
      if(conversationsList?.data?.length > 0 && status === "open"){
        console.log(conversationsList?.data[0], "conversationsList?.data[0] hello")
        await openConversation(conversationsList?.data[0], conversationsList?.data[0]?.visitor?.name, 0)
      }
    };
    
    openFirstConversation();
  },[status,conversationsList?.data?.length])

  console.log(openConversationId, "openConversationId the id")

  return (
    <>
        <div className="flex h-screen bg-gray-50">
          {/* Conversations List */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900 mb-4">Inbox</h1>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchText}
                  onChange={handleSearchInputChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchInputClick();
                    }
                  }}
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="newest"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                
                <select 
                  value={status}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="close">Closed</option>
                </select>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {conversationsList.loading ? (
                <div className="p-4 space-y-4">
                  {[...Array(8)].map((_, index) => (
                    <div className="flex items-center space-x-3" key={index}>
                      <div className="w-10 h-10 rounded-full">
                        <Skeleton circle height={40} width={40} />
                      </div>
                      <div className="flex-1">
                        <Skeleton height={16} width="60%" />
                        <Skeleton height={14} width="80%" className="mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {(searchConversationsList.data.length ? searchConversationsList.data : conversationsList.data)
                    .map((conversation: any, index: any) => (
                      <div
                        key={conversation._id}
                        onClick={async () => await openConversation(conversation, conversation?.visitor?.name, index)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          openConversationId === conversation._id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${getAvatarColor(index)}`}>
                            {conversation?.visitor?.name?.[0] || 'U'}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {conversation?.visitor?.name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {conversation.updatedAt ? format(new Date(conversation.updatedAt), 'dd/MM/yy') : 'Now'}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 truncate">
                              {conversation?.visitor?.lastMessage || conversation?.lastMessage}
                            </p>
                            
                            {conversation.newMessage > 0 && (
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full mt-1">
                                {conversation.newMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          {isConversationAvailable ? ( 
          <>
          {conversationMessages?.data?.length>1 ?
          (<div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {conversationMessages.visitorName}
                  </h2>
                  
                  {/* AI Toggle */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">AI Chat</span>
                    <button
                      onClick={handleToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isAIChat ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isAIChat ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-600">Agent Chat</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {openConversationStatus === "open" ? (
                    <button 
                      onClick={handleCloseConversation}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <PhoneOff className="w-4 h-4 mr-2" />
                      Close Conversation
                    </button>
                  ) : (
                    <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg cursor-not-allowed">
                      <PhoneOff className="w-4 h-4 mr-2" />
                      Conversation Closed
                    </button>
                  )}
                  
                  {openConversationStatus === "open" ? (
                    <button 
                      onClick={handleBlockVisitor}
                      className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Block Visitor
                    </button>
                  ) : (
                    <button className="flex items-center px-3 py-2 text-sm font-medium text-red-400 bg-red-25 rounded-lg cursor-not-allowed">
                      <UserX className="w-4 h-4 mr-2" />
                      Visitor Blocked
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center space-x-2 mt-4">
                {tags.map((tag: any) => (
                  <span
                    key={tag._id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag.name}
                    <button
                      onClick={() => handleTagDelete(tag._id)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                
                {addTag ? (
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tag name"
                        value={inputAddTag}
                        onChange={(e) => {
                          if (e.target.value.length <= 30) {
                            setInputAddTag(e.target.value);
                          }
                        }}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTagClick()}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {inputAddTag.length}/30
                      </div>
                    </div>
                    <button
                      onClick={handleAddTagClick}
                      disabled={tags.length >= 6}
                      className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddTag}
                    disabled={tags.length >= 6}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Tag ({tags.length}/6)
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6" ref={containerRef}>
              {conversationMessages.loading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, index) => (
                    <div key={index} className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-xs">
                        <Skeleton height={60} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationMessages?.data?.map((item: any, index: any) => (
                    <div
                      key={index}
                      ref={(el) => {
                        messageRefs.current[index] = el;
                      }}
                    >
                      <Message
                        messageData={item}
                        messageIndex={index}
                        expandedSources={expandedSources}
                        setExpandedSources={setExpandedSources}
                        visitorName={conversationMessages?.visitorName}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-2 mb-4">
                {openConversationStatus === "open" && !isAIChat && (
                  <button
                    onClick={() => setIsNoteActive(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      !isNoteActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </button>
                )}
                
                <button
                  onClick={() => setIsNoteActive(true)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isNoteActive
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  Note
                </button>
              </div>

              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  {isNoteActive || openConversationStatus === "close" ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={handleInputChange}
                        placeholder="Enter note here..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddNote();
                          }
                        }}
                      />
                      <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                        {wordCount}/{MAX_WORDS} words
                      </div>
                    </div>
                  ) : isAIChat ? (
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
                      Chat is disabled. Please disable AI Chat to send messages.
                    </div>
                  ) : (
                    <div className="relative">
                      <textarea
                        value={inputMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleMessageSend();
                          }
                        }}
                      />
                      <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                        {wordCount}/{MAX_WORDS} words
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {!isAIChat && !isNoteActive && openConversationStatus === "open" && (
                    <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={isNoteActive || openConversationStatus === "close" ? handleAddNote : handleMessageSend}
                    disabled={!inputMessage.trim() || (!isNoteActive && isAIChat && openConversationStatus === "open")}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>):(
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Conversation</h3>
              <p className="text-sm text-gray-500">This conversation is currently closed or not available.</p>
            </div>
          </div>
          )}


          {/* Right Sidebar - Details */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Details Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Details</h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Visitor Details */}
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Visitor Information</h4>
                <div className="space-y-3">
                  {visitorDetails && Object.entries(visitorDetails).map(([key, value]: any) => (
                    <div key={key} className="flex">
                      <dt className="text-sm text-gray-500 capitalize w-20 flex-shrink-0">{key}:</dt>
                      <dd className="text-sm text-gray-900 flex-1 break-words">{value}</dd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes Section */}
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Notes</h4>
                {notesList.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {notesList.map((note: any, index: any) => (
                      <div 
                        key={note._id || index} 
                        className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
                        onClick={() => scrollToMessage(note._id)}
                      >
                        <p className="text-sm text-gray-900">{note.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No notes found</p>
                )}
              </div>

              {/* Previous Conversations */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Previous Conversations</h4>
                {oldConversationList.data?.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {oldConversationList.data.map((conversation: any) => (
                      <div 
                        key={conversation._id} 
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          openConversationId === conversation._id 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={async () => {
                          setOpenConversationId(conversation._id);
                          await openOldConversation(conversation._id, openVisitorName);
                        }}
                      >
                        <h6 className="text-xs font-medium text-gray-700 mb-1">@{openVisitorName}</h6>
                        <p className="text-sm text-gray-900 truncate">{conversation.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No previous conversations</p>
                )}
              </div>
            </div>
          </div>
          </>):(
            <div className="flex h-screen w-full bg-gray-50 items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Conversations</h2>
              <p className="text-gray-600">No conversations found. New conversations will appear here.</p>
            </div>
          </div>
          )}
        </div>
    </>
  );
}