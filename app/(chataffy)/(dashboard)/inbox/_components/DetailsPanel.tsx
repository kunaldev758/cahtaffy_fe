"use client";
import { formatDistanceToNow } from "date-fns";
import { Note } from "./types/inbox";

interface DetailsPanelProps {
  visitorDetails: any;
  notesList: Note[];
  oldConversationList: {
    data: any[];
    loading: boolean;
  };
  openConversationId: string | null;
  openVisitorName: string;
  onScrollToMessage: (id: string) => void;
  onOldConversationClick: (conversationId: string, visitorName: string) => void;
}

export default function DetailsPanel({
  visitorDetails,
  notesList,
  oldConversationList,
  openConversationId,
  openVisitorName,
  onScrollToMessage,
  onOldConversationClick,
}: DetailsPanelProps) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Details Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Details</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Visitor Details */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Visitor Information</h4>
          <div className="space-y-3">
            {visitorDetails && Object.entries(visitorDetails).map(([key, value]: any) => (
              <div key={key} className="flex">
                <dt className="text-sm text-gray-500 capitalize w-20 flex-shrink-0">{key}:</dt>
                <dd className="text-sm text-gray-900 flex-1 break-words">{value}</dd>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Notes</h4>
          {notesList.length > 0 ? (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {notesList.map((note: Note, index: number) => (
                <div 
                  key={note._id || index} 
                  className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
                  onClick={() => onScrollToMessage(note._id)}
                >
                  <p className="text-sm text-gray-900">{note.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No notes found</p>
          )}
        </div>

        {/* Previous Conversations */}
        <div className="p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Previous Conversations</h4>
          {oldConversationList.data?.length > 0 ? (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {oldConversationList.data.map((conversation: any) => (
                <div 
                  key={conversation._id} 
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    openConversationId === conversation._id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => onOldConversationClick(conversation._id, openVisitorName)}
                >
                  <h6 className="text-xs font-medium text-gray-700 mb-1">@{openVisitorName}</h6>
                  <p className="text-sm text-gray-900 truncate">{conversation.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No previous conversations</p>
          )}
        </div>
      </div>
    </div>
  );
}