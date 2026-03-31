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
      <div className="flex-1 overflow-y-auto p-[20px] overflow-x-hidden" ref={ref}>
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
          <div className="flex flex-col gap-4">
            {/* {isAITyping && (
              <div className="flex justify-start">
                <div className="max-w-xs bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )} */}
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
                <div className="max-w-2xl w-full rounded-[20px] border border-[#D9D9D9] bg-white px-6 py-7 text-center">
                  <div
                    className={`mx-auto mb-4 flex h-[56px] w-[56px] items-center justify-center rounded-full border ${
                      currentConversation?.feedback ? "border-[#10B981] bg-[#D1FAE5]" : "border-[#F87171] bg-[#FEE2E2]"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined !text-[28px] ${
                        currentConversation?.feedback ? "text-[#059669]" : "text-[#DC2626]"
                      }`}
                    >
                      {currentConversation?.feedback ? "sentiment_satisfied" : "sentiment_dissatisfied"}
                    </span>
                  </div>

                  <div className="text-[14px] font-bold text-[#111827] mb-3">Visitor Feedback</div>

                  <div className="space-y-3">
                    {currentConversation?.feedback !== undefined && (
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex h-6 items-center rounded-full border px-4 text-[10px] font-bold tracking-[0.12em] ${
                            currentConversation.feedback
                              ? "border-[#A7F3D0] bg-[#D1FAE5] text-[#059669]"
                              : "border-[#FECACA] bg-[#FEE2E2] text-[#DC2626]"
                          }`}
                        >
                          {currentConversation.feedback ? 'RATING: GOOD' : 'RATING: POOR'}
                        </span>
                      </div>
                    )}
                    {currentConversation?.comment && (
                      <p className="mx-auto max-w-[520px] text-[12px] leading-7 text-[#64748B] whitespace-pre-wrap">
                        "{currentConversation.comment}"
                      </p>
                    )}
                  </div>

                  <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#111827]">
                    CLOSED AT {new Date(currentConversation?.updatedAt || currentConversation?.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '')}
                    {' \u2022 '}
                    {String(currentConversation?.closedBy ?? "").trim() || (typeof currentConversation?.agentId === "object" ? currentConversation.agentId?.name : "") || "Agent"}
                  </p>
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