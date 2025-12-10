"use client";
import { PhoneOff, UserX } from "lucide-react";
import TagsSection from "./TagsSection";
import { Tag } from "./types/inbox";

interface ChatHeaderProps {
  visitorName: string;
  isAIChat: boolean;
  openConversationStatus: string;
  tags: Tag[];
  addTag: boolean;
  inputAddTag: string;
  onToggleAI: () => void;
  onCloseConversation: () => void;
  onBlockVisitor: () => void;
  onAddTag: () => void;
  onAddTagClick: () => void;
  onTagDelete: (id: string) => void;
  onInputAddTagChange: (value: string) => void;
  setAddTag: (value: boolean) => void;
  canReply?: boolean;
}

export default function ChatHeader({
  visitorName,
  isAIChat,
  openConversationStatus,
  tags,
  addTag,
  inputAddTag,
  onToggleAI,
  onCloseConversation,
  onBlockVisitor,
  onAddTag,
  onAddTagClick,
  onTagDelete,
  onInputAddTagChange,
  setAddTag,
  canReply = true,
}: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {visitorName}
          </h2>
          
          {/* AI Toggle */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">AI Chat</span>
            <button
              onClick={onToggleAI}
              disabled={!canReply}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAIChat ? 'bg-blue-600' : 'bg-gray-200'
              } ${!canReply ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAIChat ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">Agent Chat</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {openConversationStatus === "open" ? (
            <button 
              onClick={onCloseConversation}
              disabled={!canReply}
              className={`flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors ${
                canReply ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Close Conversation
            </button>
          ) : (
            <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg cursor-not-allowed">
              <PhoneOff className="w-4 h-4 mr-2" />
              Conversation Closed
            </button>
          )}
          
          {openConversationStatus === "open" ? (
            <button 
              onClick={onBlockVisitor}
              disabled={!canReply}
              className={`flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg transition-colors ${
                canReply ? 'hover:bg-red-100' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <UserX className="w-4 h-4 mr-2" />
              Block Visitor
            </button>
          ) : (
            <button className="flex items-center px-3 py-2 text-sm font-medium text-red-400 bg-red-25 rounded-lg cursor-not-allowed">
              <UserX className="w-4 h-4 mr-2" />
              Visitor Blocked
            </button>
          )}
        </div>
      </div>

      <TagsSection
        tags={tags}
        addTag={addTag}
        inputAddTag={inputAddTag}
        onAddTag={onAddTag}
        onAddTagClick={onAddTagClick}
        onTagDelete={onTagDelete}
        onInputAddTagChange={onInputAddTagChange}
        setAddTag={setAddTag}
      />
    </div>
  );
}