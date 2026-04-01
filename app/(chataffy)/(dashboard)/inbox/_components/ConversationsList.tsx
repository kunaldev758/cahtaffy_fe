"use client";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import { publicAsset } from "@/lib/publicAsset";
import { Conversation } from "./types/inbox";
import defaultImageImport from '@/images/default-image.png';

const defaultImage = (defaultImageImport as any).src || defaultImageImport;

interface ConversationsListProps {
  conversationsList: {
    data: Conversation[];
    loading: boolean;
  };
  searchConversationsList: {
    data: Conversation[];
    loading: boolean;
  };
  openConversationId: string | null;
  searchText: string;
  status: string;
  rating: string;
  sortBy: string;
  onConversationClick: (conversation: Conversation, visitorName: string, index: number) => void;
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchInputClick: () => void;
  onStatusChange: (status: string) => void;
  onRatingChange: (rating: string) => void;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const formatTime = (dateStr: string) => {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / (7 * 86400000));
  const months = Math.floor(diff / (30 * 86400000));

  if (minutes < 1) return "JUST NOW";
  if (minutes < 60) return `${minutes}M AGO`;
  if (hours < 24) return `${hours}H AGO`;
  if (days < 7) return `${days}D AGO`;
  if (weeks < 4) return `${weeks}W AGO`;
  return `${months}MO AGO`;
};

