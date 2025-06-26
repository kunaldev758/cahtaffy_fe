"use client";
import { Send, Mic, MessageCircle, StickyNote } from "lucide-react";
import { useEffect, useState } from 'react';

interface MessageInputProps {
  inputMessage: string;
  wordCount: number;
  maxWords: number;
  isNoteActive: boolean;
  isAIChat: boolean;
  openConversationStatus: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onMessageSend: () => void;
  onAddNote: () => void;
  setIsNoteActive: (value: boolean) => void;
}

export default function MessageInput({
  inputMessage,
  wordCount,
  maxWords,
  isNoteActive,
  isAIChat,
  openConversationStatus,
  onInputChange,
  onMessageSend,
  onAddNote,
  setIsNoteActive,
}: MessageInputProps) {
  const [isOnline, setIsOnline] = useState(true);
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
          ) : (
            <div className="relative">
              <textarea
                value={inputMessage}
                onChange={onInputChange}
                placeholder="Type a message..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onMessageSend();
                  }
                }}
                disabled={!isOnline}
              />
              <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                {wordCount}/{maxWords} words
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {!isAIChat && !isNoteActive && openConversationStatus === "open" && (
            <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Mic className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={isNoteActive || openConversationStatus === "close" ? onAddNote : onMessageSend}
            disabled={!inputMessage.trim() || (!isNoteActive && isAIChat && openConversationStatus === "open") || !isOnline}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}