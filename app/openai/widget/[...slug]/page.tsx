'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
// import { useSocket } from "@/app/socketContext";
import './_components/widgetcss.css';
import { format } from "date-fns";
import {io,Socket } from 'socket.io-client'

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

  const chatBottomRef = useRef<any>(null);

  const widgetId = params.slug[0];
  const widgetToken = params.slug[1];
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
      query: {
        widgetId,
        widgetAuthToken: widgetToken,
        visitorId: '6731cc56aeb9b49329e272b8',
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
      localStorage.setItem('openaiVisitorId', data.visitorId);
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
              {!visitorExists ? (
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
              ) : (
                <div className="chataffy-widget-chatArea">
                  {conversation.map((message: any, index: number) => (
                    <div
                      key={index}
                      className={message.sender_type === "visitor" ? "chataffy-widget-messageClient" : "chataffy-widget-messageArea"}
                      ref={chatBottomRef}
                    >
                      {message.sender_type !== "visitor" && (
                        <Image src="/images/widget/client-logo.png" width={40} height={40} alt="Bot" />
                      )}
                      <div
                        className="chataffy-widget-message"
                        style={{
                          background: themeSettings?.colorFields?.[message.sender_type === "visitor" ? 4 : 2]?.value,
                          color: themeSettings?.colorFields?.[message.sender_type === "visitor" ? 5 : 3]?.value,
                        }}
                        dangerouslySetInnerHTML={{ __html: message.message }}
                      />
                      <div className="chataffy-widget-messageInfo">
                        {message.createdAt ? format(new Date(message.createdAt), 'hh:mm:ss a') : "Sending..."}
                      </div>
                    </div>
                  ))}
                </div>
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
