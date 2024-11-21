"use client";
import Image from "next/image";
import searchIconImage from "@/images/search-icon.svg";
import closeSmallImage from "@/images/close-small.svg";
import sendIconImage from "@/images/send-icon.svg";
import chatMessageIconImage from "@/images/chat-message-icon.svg";
import chatNoteIconImage from "@/images/chat-note-icon.svg";
import micIconImage from "@/images/mic-icon.svg";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { useState, useRef } from "react";

import { logoutApi } from "@/app/_api/dashboard/action";
import { useRouter } from "next/navigation";

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

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Message from "./message";

let socket: any;

export default function Inbox(Props: any) {
  const router = useRouter();

  const [expandedSources, setExpandedSources] = useState<null | number>(null);

  useEffect(() => {
    socket = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
      path: `${process.env.NEXT_PUBLIC_SOCKET_PATH || ""}/socket.io`,
      query: {
        token: Props.token,
        embedType: "openai",
      },
    });
    return () => {
      socket.disconnect();
    };
  }, [Props.token]);

  const [credit, setCredit] = useState({ used: 0, total: 0 });
  const [isConverstionAvailable, setIsConverstionAvailable] = useState(true);
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
  const [openConversatinVistorId, setOpenConversatinVistorId] =
    useState<any>(null);
  const [openConversatinVistorName, setOpenConversatinVistorName] =
    useState<any>(null);
  const [conversationLength, setConversationLength] = useState<number>(0);
  const [openConversatinId, setOpenConversatinId] =
    useState<any>(null);
  const [isNoteActive, setIsNotActive] = useState<boolean>(false);
  const [notesList, setNotesList] = useState<any>([]);
  const [oldConversationList, setOldConversationList] = useState<any>({
    data: [],
    loading: true,
  });
  const [visitorDetails, setVisitorDetails] = useState<any>();
  const [status, setStatus] = useState("open");
  const [inputSearchText, setInputSeachText] = useState("");
  const [searchConversationsList, setSearchConversationsList] = useState<any>({
    data: [],
    loading: true,
  });
  const [addTag, setAddTag] = useState<boolean>(false);
  const [inputAddTag, setInputAddTag] = useState<any>("");
  const [tags, setTags] = useState<any>([]);
  const [openConversationStatus, setOpenConversationStatus] = useState<any>('close')
  // const [isToggled, setIsToggled] = useState(false);
  const [isAIChat, setIsAIChat] = useState(true);

  const openConversation = async (_id: any, visitorName: string) => {
    try {
      console.log(_id, "this is id ,", visitorName, "This is visitor name")
      setOpenConversatinVistorId(_id);
      setOpenConversatinVistorName(visitorName);
      getConversationMessages(_id).then((data: any) => {
        // Update the state with the result
        console.log(data, "Conv Data")
        setConversationMessages({
          data: data.chatMessages,
          loading: false,
          conversationId: data.chatMessages[0].conversation_id,
          visitorName,
        });
        setOpenConversationStatus(data.conversationOpenStatus);
        setOpenConversatinId(data.chatMessages[0].conversation_id);
        setConversationLength(data.chatMessages.length);
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const openOldConversation = async (conversationId: any, visitorName: string) => {
    try {
      getOldConversationMessages({ conversationId }).then((data: any) => {
        // Update the state with the result
        console.log(data, "old conv data")
        setConversationMessages({
          data: data.chatMessages,
          loading: false,
          conversationId: data.chatMessages[0].conversation_id,
          visitorName,
        });
        setOpenConversationStatus(data.conversationOpenStatus);
        setOpenConversatinId(data.chatMessages[0].conversation_id);
        setConversationLength(data.chatMessages.length);
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getData = () => {
    socket.on("client-connect-response", function () {
      socket.emit("get-credit-count");
      socket.emit("get-conversations-list");
    });

    socket.on("get-credit-count-response", function ({ data }: any) {
      setCredit({ used: data.used, total: data.total });
    });

    console.log(credit, "Credit from socket");
    socket.on("get-conversations-list-response", function ({ data }: any) {
      console.log(data, "conversations list");
      setConversationsList({ data: data, loading: false });
      if (data.length) {
        openConversation(data[0]._id, data[0].name);
      } else {
        setIsConverstionAvailable(false);
      }
    });

    socket.on("conversations-list-update", function ({ data }: any) {
      setConversationsList((conversationsList: any) => {
        const newData = [data, ...conversationsList.data];
        return { data: newData, loading: false };
      });
      setIsConverstionAvailable(true);
    });

    socket.on("error-handler", async function (data: any) {
      await logoutApi();
      router.replace("/login");
    });

    socket.emit("client-connect");
  };

  useEffect(() => {
    getData();
  }, []);

  const handleMessageSend = () => {
    console.log(inputMessage, "This is message      ", openConversatinVistorId);
    if (inputMessage.trim() != "") {
      const id = Date.now();
      socket.emit("client-send-message", {
        message: inputMessage,
        visitorId: openConversatinVistorId,
        conversationId: openConversatinId,
      });
    }
    console.log(conversationMessages.data, "conversationMessages.data")
    setConversationMessages((prevState: any) => ({
      ...prevState,
      data: [
        ...prevState.data,
        {
          infoSources: [],
          is_note: "false",
          message: inputMessage,
          sender_type: "agent",
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ]
    }));
    setInputMessage("");
  };

  console.log(openConversatinVistorId, "openConversatinVistorId", openConversatinId, "openConversatinId")

  const handleAddNote = () => {
    console.log(inputMessage, "This is message      ", openConversatinVistorId);
    if (inputMessage.trim() != "") {
      const id = Date.now();
      socket.emit("client-send-add-note", {
        message: inputMessage,
        visitorId: openConversatinVistorId,
        conversationId: openConversatinId,
      });
    }
    setNotesList((prev: any) => [...prev, { message: inputMessage, createdAt: Date.now() }])
    setConversationMessages((prevState: any) => ({
      ...prevState,
      data: [
        ...prevState.data,
        {
          infoSources: [],
          is_note: "true",
          message: inputMessage,
          sender_type: "agent",
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ]
    }));
    setInputMessage("");
  };

  const handleIsNoteActive = () => {
    setIsNotActive(true);
  };

  const handleConversationChange = (id: any) => {
    openOldConversation(id, openConversatinVistorName);
  };

  useEffect(() => {
    socket.emit("visitor-connect");
  }, []);

  useEffect(() => {
    console.log("inside use effect");
    const fetchData = async () => {
      const data = await getAllNotesOfConversation({ conversationId: openConversatinId });
      console.log("This is notes data:", data);
      setNotesList(data);

      const convData = await getAllOldConversationOfVisitor({ visitor_id: openConversatinVistorId });
      console.log("This is old conversation data:", convData);
      setOldConversationList({ loading: false, data: convData });

      const visitorData = await getVisitorDetails({ visitorId: openConversatinVistorId });
      console.log("This is visitor data:", visitorData);
      setVisitorDetails(visitorData);
    };

    fetchData();
  }, [openConversatinVistorId, openConversatinId]);

  // Function to handle the change event
  const handleChange = (event: any) => {
    console.log(event.target.value, "this is val")
    setStatus(event.target.value);
  };

  const handleAddTag = () => {
    setAddTag(true);
  };

  const handleAddTagClick = async () => {
    try {
      setAddTag(false);
      console.log(inputAddTag, "inputAddTag", openConversatinId, "openConversatinId");
      await addTagToConversation({ name: inputAddTag, conversationId: openConversatinId });
      const result = await getConversationTags({ conversationId: openConversatinId });
      console.log(result, "tags")
      setTags(result);
      setInputAddTag("");
    } catch (err) {
      throw err;
    }
  };
  useEffect(() => {
    async function fetchData() {
      const result = await getConversationTags({ conversationId: openConversatinId });
      console.log(result, "tags")
      setTags(result);
    }
    fetchData();
  }, [openConversatinId])

  const handleTagDelete = async (id: any) => {
    try {
      console.log(id, "id to del")
      const newTag = tags.filter((tag: any) => {
        console.log(tag, "tags val")
        tag._id !== id;
      });
      setTags(newTag);
      await removeTagFromConversation({ id });
    } catch (err) {
      throw err;
    }
  };

  console.log(conversationMessages, "this is conv message")

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
    console.log(index, "msg index")
    const messageIndex = conversationMessages.data.findIndex((msg: any) => msg._id === index);
    if (messageIndex !== -1) {
      const messageElement = messageRefs.current[messageIndex];
      if (messageElement && containerRef.current) {
        containerRef.current.scrollTop = messageElement.offsetTop - containerRef.current.offsetTop;
      }
    }
  };

  const handleConversationSearch = async () => {
    const data = await getSearchConversationList({ query: inputSearchText });
    setConversationsList({ data: data, loading: false })
  }

  const handleArchiveConversation = async (event: any) => {
    event.target.style.backgroundColor = 'black';
    event.target.style.color = 'white';
    event.target.innerText = 'Archived';
    await addConversationToArchive({ conversationId: openConversatinId })
    router.push('inbox/archive')
  }

  const handleCloseConversation = async (event: any) => {
    event.target.style.backgroundColor = 'black';
    event.target.style.color = 'white';
    event.target.innerText = 'Closed';
    socket.emit('close-conversation', {
      conversationId: openConversatinId,
      status: 'close'
    })
    setOpenConversationStatus('close')
    // await addConversationToArchive({conversationId:openConversatinId})
  }

  const handleBlockVisitor = async (event: any) => {
    event.target.style.backgroundColor = 'black';
    event.target.style.color = 'white';
    event.target.innerText = 'Blocked';
    // await blockVisitor({visitorId:openConversatinVistorId});
  }

  // Function to handle toggle
  const handleToggle = () => {
    setIsAIChat(!isAIChat);
  };
  return (
    <>
      <div className="main-content-area">
        {isConverstionAvailable ? (
          <div className="inbox-area d-flex">
            <div className="chat-listArea">
              <div className="inbox-heading d-flex justify-content-between align-item-center">
                <div className="top-headbar-heading">Inbox</div>
                <div className="chat-listSearch">
                  {/* <input type="text" placeholder="search"></input> */}
                  <input
                    type="text"
                    placeholder="Search"
                    className="form-control"
                    value={inputSearchText}
                    onChange={(event) => {
                      setInputSeachText(event.target.value);
                    }}
                  />
                  <button type="button" className="plain-btn" onClick={handleConversationSearch}>
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
                          (conversation: any) => conversation.conversation?.conversationOpenStatus === status
                        )
                        .map((item: any, index: any) => (
                          <div
                            className={`chat-listBox gap-10 d-flex${conversationMessages.conversationId == item._id
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
                    <span style={{ color: isAIChat ? "#2196F3" : "#555" }}>AI Chat</span>
                    <span style={{ color: !isAIChat ? "#2196F3" : "#555" }}>
                      Agent Chat
                    </span>
                  </div>
                </div>
                <button onClick={handleCloseConversation}>Close Conversation Conversation</button>
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
                <div className="message-chatArea custom-scrollbar"
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
                      {openConversationStatus == 'open' && <li className="nav-item" role="presentation">
                        <button
                          className="nav-link active"
                          id="chat-tab"
                          data-bs-toggle="tab"
                          data-bs-target="#chat-tab-pane"
                          type="button"
                          role="tab"
                          aria-controls="chat-tab-pane"
                          aria-selected="true"
                          onClick={() => { setIsNotActive(false) }}
                        >
                          <Image src={chatMessageIconImage} alt="" /> Chat
                        </button>
                      </li>}
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
                          onClick={handleIsNoteActive}
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
                          <textarea className="form-control" placeholder="Enter text here...." value={inputMessage}
                            onChange={(event) => {
                              setInputMessage(event.target.value)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                handleMessageSend()

                              }
                            }}></textarea>
                          <div className="chat-messageBtns">
                            <div className="d-flex gap-16">
                              <button type="button" className="custom-btn default-btn"><Image src={micIconImage} alt="" /></button>
                              <button type="button" className="custom-btn"><Image src={sendIconImage} alt="" /></button>
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
                    <li>
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
                    </li>
                  </ul>
                </div>

                <div className="note-area">
                  <div className="note-heading">Notes</div>
                  {notesList.length ? (
                    <div className="note-listArea custom-scrollbar">
                      {notesList.map((note: any, index: any) => (
                        <div className="note-listBox">
                          <button key={index} onClick={() => scrollToMessage(note._id)}></button>
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
                  {oldConversationList.data.length ? (
                    <div className="note-listArea custom-scrollbar">
                      {oldConversationList.data.map((list: any) => (
                        <div
                          className="note-listBox"
                          onClick={() =>
                            handleConversationChange(list.conversation_id)
                          }
                        >
                          <h6>@{openConversatinVistorName}</h6>
                          <div className="note-listDescribe-area d-flex justify-content-between">
                            <p>
                              {list.message}
                            </p>
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
