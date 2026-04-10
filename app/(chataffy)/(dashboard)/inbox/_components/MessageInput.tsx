"use client";
import { Send, Mic, MessageCircle, StickyNote, X, Mic2, Square, Trash2 } from "lucide-react";
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
  isVisitorClosed?: boolean;
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
  isVisitorClosed = false,
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

  // Voice note state (notes mode only)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [isVoiceUploading, setIsVoiceUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Emit typing events to backend
  const emitTypingEvent = useCallback((isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket || !conversationId || !visitorId) {
      return;
    }

    // Only emit typing events when:
    // 1. Agent chat mode (not AI handling the thread)
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

  // Cleanup voice note resources on unmount or conversation change
  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

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

  const formatVoiceTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setVoiceBlob(blob);
        setVoicePreviewUrl(url);
        setIsVoiceRecording(false);
        if (voiceTimerRef.current) {
          clearInterval(voiceTimerRef.current);
          voiceTimerRef.current = null;
        }
      };
      mr.start();
      setVoiceSeconds(0);
      setIsVoiceRecording(true);
      voiceTimerRef.current = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
    } catch {
      setSpeechError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const discardVoiceNote = () => {
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    setVoiceBlob(null);
    setVoicePreviewUrl(null);
    setVoiceSeconds(0);
    setIsVoiceUploading(false);
  };

  const sendVoiceNote = async () => {
    if (!voiceBlob || !conversationId || !visitorId) return;
    setIsVoiceUploading(true);
    setSpeechError(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9001';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const ext = voiceBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const formData = new FormData();
      formData.append('audio', voiceBlob, `voice-note.${ext}`);
      const res = await fetch(`${apiBase}/api/upload-voice-note`, {
        method: 'POST',
        headers: { Authorization: token },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const audioUrl = `${apiBase}${data.url}`;
      const message = `<audio src="${audioUrl}" controls style="max-width:220px;border-radius:8px;outline:none;display:block;margin:4px 0;"></audio>`;
      const socket = socketRef.current;
      if (socket) {
        socket.emit(
          'client-send-add-note',
          { message, visitorId, conversationId, replyTo: null },
          (response: any) => {
            if (response?.success) {
              discardVoiceNote();
            } else {
              setSpeechError('Failed to send voice note.');
            }
            setIsVoiceUploading(false);
          }
        );
      }
    } catch {
      setSpeechError('Failed to upload voice note. Please try again.');
      setIsVoiceUploading(false);
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
    (!isNoteActive &&
      openConversationStatus === "open" &&
      (isAIChat || isVisitorClosed)) ||
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
            isVoiceRecording ? (
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                  <span className="text-[13px] font-semibold text-red-700">Recording</span>
                  <span className="text-[13px] font-mono text-red-600 font-semibold">{formatVoiceTime(voiceSeconds)}</span>
                </div>
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700 transition-colors"
                >
                  <Square className="w-3 h-3 fill-white" />
                  Stop
                </button>
              </div>
            ) : voicePreviewUrl ? (
              <div className="flex flex-col gap-2 py-1">
                <audio src={voicePreviewUrl} controls className="w-full h-8" style={{ borderRadius: '8px', outline: 'none' }} />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={sendVoiceNote}
                    disabled={isVoiceUploading || !isOnline}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B82F6] text-white text-[12px] font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    {isVoiceUploading ? 'Sending…' : 'Send Voice Note'}
                  </button>
                  <button
                    type="button"
                    onClick={discardVoiceNote}
                    disabled={isVoiceUploading}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-[12px] font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Discard
                  </button>
                </div>
              </div>
            ) : (
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
            )
          ) : isVisitorClosed && openConversationStatus === "open" ? (
            <div className="w-full rounded-lg bg-gray-50 text-gray-500 text-sm px-1 py-2">
              The visitor ended this chat. Messaging is disabled; you can still use Notes for internal comments.
            </div>
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
              disabled={!isOnline || !canReply || isVisitorClosed}
            />
          )}

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {!isVoiceRecording && !voicePreviewUrl && (
              <span className="text-[11px] text-[#94A3B8]">
                {wordCount}/{maxWords}
              </span>
            )}

            {/* Voice note button — only in notes mode */}
            {(isNoteActive || openConversationStatus === "close") && !isVoiceRecording && !voicePreviewUrl && (
              <button
                type="button"
                onClick={startVoiceRecording}
                disabled={!isOnline}
                title="Record a voice note"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#EEF2F7] hover:text-[#64748B] disabled:opacity-40 transition-colors"
              >
                <Mic2 className="w-4 h-4" />
              </button>
            )}

            {showVoiceButton && !isVoiceRecording && !voicePreviewUrl && (
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

            {!isVoiceRecording && !voicePreviewUrl && (
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
            )}
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