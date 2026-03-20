'use client'

// import Image from 'next/image'
// import trainingIconImage from '@/images/training-icon.svg';
// import chatSourceIconImage from '@/images/chat-source-icon.svg';
// import {getMessageSources} from '@/app/_api/dashboard/action'
// import { useEffect, useState } from 'react';

// import Skeleton from 'react-loading-skeleton'
// import 'react-loading-skeleton/dist/skeleton.css'

// import InformationSources from './informationSources';
// import { format } from "date-fns"

// export default function Message(props: any) {
//     const { messageData, messageIndex, expandedSources, setExpandedSources,visitorName } = props;
//     const [isExpanded, setIsExpanded] = useState(false);

//     useEffect(() => {
//         setIsExpanded(messageIndex === expandedSources);
//     }, [expandedSources, messageIndex]);

//     const toggleExpandedSources = () => {
//         setExpandedSources((prevExpandedSources:null|number) => (prevExpandedSources === messageIndex) ? null : messageIndex);
//     };

//     let message;
//     switch(messageData.sender_type){
//       case 'system':
//         message = (
//           <></>
//           // {messageData.message}
//         );
//         break;
//       case 'bot':
//         message = (
//           <div className="message-box ai-message">
//             <div className="d-flex align-items-end justify-content-end gap-16">
//               <div className="chat-messageArea d-flex flex-column align-items-end">
//                 <div className="chat-messageBox" dangerouslySetInnerHTML={{ __html: messageData.message }} />
//               </div>
//               <div className="chatMessage-logo">
//                 <Image src={trainingIconImage} alt="" />
//               </div>
//             </div>

//             <div className={`chat-messageInfo`}>
//               <div className="d-flex gap-10">
//                 {!!messageData.infoSources.length && <><span className="sourceChat-box">
//                   <button type="button" className="plain-btn sourceChat" onClick={()=>toggleExpandedSources()}>
//                     <Image src={chatSourceIconImage} alt="" />
//                   </button>
//                   {isExpanded && <InformationSources trainingListIds={messageData.infoSources} />}
//                 </span></>}
//                 <span>{format(messageData.createdAt, 'hh:mm:ss a')}</span>
//               </div>
//             </div>
//           </div>
//         );
//         case 'agent' :
//         case 'assistant' :
//           message = (
//             <div className="message-box ai-message">
//               <div className="d-flex align-items-end justify-content-end gap-16">
//                 <div className="chat-messageArea d-flex flex-column align-items-end">
//                   <div className="chat-messageBox" style={messageData.is_note =='true' ? { backgroundColor: 'yellow' } : {}} dangerouslySetInnerHTML={{ __html: messageData.message }} />
//                 </div>
//                 <div className="chatMessage-logo">
//                   <Image src={trainingIconImage} alt="" />
//                 </div>
//               </div>
  
//               <div className={`chat-messageInfo`}>
//                 <div className="d-flex gap-10">
//                   {!!messageData.infoSources.length && <><span className="sourceChat-box">
//                     <button type="button" className="plain-btn sourceChat" onClick={()=>toggleExpandedSources()}>
//                       <Image src={chatSourceIconImage} alt="" />
//                     </button>
//                     {isExpanded && <InformationSources trainingListIds={messageData.infoSources} />}
//                   </span></>}
//                   <span>{format(messageData.createdAt, 'hh:mm:ss a')}</span>
//                 </div>
//               </div>
//             </div>
//           );
//         break;
//       case 'visitor':
//         message = (
//           <div className="message-box">
//             <div className="d-flex  align-items-end gap-16">
//               <div className="chatMessage-logo">
//                 {/* <Image src={trainingIconImage} alt="" /> */}
//                 <div className="chatlist-userLetter" >
//                               {visitorName[0]}
//                             </div>
//               </div>

//               <div className="chat-messageArea d-flex flex-column align-items-start">
//                 <div className="chat-messageBox" dangerouslySetInnerHTML={{ __html: messageData.message }} />
//               </div>
//             </div>

//             <div className="chat-messageInfo">
//               <div className="d-flex gap-10">
//                 <span>{format(messageData.createdAt, 'hh:mm:ss a')}</span>
//               </div>
//             </div>
//           </div>
//         );
//         break;
//     }
//     return (<>{message}</>);
// }
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { MoreVertical, Edit, Trash2, User, ArrowRightLeft, Users, Pencil } from 'lucide-react';
import { format } from "date-fns";
import trainingIconImage from '@/images/training-icon.svg';
import chatSourceIconImage from '@/images/chat-source-icon.svg';
import defaultImageImport from '@/images/default-image.png';
import InformationSources from './informationSources';

