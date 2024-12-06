'use client'

import Image from 'next/image'
import { basePath } from '@/next.config'
// import AddcontentModal from './addContentModal'
import { useEffect } from 'react'
import { io } from "socket.io-client"
import { useState } from 'react'
// import TrainingList from './trainingList'

import { logoutApi } from '@/app/_api/dashboard/action'
import { useRouter } from 'next/navigation'

import {getConversationMessages} from '@/app/_api/dashboard/action'

import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'


let socket: any;

export default function Home(Props: any) {
  const router = useRouter()

  useEffect(() => {
    socket = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST}`, {
      path: `${process.env.NEXT_PUBLIC_SOCKET_PATH}/socket.io`,
      query: {
        token: Props.token,
      },
    });
    return () => {
      socket.disconnect();
    };
  }, [Props.token])
  
  const [credit, setCredit] = useState({ used: 0, total: 0 })
  const [conversationsList, setConversationsList] = useState<any>({ data: [], loading: true })
  const [conversationMessages, setConversationMessages] = useState<any>({ data: [], loading: true, conversationId: null })
  
  const openConversation = async (_id: any) => {
    try {
      getConversationMessages(_id).then((data:any)=>{
        // Update the state with the result
        setConversationMessages({data, loading: false, conversationId: _id});
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getData = () => {

    socket.on('client-connect-response', function () {
      socket.emit('get-credit-count')
      socket.emit('get-conversations-list')
    })

    socket.on('get-credit-count-response', function ({ data }: any) {
      setCredit({ used: data.used, total: data.total })
    })

    socket.on('get-conversations-list-response', function ({ data }: any) {
      setConversationsList({ data: data, loading: false })
    })

    socket.on('conversations-list-update', function ({ data }: any) {           
      setConversationsList((conversationsList: any)=>{ 
        const newData = [data, ...conversationsList.data];
        return {data: newData, loading: false };
      });
    })

    socket.on('error-handler', async function (data: any) {
      await logoutApi()
      router.replace('/login')
    })

    socket.emit('client-connect')
  }

  useEffect(() => {
    getData()
  }, [])

  const hrStyle = { margin: 0, border: 'none', borderTop: '1px solid #000' };
  return (
    <>
      <div className="submenu-sidebar">
        <ul>
          {conversationsList.loading ?
            <>
              {[...Array(6)].map((_, index) => (
                <li key={index}>
                  <Skeleton /> <hr style={hrStyle}/>
                </li>
              ))}
            </>
            :
            <>
              {conversationsList.data.map((item: any, key: any) => (
                <li key={key} style={{cursor: 'pointer', wordBreak: "break-word"}} onClick={() => openConversation(item._id)}>
                  {(conversationMessages.conversationId == item._id) ? 
                    <><strong>{item._id}</strong></> 
                    : <>{item._id}</>}
                  <hr style={hrStyle}/>
                </li>
              ))}
            </>
          }
        </ul>
      </div>
      <div className="top-headbar">
        <div className="top-headbar-heading">Inbox</div>
        <div className="top-headbar-right flex gap20">
          <div className="top-headbar-credit">
            <div className="headbar-credit-area flex justify-content-space-between">
              <div className="credit-text">Free Credit</div>
              <div className="credit-count">{credit.used}/{credit.total}</div>
            </div>
            <div className="headbar-credit-progress">
              <div className="credit-progressInner" style={{ "width": `${(Number(credit.used) / Number(credit.total)) * 100}%` }}></div>
            </div>

          </div>
        </div>
      </div>

      <div className="main-content-area">
          {conversationMessages.loading ?
            <>
              {[...Array(10)].map((_, index) => (
                <p key={index}>
                  <Skeleton />
                </p>
              ))}
            </>
            :
            <>
              <p><strong>Conversation: {conversationMessages.conversationId}</strong></p>
              {conversationMessages.data.map((item: any, key: any) => (
                <>
                  <p><strong>{item.sender_type}:</strong></p>
                  <p>{item.message}</p>
                  { item.infoSources && item.infoSources.map((source:any)=>{
                    <>{source}</>
                  })

                  }
                </>
              ))}
            </>
          }
        
      </div>
    </>
  )
}