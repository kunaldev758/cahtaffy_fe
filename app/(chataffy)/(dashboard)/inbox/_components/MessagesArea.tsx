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
}

const MessagesArea = forwardRef<HTMLDivElement, MessagesAreaProps>(
  ({ conversationMessages, expandedSources, setExpandedSources, messageRefs }, ref) => {
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
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

MessagesArea.displayName = "MessagesArea";
export default MessagesArea;