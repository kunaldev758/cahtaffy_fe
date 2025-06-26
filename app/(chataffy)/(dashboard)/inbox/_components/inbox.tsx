// components/Inbox.tsx (Main refactored component)
"use client";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getConversationMessages, getOldConversationMessages } from "@/app/_api/dashboard/action";
import { useSocketManager } from "./hooks/useSocketManager";

// Component imports
import ConversationsList from "./ConversationsList";
import ChatHeader from "./ChatHeader";
import MessagesArea from "./MessagesArea";
import MessageInput from "./MessageInput";
import DetailsPanel from "./DetailsPanel";
import EmptyState from "./EmptyState";

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
  const [addTag, setAddTag] = useState<boolean>(false);
  const [inputAddTag, setInputAddTag] = useState<string>("");
  const [tags, setTags] = useState<any>([]);
  const [openConversationStatus, setOpenConversationStatus] = useState<any>("close");
  const [isAIChat, setIsAIChat] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Initialize socket manager
  const {
    socketRef,
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

        // Use socket manager to join conversation
        emitJoinConversation(conversationId);

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

        emitJoinConversation(conversationId);
      }
    } catch (error) {
      console.error("Error fetching old conversation messages:", error);
    }
  };

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
        onConversationClick={handleConversationClick}
        onSearchInputChange={handleSearchInputChange}
        onSearchInputClick={handleSearchInputClick}
        onStatusChange={handleStatusChange}
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
              />

              <MessagesArea
                ref={containerRef}
                conversationMessages={conversationMessages}
                expandedSources={expandedSources}
                setExpandedSources={setExpandedSources}
                messageRefs={messageRefs}
              />

              <MessageInput
                inputMessage={inputMessage}
                wordCount={wordCount}
                maxWords={MAX_WORDS}
                isNoteActive={isNoteActive}
                isAIChat={isAIChat}
                openConversationStatus={openConversationStatus}
                onInputChange={handleInputChange}
                onMessageSend={handleMessageSend}
                onAddNote={handleAddNote}
                setIsNoteActive={setIsNoteActive}
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
          />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}