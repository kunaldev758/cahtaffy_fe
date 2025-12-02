'use client';

import { useState, useEffect, useRef, useCallback } from "react";
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
  ArrowDown,
  Mic,
  StopCircle,
  Phone
} from "lucide-react";
import { io, Socket } from 'socket.io-client'
import { v4 as uuidv4 } from "uuid";
import { sendEmailForOfflineChat } from "@/app/_api/dashboard/action";

const axios = require('axios');
require('./_components/widgetcss.css');

// Field validation helpers
const validateField = (field: any, value: any) => {
  const errors = [];

  if (field.required && (!value || value.trim() === '')) {
    errors.push(`${field.value} is required`);
    return errors;
  }

  if (value && value.trim() !== '') {
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

    if (field.validation?.minLength && value.length < field.validation.minLength) {
      errors.push(`${field.value} must be at least ${field.validation.minLength} characters`);
    }

    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      errors.push(`${field.value} must not exceed ${field.validation.maxLength} characters`);
    }

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

  const handleChange = (e: any) => {
    let newValue = e.target.value;

    if (field.type === 'tel') {
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
    </div>
  );
};

export default function EnhancedChatWidget({ params }: any) {
  const [inputMessage, setInputMessage] = useState('');
  const [conversation, setConversation] = useState([] as any);
  const [conversationId, setConversationId] = useState(null);
  const [themeSettings, setThemeSettings]: any = useState(null as any);
  const [visitorExists, setVisitorExists] = useState(false);
  const [formData, setFormData]: any = useState({});
  const [formErrors, setFormErrors]: any = useState({});
  const [fields, setFields]: any = useState([]);
  const [conversationStatus, setConversationStatus] = useState('open');
  const [visitorIp, setVisitorIp] = useState('');
  const [visitorLocation, setVisitorLocation] = useState('');
  const [showWidget, setShowWidget] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [clientLogo, setClientLogo] = useState('/api/placeholder/40/40');
  const [selectedLogo, setSelectedLogo] = useState('images/widget/human-avatar.png');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const [botVisible, setBotVisible] = useState(true);
  const [isUnavailableMode, setIsUnavailableMode] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [isSubmittingUnavailable, setIsSubmittingUnavailable] = useState(false);
  const [unavailableSubmitted, setUnavailableSubmitted] = useState(false);
  const [unavailableError, setUnavailableError] = useState('');
  const [userId, setUserId] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const noReplyTimerRef = useRef<any>(null);
  const NO_REPLY_MS = 2 * 60 * 1000;

  const chatBottomRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);
  const isManualStopRef = useRef<boolean>(false);
  const shouldBeRecordingRef = useRef<boolean>(false);
  const recordingTimerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const chatInputAvailable = visitorExists || (!visitorExists && !themeSettings?.isPreChatFormEnabled);
  const shouldRenderVoiceButton = chatInputAvailable && conversationStatus === 'open' && isSpeechSupported;
  const voiceButtonDisabled = !isRecording && (!isOnline || isTyping);

  const widgetId = params?.slug?.[0] || 'demo-widget';
  const widgetToken = params?.slug?.[1] || 'demo-token';

  const clearNoReplyTimer = () => {
    if (noReplyTimerRef.current) {
      clearTimeout(noReplyTimerRef.current);
      noReplyTimerRef.current = null;
    }
  };

  const startNoReplyTimer = () => {
    clearNoReplyTimer();
    noReplyTimerRef.current = setTimeout(() => {
      setIsUnavailableMode(true);
      setShowWidget(true);
    }, NO_REPLY_MS);
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (conversation.length > 0 && chatBottomRef.current && showWidget && !isMinimized) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, showWidget, isMinimized]);

  // Socket initialization
  useEffect(() => {
    let storedVisitorId = localStorage.getItem('visitorId');
    if (!storedVisitorId) {
      storedVisitorId = uuidv4();
      localStorage.setItem('visitorId', storedVisitorId);
    }

    let socketInstance: any;
    try {
      socketInstance = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
        query: {
          widgetId,
          widgetAuthToken: widgetToken,
          visitorId: localStorage.getItem('visitorId'),
        },
        transports: ["websocket", "polling"],
      });

      socketInstance.on('connect_error', (err: any) => {
        setSocketError(true);
      });
      socketInstance.on('error', (err: any) => {
        setSocketError(true);
      });
      socketInstance.on('disconnect', (reason: any) => {
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

      if (data?.chatMessage?.sender_type === 'visitor') {
        startNoReplyTimer();
      } else {
        clearNoReplyTimer();
      }

      try {
        const audio = new Audio("/audio/notification.mp3");
        data.chatMessage.sender_type != 'visitor' && audio.play().catch((err) => {
          console.error("Failed to play notification sound", err);
        });
      } catch (e) {
        console.error("Audio play error", e);
      }
    });

    socket.on("visitor-blocked", handleCloseConversationClient);
    socket.on("visitor-conversation-close", handleCloseConversationClient);

    return () => {
      socket.off("conversation-append-message");
      socket.off("visitor-blocked");
      socket.off("visitor-conversation-close");
      clearNoReplyTimer();
    }
  }, [socketRef.current]);

  const handleCloseConversationClient = () => {
    setConversationStatus('close');
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('visitor-connect', {
      widgetToken
    });

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
      if (data?.themeSettings?.userId) {
        setUserId(data.themeSettings.userId)
      }
    });

    socket.on("visitor-connect-response-upgrade", () => {
      console.log("event emmited for upgrade")
      setIsUnavailableMode(true);
      setShowWidget(true);
    });

    return () => {
      socket.off("visitor-connect-response");
      socket.off("visitor-connect-response-upgrade");
    };
  }, [widgetToken]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('visitor-ip', {
      ip: visitorIp
    })
  }, [visitorIp]);

  const handleSubmitUnavailableContact = async () => {
    setUnavailableError('');
    if (!contactEmail || !/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(contactEmail)) {
      setUnavailableError('Please enter a valid email address.');
      return;
    }
    setIsSubmittingUnavailable(true);
    try {
      let visitorDetails = {
        email: contactEmail,
        location: visitorLocation,
        ip: visitorIp,
        reason: 'unavailable'
      }
      sendEmailForOfflineChat(visitorDetails, contactNote, userId);
      setUnavailableSubmitted(true);

      const socket = socketRef.current;
      if (!socket) return;

      socket.emit('close-conversation-visitor', {
        conversationId: conversationId ? conversationId : (conversation[0]?.conversation_id),
        status: 'close'
      });
    } catch (e) {
      setUnavailableError('Failed to submit. Please try again.');
    } finally {
      setIsSubmittingUnavailable(false);
    }
  };

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

  useEffect(() => {
    const initialFormData: any = {};
    fields?.forEach((field: any) => {
      initialFormData[field.value] = '';
    });
    setFormData(initialFormData);
  }, [fields]);

  const sanitizeInput = (text: any) => {
    const sanitized = text.replace(/<[^>]*>/g, '');
    return sanitized.replace(/[^\w\s.,!?'"-]/g, '');
  };

  const limitMessageWords = (text: string) => {
    const safeText = text || '';
    const words = safeText.trim().split(/\s+/).filter((word) => word.length > 0);
    if (words.length > 1000) {
      return {
        value: words.slice(0, 100).join(' '),
        error: 'Message cannot exceed 1000 words'
      };
    }
    return { value: safeText, error: '' };
  };

  const handleInputChange = (e: any) => {
    const { value, error: limitError } = limitMessageWords(e.target.value);
    setError(limitError);
    setInputMessage(value);
  };

  const handleFormFieldChange = (fieldName: any, value: any) => {
    setFormData((prev: any) => ({ ...prev, [fieldName]: value }));

    if (formErrors[fieldName]) {
      setFormErrors((prev: any) => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = () => {
    const errors: any = {};
    let isValid = true;

    fields?.forEach((field: any) => {
      const fieldErrors = validateField(field, formData[field.value]);
      if (fieldErrors.length > 0) {
        errors[field.value] = fieldErrors[0];
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
    startNoReplyTimer();
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    if (recognition && isRecording) {
      isManualStopRef.current = true;
      shouldBeRecordingRef.current = false;
      recognition.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const handleRecordingConfirm = () => {
    stopRecording();
    if (inputMessage.trim()) {
      handleMessageSend();
    }
  };

  const handleRecordingCancel = () => {
    stopRecording();
    setInputMessage('');
    setSpeechError(null);
  };

  const toggleRecording = () => {
    const recognition = recognitionRef.current;
    if (
      !recognition ||
      !isSpeechSupported ||
      !isOnline ||
      isTyping ||
      !chatInputAvailable ||
      conversationStatus === 'close'
    ) {
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    setSpeechError(null);
    isManualStopRef.current = false;
    shouldBeRecordingRef.current = true;
    setRecordingTime(0);
    
    try {
      recognition.start();
      setIsRecording(true);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setSpeechError('Unable to access microphone. Please try again.');
      setIsRecording(false);
      shouldBeRecordingRef.current = false;
    }
  };

  const handleSubmitVisitorDetails = async () => {
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
      conversationId: conversationId ? conversationId : (conversation[0]?.conversation_id),
      status: 'close'
    });
    setConversationStatus('close');
  };

  const handleFeedback = (type: any) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit(
      "conversation-feedback",
      { conversationId: conversationId ? conversationId : (conversation[0]?.conversation_id), feedback: type },
      (response: any) => {
        if (response.success) {
          setFeedback(type);
        }
      }
    );
  };

  const getThemeColor = (index: any, fallback: any) => {
    return themeSettings?.colorFields?.[index]?.value || fallback;
  };

  const formatTime = (date: any) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleWidget = () => {
    setShowWidget(!showWidget);
    if (!showWidget) {
      setUnreadCount(0);
    }
  };

  const positionStyles: any = {
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setInputMessage((prev: string) => {
          const combined = prev ? `${prev.trim()} ${finalTranscript}`.trim() : finalTranscript.trim();
          const { value, error: limitError } = limitMessageWords(combined);
          setError(limitError);
          return value;
        });
      }
    };

    recognition.onerror = (event: any) => {
      const error = event.error;
      if (error === 'no-speech' || error === 'audio-capture') {
        return;
      }
      setSpeechError(error === 'not-allowed' ? 'Microphone access denied' : 'Voice recognition error');
      setIsRecording(false);
      isManualStopRef.current = false;
      shouldBeRecordingRef.current = false;
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };

    recognition.onend = () => {
      if (shouldBeRecordingRef.current && !isManualStopRef.current && recognitionRef.current) {
        try {
          recognition.start();
          setIsRecording(true);
        } catch (err) {
          setIsRecording(false);
          shouldBeRecordingRef.current = false;
          
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        }
      } else {
        setIsRecording(false);
        isManualStopRef.current = false;
        shouldBeRecordingRef.current = false;
        
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {botVisible && (
        <div style={positionStyles} className="font-sans">
          {/* Chat Widget Button */}
          <div className="relative">
            <button
              onClick={toggleWidget}
              className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-blue-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse opacity-75"></div>

              <div className="relative z-10 flex items-center justify-center w-full h-full">
                {showWidget ? (
                  <X className="w-7 h-7 text-white transform rotate-0 group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <MessageCircle className="w-7 h-7 text-white transform group-hover:scale-110 transition-transform duration-300" />
                )}
              </div>

              {!showWidget && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-white text-xs font-bold px-1">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </div>
              )}
            </button>
          </div>

          {/* Chat Window */}
          {showWidget && (
            <div className={`absolute bottom-20 right-0 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ease-out transform flex flex-col ${isMinimized ? 'h-16' : 'h-[650px]'
              }`}>

              {/* No Internet Banner */}
              {!isOnline && (
                <div className="bg-red-100 text-red-700 text-center py-2 text-sm font-semibold flex-shrink-0">
                  <div className="flex items-center justify-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>No internet connection</span>
                  </div>
                </div>
              )}

              {/* Header */}
              <div
                className="p-4 text-white relative overflow-hidden cursor-pointer flex-shrink-0"
                style={{ backgroundColor: getThemeColor(0, '#2563eb') }}
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {(themeSettings as any)?.showLogo && (
                      <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm ring-2 ring-white/30">
                        {(themeSettings as any)?.logo ? (
                          <img src={clientLogo} alt="Logo" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <img src={`${process.env.NEXT_PUBLIC_APP_URL}${selectedLogo}`} alt="Logo" className="w-9 h-9 rounded-full" />
                        )}
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-base" style={{ color: getThemeColor(1, '#ffffff') }}>
                        {(themeSettings as any)?.titleBar || "Support"}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs opacity-90 mt-0.5">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Online</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMinimized(!isMinimized);
                      }}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <Minimize2 className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
                    </button>

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

              {/* Body */}
              {!isMinimized && (
                socketError ? (
                  <div className="flex flex-col items-center justify-center flex-1 p-8">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Connection Error</h3>
                    <p className="text-gray-600 text-center text-sm">We couldn't connect to the chat service. Please try again later.</p>
                  </div>
                ) : isBlocked ? (
                  <div className="flex flex-col items-center justify-center flex-1 p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Access Blocked</h3>
                    <p className="text-gray-600 text-center text-sm">You have been blocked from using this chat. If you believe this is a mistake, please contact support.</p>
                  </div>
                ) : isUnavailableMode ? (
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="max-w-sm mx-auto">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-10 h-10 text-yellow-600" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">We're Currently Unavailable</h3>
                          <p className="text-gray-600 text-sm">Leave your email and we'll get back to you as soon as possible.</p>
                        </div>
                        {unavailableSubmitted ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <p className="text-green-700 font-medium mb-1">Message Sent!</p>
                            <p className="text-green-600 text-sm">We've received your details and will contact you soon.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                              <input
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="you@example.com"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${unavailableError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                              />
                              {unavailableError && (
                                <p className="text-red-600 text-xs mt-2 flex items-center">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {unavailableError}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                              <textarea
                                rows={4}
                                value={contactNote}
                                onChange={(e) => setContactNote(e.target.value)}
                                placeholder="Tell us what you need help with..."
                                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300 resize-none"
                              />
                            </div>
                            <button
                              onClick={handleSubmitUnavailableContact}
                              disabled={isSubmittingUnavailable}
                              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                            >
                              {isSubmittingUnavailable ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Sending...</span>
                                </div>
                              ) : (
                                'Send Message'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Messages Area */}
                    {conversationStatus === 'open' && (
                      <div className="flex-1 p-4 min-h-0 overflow-y-auto bg-gradient-to-b from-gray-50 to-white custom-scrollbar">
                        {visitorExists || (!visitorExists && !(themeSettings as any)?.isPreChatFormEnabled) ? (
                          <div className="space-y-4">
                            {conversation.map((item: any, key: any) => (
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
                                          <div
                                            className="text-sm leading-relaxed"
                                            dangerouslySetInnerHTML={{
                                              __html: item.message.replace(
                                                /<a\b([^>]*)>/gi,
                                                '<a$1 target="_blank" rel="noopener noreferrer">'
                                              )
                                            }}
                                          />
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
                                        <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: item.message }} />
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
                          // Pre-chat form
                          <div className="space-y-4">
                            <div className="text-center mb-6">
                              <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome! 👋</h3>
                              <p className="text-gray-600 text-sm">Please fill out the form below to start chatting with us.</p>
                            </div>

                            {fields?.map((field: any) => (
                              <FormField
                                key={field._id}
                                field={field}
                                value={formData[field.value] || ''}
                                onChange={(value: any) => handleFormFieldChange(field.value, value)}
                                error={formErrors[field.value]}
                              />
                            ))}

                            <button
                              type="button"
                              onClick={handleSubmitVisitorDetails}
                              disabled={isSubmittingForm}
                              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {isSubmittingForm ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Starting Chat...</span>
                                </div>
                              ) : (
                                'Start Conversation'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Input Area or End Conversation */}
                    {chatInputAvailable && (
                      <div className="border-t border-gray-200 bg-white flex-shrink-0">
                        {conversationStatus === 'close' ? (
                          <div className="text-center py-8 px-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                              <CheckCircle className="w-10 h-10 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Conversation Ended</h3>
                            <p className="text-gray-600 text-sm mb-8 leading-relaxed">Thank you for chatting with us! We hope we were able to help you.</p>

                            {/* Feedback Section */}
                            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                              <p className="text-sm font-medium text-gray-700">How was your experience?</p>
                              <div className="flex justify-center space-x-3">
                                <button
                                  onClick={() => handleFeedback(true)}
                                  disabled={feedback === false}
                                  className={`flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-200 ${feedback === true
                                    ? 'bg-green-500 text-white shadow-lg scale-105'
                                    : 'bg-white text-gray-700 hover:bg-green-500 hover:text-white hover:scale-105 border border-gray-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                                >
                                  <ThumbsUp className="w-6 h-6" />
                                  <span className="text-sm font-medium">Good</span>
                                </button>

                                <button
                                  onClick={() => handleFeedback(false)}
                                  disabled={feedback === true}
                                  className={`flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-200 ${feedback === false
                                    ? 'bg-red-500 text-white shadow-lg scale-105'
                                    : 'bg-white text-gray-700 hover:bg-red-500 hover:text-white hover:scale-105 border border-gray-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                                >
                                  <ThumbsDown className="w-6 h-6" />
                                  <span className="text-sm font-medium">Poor</span>
                                </button>
                              </div>
                              {feedback !== null && (
                                <div className="flex items-center justify-center space-x-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <p className="text-green-600 font-medium">Thank you for your feedback!</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4">
                            {/* Recording UI */}
                            {isRecording && (
                              <div className="mb-3 bg-red-50 rounded-xl p-4 border border-red-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-red-700">Recording</span>
                                  </div>
                                  <span className="text-sm font-mono text-red-600">{formatRecordingTime(recordingTime)}</span>
                                </div>
                                
                                {/* Waveform animation */}
                                <div className="flex items-center justify-center space-x-1 h-12 bg-white rounded-lg mb-3 px-4">
                                  {[...Array(25)].map((_, i) => {
                                    const randomHeight = 30 + Math.random() * 60;
                                    const randomDuration = 0.4 + Math.random() * 0.4;
                                    return (
                                      <div
                                        key={i}
                                        className="waveform-bar bg-red-500 rounded-full"
                                        style={{
                                          height: `${randomHeight}%`,
                                          animation: `waveform ${randomDuration}s ease-in-out infinite`,
                                          animationDelay: `${i * 0.03}s`
                                        }}
                                      />
                                    );
                                  })}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={handleRecordingCancel}
                                    className="flex-1 py-2.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleRecordingConfirm}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center justify-center space-x-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Send</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Input area */}
                            <div className="flex items-end space-x-2">
                              <div className="flex-1 relative">
                                <textarea
                                  ref={textareaRef}
                                  placeholder="Type your message..."
                                  value={inputMessage}
                                  onChange={handleInputChange}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleMessageSend();
                                    }
                                  }}
                                  rows={1}
                                  disabled={isTyping || !isOnline || isRecording}
                                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none overflow-y-auto custom-scrollbar"
                                  style={{ maxHeight: '120px' }}
                                />
                              </div>

                              <div className="flex items-center space-x-2 pb-1">
                                {shouldRenderVoiceButton && !isRecording && (
                                  <button
                                    onClick={toggleRecording}
                                    disabled={voiceButtonDisabled}
                                    title={
                                      !isOnline
                                        ? 'Voice capture is disabled while offline.'
                                        : isTyping
                                          ? 'Please wait for the previous message to send.'
                                          : 'Start voice recording'
                                    }
                                    className="p-3 rounded-xl transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Mic className="w-5 h-5" />
                                  </button>
                                )}

                                <button
                                  onClick={handleMessageSend}
                                  disabled={!inputMessage.trim() || Boolean(error) || isTyping || !isOnline || isRecording}
                                  className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg disabled:transform-none"
                                >
                                  <Send className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            {/* Error messages */}
                            {error && (
                              <div className="mt-2 text-xs text-red-600 flex items-center space-x-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{error}</span>
                              </div>
                            )}
                            {speechError && (
                              <div className="mt-2 text-xs text-red-600 flex items-center space-x-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{speechError}</span>
                              </div>
                            )}

                            {/* Footer info */}
                            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                              <span>
                                {inputMessage.trim().split(/\s+/).filter(word => word.length > 0).length}/1000 words
                              </span>

                              <button
                                onClick={handleCloseConversation}
                                className="text-red-500 hover:text-red-700 transition-colors font-medium flex items-center space-x-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>End chat</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* White Label Footer */}
                        {!themeSettings?.showWhiteLabel && (
                          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex-shrink-0">
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
              height: 6px;
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
            @keyframes waveform {
              0%, 100% {
                transform: scaleY(0.3);
                opacity: 0.7;
              }
              50% {
                transform: scaleY(1);
                opacity: 1;
              }
            }
            .waveform-bar {
              width: 2px;
              min-height: 4px;
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
      )}
    </>
  );
}