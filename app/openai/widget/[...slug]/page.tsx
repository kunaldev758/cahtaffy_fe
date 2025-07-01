'use client';

import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Minimize2,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot,
  ArrowDown
} from "lucide-react";
import { io, Socket } from 'socket.io-client'
import { v4 as uuidv4 } from "uuid";

const axios = require('axios');
require('./_components/widgetcss.css');

// Field validation helpers
const validateField = (field:any, value:any) => {
  const errors = [];

  // Check required fields
  if (field.required && (!value || value.trim() === '')) {
    errors.push(`${field.value} is required`);
    return errors;
  }

  if (value && value.trim() !== '') {
    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field.value} must be a valid email address`);
        }
        break;

      case 'tel':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          errors.push(`${field.value} must be a valid phone number`);
        }
        break;

      case 'number':
        if (isNaN(value)) {
          errors.push(`${field.value} must be a number`);
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`${field.value} must be a valid URL`);
        }
        break;
    }

    // Length validation
    if (field.validation?.minLength && value.length < field.validation.minLength) {
      errors.push(`${field.value} must be at least ${field.validation.minLength} characters`);
    }

    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      errors.push(`${field.value} must not exceed ${field.validation.maxLength} characters`);
    }

    // Pattern validation
    if (field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        errors.push(`${field.value} format is invalid`);
      }
    }
  }

  return errors;
};

// Form validation component
const FormField = ({ field, value, onChange, error }: { field: any; value: any; onChange: any; error: any }) => {
  const baseClasses = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";
  const errorClasses = error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white";

  const handleChange = (e:any) => {
    let newValue = e.target.value;

    // Type-specific formatting
    if (field.type === 'tel') {
      // Remove non-numeric characters for phone
      newValue = newValue.replace(/[^\d\+\-\(\)\s]/g, '');
    }

    onChange(newValue);
  };

  if (field.type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.value}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          className={`${baseClasses} ${errorClasses} resize-none`}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.value}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={field.type}
        value={value}
        onChange={handleChange}
        placeholder={field.placeholder}
        required={field.required}
        min={field.type === 'number' ? field.validation?.minLength || 0 : undefined}
        max={field.type === 'number' ? field.validation?.maxLength || undefined : undefined}
        minLength={field.type !== 'number' ? field.validation?.minLength || undefined : undefined}
        maxLength={field.type !== 'number' ? field.validation?.maxLength || undefined : undefined}
        pattern={field.validation?.pattern || undefined}
        className={`${baseClasses} ${errorClasses}`}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </p>
      )}
      {!error && field.validation?.minLength && (
        <p className="text-gray-500 text-xs mt-1">
          {field.validation.minLength > 0 && `Minimum ${field.validation.minLength} characters`}
          {field.validation.maxLength && field.validation.maxLength < 255 && ` • Maximum ${field.validation.maxLength} characters`}
        </p>
      )}
    </div>
  );
};


export default function EnhancedChatWidget({ params } :any) {
  const [inputMessage, setInputMessage] = useState('');
  const [conversation, setConversation] = useState([] as any);
  const [conversationId, setConversationId] = useState(null);
  const [themeSettings, setThemeSettings]:any = useState(null as any);
  const [visitorExists, setVisitorExists] = useState(false);
  const [formData, setFormData]:any = useState({});
  const [formErrors, setFormErrors]:any = useState({});
  const [fields, setFields]:any = useState([]);
  const [conversationStatus, setConversationStatus] = useState('open');
  const [visitorIp, setVisitorIp] = useState('');
  const [visitorLocation, setVisitorLocation] = useState('');
  const [showWidget, setShowWidget] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [clientLogo, setClientLogo] = useState('/api/placeholder/40/40');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [socketError, setSocketError] = useState(false);

  const chatBottomRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);

  // Extract widget params
  const widgetId = params?.slug?.[0] || 'demo-widget';
  const widgetToken = params?.slug?.[1] || 'demo-token';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversation.length > 0 && chatBottomRef.current && showWidget && !isMinimized) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, showWidget, isMinimized]);


  useEffect(() => {
    let storedVisitorId = localStorage.getItem('visitorId');
    if (!storedVisitorId) {
      storedVisitorId = uuidv4();
      localStorage.setItem('visitorId', storedVisitorId);
    }

    let socketInstance:any;
    try {
      socketInstance = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`,
        {
          query: {
            widgetId,
            widgetAuthToken: widgetToken,
            visitorId: localStorage.getItem('visitorId'),
          },
          transports: ["websocket", "polling"],
        }
      );

      socketInstance.on('connect_error', (err:any) => {
        setSocketError(true);
      });
      socketInstance.on('error', (err:any) => {
        setSocketError(true);
      });
      socketInstance.on('disconnect', (reason:any) => {
        if (reason !== 'io client disconnect') setSocketError(true);
      });

      socketRef.current = socketInstance;
    } catch (e) {
      setSocketError(true);
    }

    return () => {
      socketInstance?.disconnect();
      socketRef.current = null;
    };
  }, [widgetId, widgetToken]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("conversation-append-message", (data) => {
      data.chatMessage.sender_type != 'visitor' && setIsTyping(false);
      if (!conversation.length) {
        setConversationId(data.chatMessage[0]?.conversationId);
      }
      setConversation((prev: any[]) => [...prev, data.chatMessage]);
    });

    socket.on("visitor-blocked", handleCloseConversationClient);
    socket.on("visitor-conversation-close", handleCloseConversationClient);

    return () => {
      socket.off("conversation-append-message");
      socket.off("visitor-blocked");
      socket.off("visitor-conversation-close");
    }
  }, [socketRef.current]);

  const handleCloseConversationClient = () => {
    setConversationStatus('close');
  };

  // Handle socket events
  // Handle socket events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('visitor-connect', {
      widgetToken
    });

    socket.emit('visitor-ip',{
      ip:visitorIp
    })

    socket.on("visitor-connect-response", (data) => {
      setConversation(data.chatMessages || []);
      setThemeSettings(data.themeSettings || {});
      setFields(data.themeSettings?.fields || []);
      if (data.themeSettings.logo) {
        setClientLogo(`${process.env.NEXT_PUBLIC_FILE_HOST}${data.themeSettings.logo}`);
      }
      if (data?.chatMessages) {
        setConversationId(data.chatMessages[0]?.conversation_id);
      }
      if (data?.chatMessages?.length > 1) {
        setVisitorExists(true);
      }
    });

    return () => {
      socket.off("visitor-connect-response");
    };
  }, [widgetToken,visitorIp]);

  // Fetch visitor IP and location
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const fetchVisitorDetails = async () => {
      try {
        const response = await axios.get("https://ipinfo.io/?token=def346c1243a80");
        setVisitorLocation(response.data.country);
        setVisitorIp(response.data.ip);
        socket?.emit('save-visitor-details', { location: response.data.country, ip: response.data.ip });
      } catch (error) {
        console.error('Error fetching IP info:', (error as any).message);
      }
    };
    fetchVisitorDetails();

    socket.on("visitor-is-blocked", () => {
      setIsBlocked(true);
      setConversationStatus('close');
    })

    if (visitorLocation) {
      socket?.emit('save-visitor-details', { location: visitorLocation, ip: visitorIp });
    }
  }, []);

  // Initialize form data based on fields
  useEffect(() => {
    const initialFormData:any = {};
    fields?.forEach((field:any) => {
      initialFormData[field.value] = '';
    });
    setFormData(initialFormData);
  }, [fields]);

  const sanitizeInput = (text:any) => {
    const sanitized = text.replace(/<[^>]*>/g, '');
    return sanitized.replace(/[^\w\s.,!?'"-]/g, '');
  };

  const handleInputChange = (e:any) => {
    const text = e.target.value;
    const wordCount = text.trim().split(/\s+/).filter((word:any) => word.length > 0).length;

    if (wordCount > 100) {
      setError('Message cannot exceed 100 words');
      const truncatedText = text.split(/\s+/).slice(0, 100).join(' ');
      setInputMessage(truncatedText);
    } else {
      setError('');
      setInputMessage(text);
    }
  };

  const handleFormFieldChange = (fieldName:any, value:any) => {
    setFormData((prev:any) => ({ ...prev, [fieldName]: value }));

    // Clear field error when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors((prev:any) => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = () => {
    const errors:any = {};
    let isValid = true;

    fields?.forEach((field:any) => {
      const fieldErrors = validateField(field, formData[field.value]);
      if (fieldErrors.length > 0) {
        errors[field.value] = fieldErrors[0]; // Show first error only
        isValid = false;
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleMessageSend = () => {
    if (inputMessage.trim() === '' || error) return;

    const socket = socketRef.current;
    const sanitizedMessage = sanitizeInput(inputMessage);
    const messageData = { message: sanitizedMessage, id: Date.now().toString() };

    setIsTyping(true);
    socket?.emit("visitor-send-message", messageData);
    setInputMessage('');
  };

  const handleSubmitVisitorDetails = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmittingForm(true);

    try {
      const socket = socketRef.current;
      if (!socket) return;

      socket.emit('save-visitor-details', {
        location: visitorLocation,
        ip: visitorIp,
        visitorDetails: formData
      });

      setVisitorExists(true);
    } catch (error) {
      setError('Failed to submit form. Please try again.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleCloseConversation = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('close-conversation-visitor', {
      conversationId: conversationId ?conversationId:(conversation[0]?.conversation_id),
      status: 'close'
    });
    setConversationStatus('close');
  };

  const handleFeedback = (type:any) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit(
      "conversation-feedback",
      { conversationId: conversationId ?conversationId:(conversation[0]?.conversation_id), feedback: type },
      (response:any) => {
        if (response.success) {
          setFeedback(type);
        }
      }
    );
  };

  const getThemeColor = (index:any, fallback:any) => {
    return themeSettings?.colorFields?.[index]?.value || fallback;
  };

  const formatTime = (date:any) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const toggleWidget = () => {
    setShowWidget(!showWidget);
    if (!showWidget) {
      setUnreadCount(0);
    }
  };

  // Position styles
  const positionStyles:any = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000
  };

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return (
    <div style={positionStyles} className="font-sans ">
      {/* Chat Widget Button */}
      <div className="relative ">
        <button
          onClick={toggleWidget}
          className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-blue-300 group"
        >
          {/* Ripple effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse opacity-75"></div>

          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {showWidget ? (
              <X className="w-6 h-6 text-white transform rotate-0 group-hover:rotate-90 transition-transform duration-300" />
            ) : (
              <MessageCircle className="w-6 h-6 text-white transform group-hover:scale-110 transition-transform duration-300" />
            )}
          </div>

          {/* Notification badge */}
          {!showWidget && unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </div>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {showWidget &&  (
        <div className={`absolute bottom-16 right-0 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ease-out transform ${isMinimized ? 'h-16' : 'h-[600px]'
          }`}>

          {/* No Internet Banner */}
          {!isOnline && (
            <div className="bg-red-100 text-red-700 text-center py-2 font-semibold">
              No internet connection. Chat is disabled.
            </div>
          )}

          {/* Header */}
          <div
            className="p-4 text-white relative overflow-hidden cursor-pointer"
            style={{ backgroundColor: getThemeColor(0, '#2563eb') }}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                {(themeSettings as any)?.showLogo && (
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    {(themeSettings as any)?.logo ? (
                      <img src={clientLogo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                )}


                <div>
                  <h3 className="font-semibold text-sm" style={{ color: getThemeColor(1, '#ffffff') }}>
                    {(themeSettings as any)?.titleBar || "Support"}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs opacity-90">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Online</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">

                {/* Minimize/Maximize button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Minimize2 className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
                </button>

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWidget(false);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Body - Only show when not minimized */}
          {!isMinimized && (
            socketError ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h3>
                <p className="text-gray-600 text-center">We couldn't connect to the chat service. Please try again later.</p>
              </div>
            ) : isBlocked ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">You are blocked</h3>
                <p className="text-gray-600 text-center">You have been blocked from using this chat. If you believe this is a mistake, please contact support.</p>
              </div>
            ) : (
              <>
                {/* Messages Area or Pre-Chat Form */}
                {
                  conversationStatus==='open' && (
                    <div className="flex-1 p-4 h-96 overflow-y-auto bg-gradient-to-b from-gray-50 to-white custom-scrollbar">
                    {visitorExists || (!visitorExists &&  !(themeSettings as any)?.isPreChatFormEnabled)? (
                      <div className="space-y-4">
                        {conversation.map((item:any, key:any) => (
                          <div key={key}>
                            {/* Agent/System/Bot messages */}
                            {(item.sender_type === 'system' || item.sender_type === 'bot' ||
                              (item.sender_type === 'agent' && item.is_note === "false") ||
                              (item.sender_type === 'assistant' && item.is_note === "false")) && (
                                <div className="flex items-start space-x-3 animate-in slide-in-from-left duration-300">
                                  {themeSettings?.showLogo && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: getThemeColor(2, '#f1f5f9') }}>
                                      {themeSettings?.logo ? (
                                        <img src={clientLogo} alt="" className="w-6 h-6 rounded-full object-cover" />
                                      ) : (
                                        <Bot className="w-4 h-4" style={{ color: getThemeColor(3, '#1e293b') }} />
                                      )}
                                    </div>
                                  )}
                
                                  <div className="flex-1 max-w-xs">
                                    <div
                                      className="px-4 py-3 rounded-2xl rounded-tl-md shadow-sm"
                                      style={{
                                        backgroundColor: getThemeColor(2, '#f1f5f9'),
                                        color: getThemeColor(3, '#1e293b')
                                      }}
                                    >
                                      <div dangerouslySetInnerHTML={{ __html: item.message }} />
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 ml-2">
                                      {item.createdAt && formatTime(item.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              )}
                
                            {/* Visitor messages */}
                            {item.sender_type === 'visitor' && (
                              <div className="flex justify-end animate-in slide-in-from-right duration-300">
                                <div className="max-w-xs">
                                  <div
                                    className="px-4 py-3 rounded-2xl rounded-tr-md shadow-sm"
                                    style={{
                                      backgroundColor: getThemeColor(4, '#3b82f6'),
                                      color: getThemeColor(5, '#ffffff')
                                    }}
                                  >
                                    <div dangerouslySetInnerHTML={{ __html: item.message }} />
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 mr-2 text-right">
                                    {item.createdAt ? (
                                      formatTime(item.createdAt)
                                    ) : (
                                      <span className="flex items-center justify-end space-x-1">
                                        <Clock className="w-3 h-3" />
                                        <span>Sending...</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                
                        {/* Typing indicator */}
                        {isTyping && (
                          <div className="flex items-start space-x-3 animate-in slide-in-from-left duration-300">
                            {themeSettings?.showLogo && (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: getThemeColor(2, '#f1f5f9') }}>
                                {themeSettings?.logo ? (
                                  <img src={clientLogo} alt="" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <Bot className="w-4 h-4" style={{ color: getThemeColor(3, '#1e293b') }} />
                                )}
                              </div>
                            )}
                
                            <div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-tl-md">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>
                    ) : (
                      // Enhanced Pre-chat form with validation
                      <div className="space-y-4">
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome! 👋</h3>
                          <p className="text-gray-600 text-sm">Please fill out the form below to start chatting.</p>
                        </div>
                
                        {fields?.map((field:any) => (
                          <FormField
                            key={field._id}
                            field={field}
                            value={formData[field.value] || ''}
                            onChange={(value:any) => handleFormFieldChange(field.value, value)}
                            error={formErrors[field.value]}
                          />
                        ))}
                
                        <button
                          type="button"
                          onClick={handleSubmitVisitorDetails}
                          disabled={isSubmittingForm}
                          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isSubmittingForm ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Starting...</span>
                            </div>
                          ) : (
                            'Start Conversation'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  )
                }
             

                {/* Input Area - Only show when conversation is active */}
                {(visitorExists || (!visitorExists &&  !themeSettings?.isPreChatFormEnabled))&& (
                  <div className="border-t border-gray-200 bg-white">
                    {conversationStatus === 'close' ? (
                      <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Conversation Ended</h3>
                      <p className="text-gray-600 text-sm mb-6">This conversation has been closed. Thank you for contacting us!</p>
                      
                      {/* Feedback buttons */}

                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">How was your experience?</p>
                          <div className="flex justify-center space-x-4">
                            <button
                              onClick={() => handleFeedback(true)}
                              disabled={feedback === false}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${feedback === true
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-green-500 hover:text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span className="text-sm">Good</span>
                            </button>
                  
                            <button
                              onClick={() => handleFeedback(false)}
                              disabled={feedback === true}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${feedback === false
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-red-500 hover:text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <ThumbsDown className="w-4 h-4" />
                              <span className="text-sm">Poor</span>
                            </button>
                          </div>
                          {feedback !== null && (
                            <p className="text-xs text-green-600 mt-2">Thank you for your feedback!</p>
                          )}
                        </div>

                    </div>
                    ) : (
                      <div className="p-4">
                        <div className="flex items-end space-x-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Type your message..."
                              value={inputMessage}
                              onChange={handleInputChange}
                              onKeyDown={(e) => e.key === 'Enter' && handleMessageSend()}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                              disabled={isTyping || !isOnline}
                            />
                          </div>

                          <button
                            onClick={handleMessageSend}
                            disabled={!inputMessage.trim() || Boolean(error) || isTyping || !isOnline}
                            className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>

                        {error && (
                          <div className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                          <span>
                            {inputMessage.trim().split(/\s+/).filter(word => word.length > 0).length}/100 words
                          </span>

                          <button
                            onClick={handleCloseConversation}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            End conversation
                          </button>
                        </div>
                      </div>
                    )}

                    {/* White Label Footer */}
                    {!themeSettings?.showWhiteLabel && (
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <div className="text-xs text-gray-500 text-center">
                          Powered by <span className="font-semibold text-blue-600">Chataffy</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          )}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 10px;
          transition: background 0.3s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
        @keyframes slide-in-from-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-in-from-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-in {
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
          animation-fill-mode: both;
        }
        .slide-in-from-left {
          animation-name: slide-in-from-left;
        }
        .slide-in-from-right {
          animation-name: slide-in-from-right;
        }
      `}</style>
    </div>
  );
}