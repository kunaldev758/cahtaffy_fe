'use client'
import Image from 'next/image'
import searchIconImage from '@/images/search-icon.svg'
import closeSmallImage from '@/images/close-small.svg';
import sendIconImage from '@/images/send-icon.svg';
import chatMessageIconImage from '@/images/chat-message-icon.svg';
import chatNoteIconImage from '@/images/chat-note-icon.svg';
import micIconImage from '@/images/mic-icon.svg';
import { useEffect } from 'react'
import { io } from "socket.io-client"
import { useState } from 'react'

import { logoutApi } from '@/app/_api/dashboard/action'
import { useRouter } from 'next/navigation'

import { getConversationMessages, getAllNotesOfConversation, addNoteToConversation } from '@/app/_api/dashboard/action'

import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import Message from './message';

let socket: any;

export default function Inbox(Props: any) {
  const router = useRouter()

  const [expandedSources, setExpandedSources] = useState<null | number>(null);

  useEffect(() => {
    socket = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
      path: `${process.env.NEXT_PUBLIC_SOCKET_PATH || ""}/socket.io`,
      query: {
        token: Props.token,
        embedType: 'openai'
      },
    });
    return () => {
      socket.disconnect();
    };
  }, [Props.token])

  const [credit, setCredit] = useState({ used: 0, total: 0 })
  const [isConverstionAvailable, setIsConverstionAvailable] = useState(true);
  const [conversationsList, setConversationsList] = useState<any>({ data: [], loading: true })
  const [conversationMessages, setConversationMessages] = useState<any>({ data: [], loading: true, conversationId: null, visitorName: '' })
  const [inputMessage, setInputMessage] = useState('')
  const [openConversatinVistorId, setOpenConversatinVistorId] = useState<any>(null)
  const [openConversatinVistorName, setOpenConversatinVistorName] = useState<any>(null)
  const [conversationLength, setConversationLength] = useState<number>(0)
  const [isNoteActive, setIsNotActive] = useState<boolean>(false)
  const [isChatActive, setIsChatActive] = useState<boolean>(true)
  const [notesList, setNotesList] = useState<any>([])
  const [oldConversationList, setOldConversationList] = useState<any>([])


  const openConversation = async (_id: any, visitorName: string) => {
    try {
      // Make API call using the _id
      // const response = await fetch(`your-api-endpoint/${_id}`);
      // const data = await response.json();
      // const data = ["hello","hi"]
      setOpenConversatinVistorId(_id);
      setOpenConversatinVistorName(visitorName);
      getConversationMessages(_id).then((data: any) => {
        // Update the state with the result
        setConversationMessages({ data, loading: false, conversationId: _id, visitorName });
        setConversationLength(data.length)
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getData = () => {

    socket.on('client-connect-response', function () {
      socket.emit('get-credit-count')
      socket.emit('get-conversations-list')
    })

    socket.on('get-credit-count-response', function ({ data }: any) {
      setCredit({ used: data.used, total: data.total })
    })

    console.log(credit, "Credit from socket")
    socket.on('get-conversations-list-response', function ({ data }: any) {
      console.log(data, "conversations list")
      setConversationsList({ data: data, loading: false })
      if (data.length) {
        openConversation(data[0]._id, data[0].name);
      }
      else {
        setIsConverstionAvailable(false);
      }
    })

    socket.on('conversations-list-update', function ({ data }: any) {
      setConversationsList((conversationsList: any) => {
        const newData = [data, ...conversationsList.data];
        return { data: newData, loading: false };
      });
      setIsConverstionAvailable(true);
    })

    socket.on('error-handler', async function (data: any) {
      await logoutApi()
      router.replace('/login')
    })

    // socket.on('conversation-append-message', (data: any) => {
    // });

    socket.emit('client-connect')
  }

  useEffect(() => {
    getData()
  }, [])

  const handleMessageSend = () => {
    console.log(inputMessage, "This is message      ", openConversatinVistorId)
    if (inputMessage.trim() != '') {
      const id = Date.now()
      socket.emit('client-send-message', { message: inputMessage, conversationId: openConversatinVistorId });
    }
    setInputMessage('')

  }

  const handleAddNote = () => {
    console.log(inputMessage, "This is message      ", openConversatinVistorId)
    if (inputMessage.trim() != '') {
      const id = Date.now()
      socket.emit('client-send-add-note', { message: inputMessage, conversationId: openConversatinVistorId });
    }
    setInputMessage('')

  }

  const handleIsNoteActive = (message: any) => {
    if (isNoteActive) {
      let data = { message, id: openConversatinVistorId }
      addNoteToConversation(data)
    }
    setIsNotActive(!isNoteActive)
  }

  useEffect(() => {
    openConversation(openConversatinVistorId, openConversatinVistorName);
  }, [conversationLength, inputMessage])


  // useEffect(() => {
  // 	socket = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
  // 		path: `${process.env.NEXT_PUBLIC_SOCKET_PATH || ""}/socket.io`,
  // 		query: {
  // 			// widgetId: widgetId,
  // 			// widgetAuthToken: widgetToken,
  // 			// visitorId: localStorage.getItem('openaiVisitorId'),
  // 			embedType: 'openai'
  // 		},
  // 	})
  // 	return () => {
  // 		socket.disconnect()
  // 	}
  // }, [])


  useEffect(() => {
    socket.emit('visitor-connect')


    // socket.on('error-handler', async function (data: any) {
    // 	setError(true)
    // })


    // socket.on('visitor-connect-response', (data: any) => {
    // 	setSocketConnection(true)
    // 	setConversation(data.chatMessages)
    // 	localStorage.setItem('openaiVisitorId', data.visitorId)
    // })



    // socket.on('intermediate-response', ({ message }: any) => {
    // 	setAiMessage(message)
    // })

    // socket.on('conversation-append-message', (data: any) => {
    // 	setConversation((conversation: any) => [...conversation, data.chatMessage])
    // })


    // socket.on('disconnect', function (data: any) {
    // 	setSocketConnection(false)
    // })

    // socket.on('connect', function (data: any) {
    // 	setSocketConnection(true)
    // })

  }, [])

  useEffect(() => {
    console.log("inside use effect")
    const fetchData = async () => {
      const data = await getAllNotesOfConversation(openConversatinVistorId);
      console.log("This is notes data:", data);
      setNotesList(data);
    };

    fetchData();
  }, [openConversatinVistorId]);

  useEffect(() => {
    console.log("inside use effect")
    const fetchData = async () => {
      const data = await getAllNotesOfConversation(openConversatinVistorId);
      console.log("This is old conversation data:", data);
      setOldConversationList(data);
    };

    fetchData();
  }, [openConversatinVistorId]);


  return (
    <><div className="main-content-area">
      {isConverstionAvailable ? (
        <div className="inbox-area d-flex">
          <div className="chat-listArea">
            <div className="inbox-heading d-flex justify-content-between align-item-center">
              <div className="top-headbar-heading">Inbox</div>
              <div className="chat-listSearch">
                <button type="button" className="plain-btn"><Image src={searchIconImage} alt="" /></button>
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
                  <select className="form-select">
                    <option>Open</option>
                    <option>Close</option>
                  </select>
                </div>
              </div>

              <div className="chat-listBox--area custom-scrollbar">
                {conversationsList.loading ?
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
                  :
                  <>
                    {conversationsList.data.map((item: any, index: any) => (
                      <div className={`chat-listBox gap-10 d-flex${(conversationMessages.conversationId == item._id) ? ' active' : ''}`} key={index} onClick={() => openConversation(item._id, item.name)}>
                        <div className="chatlist-userLetter">
                          {item.name[0]}
                        </div>
                        <div className="chatlist-listInfo">
                          <div className="chatlist-userName">
                            {item.name}
                          </div>
                          <div className="chatlist-userMessage" dangerouslySetInnerHTML={{ __html: item.lastMessage }} />
                        </div>
                      </div>
                    ))}
                  </>
                }
              </div>
            </div>
          </div>

          <div className="chat-Area flex-grow-1">
            <div className="inbox-heading d-flex justify-content-between align-item-center">
              <div className="top-headbar-heading">{conversationMessages.visitorName}</div>
              <div className="chat-tagArea d-flex gap-16">
                <div className="chat-taglist">
                  <span className="custom-btn small-btn default-btn d-flex gap-2 align-item-center">Lead
                    <button type="button" className="plain-btn"><Image src={closeSmallImage} alt="" /></button>
                  </span>
                </div>
                <div className="dropdown add-dropdown tag-dropdown">
                  <a className="btn btn-secondary dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Add Tag
                  </a>

                  <ul className="dropdown-menu">
                    <li>
                      <div className="input-box input-iconBox">
                        <span className="input-icon"><Image src={sendIconImage} alt="" /></span>
                        <input type="text" placeholder="Search" className="form-control" />
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="message-section">
              <div className="message-chatArea custom-scrollbar">
                {conversationMessages.loading ?
                  <>
                    {[...Array(10)].map((_, index) => (
                      <p key={index}>
                        <Skeleton />
                      </p>
                    ))}
                  </>
                  :
                  <>
                    {/* <p><strong>Conversation: {conversationMessages.conversationId}</strong></p> */}
                    {conversationMessages.data.map((item: any, index: any) =>
                      <Message key={index} messageData={item} messageIndex={index} expandedSources={expandedSources} setExpandedSources={setExpandedSources} />
                    )}
                  </>
                }
                {/* <div className="message-box ai-message noteBox">
                <div className="d-flex align-items-end justify-content-end gap-16">
                  <div className="chat-messageArea d-flex flex-column align-items-end">
                    <div className="chat-messageBox"><span>@riyaz</span> Lorem ipsum us dummy text</div>
                  </div>

                  <div className="chatMessage-logo">
                    <Image src={trainingIconImage} alt="" />
                  </div>
                </div>

                <div className="chat-messageInfo">
                  <div className="d-flex gap-10">
                    <span><Image src={chatSourceIconImage} alt="" /></span>
                    <span>11:44 AM</span>
                  </div>
                </div>
              </div> */}

              </div>

              <div className="messgae-answerArea">
                <div className="answer-tab">
                  <ul className="nav nav-tabs gap-10" id="myTab" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button className="nav-link active" id="chat-tab" data-bs-toggle="tab" data-bs-target="#chat-tab-pane" type="button" role="tab" aria-controls="chat-tab-pane" aria-selected="true" onClick={handleIsNoteActive}><Image src={chatMessageIconImage} alt="" /> Chat</button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button className="nav-link" id="note-tab" data-bs-toggle="tab" data-bs-target="#note-tab-pane" type="button" role="tab" aria-controls="note-tab-pane" aria-selected="true" onClick={handleIsNoteActive}><Image src={chatNoteIconImage} alt="" /> Note</button>
                    </li>
                  </ul>
                  <div className="tab-content" id="myTabContent">
                    {
                      isNoteActive ?
                        <div className="tab-pane note-tab fade" id="note-tab-pane" role="tabpanel" aria-labelledby="note-tab" tabIndex={1}>
                          {/* <textarea className="form-control" placeholder="Enter Note Here..."></textarea> */}
                          <input type="text" placeholder="Enter Note Here..." className="form-control" value={inputMessage}
                            onChange={(event) => {
                              setInputMessage(event.target.value)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                handleAddNote();

                              }
                            }} />
                          <button type="button" className="custom-btn" onClick={handleAddNote}><Image src={sendIconImage} alt="" /></button>
                        </div>
                        // <div>hello</div>
                        :

                        <div className="tab-pane fade show active" id="chat-tab-pane" role="tabpanel" aria-labelledby="chat-tab" tabIndex={0}>
                          {/* <textarea className="form-control" placeholder="Enter text here...."></textarea>
                    <div className="chat-messageBtns">
                      <div className="d-flex gap-16">
                        <button type="button" className="custom-btn default-btn"><Image src={micIconImage} alt="" /></button>
                        <button type="button" className="custom-btn"><Image src={sendIconImage} alt="" /></button>
                      </div>
                    </div> */}
                          {/* <input type="text" placeholder="Type a message..." className="form-control" value={inputMessage}
                            onChange={(event) => {
                              setInputMessage(event.target.value)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                handleMessageSend()

                              }
                            }} /> */}
                          <input type="text" placeholder="Enter Note Here..." className="form-control" value={inputMessage}
                            onChange={(event) => {
                              setInputMessage(event.target.value)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                handleAddNote();

                              }
                            }} />
                          <div className="chat-messageBtns">
                            <div className="d-flex gap-16">
                              {/* <button type="button" className="custom-btn default-btn" onClick={handleMessageSend}><Image src={sendIconImage} alt="" /></button> */}
                              <button type="button" className="custom-btn" onClick={handleAddNote}><Image src={sendIconImage} alt="" /></button>
                              <button type="button" className="custom-btn"><Image src={sendIconImage} alt="" /></button>
                            </div>
                          </div>

                        </div>
                    }
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
                      <div className="">Amelia</div>
                    </div>
                  </li>

                  <li>
                    <div className="d-flex">
                      <div className="chat-detailsTitle">Email:-</div>
                      <div className="">test@gmail.com</div>
                    </div>
                  </li>

                  <li>
                    <div className="d-flex">
                      <div className="chat-detailsTitle">Phone:-</div>
                      <div className="">+91 9166462445</div>
                    </div>
                  </li>

                  <li>
                    <div className="d-flex">
                      <div className="chat-detailsTitle">Location:-</div>
                      <div className="">India</div>
                    </div>
                  </li>
                </ul>

              </div>

              <div className="note-area">
                <div className="note-heading">
                  Notes
                </div>
                {
                  notesList.length ? <div className="note-listArea custom-scrollbar">
                    {
                      notesList.map((note: any) =>

                        <div className="note-listBox">
                          <h6>@riyaz</h6>
                          <div className="note-listDescribe-area d-flex justify-content-between">
                            <p>{note.message}</p>
                            <span>{note.createdAt}  ago</span>
                          </div>
                        </div>

                      )
                    }

                  </div>
                    :
                    <div>No notes Found</div>
                }

              </div>

              <div className="note-area">
                <div className="note-heading">
                  Old Converstion
                </div>
                {oldConversationList.length ?
                  <div className="note-listArea custom-scrollbar">
                    {
                      oldConversationList.map(() => (
                        <div className="note-listBox">
                          <h6>@riyaz</h6>
                          <div className="note-listDescribe-area d-flex justify-content-between">
                            <p>Hi there, there so man Lorem ipsum id dummy text</p>
                            <span>1d  ago</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                  :
                  <div>No Conversations Found</div>
                }
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
    </div></>);
}