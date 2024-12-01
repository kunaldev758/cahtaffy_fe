"use client";
import Image from "next/image";
import searchIconImage from "@/images/search-icon.svg";
import closeSmallImage from "@/images/close-small.svg";
import sendIconImage from "@/images/send-icon.svg";
import chatMessageIconImage from "@/images/chat-message-icon.svg";
import chatNoteIconImage from "@/images/chat-note-icon.svg";
import micIconImage from "@/images/mic-icon.svg";
// import {  } from "react";
// import { io } from "socket.io-client";
import { useState, useRef, useEffect, useCallback } from "react";

import { logoutApi } from "@/app/_api/dashboard/action";
import { useRouter } from "next/navigation";

import { useSocket } from "@/app/socketContext";

import {
  getConversationMessages,
  getAllNotesOfConversation,
  getSearchConversationList,
  getAllOldConversationOfVisitor,
  getVisitorDetails,
  getConversationTags,
  removeTagFromConversation,
  addTagToConversation,
  getOldConversationMessages,
  addConversationToArchive,
  blockVisitor,
} from "@/app/_api/dashboard/action";

// import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Message from "./message";
// import { useSocket } from "@/app/socketContext";
// import { useRouter } from "next/router";

export default function Inbox(Props: any) {
  console.log(Props, "my props");
  const router = useRouter();
  const { socket } = useSocket();

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
  const [conversationLength, setConversationLength] = useState<number>(0);
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
  const [searchValue, setSearchValue] = useState("");
  const [searchConversationsList, setSearchConversationsList] = useState<any>({
    data: [],
    loading: true,
  });
  const [addTag, setAddTag] = useState<boolean>(false);
  const [inputAddTag, setInputAddTag] = useState<string>("");
  const [tags, setTags] = useState<any>([]);
  const [openConversationStatus, setOpenConversationStatus] =
    useState<any>("close");
  const [isAIChat, setIsAIChat] = useState(true);

  // Open conversation and fetch messages
  const openConversation = async (visitorId: any, visitorName: string) => {
    try {
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
        setConversationLength(data.chatMessages.length);
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
        setConversationLength(data.chatMessages.length);
      }
    } catch (error) {
      console.error("Error fetching old conversation messages:", error);
    }
  };

  // Handle message send
  const handleMessageSend = () => {
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
          is_note: true,
          message: inputMessage,
          sender_type: "agent",
          createdAt: Date.now(),
        },
      ],
    }));
    setInputMessage("");
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Emit "get-conversations-list" event to fetch conversations
    const userId = localStorage.getItem("userId");
    socket.emit("get-conversations-list", { userId });

    const handleConversationsListResponse = (data: any) => {
      console.log("conv list", data.conversations);
      setConversationsList({ data: data.conversations, loading: false });
      openConversation(data.conversations[0]._id, data.conversations[0].name);
      // Transform the visitorDetails array to an object
      const transformedVisitorDetails =
        data?.conversations[0]?.visitorDetails?.reduce(
          (acc: any, { field, value }: { field: string; value: string }) => {
            acc[field.toLowerCase()] = value; // Use lowercase keys for consistency
            return acc;
          },
          {
            location: data?.conversations[0]?.location,
            ip: data?.conversations[0]?.ip,
          }
        );

      setVisitorDetails(transformedVisitorDetails);
    };

    const handleAppendMessage = (data: any) => {
      console.log(data, "socket conv data");
      setConversationMessages((prev: any) => ({
        ...prev,
        data: [...prev.data, data.chatMessage],
      }));
    };

    socket.on(
      "get-conversations-list-response",
      handleConversationsListResponse
    );
    socket.on("conversation-append-message", handleAppendMessage);

    return () => {
      socket.off(
        "get-conversations-list-response",
        handleConversationsListResponse
      );
      socket.off("conversation-append-message", handleAppendMessage);
    };
  }, [socket]);

  useEffect(() => {
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
  }, [socket, openConversationId, openVisitorId]);

  const handleAddTagClick = async () => {
    try {
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

  useEffect(() => {
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
  }, [socket, openConversationId]);

  const handleTagDelete = async (id: any) => {
    try {
      console.log(id, "id to delete");

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

  const handleCloseConversation = async (event: any) => {
    try {
      // Emit event to close the conversation
      socket?.emit(
        "close-conversation",
        { conversationId: openConversationId, status: "close" },
        (response: any) => {
          if (response.success) {
            console.log("Conversation closed successfully.");
            setOpenConversationStatus("close");

            // Update UI
            event.target.style.backgroundColor = "black";
            event.target.style.color = "white";
            event.target.innerText = "Closed";
          } else {
            console.error("Failed to close conversation:", response.error);
          }
        }
      );
    } catch (err) {
      console.error("Error closing conversation:", err);
    }
  };

  const handleBlockVisitor = async (event: any) => {
    try {
      // Emit event to block a visitor
      socket?.emit(
        "block-visitor",
        { visitorId: openVisitorId },
        (response: any) => {
          if (response.success) {
            console.log("Visitor blocked successfully.");
            // Update UI
            event.target.style.backgroundColor = "black";
            event.target.style.color = "white";
            event.target.innerText = "Blocked";
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
      setSearchConversationsList({ data: [], loading: true });
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
            setSearchConversationsList({ data: [], loading: false });
          }
        }
      );
    } catch (err) {
      console.error("Error in search:", err);
      setSearchConversationsList({ data: [], loading: false });
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
    // console.log()
    if (searchText.trim().length > 0) {
      handleSearchConversations(searchText);
    } else {
      setSearchConversationsList({ data: [], loading: false });
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

  console.log(conversationMessages, "this is conv message");

  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});

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
    setIsAIChat(!isAIChat);
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
                  {/* <input type="text" placeholder="search"></input> */}
                  {/* <input
                    type="text"
                    placeholder="Search"
                    className="form-control"
                    value={inputSearchText}
                    onChange={(event) => {
                      setInputSeachText(event.target.value);
                    }}
                  /> */}
                  <input
                    type="text"
                    value={searchText}
                    onChange={handleSearchInputChange}
                    placeholder="Search Conversations"
                    className="search-input"
                  />
                  {searchConversationsList.loading ? (
                    <Skeleton count={1} />
                  ) : (
                    <ul>
                      {searchConversationsList.data.map((conversation: any) => (
                        <li key={conversation.id}>{conversation.name}</li>
                      ))}
                    </ul>
                  )}
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
                            className={`chat-listBox gap-10 d-flex${
                              conversationMessages.conversationId == item._id
                                ? " active"
                                : ""
                            }`}
                            key={index}
                            onClick={() =>
                              openConversation(item._id, item.name)
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
                {/* <button onClick={handleArchiveConversation}>Archive Conversation</button> */}
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
                <button onClick={handleCloseConversation}>
                  Close Conversation Conversation
                </button>
                <button onClick={handleBlockVisitor}>Block Visitor</button>
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

                    {/* <ul className="dropdown-menu">
                      <li>
                        <div className="input-box input-iconBox">
                          <span className="input-icon">
                            <Image src={sendIconImage} alt="" />
                          </span>
                          <input
                            type="text"
                            placeholder="Search"
                            className="form-control"
                            value={inputSearchText}
                            onChange={(event) => {
                              setInputSeachText(event.target.value);
                            }}
                          />
                        </div>
                      </li>
                    </ul> */}
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
                      {isNoteActive ? (
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
                    {/* <li>
                      <div className="d-flex">
                        <div className="chat-detailsTitle">Name:-</div>
                        <div className="">{visitorDetails?.name ?? "name"}</div>
                      </div>
                    </li>

                    <li>
                      <div className="d-flex">
                        <div className="chat-detailsTitle">Email:-</div>
                        <div className="">{visitorDetails?.email ?? "email"}</div>
                      </div>
                    </li>

                    <li>
                      <div className="d-flex">
                        <div className="chat-detailsTitle">Phone:-</div>
                        <div className="">
                          {visitorDetails?.phone ?? "phone"}
                        </div>
                      </div>
                    </li>

                    <li>
                      <div className="d-flex">
                        <div className="chat-detailsTitle">Location:-</div>
                        <div className="">
                          {visitorDetails?.location ?? "Location"}
                        </div>
                      </div>
                    </li> */}
                    {Object.entries(visitorDetails || {}).map(
                      ([fieldName, value]) => (
                        <li key={fieldName}>
                          <div className="d-flex">
                            <div className="chat-detailsTitle">{`${
                              fieldName.charAt(0).toUpperCase() +
                              fieldName.slice(1)
                            }:-`}</div>
                            <div className="">
                              {value || `${fieldName} not available`}
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
                          onClick={() =>
                            openOldConversation(
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
