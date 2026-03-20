"use client";
import { forwardRef } from "react";
import Skeleton from "react-loading-skeleton";
import Message from "./message";
import { Message as MessageType } from "./types/inbox";

interface MessagesAreaProps {
  conversationMessages: {
    data: MessageType[];
    loading: boolean;
    visitorName: string;
  };
  expandedSources: null | number;
  setExpandedSources: (value: null | number) => void;
  messageRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  currentConversation?: any;
  isAITyping?: boolean;
  onReviseAnswer?: (messageData: any) => void;
  onReply?: (messageData: any) => void;
  onJumpToReply?: (messageId: string) => void;
}

const MessagesArea = forwardRef<HTMLDivElement, MessagesAreaProps>(
  ({ conversationMessages, expandedSources, setExpandedSources, messageRefs, currentConversation, isAITyping, onReviseAnswer, onReply, onJumpToReply }, ref) => {
    return (
      <div className="flex-1 overflow-y-auto p-6" ref={ref}>
        {conversationMessages.loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-xs">
                  <Skeleton height={60} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {isAITyping && (
              <div className="flex justify-start">
                <div className="max-w-xs bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {conversationMessages?.data?.map((item: MessageType, index: number) => (
              <div
                key={index}
                ref={(el) => {
                  messageRefs.current[index] = el;
                }}
              >
                <Message
                  messageData={{ ...item, createdAt: new Date(item.createdAt) }}
                  messageIndex={index}
                  expandedSources={expandedSources}
                  setExpandedSources={setExpandedSources}
                  visitorName={conversationMessages?.visitorName}
                  onReviseAnswer={onReviseAnswer}
                  onReply={onReply}
                  onJumpToReply={onJumpToReply}
                />
              </div>
            ))}
            
            {/* Feedback Section - Displayed as part of chat messages */}
            {currentConversation && (currentConversation?.feedback !== undefined || currentConversation?.comment) && (
              <div className="flex justify-center my-4">
                <div className="max-w-2xl w-full bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="font-semibold text-gray-900 mb-3">Feedback</div>
                  <div className="space-y-2">
                    {currentConversation?.feedback !== undefined && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Rating:</span>
                        <span className={`text-sm font-medium ${currentConversation.feedback ? 'text-green-600' : 'text-red-600'}`}>
                          {currentConversation.feedback ? '👍 Good' : '👎 Poor'}
                        </span>
                      </div>
                    )}
                    {currentConversation?.comment && (
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">Comment:</span>
                        <div className="bg-white rounded border border-gray-200 p-3">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{currentConversation.comment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

MessagesArea.displayName = "MessagesArea";
export default MessagesArea;