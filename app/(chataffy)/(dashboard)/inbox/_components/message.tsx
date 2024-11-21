'use client'

import Image from 'next/image'
import trainingIconImage from '@/images/training-icon.svg';
import chatSourceIconImage from '@/images/chat-source-icon.svg';
import {getMessageSources} from '@/app/_api/dashboard/action'
import { useEffect, useState } from 'react';

import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import InformationSources from './informationSources';
import { format } from "date-fns"

export default function Message(props: any) {
  console.log(props,"the props")
    const { messageData, messageIndex, expandedSources, setExpandedSources } = props;
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setIsExpanded(messageIndex === expandedSources);
    }, [expandedSources, messageIndex]);

    const toggleExpandedSources = () => {
        setExpandedSources((prevExpandedSources:null|number) => (prevExpandedSources === messageIndex) ? null : messageIndex);
    };

    let message;
    switch(messageData.sender_type){
      case 'system':
        message = (
          <></>
          // {messageData.message}
        );
        break;
      case 'bot':
        message = (
          <div className="message-box ai-message">
            <div className="d-flex align-items-end justify-content-end gap-16">
              <div className="chat-messageArea d-flex flex-column align-items-end">
                <div className="chat-messageBox" dangerouslySetInnerHTML={{ __html: messageData.message }} />
              </div>
              <div className="chatMessage-logo">
                <Image src={trainingIconImage} alt="" />
              </div>
            </div>

            <div className={`chat-messageInfo`}>
              <div className="d-flex gap-10">
                {!!messageData.infoSources.length && <><span className="sourceChat-box">
                  <button type="button" className="plain-btn sourceChat" onClick={()=>toggleExpandedSources()}>
                    <Image src={chatSourceIconImage} alt="" />
                  </button>
                  {isExpanded && <InformationSources trainingListIds={messageData.infoSources} />}
                </span></>}
                <span>{format(messageData.createdAt, 'hh:mm:ss a')}</span>
              </div>
            </div>
          </div>
        );
        case 'agent':
          message = (
            <div className="message-box ai-message">
              <div className="d-flex align-items-end justify-content-end gap-16">
                <div className="chat-messageArea d-flex flex-column align-items-end">
                  <div className="chat-messageBox" style={messageData.is_note =='true' ? { backgroundColor: 'yellow' } : {}} dangerouslySetInnerHTML={{ __html: messageData.message }} />
                </div>
                <div className="chatMessage-logo">
                  <Image src={trainingIconImage} alt="" />
                </div>
              </div>
  
              <div className={`chat-messageInfo`}>
                <div className="d-flex gap-10">
                  {!!messageData.infoSources.length && <><span className="sourceChat-box">
                    <button type="button" className="plain-btn sourceChat" onClick={()=>toggleExpandedSources()}>
                      <Image src={chatSourceIconImage} alt="" />
                    </button>
                    {isExpanded && <InformationSources trainingListIds={messageData.infoSources} />}
                  </span></>}
                  <span>{format(messageData.createdAt, 'hh:mm:ss a')}</span>
                </div>
              </div>
            </div>
          );
        break;
      case 'visitor':
        message = (
          <div className="message-box">
            <div className="d-flex  align-items-end gap-16">
              <div className="chatMessage-logo">
                <Image src={trainingIconImage} alt="" />
              </div>

              <div className="chat-messageArea d-flex flex-column align-items-start">
                <div className="chat-messageBox" dangerouslySetInnerHTML={{ __html: messageData.message }} />
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
    return (<>{message}</>);
}