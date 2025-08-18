'use client'

import Image from 'next/image'
import { DateRangePicker, Progress } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { useEffect, useState } from 'react';
import { Chart } from "react-google-charts";

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


const formatDataSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function ModernDashboard() {
  const { socket } = useSocket();
  const [dateRange, setDateRange] = useState<any>([
    new Date(new Date().setDate(new Date().getDate() - 7)),
    new Date()
  ])

  // Dashboard metrics
  const [totalChat, setTotalChat] = useState(0)
  const [totalMessage, setTotalMessage] = useState(0)
  const [csat, setCsat] = useState(0)
  const [aiChat, setAiChat] = useState(0)
  const [totalAgents, setTotalAgents] = useState(0)
  const [data, setData] = useState<any>()
  const [totalChatsInPlan, setTotalChatsInPlan] = useState(0)

  // Analytics and plan data
  const [analytics, setAnalytics] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [showGetStartedBox, setShowGetStartedBox] = useState(true)



  useEffect(() => {
    if (!socket) return;

    socket.emit('fetch-dashboard-data', { dateRange }, (response: any) => {
      if (response.success) {
        // Handle main dashboard data
        const { totalChat, aiAssists, totalMessage, csat, totalAgents, locationData, totalChatsInPlan } = response.data;
        setTotalChat(totalChat);
        setTotalMessage(totalMessage);
        setCsat(Number(csat).toFixed(2) as any);
        setAiChat(aiAssists);
        setTotalAgents(totalAgents);
        setData(locationData);
        setTotalChatsInPlan(totalChatsInPlan);

        // Handle analytics data
        if (response.analytics) {
          setAnalytics(response.analytics);
        }

        // Handle plan data
        if (response.plan) {
          setPlan(response.plan);
        }
      }
    });

    socket.on('update-dashboard-data', (updateData: any) => {
      console.log('Real-time Update:', updateData);
      const { totalChat, aiAssists, totalMessage, csat, totalAgents, locationData, totalChatsInPlan } = updateData;
      setTotalChat(totalChat);
      setTotalMessage(totalMessage);
      setCsat(Number(csat).toFixed(2) as any);
      setAiChat(aiAssists);
      setTotalAgents(totalAgents);
      setData(locationData);
      setTotalChatsInPlan(totalChatsInPlan);
    });

    return () => {
      socket.off('update-dashboard-data');
    };
  }, [dateRange, socket]);

  // Calculate progress based on analytics data
  const getProgressData = () => {
    if (analytics) {
      const pagesAdded = analytics.pagesAdded?.success > 0;
      const filesAdded = analytics.filesAdded > 0;
      const faqsAdded = analytics.faqsAdded > 0;
      const completedTasks = Number(pagesAdded) + Number(filesAdded) + Number(faqsAdded);
      return { completedTasks, totalTasks: 3, progressPercentage: Math.ceil((completedTasks / 3) * 100) };
    } else {
      return { completedTasks: 0, totalTasks: 3, progressPercentage: 0 };
    }
  };

  const { completedTasks, totalTasks, progressPercentage } = getProgressData();

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

              {/* Total Agents */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">Total Agents</p>
                    <p className="text-3xl font-bold text-gray-900">{totalAgents}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Image src={artIconImage} alt="Total Agents" width={24} height={24} />
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

            {/* Analytics Data Cards */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Data Size */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Image src={trainingIconImage} alt="Data Size" width={24} height={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Current Data Size</p>
                      <p className="text-2xl font-bold text-gray-900">{formatDataSize(analytics.currentDataSize)}</p>
                      {/* <p className="text-xs text-gray-500">MB</p> */}
                    </div>
                  </div>
                </div>

                {/* Plan Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center`}
                      style={{ backgroundColor: plan?.metadata?.color ? `${plan.metadata.color}20` : '#059669' }}>
                      <Image src={uptimeIconImage} alt="Plan" width={24} height={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Current Plan</p>
                      <p className="text-xl font-bold text-gray-900">{plan?.displayName || analytics?.plan || 'Free'}</p>
                      {plan?.name != 'free' && <>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${analytics?.planStatus === 'active' ? 'bg-green-100 text-green-600' :
                              analytics?.planStatus === 'inactive' ? 'bg-red-100 text-red-600' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                            {analytics?.planStatus || 'Active'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${analytics?.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' :
                              analytics?.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-red-100 text-red-600'
                            }`}>
                            {analytics?.paymentStatus || 'Unpaid'}
                          </span>
                          {plan?.metadata?.popular && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Popular</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          {analytics?.billingCycle && (
                            <p>Billing: {analytics.billingCycle.charAt(0).toUpperCase() + analytics.billingCycle.slice(1)}</p>
                          )}
                          {analytics?.planExpiry && (
                            <p>Expires: {new Date(analytics.planExpiry).toLocaleDateString()}</p>
                          )}
                        </div>
                      </>}
                    </div>
                  </div>
                </div>

                {/* Training Status */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${analytics.dataTrainingStatus === 1 ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Training Status</p>
                      <p className="text-lg font-bold text-gray-900">
                        {analytics.dataTrainingStatus === 1 ? 'Training' : 'Ready'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {analytics.dataTrainingStatus === 1 ? 'Processing data...' : 'Ready to serve'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Assists Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Image src={trainingIconImage} alt="AI Assists" width={24} height={24} />
                </div>
                <h3 className="text-xl font-bold">AI Performance</h3>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold mb-2">{aiChat.toLocaleString()}</p>
                  <p className="text-blue-100">AI Chats</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold mb-2">{totalChat.toLocaleString()}</p>
                  <p className="text-blue-100">Total Chats</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold mb-2">{totalChat > 0 ? Math.round((aiChat / totalChat) * 100) : 0}%</p>
                  <p className="text-blue-100">AI Efficiency</p>
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

                <p className="text-sm text-gray-600 mb-6">Set up your chatbot with data sources.</p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-500">{completedTasks} of {totalTasks} completed</span>
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
                  {/* Web Pages */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${analytics?.pagesAdded?.success > 0 ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                        {analytics?.pagesAdded?.success > 0 && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Web Pages {analytics?.pagesAdded?.success > 0 && `(${analytics.pagesAdded.success})`}
                      </span>
                    </div>
                  </div>

                  {/* Documents/Files */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${analytics?.filesAdded > 0 ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                        {analytics?.filesAdded > 0 && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Documents {analytics?.filesAdded > 0 && `(${analytics.filesAdded})`}
                      </span>
                    </div>
                  </div>

                  {/* FAQ's */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${analytics?.faqsAdded > 0 ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                        {analytics?.faqsAdded > 0 && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        FAQ's {analytics?.faqsAdded > 0 && `(${analytics.faqsAdded})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plan Usage Metrics */}
                {plan && analytics && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Plan Limits & Usage</h4>
                    <div className="space-y-3">
                      {/* Storage Usage */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Storage</span>
                          <span>{formatDataSize(analytics?.currentDataSize)} / {formatDataSize(plan?.limits?.maxStorage)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${analytics?.currentDataSize / plan?.limits?.maxStorage > 0.8 ? 'bg-red-500' :
                                analytics?.currentDataSize / plan?.limits?.maxStorage > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                            style={{ width: `${Math.min((analytics?.currentDataSize / plan?.limits?.maxStorage) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Agents Usage */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Agents</span>
                          <span>{totalAgents} / {plan.limits.maxAgentsPerAccount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${totalAgents / plan.limits.maxAgentsPerAccount > 0.8 ? 'bg-red-500' :
                                totalAgents / plan.limits.maxAgentsPerAccount > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                            style={{ width: `${Math.min((totalAgents / plan.limits.maxAgentsPerAccount) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Queries Usage */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Monthly Queries</span>
                          <span>{totalChatsInPlan.toLocaleString()} / {plan.limits.maxQueries.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${totalChatsInPlan / plan?.limits?.maxQueries > 0.8 ? 'bg-red-500' :
                                totalChatsInPlan / plan?.limits?.maxQueries > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                            style={{ width: `${Math.min((totalChatsInPlan / plan?.limits?.maxQueries) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Plan Pricing Info */}
                    {plan.pricing && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Plan Price:</span>
                          <div className="text-right">
                            <p className="font-medium">
                              {plan.pricing.currency} {analytics?.billingCycle === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly}
                              <span className="text-gray-500">/{analytics?.billingCycle || 'month'}</span>
                            </p>
                            {analytics?.totalAmountPaid > 0 && (
                              <p className="text-gray-500">Total Paid: {plan?.pricing?.currency} {analytics?.totalAmountPaid}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Plan Limits Warning */}
                {analytics?.upgradePlanStatus && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs text-yellow-800">
                      {analytics.upgradePlanStatus.storageLimitExceeded && (
                        <p className="mb-1">⚠️ Storage limit exceeded</p>
                      )}
                      {analytics.upgradePlanStatus.agentLimitExceeded && (
                        <p className="mb-1">⚠️ Agent limit exceeded</p>
                      )}
                      {analytics.upgradePlanStatus.chatLimitExceeded && (
                        <p className="mb-1">⚠️ Chat limit exceeded</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Geographic Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
              <div className="h-80">
                {data ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Loading geographic data...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}