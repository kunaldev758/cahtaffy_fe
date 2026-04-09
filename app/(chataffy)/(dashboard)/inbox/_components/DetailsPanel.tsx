"use client";
import { formatDistanceToNow } from "date-fns";
import { Note } from "./types/inbox";
import Image from "next/image";

function stripHtml(html: string | null | undefined) {
  if (html == null) return "";
  return String(html).replace(/<[^>]+>/g, "").trim();
}

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
  currentConversation: any;
  openConversationStatus: string;
  isAIChat: boolean;
}

export default function DetailsPanel({
  visitorDetails,
  notesList,
  oldConversationList,
  openConversationId,
  openVisitorName,
  onScrollToMessage,
  onOldConversationClick,
  currentConversation,
  openConversationStatus,
  isAIChat,
}: DetailsPanelProps) {
  const getDetailValue = (keys: string[]) => {
    if (!visitorDetails) return "";
    const normalized = Object.entries(visitorDetails).reduce((acc: Record<string, any>, [k, v]) => {
      acc[k.toLowerCase()] = v;
      return acc;
    }, {});
    const match = keys.find((k) => normalized[k.toLowerCase()]);
    return match ? String(normalized[match.toLowerCase()]) : "";
  };

  const visitorName = getDetailValue(["name"]) || openVisitorName || "Visitor";
  const visitorIp = getDetailValue(["ip", "ip address"]);
  const visitorEmail = getDetailValue(["email", "mail"]);
  const visitorPhone = getDetailValue(["phone", "phone number", "mobile", "contact"]);
  const visitorCountry = getDetailValue(["location", "country"]);
  const flagUrl = visitorCountry
    ? `https://flagcdn.com/w20/${visitorCountry.toLowerCase()}.png`
    : null;
  const initials = visitorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "V";

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col rounded-[20px]">

      <div className="flex-1 p-[20px] gap-[20px] flex flex-col overflow-y-auto">
        {/* Visitor Details */}
        <div>
          <div className="rounded-[20px] border border-[#E8E8E8] bg-[#ffffff] p-[16px]">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full border border-[#D9D9D9] bg-[#ffffff] flex items-center justify-center text-[16px] font-semibold text-[#94A3B8]">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#111827] truncate capitalize">{visitorName}</p>
                {visitorIp && (
                  <div className="mt-1 flex items-center gap-1.5">
                    {flagUrl && (
                      <div className="h-[10px] w-[14px] overflow-hidden rounded-[2px] border border-[#E5E7EB] flex-shrink-0">
                        <Image src={flagUrl} alt={visitorCountry} className="rounded-[2px] object-cover" width={14} height={10} unoptimized />
                      </div>
                    )}
                    <p className="text-[12px] font-normal text-[#64748B]">IP : {visitorIp}</p>
                  </div>
                )}
              </div>
            </div>

            {(visitorEmail || visitorPhone) && (
              <div className="mt-3 space-y-2">
                {visitorEmail && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[16px] text-[#64748B]">alternate_email</span>
                    <p className="text-[13px] font-normal text-[#64748B] truncate">{visitorEmail}</p>
                  </div>
                )}
                {visitorPhone && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[16px] text-[#64748B]">call</span>
                    <p className="text-[13px] font-normal text-[#64748B]">{visitorPhone}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <div className="rounded-[20px] border border-[#E8E8E8] bg-[#ffffff] p-[16px]">
            <div className="flex items-center gap-[8px] mb-[14px]">
              <span className="material-symbols-outlined !text-[18px] text-[#64748B]">
                news
              </span>
              <h3 className="text-[13px] font-medium text-[#111827]">Notes</h3>
            </div>
            {notesList.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {notesList.map((note: Note, index: number) => (
                  <div
                    key={note._id || index}
                    className="px-[12px] py-[10px] bg-[#FEFCE8] rounded-lg border border-[#E8E8E8] cursor-pointer hover:bg-yellow-100 transition-colors flex flex-col"
                    onClick={() => onScrollToMessage(note._id)}
                  >
                    <p className="text-[10px] font-semibold text-[#111827] uppercase">
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </p>
                    {note.message?.includes('<audio') ? (
                      <p className="text-[12px] font-normal text-[#64748B] italic flex items-center gap-1">
                        🎤 Voice note
                      </p>
                    ) : (
                      <p className="text-[12px] font-normal text-[#64748B]">
                        {note.message?.replace(/<[^>]+>/g, '').trim() || ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No notes found</p>
            )}
          </div>
        </div>

        {/* Previous Conversations */}
        <div>
          <div className="rounded-[20px] border border-[#E8E8E8] bg-[#ffffff] p-[16px]">
            <div className="flex items-center gap-[8px] mb-[14px]">
              <span className="material-symbols-outlined !text-[18px] text-[#64748B]">
                history
              </span>
              <h3 className="text-[13px] font-medium text-[#111827]">Recent Chats</h3>
            </div>
            {oldConversationList.data?.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {oldConversationList.data.map((conversation: any) => {
                  const isActive = openConversationId === conversation._id || openConversationId === conversation._id?.toString();
                  // For the currently open conversation use live real-time values; for others use stored data
                  const isOpen = isActive ? openConversationStatus === "open" : conversation.conversationOpenStatus === "open";
                  const aiChatValue = isActive ? isAIChat : conversation.aiChat;
                  return (
                    <div
                      key={conversation._id}
                      className="cursor-pointer transition-colors border-b border-[#E8E8E8] pb-[14px] last:border-b-0 last:pb-0"
                      onClick={() => onOldConversationClick(conversation._id, openVisitorName)}
                    >
                      {/* <div className="flex items-center justify-between mb-1">
                        <h6 className="text-xs font-medium text-gray-700">@{openVisitorName}</h6>
                        <div className="flex items-center gap-1">
                          
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                            {isOpen ? "Open" : "Closed"}
                          </span>
                        </div>
                      </div> */}
                      <div className="flex justify-between items-center mb-[4px]">
                        <p className="text-[10px] font-semibold text-[#64748B] uppercase">
                          {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                        </p>
                        <span className={`text-[9px] h-[18px] flex items-center justify-center min-h-[18px] font-semibold px-1.5 py-0.5 rounded-[4px] border ${aiChatValue ? 'bg-[#F1F5F9] text-[#64748B] border-[#E8E8E8]' : 'bg-[#FAF5FF] text-[#A855F7] border-[#A855F7]'}`}>
                          {aiChatValue ? "AI-ONLY" : "AI + AGENT"}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#64748B] leading-[16px] truncate">{stripHtml(conversation.message)}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent chats found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}