const defaultImage = (defaultImageImport as any).src || defaultImageImport;

interface MessageSource {
  type: number | null;
  title: string | null;
  url: string | null;
}

interface ReplyTo {
  _id?: string;
  message: string;
  sender_type: string;
  humanAgentId?: { name: string; isClient?: boolean } | null;
}

interface MessageData {
  _id?: string;
  sender_type: string;
  message: string;
  createdAt: Date;
  infoSources?: MessageSource[] | string[];
  is_note?: string;
  replyTo?: ReplyTo | null;
  agentId?: {
    _id: string;
    name: string;
    avatar?: string;
    isClient?: boolean;
  };
  humanAgentId?: {
    _id: string;
    name: string;
    avatar?: string;
    isClient?: boolean;
  };
}

const Message = ({ 
  messageData, 
  messageIndex, 
  expandedSources, 
  setExpandedSources, 
  visitorName,
  onReviseAnswer,
  onReply,
  onJumpToReply,
}: { 
  messageData: MessageData; 
  messageIndex: number; 
  expandedSources: number | null; 
  setExpandedSources: (index: number | null) => void; 
  visitorName: string;
  onReviseAnswer?: (messageData: MessageData) => void;
  onReply?: (messageData: MessageData) => void;
  onJumpToReply?: (messageId: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setIsExpanded(messageIndex === expandedSources);
  }, [expandedSources, messageIndex]);

  const toggleExpandedSources = () => {
    setExpandedSources(
      expandedSources === messageIndex ? null : messageIndex
    );
  };

  // const handleEditMessage = () => {
  //   onEditMessage(messageData);
  //   setShowMenu(false);
  // };

  // const handleDeleteMessage = () => {
  //   onDeleteMessage(messageData);
  //   setShowMenu(false);
  // };

  const renderMessageMenu = () => (
    <div className="relative">
      <button
        type="button"
        className="p-1 hover:bg-gray-100 rounded-full border-none"
        onClick={() => setShowMenu(!showMenu)}
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>
      
      {/* {showMenu && (
        <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={handleEditMessage}
            >
              <Edit className="w-4 h-4" />
              Edit Message
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
              onClick={handleDeleteMessage}
            >
              <Trash2 className="w-4 h-4" />
              Delete Message
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
  
  const stripHtml = (html: string) => html?.replace(/<[^>]+>/g, '').trim() || '';

  const renderReplyQuote = (replyTo: ReplyTo, align: 'left' | 'right') => {
    const replyId = replyTo._id?.toString?.() || (replyTo as any)._id;
    const senderLabel =
      replyTo.sender_type === 'visitor'
        ? visitorName || 'Visitor'
        : replyTo.humanAgentId?.name || 'Agent';
    const preview = stripHtml(replyTo.message).slice(0, 120);
    const borderColor = align === 'right' ? 'rgba(255,255,255,0.5)' : '#93c5fd';
    const bgColor = align === 'right' ? 'rgba(255,255,255,0.15)' : '#eff6ff';
    const textColor = align === 'right' ? 'rgba(255,255,255,0.9)' : '#1e40af';
    const subColor = align === 'right' ? 'rgba(255,255,255,0.7)' : '#3b82f6';
    const jumpable = Boolean(replyId && onJumpToReply);
    const inner = (
      <>
        <div style={{ fontSize: '11px', fontWeight: 600, color: subColor, marginBottom: '2px' }}>
          {senderLabel}
        </div>
        <div style={{ fontSize: '12px', color: textColor, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {preview || '…'}
        </div>
      </>
    );
    const boxStyle: React.CSSProperties = {
      borderLeft: `3px solid ${borderColor}`,
      background: bgColor,
      borderRadius: '4px',
      padding: '4px 8px',
      marginBottom: '6px',
      maxWidth: '100%',
      ...(jumpable
        ? { cursor: 'pointer', outline: 'none' }
        : {}),
    };
    if (jumpable) {
      return (
        <button
          type="button"
          onClick={() => replyId && onJumpToReply?.(replyId)}
          title="Jump to original message"
          style={{
            ...boxStyle,
            border: 'none',
            width: '100%',
            textAlign: 'left',
            font: 'inherit',
          }}
        >
          {inner}
        </button>
      );
    }
    return <div style={boxStyle}>{inner}</div>;
  };

  // Parse infoSources: support both new object format and legacy string format
  const structuredSources: MessageSource[] = React.useMemo(() => {
    if (!messageData.infoSources?.length) return [];
    return (messageData.infoSources as any[]).map((s) => {
      if (typeof s === 'string') {
        try { return JSON.parse(s); } catch { return { type: null, title: s, url: null }; }
      }
      return s as MessageSource;
    }).filter((s) => s && (s.url || s.title));
  }, [messageData.infoSources]);

  let message;
  switch(messageData.sender_type) {
    case 'system':
      message = (
        <div className="message-box system-message my-4">
          <div className="d-flex align-items-center justify-content-center">
            <div className="d-flex align-items-center gap-2 px-4 py-2.5 rounded-full" 
              style={{ 
                backgroundColor: '#f0f9ff', 
                border: '1px solid #bfdbfe',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}>
              <div className="flex items-center justify-center w-5 h-5 rounded-full" 
                style={{ backgroundColor: '#3b82f6' }}>
                <ArrowRightLeft className="w-3 h-3 text-white" />
              </div>
              <div 
                className="text-sm font-medium text-gray-700"
                style={{ lineHeight: '1.4' }}
                dangerouslySetInnerHTML={{ __html: messageData.message }}
              />
            </div>
          </div>
          {messageData.createdAt && (
            <div className="chat-messageInfo mt-1">
              <div className="d-flex gap-10 justify-content-center">
                <span className="text-xs text-gray-400">{format(messageData.createdAt, 'hh:mm:ss a')}</span>
              </div>
            </div>
          )}
        </div>
      );
      break;
      
    case 'ai':
    case 'bot':
    case 'humanAgent':
    case 'client':
    case 'agent':
    case 'assistant':
      // Human agent messages: humanAgent, client (legacy: agent). AI: ai (legacy: bot, assistant)
      const isAgentMessage = ['humanAgent', 'client', 'agent'].includes(messageData.sender_type);
      const agentSource = messageData.humanAgentId || messageData.agentId;

      const getDisplayName = (name?: string, isClient?: boolean) => {
        if (!name) return '';
        if (name.toLowerCase() === 'client' || isClient) {
          return 'Client';
        }
        return name;
      };

      const displayName = getDisplayName(agentSource?.name, agentSource?.isClient);
      
      message = (
        <div className="message-box ai-message">
          <div className="d-flex align-items-end justify-content-end gap-16">
            <div className="chat-messageArea d-flex flex-column align-items-end">
              {/* Show agent name for agent messages */}
              {isAgentMessage && displayName && (
                <div className="text-xs text-gray-500 mb-1 mr-2">
                  {displayName}
                </div>
              )}
              <div className="chat-messageBox relative" 
                style={messageData.is_note === 'true' ? { backgroundColor: 'yellow' } : {}}
              >
                {messageData.replyTo && renderReplyQuote(messageData.replyTo, 'right')}
                <span className="relative flex items-center">
                  {/* {renderMessageMenu()} */}
                  <div
                    className="ml-2"
                    dangerouslySetInnerHTML={{
                      __html: messageData.message?.replace(
                        /<a\s+([^>]*href=['"][^'"]+['"][^>]*)>/gi,
                        (match, p1) => {
                          // If target or rel already set, don't duplicate
                          let newAttrs = p1;
                          if (!/\btarget=/i.test(newAttrs)) {
                            newAttrs += ' target="_blank"';
                          }
                          if (!/\brel=/i.test(newAttrs)) {
                            newAttrs += ' rel="noopener noreferrer"';
                          }
                          return `<a ${newAttrs}>`;
                        }
                      ),
                    }}
                  />
                </span>
                {/* <div className="absolute top-2 right-2">
                  {renderMessageMenu()}
                </div> */}
              </div>
            </div>
            <div className={`chatMessage-logo w-10 h-10 !min-w-10 min-h-10 rounded-full overflow-hidden flex items-center justify-center ${isAgentMessage && agentSource ? 'agent-avatar-container' : ''}`}>
              {isAgentMessage && agentSource ? (
                agentSource.avatar && agentSource.avatar !== 'null' && agentSource.avatar.trim() !== '' ? (
                  <div className="agent-avatar-wrapper w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    <img 
                      src={agentSource.avatar.startsWith('http') 
                        ? agentSource.avatar 
                        : `${process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9001'}${agentSource.avatar}`} 
                      alt={displayName || 'Agent'} 
                      className="agent-avatar-img w-10 h-10 object-cover"
                      onError={(e) => {
                        // Fallback to default image if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = defaultImage;
                      }}
                    />
                  </div>
                ) : (
                  // Show default image if no avatar
                  <div className="agent-avatar-wrapper w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    <Image 
                      src={defaultImage} 
                      alt={displayName || 'Agent'} 
                      width={40} 
                      height={40} 
                      className="agent-avatar-img w-10 h-10 object-cover"
                    />
                  </div>
                )
              ) : (
                <div className="w-10 h-10 min-w-10 min-h-10 rounded-full overflow-hidden flex items-center justify-center">
                  <Image src={trainingIconImage} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-contain" style={{ filter: 'brightness(10)' }} />
                </div>
              )}
            </div>
          </div>

          <div className="chat-messageInfo">
            <div className="d-flex gap-10 items-center flex-wrap">
              {/* Source info button */}
              {!!structuredSources?.length && (
                <span className="sourceChat-box relative">
                  <button
                    type="button"
                    className="plain-btn sourceChat"
                    onClick={toggleExpandedSources}
                    title="View sources"
                  >
                    <Image src={chatSourceIconImage} alt="sources" />
                  </button>
                  {isExpanded && <InformationSources sources={structuredSources} />}
                </span>
              )}
              <span>{format(messageData.createdAt, 'hh:mm:ss a')}</span>
              {onReply && (
                <button
                  type="button"
                  onClick={() => onReply(messageData)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'none',
                    border: 'none',
                    padding: '1px 4px',
                    fontSize: '11px',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                  title={messageData.is_note === 'true' ? 'Reply to this note' : 'Reply to this message'}
                >
                  ↩ Reply
                </button>
              )}
              {/* Revise Answer button - only for AI messages and only for agents */}
              {!isAgentMessage && onReviseAnswer && (
                <button
                  type="button"
                  onClick={() => onReviseAnswer(messageData)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    lineHeight: '18px',
                  }}
                  title="Improve this AI answer"
                >
                  <Pencil className="w-3 h-3" />
                  Revise Answer
                </button>
              )}
            </div>
          </div>
        </div>
      );
      break;

    case 'visitor':
      message = (
        <div className="message-box">
          <div className="d-flex align-items-end gap-16">
            <div className="chatMessage-logo">
              <div className="chatlist-userLetter">
                {visitorName ? visitorName[0] : 'U'}
              </div>
            </div>
            <div className="chat-messageArea d-flex flex-column align-items-start">
              <div className="chat-messageBox relative">
                {messageData.replyTo && renderReplyQuote(messageData.replyTo, 'left')}
                <div
                  dangerouslySetInnerHTML={{
                    __html: messageData.message
                      ? messageData.message.replace(
                          /<a\b([^>]*)>/gi,
                          (match, attrs) => {
                            // Ensure target="_blank" is present
                            let newAttrs = attrs;
                            if (!/\btarget=(_blank|"_blank"|'_blank')/i.test(attrs)) {
                              newAttrs += ' target="_blank"';
                            }
                            // Ensure rel="noopener noreferrer" is present
                            if (!/\brel=("[^"]*"|'[^']*'|[^\s>]*)/i.test(attrs)) {
                              newAttrs += ' rel="noopener noreferrer"';
                            }
                            return `<a${newAttrs}>`;
                          }
                        )
                      : "",
                  }}
                />
                {/* <div className="absolute top-2 right-2">
                  {renderMessageMenu()}
                </div> */}
              </div>
            </div>
          </div>

          <div className="chat-messageInfo">
            <div className="d-flex gap-10 items-center">
              <span>{format(messageData.createdAt, 'hh:mm:ss a')}</span>
              {onReply && (
                <button
                  type="button"
                  onClick={() => onReply(messageData)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'none',
                    border: 'none',
                    padding: '1px 4px',
                    fontSize: '11px',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                  title="Reply to this message"
                >
                  ↩ Reply
                </button>
              )}
            </div>
          </div>
        </div>
      );
      break;
  }

  return <>{message}</>;
};

export default Message;