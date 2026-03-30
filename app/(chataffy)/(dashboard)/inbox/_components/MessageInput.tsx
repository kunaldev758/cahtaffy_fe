"use client";
import { Send, Mic, MessageCircle, StickyNote, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface ReplyingTo {
  _id?: string;
  message: string;
  sender_type: string;
  senderName?: string;
}

interface MessageInputProps {
  inputMessage: string;
  wordCount: number;
  maxWords: number;
  isNoteActive: boolean;
  isAIChat: boolean;
  openConversationStatus: string;
  conversationId: string | null;
  visitorId: string | null;
  socketRef: React.RefObject<Socket | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onMessageSend: () => void;
  onAddNote: () => void;
  setIsNoteActive: (value: boolean) => void;
  canReply?: boolean;
  replyingTo?: ReplyingTo | null;
  onClearReply?: () => void;
  onJumpToReplyPreview?: (messageId: string) => void;
}

export default function MessageInput({
  inputMessage,
  wordCount,
  maxWords,
  isNoteActive,
  isAIChat,
  openConversationStatus,
  conversationId,
  visitorId,
  socketRef,
  onInputChange,
  onMessageSend,
  onAddNote,
  setIsNoteActive,
  canReply = true,
  replyingTo,
  onClearReply,
  onJumpToReplyPreview,
}: MessageInputProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  // Emit typing events to backend
  const emitTypingEvent = useCallback((isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket || !conversationId || !visitorId) {
      return;
    }

    // Only emit typing events when:
    // 1. Not in AI chat mode (isAIChat = false)
    // 2. Not in note mode
    // 3. Conversation is open
    // 4. We have valid conversationId and visitorId
    if (!isAIChat && !isNoteActive && openConversationStatus === 'open') {
      const eventName = isTyping ? 'agent-start-typing' : 'agent-stop-typing';
      console.log(`⌨️ Emitting ${eventName}:`, { conversationId, visitorId, isAIChat });
      
      socket.emit(eventName, { conversationId, visitorId, aiChat: isAIChat }, (response: any) => {
        if (response?.success) {
          console.log(`✅ ${eventName} acknowledged:`, response);
        } else {
          console.log(`⚠️ ${eventName} response:`, response);
        }
      });
    }
  }, [socketRef, conversationId, visitorId, isAIChat, isNoteActive, openConversationStatus]);

  // Handle typing with debouncing
  const handleTyping = useCallback(() => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // If not already typing, emit start-typing
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTypingEvent(true);
    }

    // Set timeout to emit stop-typing after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitTypingEvent(false);
      }
      typingTimeoutRef.current = null;
    }, 2000);
  }, [emitTypingEvent]);

  // Cleanup typing timeout on unmount or when conversation changes
  useEffect(() => {
    // Stop typing when conversation changes
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitTypingEvent(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      // Emit stop-typing when component unmounts
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitTypingEvent(false);
      }
    };
  }, [conversationId, visitorId, emitTypingEvent]);

  const appendTranscript = useCallback(
    (transcript: string) => {
      const cleanTranscript = transcript.trim();
      if (!cleanTranscript) {
        return;
      }
      const nextValue = inputMessage
        ? `${inputMessage.trim()} ${cleanTranscript}`.trim()
        : cleanTranscript;

      const syntheticEvent = {
        target: { value: nextValue },
        currentTarget: { value: nextValue },
      } as React.ChangeEvent<HTMLTextAreaElement>;

      onInputChange(syntheticEvent);
      // Trigger typing event when recording transcript is appended
      handleTyping();
    },
    [inputMessage, onInputChange, handleTyping],
  );

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
    if (typeof window === "undefined") {
      return;
    }
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      appendTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      setSpeechError(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [appendTranscript]);

  const toggleRecording = () => {
    if (!recognitionRef.current || !isSpeechSupported) {
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      // Emit stop-typing when recording stops
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitTypingEvent(false);
      }
      return;
    }
    setSpeechError(null);
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      // Emit start-typing when recording starts (only in agent chat mode)
      if (!isAIChat && !isNoteActive && openConversationStatus === 'open') {
        handleTyping();
      }
    } catch (err) {
      setSpeechError("Unable to access microphone. Please try again.");
      setIsRecording(false);
    }
  };

  const allowsVoiceForChat =
    !isNoteActive && openConversationStatus === "open" && !isAIChat;
  const allowsVoiceForNotes = isNoteActive || openConversationStatus === "close";
  const allowVoiceCapture = allowsVoiceForChat || allowsVoiceForNotes;
  const showVoiceButton = isSpeechSupported && allowVoiceCapture;
  const voiceDisabled = !isOnline || !allowVoiceCapture;
  const sendDisabled =
    !inputMessage.trim() ||
    (!isNoteActive && isAIChat && openConversationStatus === "open") ||
    !isOnline ||
    !canReply;
  const stripHtml = (html: string) => html?.replace(/<[^>]+>/g, '').trim() || '';

  return (
    <div className="bg-white rounded-b-[20px]">
      {/* Reply context bar */}
      {replyingTo && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderLeft: '3px solid #3b82f6',
          background: '#eff6ff',
          borderRadius: '4px',
          padding: '6px 10px',
          marginBottom: '8px',
          gap: '8px',
        }}>
          <button
            type="button"
            onClick={() => replyingTo._id && onJumpToReplyPreview?.(replyingTo._id)}
            disabled={!replyingTo._id || !onJumpToReplyPreview}
            title={replyingTo._id && onJumpToReplyPreview ? 'Jump to message in chat' : undefined}
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: replyingTo._id && onJumpToReplyPreview ? 'pointer' : 'default',
              padding: 0,
              font: 'inherit',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#1d4ed8', marginBottom: '2px' }}>
              REPLYING TO {(replyingTo.senderName || 'VISITOR').toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {stripHtml(replyingTo.message).slice(0, 100) || '…'}
            </div>
          </button>
          <button
            type="button"
            onClick={onClearReply}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px', flexShrink: 0 }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* No Internet Banner */}
      {!isOnline && (
        <div className="bg-red-100 text-red-700 text-center py-2 font-semibold mx-4 mt-3 mb-2 rounded-md">
          No internet connection. Chat is disabled.
        </div>
      )}
      <div className="pt-2">
        <div className="flex items-center border-b border-[#E5E7EB]">
          {openConversationStatus === "open" && !isAIChat && (
            <button
              onClick={() => setIsNoteActive(false)}
              className={`inline-flex h-10 items-center gap-2 border-b-2 px-[24px] text-[12px] font-bold uppercase tracking-[0.02em] transition-colors ${
                !isNoteActive
                  ? "border-[#3B82F6] text-[#3B82F6]"
                  : "border-transparent text-[#C5C5C5] hover:text-[#6B7280]"
              }`}
            >
              <MessageCircle className="w-[16px] h-[16px]" />
              Chat
            </button>
          )}

          <button
            onClick={() => setIsNoteActive(true)}
            className={`inline-flex h-10 items-center gap-2 border-b-2 px-[24px] text-[12px] font-semibold uppercase tracking-[0.02em] transition-colors ${
              isNoteActive
                ? "border-[#3B82F6] text-[#3B82F6]"
                : "border-transparent text-[#C5C5C5] hover:text-[#6B7280]"
            }`}
          >
            <StickyNote className="w-[16px] h-[16px]" />
            Notes
          </button>
        </div>
      </div>

      <div className="">
        <div className={`relative rounded-b-[20px] min-h-[106px] px-4 pt-3 pb-12 ${isNoteActive || openConversationStatus === "close" ? "bg-[#fefce8]" : "bg-white"}`}>
          {isNoteActive || openConversationStatus === "close" ? (
            <textarea
              value={inputMessage}
              onChange={(e) => onInputChange(e)}
              placeholder="Enter note here..."
              rows={2}
              className="w-full resize-none border-0 bg-transparent p-0 text-[14px] leading-[24px] text-[#111827] placeholder:text-[#94A3B8] outline-none focus:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onAddNote();
                }
              }}
              disabled={!isOnline}
            />
          ) : isAIChat ? (
            <div className="w-full rounded-lg bg-gray-50 text-gray-500 text-sm">
              Chat is disabled. Please disable AI Chat to send messages.
            </div>
          ) : !canReply ? (
            <div className="w-full rounded-lg bg-gray-50 text-gray-500 text-sm">
              You don't have permission to reply to this conversation.
            </div>
          ) : (
            <textarea
              value={inputMessage}
              onChange={(e) => {
                onInputChange(e);
                // Trigger typing event when agent types
                handleTyping();
              }}
              placeholder="Type a message..."
              rows={2}
              className="w-full resize-none border-0 bg-white p-0 text-[14px] leading-[24px] text-[#111827] placeholder:text-[#94A3B8] outline-none focus:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  // Emit stop-typing before sending message
                  if (isTypingRef.current) {
                    isTypingRef.current = false;
                    emitTypingEvent(false);
                  }
                  onMessageSend();
                }
              }}
              disabled={!isOnline || !canReply}
            />
          )}

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-[11px] text-[#94A3B8]">
              {wordCount}/{maxWords}
            </span>

            {showVoiceButton && (
              <button
                onClick={toggleRecording}
                disabled={voiceDisabled}
                title={
                  !isSpeechSupported
                    ? "Voice capture is not supported in this browser."
                    : allowsVoiceForNotes
                      ? "Use your voice to add a note."
                      : isRecording
                        ? "Stop recording"
                        : "Start recording"
                }
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  isRecording
                    ? "bg-red-100 text-red-600"
                    : "text-[#94A3B8] hover:bg-[#EEF2F7] hover:text-[#64748B]"
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                // Emit stop-typing before sending message/note
                if (isTypingRef.current) {
                  isTypingRef.current = false;
                  emitTypingEvent(false);
                }
                if (isNoteActive || openConversationStatus === "close") {
                  onAddNote();
                } else {
                  onMessageSend();
                }
              }}
              disabled={sendDisabled}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E2E8F0] text-[#94A3B8] hover:bg-[#CBD5E1] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {speechError && (
        <div className="mt-2 text-xs text-red-600">
          {speechError === "not-allowed"
            ? "Microphone access was denied. Please enable it in your browser settings."
            : speechError}
        </div>
      )}
      {isRecording && (
        <div className="mt-2 text-xs text-blue-600">
          Listening... speak your command and tap the mic to stop.
        </div>
      )}
    </div>
  );
}