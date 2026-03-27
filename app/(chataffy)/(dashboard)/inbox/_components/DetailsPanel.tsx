"use client";
import { formatDistanceToNow } from "date-fns";
import { Note } from "./types/inbox";
import Image from "next/image";

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
  const initials = visitorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "V";

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col rounded-[20px]">

      <div className="flex-1 overflow-y-auto">
        {/* Visitor Details */}
        <div className="p-[20px] border-b border-gray-200">
          <div className="rounded-[20px] border border-[#E8E8E8] bg-[#ffffff] p-[16px]">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full border border-[#D9D9D9] bg-[#ffffff] flex items-center justify-center text-[16px] font-semibold text-[#94A3B8]">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#111827] truncate capitalize">{visitorName}</p>
                {visitorIp && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-[10px] w-[14px] overflow-hidden rounded-[2px] border border-[#E5E7EB]">
                      <Image src="/images/new/indian-flag.png" alt="India Flag" className="rounded-[2px]" width={18} height={12} />
                    </div>
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
        <div className="p-[20px]">
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
                    <p className="text-[12px] font-normal text-[#64748B]">{note.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No notes found</p>
            )}
          </div>
        </div>

        {/* Previous Conversations */}
        <div className="p-[20px]">
          <div className="rounded-[20px] border border-[#E8E8E8] bg-[#ffffff] p-[16px]">
            <div className="flex items-center gap-[8px] mb-[14px]">
              <span className="material-symbols-outlined !text-[18px] text-[#64748B]">
                history
              </span>
              <h3 className="text-[13px] font-medium text-[#111827]">Recent Chats</h3>
            </div>
            {oldConversationList.data?.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {oldConversationList.data.map((conversation: any) => (
                  <div
                    key={conversation._id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${openConversationId === conversation._id
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
              <p className="text-sm text-gray-500">No recent chats found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}