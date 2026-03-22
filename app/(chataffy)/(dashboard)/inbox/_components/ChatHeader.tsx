"use client";
import { useRef, useEffect, useState } from "react";
import { UserX, MoreHorizontal, Tag, X, MessageSquareX } from "lucide-react";
import { Tag as TagType } from "./types/inbox";

const PREDEFINED_TAGS = ["Lead", "Ticket", "Support"];

interface ChatHeaderProps {
  visitorName: string;
  isAIChat: boolean;
  openConversationStatus: string;
  tags: TagType[];
  inputAddTag: string;
  onToggleAI: () => void;
  onCloseConversation: () => void;
  onBlockVisitor: () => void;
  onAddTagClick: () => void;
  onTagDelete: (id: string) => void;
  onInputAddTagChange: (value: string) => void;
  canReply?: boolean;
}

export default function ChatHeader({
  visitorName,
  isAIChat,
  openConversationStatus,
  tags,
  inputAddTag,
  onToggleAI,
  onCloseConversation,
  onBlockVisitor,
  onAddTagClick,
  onTagDelete,
  onInputAddTagChange,
  canReply = true,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isConversationOpen = openConversationStatus === "open";

  const handlePredefinedTag = (tagName: string) => {
    const alreadyAdded = tags.some(
      (t) => t.name.toLowerCase() === tagName.toLowerCase()
    );
    if (!alreadyAdded && tags.length < 6) {
      onInputAddTagChange(tagName);
      // Trigger add after state update
      setTimeout(() => onAddTagClick(), 0);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-5 py-3.5">
      <div className="flex items-center justify-between gap-3">
        {/* LEFT — name + status + handling badge + assigned tags */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Visitor name */}
          <h2 className="text-base font-semibold text-gray-900 truncate">
            {visitorName}
          </h2>

          {/* Online dot */}
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />

          {/* Handling badge */}
          {isAIChat ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200 flex-shrink-0">
              <span className="text-[10px]">✦</span>
              AI Handling
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 flex-shrink-0">
              <span className="text-[10px]">⊙</span>
              Agent Responding
            </span>
          )}

          {/* Assigned tags */}
          {tags.map((tag: TagType) => (
            <span
              key={tag._id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 flex-shrink-0"
            >
              #{tag.name}
              <button
                onClick={() => onTagDelete(tag._id)}
                className="ml-0.5 hover:text-purple-900 transition-colors"
                title="Remove tag"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* RIGHT — AI status + close + 3-dot menu */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* AI status button */}
          <button
            onClick={canReply ? onToggleAI : undefined}
            disabled={!canReply || !isAIChat}
            title={isAIChat ? "Disable AI (hand off to agent)" : "AI is offline"}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              isAIChat
                ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
            } ${!canReply ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isAIChat ? "AI Active" : "AI Offline"}
          </button>

          {/* Close conversation button */}
          <button
            onClick={isConversationOpen && canReply ? onCloseConversation : undefined}
            disabled={!isConversationOpen || !canReply}
            title={isConversationOpen ? "Close Conversation" : "Conversation Closed"}
            className={`p-2 rounded-lg border transition-colors ${
              isConversationOpen && canReply
                ? "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-red-500 hover:border-red-200"
                : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
            }`}
          >
            <MessageSquareX className="w-4 h-4" />
          </button>

          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
                {/* Block Visitor */}
                <button
                  onClick={() => {
                    if (isConversationOpen && canReply) {
                      onBlockVisitor();
                      setMenuOpen(false);
                    }
                  }}
                  disabled={!isConversationOpen || !canReply}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                    isConversationOpen && canReply
                      ? "text-red-600 hover:bg-red-50 cursor-pointer"
                      : "text-red-300 cursor-not-allowed"
                  }`}
                >
                  <UserX className="w-4 h-4" />
                  Block Visitor
                </button>

                <div className="border-t border-gray-100 my-1" />

                {/* Tag Conversation */}
                <div className="px-4 py-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Tag Conversation
                  </p>

                  {/* Tag input */}
                  <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 mb-2">
                    <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Type a tag"
                      value={inputAddTag}
                      onChange={(e) => {
                        if (e.target.value.length <= 30) {
                          onInputAddTagChange(e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && inputAddTag.trim()) {
                          onAddTagClick();
                        }
                      }}
                      className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
                    />
                    {inputAddTag.trim() && (
                      <button
                        onClick={() => onAddTagClick()}
                        disabled={tags.length >= 6}
                        className="text-xs text-blue-600 font-medium hover:text-blue-700 disabled:opacity-40 flex-shrink-0"
                      >
                        Add
                      </button>
                    )}
                  </div>

                  {/* Predefined tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {PREDEFINED_TAGS.map((name) => {
                      const alreadyAdded = tags.some(
                        (t) => t.name.toLowerCase() === name.toLowerCase()
                      );
                      return (
                        <button
                          key={name}
                          onClick={() => handlePredefinedTag(name)}
                          disabled={alreadyAdded || tags.length >= 6}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                            alreadyAdded
                              ? "bg-purple-50 text-purple-400 border-purple-200 cursor-default opacity-60"
                              : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 cursor-pointer"
                          }`}
                        >
                          #{name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
