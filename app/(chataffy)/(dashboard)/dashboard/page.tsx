"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DatePickerWithRange } from '@/components/datepicker'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useSocket } from '@/app/socketContext'
import { type DateRange } from 'react-day-picker'
import { subDays } from 'date-fns'
import { ChevronDown, Globe, Check, Loader2, Plus } from 'lucide-react'
import { getAIAgents } from '@/app/_api/dashboard/action'
import { createAIAgentApi } from '@/app/_api/login/action'
import { toast } from 'react-toastify'
import NotificationBell from '../_components/NotificationBell'

type Agent = {
  _id: string
  agentName: string
  website_name: string
  isActive: boolean
  dataTrainingStatus: number
}

type MetricCard = {
  title: string
  value: string
  delta?: string
  deltaTone?: 'positive' | 'negative'
  iconBg: string
  icon: JSX.Element
  chart: JSX.Element
}

type ChatItem = {
  initials: string
  name: string
  message: string
  country: string
  time: string
}

const formatDataSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getInitials = (name: string) => {
  if (!name) return '??'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function Dashboard2Page() {
  const router = useRouter()
  const { socket } = useSocket()

  // Agent switcher state
  const [agents, setAgents] = useState<Agent[]>([])
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false)
  const [isAgentLoading, setIsAgentLoading] = useState(true)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)
  const agentDropdownRef = useRef<HTMLDivElement>(null)

  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  // Dashboard metrics
  const [totalChat, setTotalChat] = useState(0)
  const [totalMessage, setTotalMessage] = useState(0)
  const [csat, setCsat] = useState(0)
  const [aiChat, setAiChat] = useState(0)
  const [totalHumanAgents, setTotalHumanAgents] = useState(0)
  const [totalChatsInPlan, setTotalChatsInPlan] = useState(0)

  // Analytics & plan
  const [analytics, setAnalytics] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)

  // Agent-specific setup data
  const [agentData, setAgentData] = useState<any>(null)

  // Recent conversations
  const [recentChats, setRecentChats] = useState<ChatItem[]>([])

  // Current agent id
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)

  // Sync agentId from localStorage + load agents for switcher
  useEffect(() => {
    const storedId = localStorage.getItem('currentAgentId')
    setCurrentAgentId(storedId)

    const handleAgentChanged = (e: Event) => {
      const id = (e as CustomEvent).detail?.agentId ?? localStorage.getItem('currentAgentId')
      setCurrentAgentId(id)
    }
    window.addEventListener('agent-changed', handleAgentChanged)

    // Load agents list
    ;(async () => {
      setIsAgentLoading(true)
      try {
        const data = await getAIAgents()
        setAgents(Array.isArray(data) ? data : [])
      } catch { /* silent */ } finally {
        setIsAgentLoading(false)
      }
    })()

    return () => window.removeEventListener('agent-changed', handleAgentChanged)
  }, [])

  // Close agent dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(e.target as Node)) {
        setIsAgentDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSwitchAgent = (agentId: string) => {
    if (agentId === currentAgentId) { setIsAgentDropdownOpen(false); return }
    localStorage.setItem('currentAgentId', agentId)
    setCurrentAgentId(agentId)
    window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId } }))
    setIsAgentDropdownOpen(false)
    toast.success(`Switched to ${agents.find((a) => a._id === agentId)?.agentName || 'agent'}`)
  }

  const handleNewAgent = async () => {
    if (isCreatingAgent) return
    setIsAgentDropdownOpen(false)
    setIsCreatingAgent(true)
    try {
      const res = await createAIAgentApi()
      if (!res?.status || !res?.agent?._id) { toast.error(res?.message || 'Failed to create agent'); return }
      const newAgentId = res.agent._id
      localStorage.setItem('previousAgentId', localStorage.getItem('currentAgentId') ?? '')
      localStorage.setItem('currentAgentId', newAgentId)
      window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId: newAgentId } }))
      router.push('/website/new')
    } catch { toast.error('Failed to create agent. Please try again.') }
    finally { setIsCreatingAgent(false) }
  }

  const currentAgent = agents.find((a) => a._id === currentAgentId)
  const agentDisplayName = currentAgent
    ? currentAgent.agentName || currentAgent.website_name || 'Unnamed Agent'
    : currentAgentId ? 'Loading...' : 'No agent'
  const agentInitials = agentDisplayName
    .split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')

  const fetchDashboardData = useCallback(() => {
    if (!socket || !currentAgentId) return

    const range = [
      (dateRange.from ?? subDays(new Date(), 7)).toISOString(),
      (dateRange.to ?? new Date()).toISOString(),
    ]

    socket.emit('fetch-dashboard-data', { dateRange: range, agentId: currentAgentId }, (response: any) => {
      if (response.success) {
        const { totalChat, aiAssists, totalMessage, csat, totalHumanAgents, totalChatsInPlan } = response.data
        setTotalChat(totalChat ?? 0)
        setTotalMessage(totalMessage ?? 0)
        setCsat(parseFloat(Number(csat).toFixed(2)))
        setAiChat(aiAssists ?? 0)
        setTotalHumanAgents(totalHumanAgents ?? 0)
        setTotalChatsInPlan(totalChatsInPlan ?? 0)
        if (response.analytics) setAnalytics(response.analytics)
        if (response.plan) setPlan(response.plan)
      }
    })

    // Fetch agent-specific data (pagesAdded, filesAdded, faqsAdded)
    socket.emit('get-agent-data', {}, (res: any) => {
      if (res?.agentData) setAgentData(res.agentData)
    })
    socket.once('get-agent-data-response', (res: any) => {
      if (res?.agentData) setAgentData(res.agentData)
    })
  }, [socket, currentAgentId, dateRange])

  const fetchRecentChats = useCallback(() => {
    if (!socket) return

    const buildChats = (conversations: any[]): ChatItem[] =>
      conversations
        .slice(0, 10)
        .map((conv) => {
          const visitor = conv.visitor
          const name = visitor?.name || visitor?.email || 'Unknown'
          const lastMsg = conv.lastMessage || ''
          const country = visitor?.location || ''
          const time = conv.createdAt ? timeAgo(conv.updatedAt || conv.createdAt) : ''
          return { initials: getInitials(name), name, message: lastMsg, country, time }
        })

    socket.once('get-open-conversations-list-response', (res: any) => {
      if (res?.status === 'success') {
        setRecentChats(buildChats(res.conversations ?? []))
      }
    })
    socket.emit('get-open-conversations-list', {})
  }, [socket])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    fetchRecentChats()
  }, [fetchRecentChats])

  // Derive setup progress from agentData
  const pagesAdded = agentData?.pagesAdded?.success ?? 0
  const filesAdded = agentData?.filesAdded ?? 0
  const faqsAdded = agentData?.faqsAdded ?? 0
  const completedTasks = Number(pagesAdded > 0) + Number(filesAdded > 0) + Number(faqsAdded > 0)
  const progressPercentage = Math.ceil((completedTasks / 3) * 100)

  // Plan limits
  const maxStorage = plan?.limits?.maxStorage ?? 0
  const maxAgents = plan?.limits?.maxAgentsPerAccount ?? 1
  const maxQueries = plan?.limits?.maxQueries ?? 0
  const currentDataSize = analytics?.currentDataSize ?? 0
  const storagePercent = maxStorage > 0 ? Math.min((currentDataSize / maxStorage) * 100, 100) : 0
  const agentPercent = maxAgents > 0 ? Math.min((totalHumanAgents / maxAgents) * 100, 100) : 0

  const autoResolvePercent = totalChat > 0 ? Math.round((aiChat / totalChat) * 100) : 0

  const metrics: MetricCard[] = [
    {
      title: 'Total Chats',
      value: totalChat.toLocaleString(),
      iconBg: '#EEF2FF',
      icon: <span className="material-symbols-outlined !text-[20px] leading-none text-[#4B56F2]">chat_bubble</span>,
      chart: <SparklineBlue />,
    },
    {
      title: 'Total Messages',
      value: totalMessage.toLocaleString(),
      iconBg: '#EAFFEA',
      icon: <span className="material-symbols-outlined !text-[20px] leading-none text-[#57B947]">chat</span>,
      chart: <SparklineRed />,
    },
    {
      title: 'CSAT Score',
      value: `${csat}%`,
      iconBg: '#FFF8DE',
      icon: <span className="material-symbols-outlined !text-[20px] leading-none text-[#EAB308]">hotel_class</span>,
      chart: <div className="h-[31px] w-[102px]" />,
    },
    {
      title: 'Uptime',
      value: '99.99%',
      iconBg: '#FFF1F2',
      icon: <span className="material-symbols-outlined !text-[20px] leading-none text-[#FF5B70]">history</span>,
      chart: <div className="h-[31px] w-[102px]" />,
    },
  ]

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <header className="flex flex-col gap-5 border-b border-[#F1F5F9] bg-[#F9F9F9] pr-[20px] py-[20px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-[14px]">
            <h1 className="text-[24px] font-bold leading-5 text-[#111827]">Overview</h1>
            <span
              className={`inline-flex h-[22px] items-center gap-1 rounded-[4px] border px-[10px] text-center text-[12px] font-medium leading-[18px] ${
                agentData?.dataTrainingStatus === 1
                  ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]'
                  : 'border-[#34D399] bg-[#ECFDF5] text-[#059669]'
              }`}
            >
              <CheckCircleIcon className="h-[13px] w-[13px]" />
              {agentData?.dataTrainingStatus === 1 ? 'Training in progress' : 'No training in progress'}
            </span>
          </div>
          <p className="text-[13px] leading-5 text-[#64748B]">
            Welcome back, here&apos;s what&apos;s happening across your agents.
          </p>
        </div>

        <div className="flex items-center gap-[16px] lg:justify-end">
          {/* Agent switcher */}
          <div className="relative" ref={agentDropdownRef}>
            <button
              type="button"
              onClick={() => setIsAgentDropdownOpen((prev) => !prev)}
              className="inline-flex h-[40px] min-w-[200px] items-center gap-[9px] rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] text-[#111827]"
            >
              {isAgentLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#64748B] shrink-0" />
              ) : (
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[10px] font-bold text-[#4B56F2]">
                  {agentInitials || <Globe className="h-3 w-3" />}
                </span>
              )}
              <span className="flex-1 truncate text-left">{agentDisplayName}</span>
              {currentAgent?.dataTrainingStatus === 1 && (
                <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />
              )}
              <ChevronDown className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-150 ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAgentDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-[260px] overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-lg">
                <div className="max-h-60 overflow-y-auto py-1">
                  {agents.length === 0 && !isAgentLoading && (
                    <p className="px-4 py-3 text-center text-sm text-[#64748B]">No agents found</p>
                  )}
                  {agents.map((agent) => {
                    const name = agent.agentName || agent.website_name || 'Unnamed Agent'
                    const isSelected = agent._id === currentAgentId
                    const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')
                    return (
                      <button
                        key={agent._id}
                        type="button"
                        onClick={() => handleSwitchAgent(agent._id)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${isSelected ? 'bg-[#EEF2FF]' : ''}`}
                      >
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[11px] font-bold text-[#4B56F2]">
                          {initials || <Globe className="h-4 w-4" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[13px] font-medium text-[#111827]">{name}</p>
                          {agent.website_name && agent.agentName && agent.agentName !== agent.website_name && (
                            <p className="truncate text-[11px] text-[#94A3B8]">{agent.website_name}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {agent.dataTrainingStatus === 1 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />
                          )}
                          {isSelected && <Check className="h-4 w-4 text-[#4B56F2]" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="border-t border-[#F1F5F9] p-2">
                  <button
                    type="button"
                    onClick={handleNewAgent}
                    disabled={isCreatingAgent}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    {isCreatingAgent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {isCreatingAgent ? 'Creating...' : 'New AI agent'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <DatePickerWithRange
            value={dateRange}
            onDateChange={(range) => {
              if (range) setDateRange(range)
            }}
          />

          <NotificationBell />
        </div>
      </header>

      <main className="rounded-tl-[30px] bg-[#F3F4F6] px-4 pb-[33px] pt-6 lg:px-6 flex flex-col gap-[24px]">
        {/* Metric cards */}
        <section className="grid gap-6 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCardView key={metric.title} metric={metric} />
          ))}
        </section>

        {/* Setup + Plan Limits */}
        <section className="grid gap-6 xl:grid-cols-[1.58fr_1fr]">
          <div className="rounded-[20px] bg-white p-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] flex flex-col gap-[20px]">
            <div>
              <h2 className="flex items-center gap-2 text-[24px] font-bold leading-5 text-[#111827]">
                <span>Hello, Chataffy User!</span>
                <img src="/images/new/wave-icon.png" alt="Wave Icon" width={24} height={20} />
              </h2>
              <p className="mt-3 text-[14px] font-medium leading-5 text-[#64748B]">
                You&apos;re on step {completedTasks} of 3. Start by adding your data sources.
              </p>
            </div>

            <div>
              <Progress value={progressPercentage} className="h-[16px] rounded-full bg-[#F1F5F9] [&>div]:bg-[#4F7FF7]" />
            </div>

            <div className="flex flex-wrap items-center gap-[22px] text-[13px] font-medium leading-5 text-[#64748B]">
              <div className="flex items-center gap-[6px]">
                {pagesAdded > 0
                  ? <CheckCircleIcon className="h-[17px] w-[17px] text-[#16A34A]" />
                  : <div className="h-[14px] w-[14px] bg-[#F1F5F9] rounded-full" />}
                <span>Web Pages{pagesAdded > 0 ? ` (${pagesAdded})` : ''}</span>
              </div>
              <div className="flex items-center gap-[6px]">
                {filesAdded > 0
                  ? <CheckCircleIcon className="h-[17px] w-[17px] text-[#16A34A]" />
                  : <div className="h-[14px] w-[14px] bg-[#F1F5F9] rounded-full" />}
                <span>Documents{filesAdded > 0 ? ` (${filesAdded})` : ''}</span>
              </div>
              <div className="flex items-center gap-[6px]">
                {faqsAdded > 0
                  ? <CheckCircleIcon className="h-[17px] w-[17px] text-[#16A34A]" />
                  : <CircleOutlineIcon className="h-[17px] w-[17px] text-[#E2E8F0]" />}
                <span>FAQ&apos;s{faqsAdded > 0 ? ` (${faqsAdded})` : ''}</span>
              </div>
            </div>

            <div className='flex'>
              <button
                type="button"
                onClick={() => router.push('/setup/training')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold"
              >
                <span>Continue Setup</span>
                <span className="material-symbols-outlined !text-[14px]">arrow_forward_ios</span>
              </button>
            </div>
          </div>

          <div className="rounded-[20px] bg-white p-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold leading-5 text-[#111827]">Plan Limits &amp; Usage</h2>
                <p className="mt-[6px] text-[13px] leading-5 text-[#64748B]">{plan?.displayName ?? 'Free Plan'}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/billing')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold"
              >
                <span>Upgrade Plan</span>
                <span className="material-symbols-outlined !text-[18px]">keyboard_double_arrow_up</span>
              </button>
            </div>

            <div className="mt-[24px] space-y-4">
              <div>
                <div className="flex items-end justify-between gap-4 text-[13px] font-medium leading-5 text-[#64748B]">
                  <span>Data Storage</span>
                  <span className="text-right font-bold text-[#111827]">
                    {formatDataSize(currentDataSize)} / {formatDataSize(maxStorage)}
                  </span>
                </div>
                <Progress value={storagePercent} className="mt-1.5 h-[8px] rounded-full bg-[#F1F5F9]" />
              </div>

              <div>
                <div className="flex items-end justify-between gap-4 text-[13px] font-medium leading-5 text-[#64748B]">
                  <span>Agents</span>
                  <span className="text-right font-bold text-[#111827]">{totalHumanAgents} / {maxAgents}</span>
                </div>
                <Progress value={agentPercent} className="mt-1.5 h-[8px] rounded-full bg-[#F1F5F9]" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-[13px] font-bold text-[#111827]">Queries Handled</p>
                  <p className="text-[11px] leading-4 text-[#64748B]">Deducted from shared pool</p>
                </div>
                <span className="mt-0 text-right text-[16px] font-bold leading-5 text-[#111827]">
                  {totalChatsInPlan}{maxQueries > 0 ? ` / ${maxQueries.toLocaleString()}` : ''}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Chats + AI Performance */}
        <section className="grid gap-6 xl:grid-cols-[1fr_1.16fr]">
          <div className="rounded-[20px] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]">
            <div className="flex items-start justify-between gap-4 px-[20px] py-[20px]">
              <div>
                <h2 className="text-[18px] font-bold leading-5 text-[#111827]">Recent Chats</h2>
                <p className="mt-[6px] text-[13px] leading-5 text-[#64748B]">Latest conversations from your agent</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/inbox')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold"
              >
                <span>All Conversation</span>
                <span className="material-symbols-outlined !text-[14px]">arrow_forward_ios</span>
              </button>
            </div>

            <ScrollArea className="h-[314px]">
              <div className='flex flex-col'>
                {recentChats.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-[13px] text-[#64748B]">
                    No recent conversations
                  </div>
                ) : (
                  recentChats.map((chat, index) => (
                    <div key={index} className="border-t border-[#EDF2F7] px-[20px] py-[16px] first:border-t-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-[16px]">
                          <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#E8E8E8] bg-white text-[18px] font-medium leading-5 text-[#64748B]">
                            {chat.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold leading-5 text-[#111827]">{chat.name}</p>
                            <p className="mt-1 truncate text-[13px] leading-5 text-[#64748B]">{chat.message || 'No messages yet'}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-[15px] text-[13px] leading-5 text-[#64748B]">
                          {chat.country && <FlagBadge country={chat.country} />}
                          <span>{chat.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="rounded-[20px] bg-white p-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]">
            <div>
              <h2 className="text-[18px] font-bold leading-5 text-[#111827]">AI Performance</h2>
              <p className="mt-[6px] text-[13px] leading-5 text-[#64748B]">
                Real-time analysis of automated interactions
              </p>
            </div>

            <div className="mt-[24px] grid gap-4 lg:grid-cols-[240px_1fr]">
              <div className="rounded-[20px] border border-[#E8E8E8] bg-[linear-gradient(180deg,#3F0D5C_0%,#5B2C92_100%)] px-4 py-4 text-white">
                <div className="flex items-center gap-[13px]">
                  <SparklesIcon className="h-5 w-5" />
                  <span className="text-[14px] font-medium">Optimization Status</span>
                </div>
                <h3 className="mt-[18px] text-[16px] font-bold leading-5">
                  {autoResolvePercent >= 70 ? 'High Impact' : autoResolvePercent >= 40 ? 'Medium Impact' : 'Getting Started'}
                </h3>
                <p className="mt-[9px] text-[13px] font-medium leading-5 text-white/95">
                  Your bots have successfully diverted {aiChat.toLocaleString()} human support tickets this month.
                </p>
                <div className="mt-5">
                  <p className="text-[24px] font-bold leading-5">{autoResolvePercent}%</p>
                  <p className="mt-[9px] text-[13px] font-medium leading-5">Overall Auto-Resolve</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard title="AI Chats handled" value={aiChat.toLocaleString()} className="sm:col-span-2" />
                <InfoCard title="Total Chats" value={totalChat.toLocaleString()} />
                <InfoCard title="Avg. Response Time" value="0.4s" />
              </div>
            </div>
          </div>
        </section>

        {/* Live Traffic Map */}
        <section className="rounded-[20px] bg-white p-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]">
          <div>
            <h2 className="text-[18px] font-bold leading-5 text-[#111827]">Live Traffic Map</h2>
            <p className="mt-[6px] text-[13px] leading-5 text-[#64748B]">Geographic distribution of your visitors</p>
          </div>

          <div className="mt-6 flex justify-center">
            <img
              src="https://www.figma.com/api/mcp/asset/5f73df19-1623-45d5-8eae-79d0d562a80a"
              alt="Live traffic map"
              className="h-auto max-h-[198px] w-full max-w-[310px] object-contain"
            />
          </div>

          <div className="mt-4 w-[121px]">
            <img
              src="https://www.figma.com/api/mcp/asset/40620534-f7e4-45a8-befb-25c135ff7d56"
              alt="Traffic map scale"
              className="h-auto w-full object-contain"
            />
          </div>
        </section>
      </main>
    </div>
  )
}

function MetricCardView({ metric }: { metric: MetricCard }) {
  return (
    <div className="rounded-[20px] bg-white p-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-[8px]" style={{ backgroundColor: metric.iconBg }}>
          {metric.icon}
        </div>
        <div className="flex h-[31px] w-[102px] items-start justify-end">{metric.chart}</div>
      </div>

      <div className="mt-[27px] flex items-center gap-[15px]">
        <h3 className="text-[24px] font-bold leading-5 text-[#111827]">{metric.value}</h3>
        {metric.delta ? (
          <span
            className={`rounded-[4px] px-1 py-[2px] text-[12px] font-medium leading-4 ${metric.deltaTone === 'positive'
              ? 'bg-[#ECFDF5] text-[#059669]'
              : 'bg-[#FFF1F2] text-[#E11D48]'
              }`}
          >
            {metric.delta}
          </span>
        ) : null}
      </div>
      <p className="mt-[6px] text-[14px] font-medium leading-5 text-[#64748B]">{metric.title}</p>
    </div>
  )
}

function InfoCard({ title, value, className = '' }: { title: string; value: string; className?: string }) {
  return (
    <div className={`rounded-[20px] border border-[#E8E8E8] bg-white p-[20px] ${className}`}>
      <p className="text-[14px] font-medium leading-5 text-[#64748B]">{title}</p>
      <p className="mt-[14px] text-[24px] font-bold leading-5 text-[#111827]">{value}</p>
    </div>
  )
}

function FlagBadge({ country }: { country: string }) {
  if (country === 'IN') {
    return (
      <span className="inline-flex h-[14px] w-[21px] overflow-hidden rounded-[2px] border border-[#E5E7EB]">
        <span className="h-full w-full bg-[linear-gradient(180deg,#FF9933_0%,#FF9933_33%,#FFFFFF_33%,#FFFFFF_66%,#138808_66%,#138808_100%)]" />
      </span>
    )
  }

  if (country === 'CA') {
    return (
      <span className="inline-flex h-[14px] w-[21px] overflow-hidden rounded-[2px] border border-[#E5E7EB] bg-white">
        <span className="w-[5px] bg-[#FF2D2D]" />
        <span className="w-[11px] bg-white" />
        <span className="w-[5px] bg-[#FF2D2D]" />
      </span>
    )
  }

  // Generic flag fallback - just show country code
  return (
    <span className="inline-flex h-[14px] items-center rounded-[2px] border border-[#E5E7EB] bg-[#F8FAFC] px-1 text-[10px] font-medium text-[#64748B]">
      {country}
    </span>
  )
}

function CheckCircleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 6.89137 17.1086 2.75 12 2.75ZM10.72 15.78L7.47 12.53L8.53 11.47L10.72 13.66L15.47 8.91L16.53 9.97L10.72 15.78Z" />
    </svg>
  )
}

function CircleOutlineIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}


function SparklesIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g clipPath="url(#clip0_2640_733)">
        <path d="M15.833 7.49998L16.8747 5.20831L19.1663 4.16665L16.8747 3.12498L15.833 0.833313L14.7913 3.12498L12.4997 4.16665L14.7913 5.20831L15.833 7.49998ZM9.58301 7.91665L7.49968 3.33331L5.41634 7.91665L0.833008 9.99998L5.41634 12.0833L7.49968 16.6666L9.58301 12.0833L14.1663 9.99998L9.58301 7.91665ZM15.833 12.5L14.7913 14.7916L12.4997 15.8333L14.7913 16.875L15.833 19.1666L16.8747 16.875L19.1663 15.8333L16.8747 14.7916L15.833 12.5Z" fill="white" />
      </g>
      <defs>
        <clipPath id="clip0_2640_733">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function SparklineBlue() {
  return (
    <svg viewBox="0 0 102 31" className="h-[31px] w-[102px]" fill="none" aria-hidden="true">
      <path d="M4 17H18L28 8L40 30L52 21L63 25L76 12L84 17L98 4" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparklineRed() {
  return (
    <svg viewBox="0 0 111 31" className="h-[31px] w-[111px]" fill="none" aria-hidden="true">
      <path d="M4 5L14 7L24 21L34 10L44 29L56 18L66 22L79 7L92 4L105 20" stroke="#F43F5E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
