"use client";
import { Search } from "lucide-react";
import { format } from "date-fns";
import Skeleton from "react-loading-skeleton";
import { Conversation } from "./types/inbox";

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
  onConversationClick: (conversation: Conversation, visitorName: string, index: number) => void;
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchInputClick: () => void;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function ConversationsList({
  conversationsList,
  searchConversationsList,
  openConversationId,
  searchText,
  status,
  onConversationClick,
  onSearchInputChange,
  onSearchInputClick,
  onStatusChange,
}: ConversationsListProps) {
  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-purple-100 text-purple-600",
      "bg-blue-100 text-blue-600", 
      "bg-green-100 text-green-600",
      "bg-yellow-100 text-yellow-600",
      "bg-pink-100 text-pink-600",
      "bg-indigo-100 text-indigo-600"
    ];
    return colors[index % colors.length];
  };

  const displayConversations = searchConversationsList.data.length 
    ? searchConversationsList.data 
    : conversationsList.data;

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Inbox</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchText}
            onChange={onSearchInputChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearchInputClick();
              }
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select 
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            defaultValue="newest"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          
          <select 
            value={status}
            onChange={onStatusChange}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="open">Open</option>
            <option value="close">Closed</option>
          </select>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversationsList.loading ? (
          <div className="p-4 space-y-4">
            {[...Array(8)].map((_, index) => (
              <div className="flex items-center space-x-3" key={index}>
                <div className="w-10 h-10 rounded-full">
                  <Skeleton circle height={40} width={40} />
                </div>
                <div className="flex-1">
                  <Skeleton height={16} width="60%" />
                  <Skeleton height={14} width="80%" className="mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {displayConversations.map((conversation: Conversation, index: number) => (
              <div
                key={conversation._id}
                onClick={async () => await onConversationClick(conversation, conversation?.visitor?.name, index)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  openConversationId === conversation._id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${getAvatarColor(index)}`}>
                    {conversation?.visitor?.name?.[0] || 'U'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation?.visitor?.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conversation.updatedAt ? format(new Date(conversation.updatedAt), 'dd/MM/yy') : 'Now'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {conversation?.visitor?.lastMessage || conversation?.lastMessage}
                    </p>
                    
                    {conversation.newMessage > 0 && conversation._id !== openConversationId && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full mt-1">
                        {conversation.newMessage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}