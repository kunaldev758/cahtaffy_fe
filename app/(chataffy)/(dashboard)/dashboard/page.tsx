'use client'

import Image from 'next/image'
import { DateRangePicker, Progress } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { useEffect, useState } from 'react';
import { Chart } from "react-google-charts";
import { getTrainingStatus } from '@/app/_api/dashboard/action'
import { useSocket } from "@/app/socketContext";

import totalChatIconImage from '@/images/total-chat-icon.svg';
import totalMessageIconImage from '@/images/total-message-icon.svg';
import artIconImage from '@/images/art-icon.svg';
import csatIconImage from '@/images/csat-icon.svg';
import fallbackMessageIconImage from '@/images/fallback-message-icon.svg';
import uptimeIconImage from '@/images/uptime-icon.svg';
import trainingIconImage from '@/images/training-icon.svg';
import closeBtnImage from '@/images/close-btn.svg';
import tagPlusImage from '@/images/tag-plus.svg';

export default function ModernDashboard() {
  const { socket } = useSocket();
  const [dateRange, setDateRange] = useState<any>([
    new Date(new Date().setDate(new Date().getDate() - 7)), 
    new Date()
  ])
  const [totalChat, setTotalChat] = useState(0)
  const [totalMessage, setTotalMessage] = useState(0)
  const [art, setArt] = useState(0)
  const [csat, setCsat] = useState(0)
  const [fallbackMessage, setFallbackMessage] = useState(0)
  const [uptime, setUptime] = useState(0)
  const [aiChat, setAiChat] = useState(0)
  const [data, setData] = useState<any>()
  const [showGetStartedBox, setShowGetStartedBox] = useState(true)

  const [webpageStatus, setWebpageStatus] = useState(false)
  const [faqStatus, setFaqStatus] = useState(false)
  const [docSnippetStatus, setDocSnippetStatus] = useState(false)

  useEffect(() => {
    getTrainingStatus().then((data: any) => {
      console.log(data)
      setWebpageStatus(data.webpageStatus)
      setFaqStatus(data.faqStatus)
      setDocSnippetStatus(data.docSnippetStatus)
    })
  }, [])

  useEffect(() => {
    if (!socket) return;
    
    socket.emit('fetch-dashboard-data', { dateRange }, (response: any) => {
      if (response.success) {
        const { totalChat, totalMessage, art, csat, fallbackMessage, uptime, aiAssists, locationData } = response.data;
        setTotalChat(totalChat);
        setTotalMessage(totalMessage);
        setArt(art);
        setCsat(Number(csat).toFixed(2));
        setFallbackMessage(fallbackMessage);
        setUptime(uptime);
        setAiChat(aiAssists);
        setData(locationData);
      }
    });

    socket.on('update-dashboard-data', (data: any) => {
      console.log('Real-time Update:', data);
      const { totalChat, totalMessage, art, csat, fallbackMessage, uptime, aiAssists, locationData } = data;
      setTotalChat(totalChat);
      setTotalMessage(totalMessage);
      setArt(art);
      setCsat(Number(csat).toFixed(2));
      setFallbackMessage(fallbackMessage);
      setUptime(uptime);
      setAiChat(aiAssists);
      setData(locationData);
    });

    return () => {
      socket.off('update-dashboard-data');
    };
  }, [dateRange, socket]);

  const completedTasks = Number(webpageStatus) + Number(docSnippetStatus) + Number(faqStatus);
  const progressPercentage = Math.ceil((completedTasks / 3) * 100);

  return (
    <div className="min-h-screen bg-gray-50 grow">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor your chatbot performance and analytics</p>
          </div>
          <div className="flex items-center space-x-4">
            <DateRangePicker
              cleanable={false}
              placement='autoVerticalEnd'
              value={dateRange}
              onChange={setDateRange}
              className="border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Content - 3 columns */}
          <div className="xl:col-span-3 space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Total Chat */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">Total Chat</p>
                    <p className="text-3xl font-bold text-gray-900">{totalChat.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Image src={totalChatIconImage} alt="Total Chat" width={24} height={24} />
                  </div>
                </div>
              </div>

              {/* Total Message */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">Total Message</p>
                    <p className="text-3xl font-bold text-gray-900">{totalMessage.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Image src={totalMessageIconImage} alt="Total Message" width={24} height={24} />
                  </div>
                </div>
              </div>

              {/* ART */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">ART</p>
                    <p className="text-3xl font-bold text-gray-900">{art}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Image src={artIconImage} alt="ART" width={24} height={24} />
                  </div>
                </div>
              </div>

              {/* CSAT */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">CSAT</p>
                    <p className="text-3xl font-bold text-gray-900">{csat}%</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Image src={csatIconImage} alt="CSAT" width={24} height={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fallback Message */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Image src={fallbackMessageIconImage} alt="Fallback Message" width={24} height={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Fallback Message</p>
                    <p className="text-2xl font-bold text-gray-900">{fallbackMessage}</p>
                  </div>
                </div>
              </div>

              {/* Uptime */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Image src={uptimeIconImage} alt="Uptime" width={24} height={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Uptime</p>
                    <p className="text-2xl font-bold text-gray-900">{uptime}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Assists Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Image src={trainingIconImage} alt="AI Assists" width={24} height={24} />
                </div>
                <h3 className="text-xl font-bold">AI Assists</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold mb-2">{aiChat.toLocaleString()}</p>
                  <p className="text-blue-100">AI Chats</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold mb-2">{totalChat.toLocaleString()}</p>
                  <p className="text-blue-100">Total Chats</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Get Started Card */}
            {showGetStartedBox && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Get Started</h3>
                  <button 
                    onClick={() => setShowGetStartedBox(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Image src={closeBtnImage} alt="Close" width={16} height={16} />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-6">We'll guide you to setup your account.</p>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-500">{completedTasks} of 3 completed</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Setup Tasks */}
                <div className="space-y-4">
                  {/* Web Page */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${webpageStatus ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                        {webpageStatus && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Web Page</span>
                    </div>
                    {/* {!webpageStatus && (
                      <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1">
                        <Image src={tagPlusImage} alt="Add" width={12} height={12} />
                        <span>Add</span>
                      </button>
                    )} */}
                  </div>

                  {/* Doc/Snippets */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${docSnippetStatus ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                        {docSnippetStatus && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Doc/Snippets</span>
                    </div>
                    {/* {!docSnippetStatus && (
                      <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1">
                        <Image src={tagPlusImage} alt="Add" width={12} height={12} />
                        <span>Add</span>
                      </button>
                    )} */}
                  </div>

                  {/* FAQ's */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${faqStatus ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                        {faqStatus && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">FAQ's</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Geographic Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
              <div className="h-80">
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
                  options={{
                    backgroundColor: 'transparent',
                    datalessRegionColor: '#f5f5f5',
                    defaultColor: '#e0e7ff',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}