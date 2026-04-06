"use client";
import { useRef, useEffect, useState } from "react";
import { UserX, MoreHorizontal, Tag, X, MessageSquareX } from "lucide-react";
import { Tag as TagType } from "./types/inbox";
import Image from "next/image";
import { publicAsset } from "@/lib/publicAsset";

const PREDEFINED_TAGS = ["Lead", "Ticket", "Support"];

const PREDEFINED_TAG_THEME: Record<string, { base: string; hover: string; disabled: string }> = {
  Lead: {
    base: "bg-[#ECFDF5] text-[#059669] border-[#059669]",
    hover: "hover:bg-[#D1FAE5]",
    disabled: "bg-[#ECFDF5] text-[#6EE7B7] border-[#A7F3D0] cursor-default opacity-60",
  },
  Ticket: {
    base: "bg-[#FAF5FF] text-[#A855F7] border-[#A855F7]",
    hover: "hover:bg-[#F3E8FF]",
    disabled: "bg-[#FAF5FF] text-[#D8B4FE] border-[#E9D5FF] cursor-default opacity-60",
  },
  Support: {
    base: "bg-[#FFFBEB] text-[#FBBF24] border-[#FBBF24]",
    hover: "hover:bg-[#FEF3C7]",
    disabled: "bg-[#FFFBEB] text-[#FCD34D] border-[#FDE68A] cursor-default opacity-60",
  },
};

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
  isVisitorClosed?: boolean;
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
  isVisitorClosed = false,
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
    <div className="bg-white border-b border-gray-200 px-[20px] w-full rounded-t-[20px] h-[74px]">
      <div className="flex items-center justify-between gap-3 h-full">
        {/* LEFT — name + status + handling badge + assigned tags */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {/* Visitor name */}
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {visitorName}
            </h2>

            {/* Online dot */}
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          </div>

          <div className="flex items-center gap-[10px]">
            <div>
              {/* Handling badge */}
              {isAIChat ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#FAF5FF] text-[#A855F7] border border-[#A855F7] h-[18px]">
                  <Image src={publicAsset("/images/new/sparkle-purple-icon.svg")} alt="Sparkle" width={12} height={12} />
                  AI Handling
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#059669] h-[18px]">
                  <span className="material-symbols-outlined !text-[12px] text-[#059669]">
                    support_agent
                  </span>
                  Agent Responding
                </span>
              )}
            </div>

            <div className="flex items-center gap-[10px]">
              {/* Assigned tags */}
              {tags.map((tag: TagType) => (
                <span
                  key={tag._id}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#FAF5FF] text-[#A855F7] border border-[#A855F7] h-[18px]"
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
          </div>


        </div>

        {/* RIGHT — AI status + close + 3-dot menu */}
        <div className="flex items-center gap-[12px] flex-shrink-0">
          {/* AI status button */}
          <button
            onClick={canReply && !isVisitorClosed ? onToggleAI : undefined}
            disabled={!canReply || !isAIChat || isVisitorClosed}
            title={
              isVisitorClosed
                ? "The visitor ended this chat"
                : isAIChat
                  ? "Disable AI (hand off to agent)"
                  : "AI is offline"
            }
            className={`px-[18px] h-[38px] text-[13px] font-bold rounded-[12px] flex items-center justify-center gap-[8px] ${isAIChat
              ? "bg-[#111827] text-white shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.10)]"
              : "bg-[#F1F5F9] text-[#64748B] border-gray-200 cursor-default"
              } ${!canReply || isVisitorClosed ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isAIChat && (
              <span className="material-symbols-outlined !text-[18px]">
                how_to_reg
              </span>
            )}
            {isAIChat ? "Take Over" : "AI Offline"}
          </button>

          {/* Close conversation button */}
          <button
            onClick={isConversationOpen && canReply ? onCloseConversation : undefined}
            disabled={!isConversationOpen || !canReply}
            title={isConversationOpen ? "Close Conversation" : "Conversation Closed"}
            className={`h-[38px] w-[38px] rounded-lg border transition-colors flex items-center justify-center ${isConversationOpen && canReply
              ? "bg-white text-[#111827] border-gray-200 hover:bg-gray-50 hover:text-red-500 hover:border-red-200"
              : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
              }`}
          >
            <span className="material-symbols-outlined !text-[18px]">
              chat_error
            </span>
          </button>

          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="h-[38px] w-[38px] rounded-lg border border-gray-200 bg-white text-[#111827] hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined !text-[18px]">
                more_horiz
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full w-[230px] bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
                {/* Block Visitor */}
                <button
                  onClick={() => {
                    if (isConversationOpen && canReply) {
                      onBlockVisitor();
                      setMenuOpen(false);
                    }
                  }}
                  disabled={!isConversationOpen || !canReply}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isConversationOpen && canReply
                    ? "text-red-600 hover:bg-red-50 cursor-pointer"
                    : "text-red-300 cursor-not-allowed"
                    }`}
                >
                  <UserX className="w-4 h-4" />
                  Block Visitor
                </button>

                <div className="border-t border-gray-100 my-1" />

                {/* Tag Conversation */}
                <div className="p-[10px]">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Tag Conversation
                  </p>

                  {/* Tag input */}
                  <div className="flex items-center gap-1.5 border border-[#E2E8F0] rounded-md px-[10px] py-[8px] mb-2 h-[30px] bg-white">
                    <span className="material-symbols-outlined !text-[14px] text-[#64748B]">
                      sell
                    </span>
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
                      className="flex-1 bg-transparent text-[#111827] placeholder-gray-400 outline-none min-w-0 text-[11px] font-semibold placeholder:text-[#64748B]"
                    />
                    {inputAddTag.trim() && (
                      <button
                        onClick={() => onAddTagClick()}
                        disabled={tags.length >= 6}
                        className="text-[12px] text-blue-600 font-medium hover:text-blue-700 disabled:opacity-40 flex-shrink-0"
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
                      const theme = PREDEFINED_TAG_THEME[name] || PREDEFINED_TAG_THEME.Lead;
                      return (
                        <button
                          key={name}
                          onClick={() => handlePredefinedTag(name)}
                          disabled={alreadyAdded || tags.length >= 6}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border h-[18px] ${alreadyAdded || tags.length >= 6
                            ? theme.disabled
                            : `${theme.base} ${theme.hover} cursor-pointer`
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
