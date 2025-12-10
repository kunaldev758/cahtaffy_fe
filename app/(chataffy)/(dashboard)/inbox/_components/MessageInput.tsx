"use client";
import { Send, Mic, MessageCircle, StickyNote } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

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
      
      socket.emit(eventName, { conversationId, visitorId }, (response: any) => {
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
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* No Internet Banner */}
      {!isOnline && (
        <div className="bg-red-100 text-red-700 text-center py-2 font-semibold mb-2">
          No internet connection. Chat is disabled.
        </div>
      )}
      <div className="flex space-x-2 mb-4">
        {openConversationStatus === "open" && !isAIChat && (
          <button
            onClick={() => setIsNoteActive(false)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              !isNoteActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </button>
        )}
        
        <button
          onClick={() => setIsNoteActive(true)}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            isNoteActive
              ? 'bg-yellow-100 text-yellow-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <StickyNote className="w-4 h-4 mr-2" />
          Note
        </button>
      </div>

      <div className="flex items-end space-x-3">
        <div className="flex-1">
          {isNoteActive || openConversationStatus === "close" ? (
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={onInputChange}
                placeholder="Enter note here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onAddNote();
                  }
                }}
                disabled={!isOnline}
              />
              <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                {wordCount}/{maxWords} words
              </div>
            </div>
          ) : isAIChat ? (
            <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
              Chat is disabled. Please disable AI Chat to send messages.
            </div>
          ) : !canReply ? (
            <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
              You don't have permission to reply to this conversation.
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={inputMessage}
                onChange={(e) => {
                  onInputChange(e);
                  // Trigger typing event when agent types
                  handleTyping();
                }}
                placeholder="Type a message..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
              <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                {wordCount}/{maxWords} words
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
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
              className={`p-3 rounded-lg transition-colors ${
                isRecording
                  ? "bg-red-100 text-red-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Mic className="w-5 h-5" />
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
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
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