export default function ConversationsList({
  conversationsList,
  searchConversationsList,
  openConversationId,
  searchText,
  status,
  rating,
  sortBy,
  onConversationClick,
  onSearchInputChange,
  onSearchInputClick,
  onStatusChange,
  onRatingChange,
  onSortChange,
}: ConversationsListProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-purple-100 text-purple-600",
      "bg-blue-100 text-blue-600",
      "bg-green-100 text-green-600",
      "bg-yellow-100 text-yellow-600",
      "bg-pink-100 text-pink-600",
      "bg-indigo-100 text-indigo-600",
    ];
    return colors[index % colors.length];
  };

  const sortConversations = (conversations: Conversation[]) => {
    const sorted = [...conversations];
    if (sortBy === "lastActivity") {
      return sorted.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === "dateStarted") {
      return sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    return sorted;
  };

  const displayConversations = searchConversationsList.data.length
    ? sortConversations(searchConversationsList.data)
    : sortConversations(conversationsList.data);

  const hasActiveFilters = status !== "open" || rating !== "all";

  const FilterPill = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[13px] font-medium rounded-lg border transition-colors ${active
        ? "border-blue-500 text-blue-600 bg-blue-50 font-medium"
        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full rounded-[20px] relative">
      {/* Header */}
      <div className="px-[20px] py-[20px] flex items-center justify-between border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">Chat Logs</h1>
        <div className="flex items-center gap-[10px]">
          <button
            onClick={() => {
              setShowFilter((v) => !v);
              setShowSearch(false);
            }}
            className={`rounded-lg transition-colors relative bg-[#F1F5F9] w-8 h-8 flex items-center justify-center ${showFilter || hasActiveFilters
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:bg-gray-100"
              }`}
            title="Advance filter"
          >
            <span className="material-symbols-outlined !text-[20px]">
              filter_list
            </span>
            {hasActiveFilters && !showFilter && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => {
              setShowSearch((v) => !v);
              setShowFilter(false);
            }}
            className={`p-2 rounded-lg transition-colors bg-[#F1F5F9] w-8 h-8 ${showSearch
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:bg-gray-100"
              }`}
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-[20px] py-[18px] absolute bg-white h-[73px] w-full rounded-t-[20px] border-b border-[#E8E8E8]">
          <div className="flex items-center justify-between gap-[10px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchText}
                onChange={onSearchInputChange}
                autoFocus
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:border-transparent transition-colors focus:outline-none focus:ring-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSearchInputClick();
                }}
              />
            </div>

            <button
              onClick={() => setShowSearch(false)}
              className="flex w-[38px] h-[38px] items-center justify-center rounded-lg border border-[#E8E8E8] bg-white"
            >
              <span className="material-symbols-outlined !text-[20px]">
                close_small
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Advance Filter Panel */}
      {showFilter && (
        <div className="p-[20px] border-b border-gray-100 bg-white absolute w-full rounded-b-[20px] top-[73px] shadow-[0px_20px_20px_-8px_rgba(26,26,26,0.28)] z-10">
          <h3 className="text-sm font-semibold text-gray-800 mb-[20px]">
            Advance filter
          </h3>

          <div className="flex flex-col gap-[20px]">
            {/* STATUS */}
            <div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-2">
                STATUS
              </p>
              <div className="flex gap-2 flex-wrap">
                <FilterPill
                  label="All"
                  active={status === "all"}
                  onClick={() => onStatusChange("all")}
                />
                <FilterPill
                  label="Open"
                  active={status === "open"}
                  onClick={() => onStatusChange("open")}
                />
                <FilterPill
                  label="Closed"
                  active={status === "close"}
                  onClick={() => onStatusChange("close")}
                />
              </div>
            </div>

            {/* RATING */}
            <div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-2">
                RATING
              </p>
              <div className="flex gap-2 flex-wrap">
                <FilterPill
                  label="All"
                  active={rating === "all"}
                  onClick={() => onRatingChange("all")}
                />
                <FilterPill
                  label="Good"
                  active={rating === "good"}
                  onClick={() => onRatingChange("good")}
                />
                <FilterPill
                  label="Bad"
                  active={rating === "bad"}
                  onClick={() => onRatingChange("bad")}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversationsList.loading ? (
          <div className="p-4 space-y-4">
            {[...Array(8)].map((_, index) => (
              <div className="flex items-center space-x-3" key={index}>
                <Skeleton circle height={40} width={40} />
                <div className="flex-1">
                  <Skeleton height={14} width="55%" />
                  <Skeleton height={12} width="75%" className="mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : displayConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="text-sm">No conversations found</p>
          </div>
        ) : (
          displayConversations.map((conversation: Conversation, index: number) => (
            <div
              key={conversation._id}
              onClick={async () =>
                await onConversationClick(
                  conversation,
                  conversation?.visitor?.name,
                  index
                )
              }
              className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${openConversationId === conversation._id
                ? "bg-[#F8FAFC] border-r-2 border-r-blue-500"
                : "hover:bg-gray-50"
                }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-[10px] border border-[#E8E8E8] flex-shrink-0 flex items-center justify-center font-semibold text-sm bg-white ${openConversationId === conversation._id ? "text-[#4686FE]" : ""}`}
                >
                  {conversation?.visitor?.name?.[0]?.toUpperCase() || "U"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name row */}
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {conversation?.visitor?.name}
                      </span>
                      {/* Handling indicator icon */}
                      {conversation.aiChat ? (
                        <Image
                          src={publicAsset("/images/new/sparkle-icon.svg")}
                          alt="AI"
                          width={14}
                          height={14}
                          className="flex-shrink-0 opacity-70"
                        />
                      ) : (
                        /* Agent avatar if available, else default agent icon */
                        conversation.agentId &&
                          typeof conversation.agentId === "object" ? (
                          <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                            <Image
                              src={
                                conversation.agentId.avatar
                                  ? `${process.env.NEXT_PUBLIC_API_HOST ||
                                  "http://localhost:9001"
                                  }${conversation.agentId.avatar}`
                                  : defaultImage
                              }
                              alt={conversation.agentId.name || "Agent"}
                              width={16}
                              height={16}
                              className="w-4 h-4 object-cover"
                              unoptimized
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  defaultImage;
                              }}
                            />
                          </div>
                        ) : (
                          <Image
                            src={publicAsset("/images/profile-icon.svg")}
                            alt="Agent"
                            width={14}
                            height={14}
                            className="flex-shrink-0 opacity-60"
                          />
                        )
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 ml-2 flex-shrink-0 tracking-wide">
                      {conversation.updatedAt
                        ? formatTime(conversation.updatedAt)
                        : "JUST NOW"}
                    </span>
                  </div>

                  {/* Last message */}
                  <p className="text-xs text-gray-500 truncate leading-relaxed">
                    {conversation?.lastMessage ||
                      conversation?.visitor?.lastMessage ||
                      "No messages yet"}
                  </p>

                  {/* Unread badge */}
                  {conversation.newMessage > 0 &&
                    conversation._id !== openConversationId && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 mt-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {conversation.newMessage}
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
