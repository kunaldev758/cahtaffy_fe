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
import { MoreVertical, Edit, Trash2, User, ArrowRightLeft, Users } from 'lucide-react';
import { format } from "date-fns";
import trainingIconImage from '@/images/training-icon.svg';
import chatSourceIconImage from '@/images/chat-source-icon.svg';
import InformationSources from './informationSources';

interface MessageData {
  sender_type: string;
  message: string;
  createdAt: Date;
  infoSources?: string[];
  is_note?: string;
  agentId?: {
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
  // onEditMessage, 
  // onDeleteMessage 
}: { 
  messageData: MessageData; 
  messageIndex: number; 
  expandedSources: number | null; 
  setExpandedSources: (index: number | null) => void; 
  visitorName: string; 
  // onEditMessage: (data: MessageData) => void; 
  // onDeleteMessage: (data: MessageData) => void; 
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
      
    case 'bot':
    case 'agent':
    case 'assistant':
      // Check if this is an agent message (has agentId) vs bot/assistant
      const isAgentMessage = messageData.sender_type === 'agent';
      
      // Format agent name - capitalize "client" to "Client" for client-agents
      const getDisplayName = (name?: string, isClient?: boolean) => {
        if (!name) return '';
        if (name.toLowerCase() === 'client' || isClient) {
          return 'Client';
        }
        return name;
      };
      
      const displayName = getDisplayName(messageData.agentId?.name, messageData.agentId?.isClient);
      
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
            <div className={`chatMessage-logo w-10 h-10 !min-w-10 min-h-10 rounded-full overflow-hidden flex items-center justify-center ${isAgentMessage && messageData.agentId ? 'agent-avatar-container' : ''}`}>
              {isAgentMessage && messageData.agentId ? (
                // Check if avatar exists and is not null/empty
                messageData.agentId.avatar && messageData.agentId.avatar !== 'null' && messageData.agentId.avatar.trim() !== '' ? (
                  <div className="agent-avatar-wrapper w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    <img 
                      src={messageData.agentId.avatar.startsWith('http') 
                        ? messageData.agentId.avatar 
                        : `${process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9001'}${messageData.agentId.avatar}`} 
                      alt={displayName || 'Agent'} 
                      className="agent-avatar-img w-10 h-10 object-cover"
                      onError={(e) => {
                        // Fallback to default image if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/default-image.png';
                      }}
                    />
                  </div>
                ) : (
                  // Show default image if no avatar
                  <div className="agent-avatar-wrapper w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    <Image 
                      src="/images/default-image.png" 
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
            <div className="d-flex gap-10">
              {!!messageData.infoSources?.length && (
                <span className="sourceChat-box">
                  <button type="button" className="plain-btn sourceChat" onClick={toggleExpandedSources}>
                    <Image src={chatSourceIconImage} alt="" />
                  </button>
                  {isExpanded && <InformationSources trainingListIds={messageData.infoSources} />}
                </span>
              )}
              <span>{format(messageData.createdAt, 'hh:mm:ss a')}</span>
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
            <div className="d-flex gap-10">
              <span>{format(messageData.createdAt, 'hh:mm:ss a')}</span>
            </div>
          </div>
        </div>
      );
      break;
  }

  return <>{message}</>;
};

export default Message;