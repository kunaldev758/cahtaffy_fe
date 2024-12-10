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
import { format } from "date-fns";

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
  const [conversationMessages, setConversationMessages] = useState<any>({
    data: [],
    loading: true,
    conversationId: null,
    visitorName: "",
  });
  const [inputMessage, setInputMessage] = useState("");
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

  useEffect(() => {
    const socketInstance = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
      query: {
        token: localStorage.getItem('token'),
      },
      transports: ["websocket", "polling"], // Ensure compatibility
    });

    socketRef.current = socketInstance;

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [openConversationId]);

  // Open conversation and fetch messages
  const openConversation = async (visitorId: any, visitorName: string, index: any) => {
    try {
      const socket = socketRef.current;
      if (!socket) return;

      setOpenVisitorId(visitorId);
      setOpenVisitorName(visitorName);

      const data = await getConversationMessages(visitorId);
      console.log(data, "conv data");
      if (data) {
        setConversationMessages({
          data: data.chatMessages,
          loading: false,
          conversationId: data.chatMessages[0]?.conversation_id,
          visitorName,
        });
        setOpenConversationStatus(data.conversationOpenStatus);
        setOpenConversationId(data.chatMessages[0]?.conversation_id);

        socket.emit("set-conversation-id", { conversationId: data.chatMessages[0]?.conversation_id });

        // setConversationLength(data.chatMessages.length);   
        setIsAIChat(conversationsList.data[index].conversation.aiChat);
      }
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
    }
  };

  // Open old conversation
  const openOldConversation = async (
    conversationId: any,
    visitorName: string
  ) => {
    try {
      console.log(conversationId, visitorName, "kunalll")
      const data = await getOldConversationMessages({ conversationId });
      console.log("old conv", data);
      if (data) {
        setConversationMessages({
          data: data.chatMessages,
          loading: false,
          conversationId: data.chatMessages[0]?.conversation_id,
          visitorName,
        });
        setOpenConversationStatus(data.conversationOpenStatus);
        setOpenConversationId(data.chatMessages[0]?.conversation_id);
        // setConversationLength(data.chatMessages.length);
      }
    } catch (error) {
      console.error("Error fetching old conversation messages:", error);
    }
  };

  // Handle message send
  const handleMessageSend = () => {
    const socket = socketRef.current;
    if (!inputMessage.trim() || !socket) return;

    const messageData = { message: inputMessage, visitorId: openVisitorId };
    socket.emit("client-send-message", messageData, (response: any) => {
      if (response?.chatMessage) {
        setConversationMessages((prev: any) => ({
          ...prev,
          data: [...prev.data, response.chatMessage],
        }));
        setInputMessage("");
      }
    });
  };

  // Handle adding a note
  const handleAddNote = () => {
    const socket = socketRef.current;
    if (!inputMessage.trim() || !socket) return;

    const noteData = {
      message: inputMessage,
      visitorId: openVisitorId,
      conversationId: openConversationId,
    };
    socket.emit("client-send-add-note", noteData);

    setNotesList((prev: any) => [
      ...prev,
      { message: inputMessage, createdAt: Date.now() },
    ]);

    setConversationMessages((prevState: any) => ({
      ...prevState,
      data: [
        ...prevState.data,
        {
          infoSources: [],
          is_note: 'true',
          message: inputMessage,
          sender_type: "agent",
          createdAt: Date.now(),
        },
      ],
    }));
    setInputMessage("");
  };

  //new messages and visitor close chat
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleAppendMessage = (data: any) => {
      console.log(data, "socket conv data");
      setConversationMessages((prev: any) => ({
        ...prev,
        data: [...prev.data, data.chatMessage],
      }));
    };

    socket.on("conversation-append-message", handleAppendMessage);

    socket.on("visitor-close-chat", handleCloseConversationVisitor);
    return () => {
      socket.off("conversation-append-message", handleAppendMessage);
      socket.off("visitor-close-chat");
    };

  }, [socketRef.current])

  // Socket get conversation List
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const userId = localStorage.getItem("userId");

    socket.emit("get-conversations-list", { userId });

    socket.on(
      "get-conversations-list-response",
      handleConversationsListResponse
    );

    return () => {
      socket.off(
        "get-conversations-list-response",
        handleConversationsListResponse
      );
    };
  }, []);

  const handleConversationsListResponse = async (data: any) => {
    console.log("conv list", data.conversations);
    setConversationsList({ data: data.conversations, loading: false });


    let index = data.conversations.findIndex(
      (conv: any) => conv?.conversation?.conversationOpenStatus === "open"
    ) || 0;


    await openConversation(data.conversations[index]._id, data.conversations[index].name, 2);
    // Transform the visitorDetails array to an object
    const transformedVisitorDetails =
      data?.conversations[index]?.visitorDetails?.reduce(
        (acc: any, { field, value }: { field: string; value: string }) => {
          acc[field.toLowerCase()] = value; // Use lowercase keys for consistency
          return acc;
        },
        {
          location: data?.conversations[index]?.location,
          ip: data?.conversations[index]?.ip,
        }
      );

    setVisitorDetails(transformedVisitorDetails);
  };

  const handleConversationsListUpdateResponse = async (data: any) => {
    console.log("conv list", data.conversations);
    setConversationsList({ data: data.conversations, loading: false });
  };

  // conv list update
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const userId = localStorage.getItem("userId");
    // Handle the "visitor-connect-list-update" event
    socket.on("visitor-connect-list-update", () => {
      console.log("list Update")
      socket.emit("get-conversations-list", { userId });
    });

    socket.on(
      "get-conversations-list-response",
      handleConversationsListUpdateResponse
    );

    return () => {
      socket.off(
        "get-conversations-list-response",
        handleConversationsListUpdateResponse
      );
    };

  }, [socketRef.current])

  //old conv and notes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (openConversationId) {
      console.log(openConversationId, "notes openConversationId");
      socket.emit(
        "get-all-note-messages",
        { conversationId: openConversationId },
        (response: any) => {
          if (response.success) {
            console.log("conv notes", response);
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
            console.log("old Conversations", response);
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
  }, [socketRef.current, openConversationId, openVisitorId]);

  const handleAddTagClick = async () => {
    try {
      const socket = socketRef.current;
      setAddTag(false);
      console.log(
        inputAddTag,
        "inputAddTag",
        openConversationId,
        "openConversatinId"
      );

      // Emit event to add a tag to the conversation
      socket?.emit(
        "add-conversation-tag",
        { name: inputAddTag, conversationId: openConversationId },
        (response: any) => {
          if (response.success) {
            console.log("Tag added successfully:", response.tags);
            setTags(response.tags); // Update tags with the response
            setInputAddTag("");
          } else {
            console.error("Failed to add tag:", response.error);
          }
        }
      );
    } catch (err) {
      console.error("Error adding tag:", err);
    }
  };

  //tags socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !openConversationId) return;

    // Fetch tags when the conversation changes
    socket.emit(
      "get-conversation-tags",
      { conversationId: openConversationId },
      (response: any) => {
        if (response.success) {
          console.log("Fetched tags:", response.tags);
          setTags(response.tags);
        } else {
          console.error("Failed to fetch tags:", response.error);
        }
      }
    );
  }, [socketRef.current, openConversationId]);

  const handleTagDelete = async (id: any) => {
    try {
      console.log(id, "id to delete");
      const socket = socketRef.current;
      // Emit event to delete a tag from the conversation
      socket?.emit(
        "remove-conversation-tag",
        { id, conversationId: openConversationId },
        (response: any) => {
          if (response.success) {
            console.log("Tag deleted successfully:", response.tags);
            setTags(response.tags); // Update tags with the response
          } else {
            console.error("Failed to delete tag:", response.error);
          }
        }
      );
    } catch (err) {
      console.error("Error deleting tag:", err);
    }
  };

  const handleCloseConversation = async () => {
    try {
      console.log("button clicked")
      const socket = socketRef.current;
      // Emit event to close the conversation
      socket?.emit(
        "close-conversation",
        { conversationId: openConversationId, status: "close" },
        (response: any) => {
          if (response.success) {
            console.log("Conversation closed successfully.");
            setOpenConversationStatus("close");
          } else {
            console.error("Failed to close conversation:", response.error);
          }
        }
      );
    } catch (err) {
      console.error("Error closing conversation:", err);
    }
  };

  const handleCloseConversationVisitor = () => {
    setOpenConversationStatus("close");
  };

  const handleBlockVisitor = async () => {
    try {
      const socket = socketRef.current;
      // Emit event to block a visitor
      socket?.emit(
        "block-visitor",
        { visitorId: openVisitorId },
        (response: any) => {
          if (response.success) {
            console.log("Visitor blocked successfully.");
          } else {
            console.error("Failed to block visitor:", response.error);
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
      // setSearchConversationsList({ data: [], loading: true });
      console.log(searchText, "Search Query");

      // Emit a search event to the server
      socket?.emit(
        "search-conversations",
        { query: searchText },
        (response: any) => {
          if (response.success) {
            console.log("Search Results:", response.data);
            setConversationsList({ data: response.data, loading: false });
          } else {
            console.error("Search Error:", response.error);
            // setSearchConversationsList({ data: [], loading: false });
          }
        }
      );
    } catch (err) {
      console.error("Error in search:", err);
      // setSearchConversationsList({ data: [], loading: false });
    }
  };

  const debounce = (func: Function, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  // Use this function to update search results when the input changes
  // const handleSearchInputChange = useCallback(
  //   debounce((e: React.ChangeEvent<HTMLInputElement>) => {
  //     const searchValue = e.target.value;
  //     setSearchText(searchValue);
  //     console.log(searchValue, "this is searchValue")
  //     if (searchValue.trim().length > 0) {
  //       handleSearchConversations(searchValue);
  //     } else {
  //       setSearchConversationsList({ data: [], loading: false });
  //     }
  //   }, 300),
  //   [setSearchText]
  // );

  const handleSearchInputChange = (e: any) => {
    const searchValue = e.target.value;
    setSearchText(searchValue);
    console.log(searchValue, "this is searchValue");
  };

  const handleSearchInputClick = () => {
    if (searchText.trim().length > 0) {
      handleSearchConversations(searchText);
    } else {
      // setSearchConversationsList({ data: [], loading: false });
    }
  };

  // Function to handle the change event
  const handleChange = (event: any) => {
    console.log(event.target.value, "this is val");
    setStatus(event.target.value);
  };

  const handleAddTag = () => {
    setAddTag(true);
  };

  // Scroll to the bottom whenever conversationMessages changes
  useEffect(() => {
    // Delay scrolling to ensure the DOM has updated
    const scrollTimeout = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 100); // Adjust delay if necessary

    return () => clearTimeout(scrollTimeout); // Clean up timeout on unmount
  }, [conversationMessages?.data]);

  // Scroll to a specific message
  const scrollToMessage = (index: any) => {
    console.log(index, "msg index");
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

  // Function to handle toggle
  const handleToggle = () => {
    try {
      const socket = socketRef.current;
      // Emit event to block a visitor
      if (isAIChat === true) {
        socket?.emit(
          "close-ai-response",
          { conversationId: openConversationId },
          (response: any) => {
            if (response.success) {
              console.log("Visitor blocked successfully.");
              setIsAIChat(false);
            } else {
              console.error("Failed to block visitor:", response.error);
            }
          }
        );
      }
    } catch (err) {
      console.error("Error blocking visitor:", err);
    }
  };
  return (
    <>
      <div className="main-content-area">
        {isConversationAvailable ? (
          <div className="inbox-area d-flex">
            <div className="chat-listArea">
              <div className="inbox-heading d-flex justify-content-between align-item-center">
                <div className="top-headbar-heading">Inbox</div>
                <div className="chat-listSearch">
                  <input
                    type="text"
                    value={searchText}
                    onChange={handleSearchInputChange}
                    placeholder="Search Conversations"
                    className="search-input"
                  />

                  <button
                    type="button"
                    className="plain-btn"
                    onClick={handleSearchInputClick}
                  >
                    <Image src={searchIconImage} alt="" />
                  </button>
                </div>
              </div>

              <div className="chat-listSection ">
                <div className="chat-listFilter plr-20 ptb-10 d-flex justify-content-between">
                  <div className="custom-dropi plain-dropi">
                    <select className="form-select">
                      <option>Newest</option>
                      <option>Oldest</option>
                    </select>
                  </div>

                  <div className="custom-dropi plain-dropi">
                    <select
                      className="form-select"
                      value={status}
                      onChange={handleChange}
                    >
                      <option>open</option>
                      <option>close</option>
                    </select>
                  </div>
                </div>

                <div className="chat-listBox--area custom-scrollbar">
                  {conversationsList.loading ? (
                    <>
                      {[...Array(8)].map((_, index) => (
                        <div className="chat-listBox gap-10 d-flex" key={index}>
                          <div className="chatlist-userLetter">
                            <Skeleton />
                          </div>
                          <div className="chatlist-listInfo">
                            <div className="chatlist-userName">
                              <Skeleton />
                            </div>
                            <div className="chatlist-userMessage">
                              <Skeleton />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {conversationsList.data
                        .filter(
                          (conversation: any) =>
                            conversation?.conversation
                              ?.conversationOpenStatus === status
                        )
                        .map((item: any, index: any) => (
                          <div
                            className={`chat-listBox gap-10 d-flex${conversationMessages.conversationId == item._id
                              ? " active"
                              : ""
                              }`}
                            key={index}
                            onClick={async () =>
                              await openConversation(item._id, item.name, index)
                            }
                          >
                            <div className="chatlist-userLetter">
                              {item.name[0]}
                            </div>
                            <div className="chatlist-listInfo">
                              <div className="chatlist-userName">
                                {item.name}
                              </div>
                              <div
                                className="chatlist-userMessage"
                                dangerouslySetInnerHTML={{
                                  __html: item.lastMessage,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="chat-Area flex-grow-1">
              <div className="inbox-heading d-flex justify-content-between align-item-center">
                <div className="top-headbar-heading">
                  {conversationMessages.visitorName}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      position: "relative",
                      display: "inline-block",
                      width: "60px",
                      height: "34px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAIChat}
                      onChange={handleToggle}
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0,
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: isAIChat ? "#2196F3" : "#ccc",
                        transition: "0.4s",
                        borderRadius: "34px",
                      }}
                    ></span>
                    <span
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "26px",
                        width: "26px",
                        left: isAIChat ? "30px" : "4px",
                        bottom: "4px",
                        backgroundColor: "white",
                        transition: "0.4s",
                        borderRadius: "50%",
                      }}
                    ></span>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    <span style={{ color: isAIChat ? "#2196F3" : "#555" }}>
                      AI Chat
                    </span>
                    <span style={{ color: !isAIChat ? "#2196F3" : "#555" }}>
                      Agent Chat
                    </span>
                  </div>
                </div>
                {openConversationStatus === "open" ?
                  <button onClick={handleCloseConversation}>
                    Close Conversation
                  </button> :
                  <button>
                    Conversation Closed
                  </button>
                }

                {openConversationStatus === "open" ?
                  <button onClick={handleBlockVisitor}>
                    Block Visitor
                    </button>
                  :
                  <button>
                    Visitor Blocked
                  </button>
                }

                <div className="chat-tagArea d-flex gap-16">
                  <div className="chat-taglist">
                    {tags.map((tag: any) => (
                      <span className="custom-btn small-btn default-btn d-flex gap-2 align-item-center">
                        {tag.name}
                        <button type="button" className="plain-btn">
                          <Image
                            src={closeSmallImage}
                            alt=""
                            onClick={() => handleTagDelete(tag._id)}
                          />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="dropdown add-dropdown tag-dropdown">
                    <a
                      className="btn btn-secondary dropdown-toggle"
                      href="#"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      onClick={handleAddTag}
                    >
                      Add Tag
                    </a>

                    <div>
                      {addTag && (
                        <div>
                          <input
                            type="text"
                            placeholder="Add Tag Name"
                            value={inputAddTag}
                            onChange={(event) => {
                              setInputAddTag(event.target.value);
                            }}
                          ></input>
                          <button onClick={handleAddTagClick}>Add</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="message-section">
                <div
                  className="message-chatArea custom-scrollbar"
                  ref={containerRef}
                  style={{
                    overflowY: "auto", // Enable vertical scrolling
                    overflowX: "hidden",
                  }}
                >
                  {conversationMessages.loading ? (
                    <>
                      {[...Array(10)].map((_, index) => (
                        <p key={index}>
                          <Skeleton />
                        </p>
                      ))}
                    </>
                  ) : (
                    <>
                      {conversationMessages?.data?.map(
                        (item: any, index: any) => (
                          <div
                            key={index}
                            ref={(el) => {
                              messageRefs.current[index] = el; // Assign ref to each message
                            }}
                          >
                            <Message
                              key={index}
                              messageData={item}
                              messageIndex={index}
                              expandedSources={expandedSources}
                              setExpandedSources={setExpandedSources}
                            />
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                <div className="messgae-answerArea">
                  <div className="answer-tab">
                    <ul
                      className="nav nav-tabs gap-10"
                      id="myTab"
                      role="tablist"
                    >
                      {openConversationStatus == "open" && (
                        <li className="nav-item" role="presentation">
                          <button
                            className="nav-link active"
                            id="chat-tab"
                            data-bs-toggle="tab"
                            data-bs-target="#chat-tab-pane"
                            type="button"
                            role="tab"
                            aria-controls="chat-tab-pane"
                            aria-selected="true"
                            onClick={() => {
                              setIsNoteActive(false);
                            }}
                          >
                            <Image src={chatMessageIconImage} alt="" /> Chat
                          </button>
                        </li>
                      )}
                      <li className="nav-item" role="presentation">
                        <button
                          className="nav-link"
                          id="note-tab"
                          data-bs-toggle="tab"
                          data-bs-target="#note-tab-pane"
                          type="button"
                          role="tab"
                          aria-controls="note-tab-pane"
                          aria-selected="true"
                          onClick={() => setIsNoteActive(true)}
                        >
                          <Image src={chatNoteIconImage} alt="" /> Note
                        </button>
                      </li>
                    </ul>
                    <div className="tab-content" id="myTabContent">
                      {isNoteActive || openConversationStatus == "close" ? (
                        <>
                          <input
                            type="text"
                            placeholder="Enter Note Here..."
                            className="form-control"
                            value={inputMessage}
                            onChange={(event) => {
                              setInputMessage(event.target.value);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                handleAddNote();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="custom-btn"
                            onClick={handleAddNote}
                          >
                            <Image src={sendIconImage} alt="" />
                          </button>
                        </>
                      ) : (
                        <div
                          className="tab-pane fade show active"
                          id="chat-tab-pane"
                          role="tabpanel"
                          aria-labelledby="chat-tab"
                          tabIndex={0}
                        >
                          <textarea
                            className="form-control"
                            placeholder="Enter text here...."
                            value={inputMessage}
                            onChange={(event) => {
                              setInputMessage(event.target.value);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                handleMessageSend();
                              }
                            }}
                          ></textarea>
                          <div className="chat-messageBtns">
                            <div className="d-flex gap-16">
                              <button
                                type="button"
                                className="custom-btn default-btn"
                              >
                                <Image src={micIconImage} alt="" />
                              </button>
                              <button type="button" className="custom-btn">
                                <Image src={sendIconImage} alt="" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="chat-detailsArea">
              <div className="inbox-heading d-flex justify-content-between align-item-center">
                <div className="top-headbar-heading">Details</div>
              </div>

              <div className="chat-detailsSec">
                <div className="chat-detailsBox">
                  <ul className="list-unstyled mb-0">
                    {Object.entries(visitorDetails || {}).map(
                      ([fieldName, value]: any) => (
                        <li key={fieldName}>
                          <div className="d-flex">
                            <div className="chat-detailsTitle">{`${fieldName.charAt(0).toUpperCase() +
                              fieldName.slice(1)
                              }:-`}</div>
                            <div className="">
                              {value}
                            </div>
                          </div>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="note-area">
                  <div className="note-heading">Notes</div>
                  {notesList.length ? (
                    <div className="note-listArea custom-scrollbar">
                      {notesList.map((note: any, index: any) => (
                        <div className="note-listBox">
                          <button
                            key={index}
                            onClick={() => scrollToMessage(note._id)}
                          ></button>
                          <h6>@riyaz</h6>
                          <div className="note-listDescribe-area d-flex justify-content-between">
                            <p>{note.message}</p>
                            <span>{note.createdAt} ago</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>No notes Found</div>
                  )}
                </div>

                <div className="note-area">
                  <div className="note-heading">Old Converstion</div>
                  {oldConversationList.data?.length ? (
                    <div className="note-listArea custom-scrollbar">
                      {oldConversationList.data.map((list: any) => (
                        <div
                          className="note-listBox"
                          onClick={async () =>
                            await openOldConversation(
                              list.conversation_id,
                              openVisitorName
                            )
                          }
                        >
                          <h6>@{openVisitorName}</h6>
                          <div className="note-listDescribe-area d-flex justify-content-between">
                            <p>{list.message}</p>
                            <span>{list.createdAt} ago</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>No Conversations Found</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="inbox-area">
            <div className="inbox-heading d-flex justify-content-between align-item-center">
              <div className="top-headbar-heading">Inbox</div>
            </div>
            <div className="justify-content-between align-item-center">
              <p>No conversation found.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
