'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import defaultImageImport from '@/images/default-image.png';
import { Plus_Jakarta_Sans } from 'next/font/google'


const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const defaultImage = (defaultImageImport as any).src || defaultImageImport;

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
  const baseClasses = "w-full h-[40px] text-[13px] font-normal text-[#111827] px-4 py-3 border border-[#E2E8F0] rounded-[8px] focus:ring-0 focus:outline-none focus:border-transparent transition-colors placeholder:text-[#94A3B8]";
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
      <label className="block text-[12px] font-medium text-[#64748B] mb-2 capitalize">
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
  const [showWidget, setShowWidget] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [comment, setComment] = useState('');
  const [conversationFeedback, setConversationFeedback] = useState<any>(null);
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [aiChat, setAiChat] = useState(true); // Default to true (AI chat mode)
  const [isConnectingToAgent, setIsConnectingToAgent] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ _id?: string; message: string; sender_type: string; senderName?: string } | null>(null);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const noReplyTimerRef = useRef<any>(null);
  const NO_REPLY_MS = 2 * 60 * 1000;

  const chatBottomRef = useRef<any>(null);
  const messageRowRefsById = useRef<Record<string, HTMLDivElement | null>>({});
  const socketRef = useRef<Socket | null>(null);
  const closeConversationContextRef = useRef({ conversationId: null as string | null, conversation: [] as any[] });
  closeConversationContextRef.current = { conversationId, conversation };
  const recognitionRef = useRef<any>(null);
  const isManualStopRef = useRef<boolean>(false);
  const shouldBeRecordingRef = useRef<boolean>(false);
  const recordingTimerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldMaintainFocusRef = useRef<boolean>(false);
  const currentTranscriptRef = useRef<string>('');
  const lastFinalTranscriptRef = useRef<string>('');
  const lastDisplayedTextRef = useRef<string>('');

  const chatInputAvailable = visitorExists || (!visitorExists && !themeSettings?.isPreChatFormEnabled);
  const shouldRenderVoiceButton = chatInputAvailable && conversationStatus === 'open' && isSpeechSupported;
  const voiceButtonDisabled = !isRecording && (!isOnline || (aiChat && isTyping));

  const widgetId = params?.slug?.[0] || 'demo-widget';
  const widgetToken = params?.slug?.[1] || 'demo-token';
  const agentId = params?.slug?.[2] || null;

  const clearNoReplyTimer = () => {
    if (noReplyTimerRef.current) {
      clearTimeout(noReplyTimerRef.current);
      noReplyTimerRef.current = null;
    }
  };

  const startNoReplyTimer = () => {
    clearNoReplyTimer();
    noReplyTimerRef.current = setTimeout(() => {
      const socket = socketRef.current;
      if (!socket) return;
      const { conversationId: cid, conversation: conv } = closeConversationContextRef.current;
      socket.emit('close-conversation-visitor', {
        conversationId: cid ? cid : conv[0]?.conversation_id,
        status: 'close'
      });
      setConversationStatus('close');
      setShowWidget(true);
    }, NO_REPLY_MS);
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 72) + 'px';
    }
  };

  // Track inputMessage changes for debugging
  useEffect(() => {
    if (inputMessage !== '') {
      console.log('📝 inputMessage changed to:', `"${inputMessage}"`);
    }
  }, [inputMessage]);

  // Track isTyping changes for debugging
  useEffect(() => {
    console.log('🔄 isTyping state changed:', {
      isTyping: isTyping,
      aiChat: aiChatRef.current
    });
  }, [isTyping]);

  // Track aiChat changes for debugging
  useEffect(() => {
    console.log('🔄 aiChat state changed to:', aiChat);
    // Update ref after logging
    aiChatRef.current = aiChat;
  }, [aiChat]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  // Refocus textarea when it becomes enabled (isTyping becomes false) or when we should maintain focus
  useEffect(() => {
    if (shouldMaintainFocusRef.current && !isTyping && isOnline && chatInputAvailable && conversationStatus === 'open' && !isMinimized && showWidget) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
          shouldMaintainFocusRef.current = false;
        });
      });
    }
  }, [isTyping, isOnline, chatInputAvailable, conversationStatus, isMinimized, showWidget]);

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
          agentId: agentId,
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
      console.error("Socket initialization error", e);
      setSocketError(true);
    }

    return () => {
      socketInstance?.disconnect();
      socketRef.current = null;
    };
  }, [widgetId, widgetToken, agentId]);

  const handleCloseConversationClient = useCallback(() => {
    setConversationStatus('close');
  }, []);

  // Use a ref to track aiChat so socket listeners always have the latest value
  const aiChatRef = useRef(aiChat);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("conversation-append-message", (data) => {
      console.log('📨 conversation-append-message received:', {
        sender_type: data.chatMessage.sender_type,
        aiChat: aiChatRef.current,
        currentIsTyping: isTyping
      });

      // Set isTyping to false when receiving a non-visitor message
      // In AI chat mode: set false when bot/assistant responds
      // In agent chat mode: typing is controlled by socket events, so don't set it here
      if (data.chatMessage.sender_type != 'visitor') {
        if (aiChatRef.current) {
          // AI chat mode: clear typing indicator when bot responds
          console.log('🤖 AI chat mode: Setting isTyping to false (bot responded)');
          setIsTyping(false);
        } else {
          // Agent chat mode: typing is controlled by socket events, but clear it when message arrives
          console.log('👤 Agent chat mode: Setting isTyping to false (agent message received)');
          setIsTyping(false);
        }
      }

      setConversation((prev: any[]) => {
        if (!prev.length) {
          setConversationId(data.chatMessage?.conversation_id);
        }
        return [...prev, data.chatMessage];
      });

      if (data?.chatMessage?.sender_type === 'visitor') {
        startNoReplyTimer();
      } else {
        clearNoReplyTimer();
      }

      try {
        // Construct audio path with basePath support for production
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/chataffy/cahtaffy_fe';
        const audioPath = `${basePath}/audio/notification.mp3`;
        const audio = new Audio(audioPath);
        data.chatMessage.sender_type != 'visitor' && audio.play().catch((err) => {
          console.error("Failed to play notification sound", err);
        });
      } catch (e) {
        console.error("Audio play error", e);
      }
    });

    // Listen for typing events - only show typing indicator when aiChat = false
    socket.on("agent-typing", () => {
      console.log('⌨️ agent-typing event received:', {
        aiChat: aiChatRef.current,
        currentIsTyping: isTyping
      });

      if (!aiChatRef.current) {
        console.log('✅ Agent chat mode: Setting isTyping to true (agent is typing)');
        setIsTyping(true);
      } else {
        console.log('⏭️ AI chat mode: Ignoring agent-typing event');
      }
    });

    socket.on("agent-stop-typing", () => {
      console.log('⏹️ agent-stop-typing event received:', {
        aiChat: aiChatRef.current,
        currentIsTyping: isTyping
      });

      if (!aiChatRef.current) {
        console.log('✅ Agent chat mode: Setting isTyping to false (agent stopped typing)');
        setIsTyping(false);
      } else {
        console.log('⏭️ AI chat mode: Ignoring agent-stop-typing event');
      }
    });

    // Listen for aiChat status updates
    socket.on("ai-chat-status-update", (data: any) => {
      console.log('🔄 ai-chat-status-update received:', {
        newAiChat: data?.aiChat,
        currentAiChat: aiChatRef.current
      });

      if (data?.aiChat !== undefined) {
        console.log(`📝 Updating aiChat from ${aiChatRef.current} to ${data.aiChat}`);
        setAiChat(data.aiChat);
        // Also clear typing indicator when switching modes
        setIsTyping(false);
      }
    });

    // Listen for agent connection request
    socket.on("agent-connection-request", (data: any) => {
      console.log('🔗 agent-connection-request received:', data);
      setIsConnectingToAgent(true);
      setIsTyping(false);
    });

    // Listen for agent connection timeout
    socket.on("agent-connection-timeout", (data: any) => {
      console.log('⏱️ agent-connection-timeout received:', data);
      setIsConnectingToAgent(false);
    });

    // Listen for agent connection accepted
    socket.on("agent-connection-accepted", (data: any) => {
      console.log('✅ agent-connection-accepted received:', data);
      setIsConnectingToAgent(false);
      setAiChat(false);
    });

    socket.on("visitor-blocked", handleCloseConversationClient);
    socket.on("visitor-conversation-close", handleCloseConversationClient);

    return () => {
      socket.off("conversation-append-message");
      socket.off("visitor-blocked");
      socket.off("visitor-conversation-close");
      socket.off("agent-typing");
      socket.off("agent-stop-typing");
      socket.off("ai-chat-status-update");
      socket.off("agent-connection-request");
      socket.off("agent-connection-timeout");
      socket.off("agent-connection-accepted");
      clearNoReplyTimer();
    }
  }, [handleCloseConversationClient]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('visitor-connect', {
      widgetToken
    });

    socket.on("visitor-connect-response", (data) => {
      console.log('🔌 visitor-connect-response received:', {
        hasChatMessages: !!data?.chatMessages,
        chatMessagesCount: data?.chatMessages?.length,
        aiChatFromResponse: data?.aiChat,
        currentAiChat: aiChatRef.current
      });

      setConversation(data.chatMessages || []);
      setThemeSettings(data.themeSettings || {});
      setBotVisible(data.themeSettings?.isActive === 1);
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
      if (data?.conversationFeedback) {
        setConversationFeedback(data.conversationFeedback);
        setFeedback(data.conversationFeedback.feedback);
        setComment(data.conversationFeedback.comment || '');
      }
      // Set aiChat status if provided in response
      if (data?.aiChat !== undefined) {
        console.log(`📝 Setting aiChat from visitor-connect-response: ${data.aiChat}`);
        setAiChat(data.aiChat);
      } else {
        console.log('⚠️ No aiChat value in visitor-connect-response, keeping default:', aiChatRef.current);
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

    console.log('📤 handleMessageSend called:', {
      aiChat: aiChat,
      currentIsTyping: isTyping
    });

    // Only set isTyping to true if aiChat is true (AI chat mode)
    // In agent chat mode (aiChat = false), typing indicator is controlled by socket events
    if (aiChat) {
      console.log('🤖 AI chat mode: Setting isTyping to true (waiting for bot response)');
      setIsTyping(true);
    } else {
      console.log('👤 Agent chat mode: NOT setting isTyping (will be controlled by agent-typing socket events)');
    }

    socket?.emit("visitor-send-message", { ...messageData, replyTo: replyingTo?._id || null });

    // Set flag to maintain focus after state updates
    shouldMaintainFocusRef.current = true;

    setReplyingTo(null);
    setInputMessage('');
    startNoReplyTimer();

    // Refocus immediately if textarea won't be disabled, otherwise useEffect will handle it
    if (!aiChat || (!isTyping && isOnline)) {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    if (recognition && isRecording) {
      console.log('⏹️ Stopping recording manually');
      console.log('📋 Transcript at stop:', currentTranscriptRef.current);

      // CRITICAL: Capture the transcript value NOW before anything else
      const finalTranscript = currentTranscriptRef.current;
      console.log('🔒 Captured transcript:', finalTranscript);

      // Set flags BEFORE stopping recognition
      shouldBeRecordingRef.current = false;
      isManualStopRef.current = true;

      // Stop the recognition
      try {
        recognition.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }

      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);

      // Show transcribing loader
      setIsTranscribing(true);

      // Set the message AFTER the loader, when the textarea will be rendered
      setTimeout(() => {
        console.log('⏰ Transcribing complete, now setting input message');

        if (finalTranscript) {
          const { value, error: limitError } = limitMessageWords(finalTranscript);
          console.log('🔢 Setting value:', `"${value}"`);
          setError(limitError);
          setInputMessage(value);
          console.log('💾 Input message set');
        }

        setIsTranscribing(false);
        isManualStopRef.current = false;
        console.log('✅ Transcribing complete, textarea should now show:', finalTranscript);
      }, 1500);
    }
  };

  const handleRecordingCancel = () => {
    stopRecording();
    setInputMessage('');
    setSpeechError(null);
    // setIsTranscribing(false);
    currentTranscriptRef.current = '';
    lastFinalTranscriptRef.current = '';
    lastDisplayedTextRef.current = '';
  };

  const toggleRecording = () => {
    console.log('🔘 toggleRecording called, currently recording:', isRecording);

    const recognition = recognitionRef.current;
    if (
      !recognition ||
      !isSpeechSupported ||
      !isOnline ||
      (aiChat && isTyping) ||
      !chatInputAvailable ||
      conversationStatus === 'close'
    ) {
      console.log('❌ Cannot toggle recording - conditions not met');
      return;
    }

    if (isRecording) {
      console.log('⏸️ Currently recording, calling stopRecording()');
      stopRecording();
      return;
    }

    console.log('▶️ Starting new recording');
    setSpeechError(null);
    isManualStopRef.current = false;
    shouldBeRecordingRef.current = true;
    setRecordingTime(0);
    currentTranscriptRef.current = '';
    lastFinalTranscriptRef.current = '';
    lastDisplayedTextRef.current = '';
    console.log('🔄 Reset all transcript refs for new recording');

    try {
      recognition.start();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('❌ Error starting recording:', err);
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

  const handleConfirmEndSession = () => {
    setShowEndSessionConfirm(false);
    handleCloseConversation();
  };

  const handleFeedback = (type: any) => {
    setFeedback(type);
  };

  const handleSubmitFeedback = () => {
    if (feedback === null) return;

    const socket = socketRef.current;
    if (!socket) return;

    setIsSubmittingFeedback(true);

    const feedbackData = {
      conversationId: conversationId ? conversationId : (conversation[0]?.conversation_id),
      feedback: feedback,
      comment: comment.trim() || undefined
    };

    socket.emit(
      "conversation-feedback",
      feedbackData,
      (response: any) => {
        setIsSubmittingFeedback(false);
        if (response.success) {
          setFeedbackSubmitted(true);
          setConversationFeedback({
            feedback: feedback,
            comment: comment.trim() || undefined
          });
        }
      }
    );
  };

  const handleStartNewChat = () => {
    // Clear localStorage
    // localStorage.removeItem('visitorId');

    // Disconnect socket
    const socket = socketRef.current;
    if (socket) {
      socket.disconnect();
    }

    // Reload page to start fresh with new visitor ID
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
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

  const scrollWidgetToMessageId = (messageId: string) => {
    const id = messageId?.toString?.() || messageId;
    const el = messageRowRefsById.current[id];
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleWidget = () => {
    setShowWidget(!showWidget);
    if (!showWidget) {
      setUnreadCount(0);
    }
  };

  const isBarLauncher = themeSettings?.widgetType === 'bar';
  const alignLeft = themeSettings?.align === 'left';
  const displayBarMessage =
    (themeSettings?.displayBarMessage && String(themeSettings.displayBarMessage).trim()) ||
    "We're Online! Chat Now!";

  const launcherContainerStyle = useMemo((): import('react').CSSProperties => {
    if (isBarLauncher) {
      return { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 };
    }
    return {
      position: 'fixed',
      bottom: '20px',
      zIndex: 1000,
      ...(alignLeft ? { left: '20px', right: 'auto' } : { right: '20px', left: 'auto' }),
    };
  }, [isBarLauncher, alignLeft]);

  const chatPanelPositionClass = isBarLauncher
    ? 'absolute bottom-full left-1/2 mb-2 w-[400px] max-w-[calc(100vw-20px)] -translate-x-1/2'
    : `absolute bottom-20 w-[400px] ${alignLeft ? 'left-0' : 'right-0'}`;

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

    recognition.onstart = () => {
      console.log('🎤 Recognition started');
      // Don't reset refs if we're continuing a recording session
      // Only reset when starting fresh (shouldBeRecordingRef will be true on continue)
      // The refs are reset in toggleRecording when starting new
    };

    recognition.onresult = (event: any) => {
      console.log('📝 Recognition result event fired, total results:', event.results.length);

      let finalText = '';
      let interimText = '';

      // Build complete transcript from ALL results
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
          console.log(`✅ Final [${i}]: "${transcript}"`);
        } else {
          interimText += transcript;
          console.log(`⏳ Interim [${i}]: "${transcript}"`);
        }
      }

      finalText = finalText.trim();
      interimText = interimText.trim();

      console.log('📋 Built final text:', finalText);
      console.log('📋 Built interim text:', interimText);

      // CRITICAL: Always update currentTranscriptRef with the latest complete text
      // This ensures we have the most up-to-date transcript when stopping
      if (finalText) {
        currentTranscriptRef.current = finalText;
        console.log('💾 Updated ref to:', currentTranscriptRef.current);
      }

      // For display: show final + interim
      let displayText = '';
      if (finalText) {
        displayText = interimText ? `${finalText} ${interimText}` : finalText;
      } else {
        displayText = interimText;
      }

      displayText = displayText.trim();

      // Only update display if text actually changed
      if (displayText && displayText !== lastDisplayedTextRef.current) {
        console.log('📺 Updating display to:', `"${displayText}"`);
        lastDisplayedTextRef.current = displayText;

        const { value, error: limitError } = limitMessageWords(displayText);
        setError(limitError);
        setInputMessage(value);
      } else {
        console.log('⏭️ Display unchanged, skipping');
      }
    };

    recognition.onerror = (event: any) => {
      const error = event.error;
      console.error('❌ Speech recognition error:', error);

      if (error === 'no-speech') {
        console.log('⚠️ No speech detected, but continuing...');
        return; // Don't stop on no-speech
      }

      if (error === 'audio-capture') {
        console.log('⚠️ Audio capture issue, but continuing...');
        return;
      }

      // For other errors, stop recording
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
      console.log('🛑 Recognition ended');
      console.log('📋 Final transcript in ref:', currentTranscriptRef.current);
      console.log('🎯 Manual stop?', isManualStopRef.current);
      console.log('🔄 Should continue?', shouldBeRecordingRef.current);

      // Only update the input if this is NOT a manual stop
      // (manual stop already handled the input in stopRecording)
      if (currentTranscriptRef.current && !isManualStopRef.current) {
        console.log('💬 Setting final message:', currentTranscriptRef.current);
        const { value, error: limitError } = limitMessageWords(currentTranscriptRef.current);
        setError(limitError);
        setInputMessage(value);
      } else if (isManualStopRef.current) {
        console.log('⏭️ Skipping message update - manual stop already handled it');
      }

      // Check if we should continue recording (not a manual stop)
      if (shouldBeRecordingRef.current && !isManualStopRef.current) {
        console.log('🔄 Restarting recognition (continuous mode)');
        try {
          // Small delay before restart to ensure clean state
          setTimeout(() => {
            if (recognitionRef.current && shouldBeRecordingRef.current && !isManualStopRef.current) {
              recognition.start();
              setIsRecording(true);
            }
          }, 100);
        } catch (err) {
          console.error('Failed to restart recognition:', err);
          setIsRecording(false);
          shouldBeRecordingRef.current = false;

          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        }
      } else {
        console.log('✋ Not restarting - user stopped recording');
        // IMPORTANT: Don't clear the ref here! It's needed for the UI
        // Only clear the recording state
        setIsRecording(false);

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      console.log('🧹 Cleaning up recognition');
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      recognitionRef.current = null;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {botVisible && (
        <div style={launcherContainerStyle} className={`font-sans ${isBarLauncher ? 'w-full' : ''}`}>
          {/* Chat Widget launcher: bubble or bar */}
          <div className={isBarLauncher ? 'relative w-full' : 'relative'}>
            {isBarLauncher ? (
              <button
                type="button"
                onClick={toggleWidget}
                className="relative flex w-full items-center justify-between gap-3 rounded-t-2xl px-5 py-4 shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                style={{
                  backgroundColor: getThemeColor(0, '#2563eb'),
                  color: getThemeColor(1, '#ffffff'),
                }}
              >
                <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold">
                  {displayBarMessage}
                </span>
                <div className="relative flex shrink-0 items-center">
                  {showWidget ? (
                    <X className="h-6 w-6" style={{ color: getThemeColor(1, '#ffffff') }} />
                  ) : (
                    <MessageCircle className="h-6 w-6" style={{ color: getThemeColor(1, '#ffffff') }} />
                  )}
                  {!showWidget && unreadCount > 0 && (
                    <div className="absolute -right-1 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1">
                      <span className="text-xs font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </div>
                  )}
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleWidget}
                className="group relative h-16 w-16 transform rounded-full shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-0"
              >
                <div className="absolute inset-0 animate-pulse rounded-full" style={{ backgroundColor: getThemeColor(0, '#2563eb') }}></div>

                <div className="relative z-10 flex h-full w-full items-center justify-center">
                  {showWidget ? (
                    <X className="h-7 w-7 rotate-0 text-white transition-transform duration-300 group-hover:rotate-90" style={{ color: getThemeColor(1, '#ffffff') }} />
                  ) : (
                    <span className="material-symbols-outlined !text-[28px]  transition-transform duration-300 group-hover:scale-110" style={{ color: getThemeColor(1, '#ffffff') }}>
                      chat_bubble
                    </span>
                  )}
                </div>

                {!showWidget && unreadCount > 0 && (
                  <div className="absolute -right-1 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1">
                    <span className="text-xs font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Chat Window */}
          {showWidget && (
            <div className={`${chatPanelPositionClass} ${jakarta.className} bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ease-out transform flex flex-col ${isMinimized ? 'h-16' : 'h-[calc(100vh-250px)]'
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
                      <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center border border-[#dddddd]">
                        {(themeSettings as any)?.logo ? (
                          <img src={clientLogo} alt="Logo" className="w-11 h-11 min-w-11 min-h-11 rounded-full object-cover" />
                        ) : (
                          <img src={`${process.env.NEXT_PUBLIC_APP_URL}${selectedLogo}`} alt="Logo" className="w-9 h-9 rounded-full" />
                        )}
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: getThemeColor(1, '#ffffff') }}>
                        {(themeSettings as any)?.titleBar || "Support"}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs opacity-90 mt-0.5">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium" style={{ color: getThemeColor(1, '#ffffff') }}>Online</span>
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
                      <Minimize2 className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`}
                        style={{ color: getThemeColor(1, '#ffffff') }}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEndSessionConfirm(true);
                      }}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" style={{ color: getThemeColor(1, '#ffffff') }} />
                    </button>
                  </div>
                </div>
              </div>

              {showEndSessionConfirm && (
                <div className="absolute inset-0 z-50 bg-black/35 backdrop-blur-[1px] flex items-center justify-center p-4">
                  <div className="relative w-full max-w-[340px] rounded-[20px] bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.35)] text-center">
                    <button
                      type="button"
                      onClick={() => setShowEndSessionConfirm(false)}
                      className="absolute right-5 top-5 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: getThemeColor(0, '#2563eb') }}>
                      <span className="material-symbols-outlined !text-[34px]" style={{ color: getThemeColor(1, '#ffffff') }}>logout</span>
                    </div>

                    <h3 className="text-[20px] font-semibold text-[#111827] leading-tight mb-2">
                      Ready to end this chat?
                    </h3>
                    <p className="text-[12px] font-normal text-[#64748B] leading-tight mb-8">
                      Do you really want to close the chat?
                    </p>

                    <div className="flex flex-col gap-4">
                      <button
                        type="button"
                        onClick={handleConfirmEndSession}
                        className="inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#0F172A] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#111827]"
                      >
                        End Session
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowEndSessionConfirm(false)}
                        className="inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-white border border-[#E2E8F0] px-4 text-[14px] font-semibold transition-colors hover:bg-[#F1F5F9] text-[#4B5563]"
                      >
                        Keep Chatting
                      </button>

                      <div className="flex items-center justify-center gap-1.5 text-[#64748B] uppercase tracking-[0.08em] text-[11px] font-medium">
                        <span className="material-symbols-outlined !text-[12px]">shield</span>
                        <span>Secure Session</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                      <div className="flex-1 p-5 min-h-0 overflow-y-auto bg-white custom-scrollbar">
                        <style>{`
                          .chat-bubble a {
                            color: var(--chat-link-color) !important;
                            text-decoration: underline !important;
                          }
                          .chat-bubble a:visited {
                            color: var(--chat-link-color) !important;
                          }
                        `}</style>
                        {visitorExists || (!visitorExists && !(themeSettings as any)?.isPreChatFormEnabled) ? (
                          <div className="space-y-4">
                            {conversation.map((item: any, key: any) => (
                              <div
                                key={item._id || key}
                                ref={(el) => {
                                  const mid = item._id?.toString?.();
                                  if (mid) messageRowRefsById.current[mid] = el;
                                }}
                              >
                                {/* System messages - centered and styled differently */}
                                {item.sender_type === 'agent-connect' && (
                                  <div className="flex items-center justify-center py-2 animate-in slide-in-from-left duration-300">
                                    <div className="d-flex align-items-center gap-1 px-[8px] rounded-full h-[24px] max-h-[24px] min-h-[24px] bg-[#FAF5FF] border border-[#A855F7]">
                                      <div
                                        className="text-[12px] font-semibold text-[#A855F7] italic flex items-center justify-center h-[24px]"
                                        dangerouslySetInnerHTML={{
                                          __html: item.message.replace(
                                            /<a\b([^>]*)>/gi,
                                            '<a$1 target="_blank" rel="noopener noreferrer">'
                                          )
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Agent/Bot messages: ai, humanAgent, client; legacy: bot, agent, assistant */}
                                {(['ai', 'humanAgent', 'client', 'bot', 'agent', 'assistant', 'system'].includes(item.sender_type) &&
                                  item.is_note !== "true") && (
                                    <div className="flex items-start space-x-3 animate-in slide-in-from-left duration-300">
                                      {themeSettings?.showLogo && (
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-[#E2E8F0] overflow-hidden relative"
                                          style={{ backgroundColor: getThemeColor(4, '#3b82f6'), }}>
                                          {(item.sender_type === 'humanAgent' || item.sender_type === 'client' || item.sender_type === 'agent') && item.humanAgentId ? (
                                            item.humanAgentId.avatar && item.humanAgentId.avatar !== 'null' && item.humanAgentId.avatar.trim() !== '' ? (
                                              <img
                                                src={item.humanAgentId.avatar.startsWith('http')
                                                  ? item.humanAgentId.avatar
                                                  : `${process.env.NEXT_PUBLIC_API_HOST || process.env.NEXT_PUBLIC_FILE_HOST || ''}${item.humanAgentId.avatar}`}
                                                alt={item.humanAgentId.name || 'Agent'}
                                                className="w-8 h-8 rounded-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = defaultImage;
                                                }}
                                              />
                                            ) : (
                                              <img
                                                src={defaultImage}
                                                alt={item.humanAgentId.name || 'Agent'}
                                                className="w-8 h-8 rounded-full object-cover"
                                              />
                                            )
                                          ) : (
                                            <Bot className="w-4 h-4" style={{ color: getThemeColor(5, '#ffffff') }} />
                                          )}
                                        </div>
                                      )}

                                      <div className="flex-1 max-w-xs">
                                        <div
                                          className="px-4 py-3 rounded-2xl rounded-tl-md shadow-sm chat-bubble"
                                          style={{
                                            backgroundColor: getThemeColor(4, '#3b82f6'),
                                            color: getThemeColor(5, '#ffffff'),
                                            // Used to force <a> color inside dangerouslySetInnerHTML content
                                            ['--chat-link-color' as any]: getThemeColor(5, '#ffffff'),
                                          }}
                                        >
                                          {/* Reply quote for agent/bot messages */}
                                          {item.replyTo && (
                                            <button
                                              type="button"
                                              onClick={() => item.replyTo._id && scrollWidgetToMessageId(item.replyTo._id)}
                                              title="Jump to original message"
                                              className="text-[10px] font-semibold rounded-[6px] px-2.5 py-1.5 flex flex-col items-start gap-1 mb-1"
                                              style={{
                                                backgroundColor: getThemeColor(4, '#f1f5f9'),
                                                // Slight dark overlay so it looks richer while keeping theme color
                                                backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.18))',
                                              }}
                                            >
                                              <div className="text-[10px] font-semibold" style={{ color: getThemeColor(5, '#1e293b') }}>
                                                {item.replyTo.sender_type === 'visitor' ? 'You' : (item.replyTo.humanAgentId?.name || 'Agent')}
                                              </div>
                                              <div className="text-[11px] font-normal text-left" style={{ color: getThemeColor(5, '#1e293b') }}>
                                                {item.replyTo.message?.replace(/<[^>]+>/g, '').trim().slice(0, 80) || '…'}
                                              </div>
                                            </button>
                                          )}
                                          <div
                                            className="text-sm leading-relaxed [&_a]:text-[var(--chat-link-color)] [&_a]:underline [&_a]:break-words"
                                            dangerouslySetInnerHTML={{
                                              __html: item.message.replace(
                                                /<a\b([^>]*)>/gi,
                                                '<a$1 target="_blank" rel="noopener noreferrer">'
                                              )
                                            }}
                                          />
                                        </div>
                                        <div className="flex items-center gap-2 mt-[10px]">
                                          <span className="text-[10px] text-[#64748B] font-semibold">
                                            {item.createdAt && formatTime(item.createdAt)}
                                          </span>
                                          {conversationStatus === 'open' && (
                                            <button
                                              type="button"
                                              onClick={() => setReplyingTo({
                                                _id: item._id,
                                                message: item.message,
                                                sender_type: item.sender_type,
                                                senderName: item.humanAgentId?.name || 'Agent',
                                              })}
                                              className="text-[10px] text-[#64748B] font-semibold bg-[#F8FAFC] border border-[#E8E8E8] rounded-full px-1.5 h-[20px] flex items-center justify-center max-h-[20px] min-h-[20px] gap-1"
                                            >

                                              <span className="material-symbols-outlined !text-[12px]">
                                                reply
                                              </span> <span className="text-[10px] text-[#64748B] font-semibold">Reply</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                {/* Visitor messages */}
                                {item.sender_type === 'visitor' && (
                                  <div className="flex justify-end animate-in slide-in-from-right duration-300">
                                    <div className="max-w-xs">
                                      <div
                                        className="px-4 py-3 rounded-2xl rounded-tr-md shadow-sm chat-bubble"
                                        style={{
                                          backgroundColor: getThemeColor(2, '#f1f5f9'),
                                          color: getThemeColor(3, '#1e293b'),
                                          ['--chat-link-color' as any]: getThemeColor(3, '#1e293b'),
                                        }}
                                      >
                                        {/* Reply quote inside visitor bubble */}
                                        {item.replyTo && (
                                          <button
                                            type="button"
                                            onClick={() => item.replyTo._id && scrollWidgetToMessageId(item.replyTo._id)}
                                            title="Jump to original message"
                                            className="text-[10px] font-semibold rounded-[6px] px-2.5 py-1.5 flex flex-col items-start gap-1 mb-1"
                                            style={{
                                              backgroundColor: getThemeColor(2, '#f1f5f9'),
                                              // Slight dark overlay so it looks richer while keeping theme color
                                              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.18))',
                                            }}
                                          >
                                            <div className="text-[11px] font-semibold" style={{ color: getThemeColor(3, '#1e293b') }}>
                                              {item.replyTo.sender_type === 'visitor' ? 'You' : (item.replyTo.humanAgentId?.name || 'Agent')}
                                            </div>
                                            <div className="text-[12px] font-normal text-left" style={{ color: getThemeColor(3, '#1e293b') }}>
                                              {item.replyTo.message?.replace(/<[^>]+>/g, '').trim().slice(0, 80) || '…'}
                                            </div>
                                          </button>
                                        )}
                                        <div
                                          className="text-sm leading-relaxed [&_a]:text-[var(--chat-link-color)] [&_a]:underline [&_a]:break-words"
                                          dangerouslySetInnerHTML={{ __html: item.message }}
                                        />
                                      </div>
                                      <div className="text-[10px] text-[#64748B] font-semibold mt-[10px] text-right">
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
                            {isTyping && (() => {
                              // In agent mode (aiChat=false): find the most recent human agent message
                              // and use their humanAgentId for the avatar.
                              // In AI mode (aiChat=true): show the bot icon.
                              const recentHumanAgentMsg = !aiChat
                                ? [...conversation].reverse().find((msg: any) =>
                                  msg.humanAgentId && (msg.sender_type === 'humanAgent' || msg.sender_type === 'client' || msg.sender_type === 'agent')
                                )
                                : null;
                              const typingHumanAgent = recentHumanAgentMsg?.humanAgentId;

                              return (
                                <div className="flex items-start space-x-3 animate-in slide-in-from-left duration-300">
                                  {themeSettings?.showLogo && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-[#E2E8F0] overflow-hidden relative"
                                      style={{ backgroundColor: getThemeColor(4, '#3b82f6') }}>
                                      {typingHumanAgent ? (
                                        typingHumanAgent.avatar && typingHumanAgent.avatar !== 'null' && typingHumanAgent.avatar.trim() !== '' ? (
                                          <img
                                            src={typingHumanAgent.avatar.startsWith('http')
                                              ? typingHumanAgent.avatar
                                              : `${process.env.NEXT_PUBLIC_API_HOST || process.env.NEXT_PUBLIC_FILE_HOST || ''}${typingHumanAgent.avatar}`}
                                            alt={typingHumanAgent.name || 'Agent'}
                                            className="w-8 h-8 rounded-full object-cover"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.src = defaultImage;
                                            }}
                                          />
                                        ) : (
                                          <img
                                            src={defaultImage}
                                            alt={typingHumanAgent.name || 'Agent'}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                        )
                                      ) : (
                                        <Bot className="w-4 h-4" style={{ color: getThemeColor(5, '#ffffff') }} />
                                      )}
                                    </div>
                                  )}

                                  <div
                                    className="px-4 py-3 rounded-2xl rounded-tl-md"
                                    style={{
                                      backgroundColor: getThemeColor(4, '#3b82f6'),
                                      color: getThemeColor(5, '#ffffff'),
                                    }}
                                  >
                                    <div className="flex space-x-1">
                                      <div
                                        className="w-2 h-2 rounded-full animate-bounce"
                                        style={{ backgroundColor: getThemeColor(5, '#ffffff') }}
                                      ></div>
                                      <div
                                        className="w-2 h-2 rounded-full animate-bounce"
                                        style={{
                                          backgroundColor: getThemeColor(5, '#ffffff'),
                                          animationDelay: '0.1s',
                                        }}
                                      ></div>
                                      <div
                                        className="w-2 h-2 rounded-full animate-bounce"
                                        style={{
                                          backgroundColor: getThemeColor(5, '#ffffff'),
                                          animationDelay: '0.2s',
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Feedback Display - Show in chat area if feedback exists */}
                            {conversationFeedback && (conversationFeedback.feedback !== undefined || conversationFeedback.comment) && (
                              <div className="flex justify-center my-4">
                                <div className="max-w-xs w-full bg-gray-50 rounded-lg border border-gray-200 p-4">
                                  <div className="font-semibold text-sm text-gray-900 mb-2">Feedback</div>
                                  <div className="space-y-2">
                                    {conversationFeedback.feedback !== undefined && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-600">Rating:</span>
                                        <span className={`text-xs font-medium ${conversationFeedback.feedback ? 'text-green-600' : 'text-red-600'}`}>
                                          {conversationFeedback.feedback ? '👍 Good' : '👎 Poor'}
                                        </span>
                                      </div>
                                    )}
                                    {conversationFeedback.comment && (
                                      <div>
                                        <span className="text-xs text-gray-600 block mb-1">Comment:</span>
                                        <div className="bg-white rounded border border-gray-200 p-2">
                                          <p className="text-xs text-gray-900 whitespace-pre-wrap">{conversationFeedback.comment}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div ref={chatBottomRef} />
                          </div>
                        ) : (
                          // Pre-chat form
                          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col gap-5">
                            <div className="flex flex-col gap-2 w-4/5 mx-auto justify-center text-center">
                              <h3 className="text-[20px] font-bold text-[#111827] mb-2">
                                Hello! How can we help you today?
                              </h3>
                              <p className="text-[#64748B] text-[13px] font-normal">
                                Please fill out the form below to start a conversation with us.
                              </p>
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
                              className="inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#0F172A] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#111827]"
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

                    {/* Connecting to Agent Message */}
                    {isConnectingToAgent && (
                      <div className="border-t border-gray-200 bg-blue-50 flex-shrink-0 p-4">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm font-medium text-blue-700">Connecting to agent...</span>
                        </div>
                      </div>
                    )}

                    {/* Input Area or End Conversation */}
                    {chatInputAvailable && !isConnectingToAgent && (
                      <div className={`bg-white ${conversationStatus === 'close' ? 'flex-1 min-h-0 flex flex-col' : 'flex-shrink-0'}`}>
                        {conversationStatus === 'close' ? (
                          <div className="flex-1 flex flex-col justify-center px-6 py-4">
                            {feedbackSubmitted ? (
                              <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                  <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Your response has been submitted</h3>
                                <p className="text-gray-600 text-sm mb-6 leading-relaxed">Thank you for your feedback! We appreciate your input.</p>

                                <button
                                  onClick={handleStartNewChat}
                                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                >
                                  Start New Chat
                                </button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                                  <CheckCircle className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">Conversation Ended</h3>
                                <p className="text-gray-600 text-xs mb-5 leading-relaxed">Thank you for chatting with us! We hope we were able to help you.</p>

                                {/* Feedback Section */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                  <p className="text-xs font-medium text-gray-700">How was your experience?</p>
                                  <div className="flex justify-center space-x-2">
                                    <button
                                      onClick={() => handleFeedback(true)}
                                      disabled={feedback === false || isSubmittingFeedback}
                                      className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-200 ${feedback === true
                                        ? 'bg-green-500 text-white shadow-lg scale-105'
                                        : 'bg-white text-gray-700 hover:bg-green-500 hover:text-white hover:scale-105 border border-gray-200'
                                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                                    >
                                      <ThumbsUp className="w-5 h-5" />
                                      <span className="text-xs font-medium">Good</span>
                                    </button>

                                    <button
                                      onClick={() => handleFeedback(false)}
                                      disabled={feedback === true || isSubmittingFeedback}
                                      className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-200 ${feedback === false
                                        ? 'bg-red-500 text-white shadow-lg scale-105'
                                        : 'bg-white text-gray-700 hover:bg-red-500 hover:text-white hover:scale-105 border border-gray-200'
                                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                                    >
                                      <ThumbsDown className="w-5 h-5" />
                                      <span className="text-xs font-medium">Poor</span>
                                    </button>
                                  </div>

                                  {/* Comment Section */}
                                  <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                      Share your feedback (Optional)
                                    </label>
                                    <textarea
                                      value={comment}
                                      onChange={(e) => setComment(e.target.value)}
                                      placeholder="Tell us what you think about your experience..."
                                      rows={2}
                                      maxLength={500}
                                      disabled={isSubmittingFeedback}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-xs text-gray-500">
                                        {comment.length}/500 characters
                                      </span>
                                    </div>
                                  </div>

                                  {/* Submit Button */}
                                  {feedback !== null && (
                                    <button
                                      onClick={handleSubmitFeedback}
                                      disabled={isSubmittingFeedback}
                                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg disabled:transform-none mt-3"
                                    >
                                      {isSubmittingFeedback ? (
                                        <div className="flex items-center justify-center space-x-2">
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>Submitting...</span>
                                        </div>
                                      ) : (
                                        'Submit Feedback'
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="px-5 py-5">
                            {/* Recording UI - Overlay style */}
                            {isRecording ? (
                              <div className="space-y-4">
                                {/* Recording indicator */}
                                <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                      <span className="text-sm font-semibold text-red-700">Recording</span>
                                    </div>
                                    <span className="text-sm font-mono text-red-600 font-semibold">{formatRecordingTime(recordingTime)}</span>
                                  </div>

                                  {/* Waveform animation */}
                                  <div className="flex items-center justify-center space-x-1 h-16 bg-white rounded-lg px-4 shadow-inner">
                                    {[...Array(30)].map((_, i) => {
                                      const randomHeight = 20 + Math.random() * 70;
                                      const randomDuration = 0.3 + Math.random() * 0.5;
                                      return (
                                        <div
                                          key={i}
                                          className="waveform-bar bg-red-500 rounded-full"
                                          style={{
                                            height: `${randomHeight}%`,
                                            animation: `waveform ${randomDuration}s ease-in-out infinite`,
                                            animationDelay: `${i * 0.025}s`
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Cancel button only */}
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={handleRecordingCancel}
                                    className="px-8 py-3 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors border-2 border-gray-300 shadow-sm"
                                  >
                                    Stop
                                  </button>
                                </div>
                              </div>
                            ) : isTranscribing ? (
                              /* Transcribing loader */
                              <div className="space-y-4">
                                <div className="bg-blue-50 rounded-xl p-8 border border-blue-100">
                                  <div className="flex flex-col items-center justify-center space-y-4">
                                    {/* Animated dots loader */}
                                    <div className="flex space-x-2">
                                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>

                                    {/* Transcribing text */}
                                    <div className="text-center">
                                      <p className="text-sm font-semibold text-blue-700 mb-1">Transcribing...</p>
                                      <p className="text-xs text-blue-600">Processing your voice message</p>
                                    </div>

                                    {/* Animated progress bar */}
                                    <div className="w-full max-w-xs h-1 bg-blue-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full animate-progress"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Reply context bar */}
                                {replyingTo && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderLeft: '3px solid #3b82f6',
                                    background: '#eff6ff',
                                    borderRadius: '4px',
                                    padding: '6px 10px',
                                    marginBottom: '8px',
                                    gap: '8px',
                                  }}>
                                    <button
                                      type="button"
                                      onClick={() => replyingTo._id && scrollWidgetToMessageId(replyingTo._id)}
                                      disabled={!replyingTo._id}
                                      title="Jump to message in chat"
                                      style={{
                                        flex: 1,
                                        minWidth: 0,
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        cursor: replyingTo._id ? 'pointer' : 'default',
                                        padding: 0,
                                        font: 'inherit',
                                      }}
                                    >
                                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#1d4ed8', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Replying to {replyingTo.senderName || 'Agent'}
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {replyingTo.message?.replace(/<[^>]+>/g, '').trim().slice(0, 80) || '…'}
                                      </div>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setReplyingTo(null)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}

                                {/* Normal Input area */}
                                <div className="rounded-full border border-[#D8DEE8] bg-white px-3 py-2 min-h-[52px] flex items-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                  <textarea
                                    ref={textareaRef}
                                    placeholder="Message..."
                                    value={inputMessage}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        const textarea = e.currentTarget;
                                        handleMessageSend();
                                        requestAnimationFrame(() => {
                                          requestAnimationFrame(() => {
                                            textarea.focus();
                                          });
                                        });
                                      }
                                    }}
                                    rows={1}
                                    disabled={(aiChat && isTyping) || !isOnline}
                                    className="flex-1 min-w-0 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 resize-none overflow-y-auto custom-scrollbar text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] leading-[20px] pr-2"
                                    style={{ minHeight: '20px', maxHeight: '72px' }}
                                  />

                                  <div className="flex items-center pl-2 gap-2 border-l border-[#E2E8F0]">
                                    {shouldRenderVoiceButton && (
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
                                        className="h-8 w-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Mic className="w-4 h-4" />
                                      </button>
                                    )}

                                    <button
                                      onClick={handleMessageSend}
                                      disabled={!inputMessage.trim() || Boolean(error) || (aiChat && isTyping) || !isOnline}
                                      className="h-8 w-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      style={{
                                        backgroundColor: getThemeColor(4, '#3b82f6'),
                                        color: getThemeColor(5, '#ffffff'),
                                      }}
                                    >
                                      <Send className="w-4 h-4" />
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
                              </>
                            )}
                          </div>
                        )}

                        {/* White Label Footer */}
                        {!themeSettings?.showWhiteLabel && (
                          <div className="px-5 pb-[12px] bg-white flex-shrink-0">
                            <div className="text-[12px] text-[#B0B9C8] text-center flex items-center justify-center gap-1.5">
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-[4px] bg-[#D3D9E5] text-[10px] font-semibold text-white">C</span>
                              <span>Powered by Chataffy</span>
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
            @keyframes progress {
              0% {
                width: 0%;
              }
              100% {
                width: 100%;
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
            .animate-progress {
              animation: progress 1.5s ease-in-out;
            }
          `}</style>
        </div>
      )}
    </>
  );
}