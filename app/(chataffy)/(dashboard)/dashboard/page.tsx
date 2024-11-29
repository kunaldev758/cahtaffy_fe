'use client'

import Image from 'next/image'

import totalChatIconImage from '@/images/total-chat-icon.svg';
import totalMessageIconImage from '@/images/total-message-icon.svg';
import artIconImage from '@/images/art-icon.svg';
import csatIconImage from '@/images/csat-icon.svg';
import fallbackMessageIconImage from '@/images/fallback-message-icon.svg';
import uptimeIconImage from '@/images/uptime-icon.svg';
import trainingIconImage from '@/images/training-icon.svg';
import closeBtnImage from '@/images/close-btn.svg';
import tagPlusImage from '@/images/tag-plus.svg';

import { DateRangePicker,Progress  } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { useEffect, useState } from 'react';
import { Chart } from "react-google-charts";
import { getTrainingStatus } from '@/app/_api/dashboard/action'
import io from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string);

export default function Home() {
  const [dateRange, setDateRange] = useState<any>([new Date(), new Date()])
  const [totalChat, setTotalChat] = useState(0)
  const [totalMessage, setTotalMessage] = useState(0)
  const [art, setArt] = useState(0)
  const [csat, setCsat] = useState(0)
  const [fallbackMessage, setFallbackMessage] = useState(0)
  const [uptime, setUptime] = useState(0)
  const [aiAssists, setAiAssists] = useState({ aiChats: 0, totalChats: 0 })
  const [showGetStartedBox, setShowGetStartedBox] = useState(true)

  const [webpageStatus, setWebpageStatus] = useState(false)
  const [faqStatus, setFaqStatus] = useState(false)
  const [docSnippetStatus, setDocSnippetStatus] = useState(false)


  useEffect(() => {
    getTrainingStatus().then((data:any) => {
      console.log(data)
      setWebpageStatus(data.webpageStatus)
      setFaqStatus(data.faqStatus)
      setDocSnippetStatus(data.docSnippetStatus)
    })
  }, [])

  const data = [
    ["Country", "Chat Cont"],
    ["INDIA", 200],
    ["PAKISTAN", 700],
  ];

  // Emit a request for initial data
  useEffect(() => {
    // Emit event to fetch dashboard data
    socket.emit('fetch-dashboard-data', { dateRange }, (response: any) => {
      if (response.success) {
        const { totalChat, totalMessage, art, csat, fallbackMessage, uptime, aiAssists, trainingStatus } = response.data;
        setTotalChat(totalChat);
        setTotalMessage(totalMessage);
        setArt(art);
        setCsat(csat);
        setFallbackMessage(fallbackMessage);
        setUptime(uptime);
        setAiAssists(aiAssists);
        setWebpageStatus(trainingStatus.webpageStatus);
        setFaqStatus(trainingStatus.faqStatus);
        setDocSnippetStatus(trainingStatus.docSnippetStatus);
      }
    });

    // Listen for real-time updates
    socket.on('update-dashboard-data', (data: any) => {
      console.log('Real-time Update:', data);
      const { totalChat, totalMessage, art, csat, fallbackMessage, uptime, aiAssists, trainingStatus } = data;
      setTotalChat(totalChat);
      setTotalMessage(totalMessage);
      setArt(art);
      setCsat(csat);
      setFallbackMessage(fallbackMessage);
      setUptime(uptime);
      setAiAssists(aiAssists);
      setWebpageStatus(trainingStatus.webpageStatus);
      setFaqStatus(trainingStatus.faqStatus);
      setDocSnippetStatus(trainingStatus.docSnippetStatus);
    });

    // Cleanup socket listeners on unmount
    return () => {
      socket.off('update-dashboard-data');
    };
  }, [dateRange]);

  // Emit event when date range changes
  useEffect(() => {
    socket.emit('fetch-dashboard-data', { dateRange });
  }, [dateRange]);

  return (
    <><div className="main-content">
      <div className="submenu-sidebar">
        <ul>
          <li className="active"><a href="">Dashboard</a></li>
        </ul>
      </div>

      <div className="top-headbar">
        <div className="top-headbar-heading">Dashboard</div>
        <div className="top-headbar-right">
          <DateRangePicker
            placement='autoVerticalEnd'
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      <div className="main-content-area">
        <div className="dashboard-area d-flex gap-20">
          <div className="dashboard-left flex-grow-1">
            <div className="d-grid gap-20 grid-column-4">
              <div className="card d-flex flex-column">
                <div className="dashboard-Lefticon">
                  <Image src={totalChatIconImage} alt="" />
                </div>
                <div className="dashboard-highlightContent">
                  <h3>{totalChat}</h3>
                  <p>Total Chat</p>
                </div>
              </div>

              <div className="card d-flex flex-column">
                <div className="dashboard-Lefticon">
                  <Image src={totalMessageIconImage} alt="" />
                </div>
                <div className="dashboard-highlightContent">
                  <h3>{totalMessage}</h3>
                  <p>Total Message</p>
                </div>
              </div>

              <div className="card d-flex flex-column">
                <div className="dashboard-Lefticon">
                  <Image src={artIconImage} alt="" />
                </div>
                <div className="dashboard-highlightContent">
                  <h3>{art}</h3>
                  <p>ART</p>
                </div>
              </div>

              <div className="card d-flex flex-column">
                <div className="dashboard-Lefticon">
                  <Image src={csatIconImage} alt="" />
                </div>
                <div className="dashboard-highlightContent">
                  <h3>{csat}</h3>
                  <p>CSAT</p>
                </div>
              </div>
            </div>

            <div className="d-grid gap-20 mt-20 grid-column-2">
              <div className="card d-flex flex-row gap-20 align-item-center">
                <div className="dashboard-Lefticon mb-0">
                  <Image src={fallbackMessageIconImage} alt="" />
                </div>
                <div className="dashboard-highlightContent">
                  <h3>{fallbackMessage}</h3>
                  <p>Fallback Message</p>
                </div>
              </div>

              <div className="card d-flex flex-row gap-20 align-item-center">
                <div className="dashboard-Lefticon mb-0">
                  <Image src={uptimeIconImage} alt="" />
                </div>
                <div className="dashboard-highlightContent">
                  <h3>{uptime}</h3>
                  <p>Uptime</p>
                </div>
              </div>
            </div>

            <div className="d-grid gap-20 mt-20">
              <div className="card training-highlight-box">
                <div className="d-flex flex-row gap-20 align-item-center">
                  <div className="dashboard-Lefticon dashboard-aiIcon mb-0">
                    <Image src={trainingIconImage} alt="" />
                  </div>
                  <div className="dashboard-highlightContent">
                    <h3 className="mb-0">Ai Assists</h3>
                  </div>
                </div>

                <div className="training-highlight-mid mt-3 mb-0">
                  <div className="training-highlight-count">
                    <h3>{aiAssists.aiChats}</h3>
                    <p>AI Chats</p>
                  </div>
                  <div className="training-highlight-count">
                    <h3>{aiAssists.totalChats}</h3>
                    <p>Total Chats</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-right">
            {showGetStartedBox &&
              <div className="card setup-progresrArea">
                <div className="setup-progressHead">
                  <div className="d-flex align-item-center justify-content-between">
                    <h3>Get Started</h3>
                    <button type="button" className="plain-btn" onClick={() => setShowGetStartedBox(false)}><Image src={closeBtnImage} alt="" /></button>
                  </div>
                  <p className="text-gray mt-6">We&apos;ll guide you to setup your account.</p>
                </div>
                <div className="dashboard-progressBar">
                <Progress.Line percent={Math.ceil((webpageStatus ? 33.33 : 0)+(docSnippetStatus ? 33.33 : 0)+(faqStatus ? 33.33 : 0))}/>

                  <div className="headbar-credit-area">
                    <div className="credit-text">{Number(webpageStatus) + Number(docSnippetStatus) + Number(faqStatus)} of 3 tasks completed</div>
                  </div>
                  <div className="dashboard-setupArea">
                    <ul className="m-0 p-0">
                      <li className="d-flex align-item-center justify-content-between position-relative">
                        <div className="d-flex gap-3 align-item-center">
                          <div className={`setup-progressPoint ${webpageStatus && `done`}`}></div>
                          <p>Web Page</p>
                        </div>
                        {webpageStatus == false &&
                          <button className="custom-btn d-flex gap-2 align-item-center"><Image src={tagPlusImage} alt="" /> Add</button>}
                      </li>

                      <li className="d-flex align-item-center justify-content-between position-relative">
                        <div className="d-flex gap-3 align-item-center">
                          <div className={`setup-progressPoint ${docSnippetStatus && `done`}`}></div>
                          <p>Doc/Snippets</p>
                        </div>
                        {docSnippetStatus == false &&
                          <button className="custom-btn d-flex gap-2 align-item-center"><Image src={tagPlusImage} alt="" /> Add</button>}
                      </li>

                      <li className="d-flex align-item-center justify-content-between position-relative">
                        <div className="d-flex gap-3 align-item-center">
                          <div className={`setup-progressPoint ${faqStatus && `done`}`}></div>
                          <p>{`FAQ's`}</p>
                        </div>
                        {faqStatus == false &&
                          <button className="custom-btn d-flex gap-2 align-item-center"><Image src={tagPlusImage} alt="" /> Add</button>}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>}

            <div className="card setup-progresrArea mt-20">
              <div className="mapArea">
                <Chart
                  chartEvents={[
                    {
                      eventName: "select",
                      callback: ({ chartWrapper }: { chartWrapper: any }) => {
                        const chart = chartWrapper.getChart();
                        const selection = chart.getSelection();
                        if (selection.length === 0) return;
                        const region = data[selection[0].row + 1];
                        console.log("Selected : " + region);
                      },
                    },
                  ]}
                  chartType="GeoChart"
                  width="100%"
                  height="100%"
                  data={data}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div></>
  )
}