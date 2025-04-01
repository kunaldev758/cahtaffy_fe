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
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
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
      message = <></>;
      break;
      
    case 'bot':
    case 'agent':
    case 'assistant':
      message = (
        <div className="message-box ai-message">
          <div className="d-flex align-items-end justify-content-end gap-16">
            <div className="chat-messageArea d-flex flex-column align-items-end">
              <div className="chat-messageBox relative" 
                style={messageData.is_note === 'true' ? { backgroundColor: 'yellow' } : {}}
              >
                <span className="relative flex items-center">
                  {/* {renderMessageMenu()} */}
                  <div className="ml-2" dangerouslySetInnerHTML={{ __html: messageData.message }} />
                </span>
                {/* <div className="absolute top-2 right-2">
                  {renderMessageMenu()}
                </div> */}
              </div>
            </div>
            <div className="chatMessage-logo">
              <Image src={trainingIconImage} alt="" />
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
                <div dangerouslySetInnerHTML={{ __html: messageData.message }} />
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