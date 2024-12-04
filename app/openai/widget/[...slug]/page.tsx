'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
// import { useSocket } from "@/app/socketContext";
import './_components/widgetcss.css';
import { format } from "date-fns";
import {io,Socket } from 'socket.io-client'
import { v4 as uuidv4 } from "uuid"; 
import { basePath } from "@/next.config"

const axios = require('axios');

export default function ChatWidget({ params }: { params: { slug: any } }) {
  // const { socket } = useSocket();

  const [inputMessage, setInputMessage] = useState('');
  const [conversation, setConversation] = useState<any>([]);
  const [themeSettings, setThemeSettings] = useState<any>(null);
  const [visitorExists, setVisitorExists] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [fields, setFields] = useState<any>([]);
  const [conversationStatus, setConversationStatus] = useState('open');
  const [visitorIp, setVisitorIp] = useState('');
  const [visitorLocation, setVisitorLocation] = useState('');
  const [showWidget, setShowWidget] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const chatBottomRef = useRef<any>(null);

  const widgetId = params.slug[0];
  const widgetToken = params.slug[1];
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let storedVisitorId:any = localStorage.getItem('visitorId');
    if (!storedVisitorId) {
      // Generate and store new ID
      storedVisitorId = uuidv4();
      localStorage.setItem('visitorId', storedVisitorId);
    }
    const socketInstance = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
      query: {
        widgetId,
        widgetAuthToken: widgetToken,
        visitorId: localStorage.getItem('visitorId'),
        embedType: "openai",
      },
      transports: ["websocket", "polling"], // Ensure compatibility
    });

    socketRef.current = socketInstance;

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [widgetId, widgetToken]);

  // Scroll to the bottom of the chat
  useEffect(() => {
    if (conversation.length > 0 && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Handle socket events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('visitor-connect', {
      widgetToken
    });

    socket.on("visitor-connect-response", (data: any) => {
      console.log(data,"conn res")
      setConversation(data.chatMessages || []);
      setThemeSettings(data.themeSettings || {});
      setFields(data.themeSettings?.fields || []);
      // localStorage.setItem('openaiVisitorId', data.visitorId);
      if(data.chatMessages?.length <=0){
        setVisitorExists(true);
      }
    });

    socket.on("conversation-append-message", (data: any) => {
      setConversation((prev:any) => [...prev, data.chatMessage]);
    });

    return () => {
      socket.off("visitor-connect-response");
      socket.off("conversation-append-message");
    };
  }, [ widgetId, widgetToken]);

  // Fetch visitor IP and location
  useEffect(() => {
    const fetchVisitorDetails = async () => {
      try {
        const response = await axios.get('https://ipinfo.io/?token=def346c1243a80');
        setVisitorLocation(response.data.country);
        setVisitorIp(response.data.ip);
      } catch (error: any) {
        console.error('Error fetching IP info:', error.message);
      }
    };
    fetchVisitorDetails();
  }, []);

  const handleMessageSend = () => {
    if (!inputMessage.trim()) return;
    const socket = socketRef.current;
    const messageData = { message: inputMessage, id: Date.now().toString() };
    console.log(messageData,"messageData")
    socket?.emit("visitor-send-message", messageData, (response: any) => {
      if (response?.chatMessage) {
        setConversation((prev:any) => [...prev, response.chatMessage]);
      }
      setInputMessage('');
    });
  };

  const handleSubmitVisitorDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!socket) return; // Guard against uninitialized socket
    console.log(formData,visitorLocation,visitorIp,"visitor det")
    socket?.emit('save-visitor-details', { location: visitorLocation, ip: visitorIp, visitorDetails: formData });
    setVisitorExists(true);
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev:any) => ({ ...prev, [fieldName]: value }));
  };

  const handleCloseConversation = () => {
    const socket = socketRef.current;
    if (!socket) return; // Guard against uninitialized socket
    socket?.emit('close-conversation', { status: 'close' });
    setConversationStatus('close');
  };

  const handleFeedback = (type: any, messageId: any) => {
		// Emit the feedback to the server
    const socket = socketRef.current;
    if (!socket) return;
		socket.emit(
			"message-feedback",
			{ messageId: messageId, feedback: type }, // Send message ID and feedback type
			(response: any) => {
				if (response.success) {
					console.log("Feedback updated successfully:", response.updatedMessage);
					setFeedback(type); // Update local state
				} else {
					console.error("Error updating feedback:", response.error);
				}
			}
		);
	};


  return (
    <>
      <div className="chataffy-widget-area">
        <div className="chataffy-widgetBtn-box" onClick={() => setShowWidget((prev) => !prev)}>
          <div className="chataffy-widget-btn">
            <Image src="/images/widget/widget-icon.png" width={37} height={37} alt="Widget Icon" />
          </div>
        </div>

        {showWidget && (
          <div className="chataffy-messageFrame">
            <div className="chataffy-widget-head" style={{ background: themeSettings?.colorFields?.[0]?.value }}>
              <div className="chataffy-widget-headLeft">
                <Image src="/images/widget/client-logo.png" width={40} height={40} alt="Client Logo" />
                <div className="chataffy-head-infoArea">
                  <div className="chataffy-headName" style={{ color: themeSettings?.colorFields?.[1]?.value }}>
                    {themeSettings?.titleBar || "Chataffy"}
                  </div>
                  <div className="chataffy-headStatus">
                    <span className="chataffy-statusPoint"></span> Online
                  </div>
                </div>
              </div>
              <button className="chataffy-widget-closeBtn" onClick={() => setShowWidget(false)}>
                <Image src="/images/widget/close-btn.svg" width={20} height={20} alt="Close" />
              </button>
            </div>

            <div className="chataffy-widget-body">
              {visitorExists ? (
                <div>
                {conversation.map((item: any, key: any) => (
                  <div key={key}>
                    {(item.sender_type == 'system' || item.sender_type == 'bot' || item.sender_type == 'agent') &&
                      <div className="chataffy-widget-messageArea" ref={chatBottomRef}>
                        <div className="chataffy-widget-messageImage">
                          <Image src={`${basePath}/images/widget/client-logo.png`} width={40} height={40} alt="" />
                        </div>

                        <div className="chataffy-widget-messageBox">
                          <div className="chataffy-widget-message" style={{ "background": themeSettings?.colorFields[2]?.value, "color": themeSettings?.colorFields[3]?.value }}>
                            <div dangerouslySetInnerHTML={{ __html: item.message }} />
                          </div>
                          <div>
                            <span>
                              <button
                                onClick={() => handleFeedback("like", item._id)}
                                disabled={feedback === "like"}>👍</button>
                            </span>
                            <span>
                              <button
                                onClick={() => handleFeedback("dislike", item._id)}
                                disabled={feedback === "dislike"}>👎</button>
                            </span>
                          </div>
                          <div style={{ display: 'none' }}>
                            {(item.infoSources) &&
                              item.infoSources.map((source: any, sourceKey: any) => (
                                <>{source}<br /></>
                              ))
                            }
                          </div>
                          <div className="chataffy-widget-messageInfo">
                            {format(item.createdAt, 'hh:mm:ss a')}
                          </div>
                        </div>
                      </div>}

                    {item.sender_type == 'visitor' &&
                      <div className="chataffy-widget-messageClient" ref={chatBottomRef}>
                        <div className="chataffy-widget-messageBox">
                          <div className="chataffy-widget-message" style={{ "background": themeSettings?.colorFields[4]?.value, "color": themeSettings?.colorFields[5]?.value }}>
                            <div dangerouslySetInnerHTML={{ __html: item.message }} />
                          </div>
                          {item.createdAt ?
                            <div className="chataffy-widget-messageInfo">
                              {format(item.createdAt, 'hh:mm:ss a')}
                            </div>
                            :
                            <div className="chataffy-widget-messageInfo">
                              Sending...
                            </div>
                          }
                        </div>
                      </div>}
                  </div>
                ))}
              </div>
              ) : (
                <form onSubmit={handleSubmitVisitorDetails}>
                {fields.map((field: any) => (
                  <div key={field._id} style={{ marginBottom: "15px" }}>
                    <label htmlFor={field._id}>{field.name}:</label>
                    <input
                      type={field.name.toLowerCase() === "email" ? "email" : "text"}
                      id={field._id}
                      required={field.required}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  </div>
                ))}
                <button type="submit">Save</button>
              </form>
              )}
            </div>

            <div className="chataffy-widget-textarea">
              {conversationStatus === 'close' ? (
                <div>Conversation Closed</div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleMessageSend()}
                  />
                  <button onClick={handleCloseConversation}>Close Conversation</button>
                  <button onClick={handleMessageSend}>
                    <Image src="/images/widget/send-icon.svg" width={18} height={18} alt="Send" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
