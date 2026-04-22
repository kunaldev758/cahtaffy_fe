'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { getAIAgents } from '@/app/_api/dashboard/action'
import { toggleWidgetStatusApi } from '@/app/_api/dashboard/action'
import { deleteAIAgentApi, createAIAgentApi } from '@/app/_api/login/action'
import TopHead from '../_components/TopHead'
import LottieAnimation from '../_components/LottieAnimation'
import { usePlanContext } from '@/app/planContext'

type Agent = {
  _id: string
  website_name: string
  agentName: string
  isActive: boolean
  lastTrained: string | null
  dataTrainingStatus: number
  pagesAdded: { success: number; failed: number; total: number } | null
  filesAdded: number
  faqsAdded: number
  currentDataSize: number
  widgetIsActive: number
}

// Deterministic gradient palette based on agent index
const CARD_GRADIENTS = [
  'from-[#3b4fc4] via-[#6b3fa0] to-[#c43b6b]',
  'from-[#0fa87e] via-[#0d9488] to-[#0284c7]',
  'from-[#7c3aed] via-[#a855f7] to-[#ec4899]',
  'from-[#16a34a] via-[#15803d] to-[#065f46]',
  'from-[#ea580c] via-[#dc2626] to-[#9f1239]',
  'from-[#0369a1] via-[#1d4ed8] to-[#4f46e5]',
]

function CardBanner({ index }: { index: number }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  return (
    <div className={`relative h-[190px] rounded-t-2xl bg-gradient-to-br ${gradient} flex items-end justify-center overflow-hidden`}>
      {/* Browser mockup */}
      <div className="w-48 h-32 bg-white/70 rounded-tl-[20px] rounded-tr-[20px] outline outline-1 outline-offset-[-1px] outline-white/30 inline-flex flex-col justify-start items-start">
        <div className="w-48 p-2 rounded-tl-[20px] rounded-tr-[20px] border-b border-white/20 inline-flex justify-start items-center gap-2">
          <div className={`h-4 w-4 rounded-full bg-gradient-to-br ${gradient}`} />
          <div className="w-24 h-2 bg-indigo-900/10 rounded-[100px]" />
        </div>
        <div className="w-48 flex-1 relative border-t border-neutral-200">
          <div className={`w-28 h-3 left-[12px] top-[15.28px] absolute bg-gradient-to-br ${gradient} rounded-[100px]`} />
          <div className="w-24 h-3 left-[88px] top-[39.28px] absolute bg-white/40 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function formatLastTrained(
  lastTrained: string | null
): { label: string; isRecent: boolean } {
  if (!lastTrained) {
    return { label: "NOT TRAINED YET", isRecent: false };
  }

  const diff = Date.now() - new Date(lastTrained).getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return { label: "Last trained just now", isRecent: true };
  }
  if (minutes < 60) {
    return {
      label: `Last trained ${minutes} minute${minutes !== 1 ? "s" : ""} ago`,
      isRecent: true,
    };
  }
  if (hours < 24) {
    return {
      label: `Last trained ${hours} hour${hours !== 1 ? "s" : ""} ago`,
      isRecent: true,
    };
  }
  return {
    label: `LAST TRAINED ${days} DAY${days !== 1 ? "S" : ""} AGO`,
    isRecent: false,
  };
}

export default function WebsitePage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { effectiveLimits } = usePlanContext()

  useEffect(() => {
    const cleanupOrphan = async () => {
      const previousAgentId = localStorage.getItem('previousAgentId')
      const currentAgentId = localStorage.getItem('currentAgentId')
      if (previousAgentId !== null) {
        if (currentAgentId) {
          try { await deleteAIAgentApi(currentAgentId) } catch { /* best-effort */ }
        }
        if (previousAgentId) {
          localStorage.setItem('currentAgentId', previousAgentId)
        } else {
          localStorage.removeItem('currentAgentId')
        }
        localStorage.removeItem('previousAgentId')
        window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId: previousAgentId || null } }))
      }
    }

    const fetchAgents = async () => {
      setIsLoading(true)
      await cleanupOrphan()
      try {
        const data = await getAIAgents()
        setAgents(Array.isArray(data) ? data : [])
        if(data.length > 0) {
          window.localStorage.setItem('agents', JSON.stringify(data))
        }
      } catch {
        toast.error('Failed to load agents')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [])

  const handleNewAgent = async () => {
    const maxAgentsPerAccount = Number(effectiveLimits?.maxAgentsPerAccount)
    if (Number.isFinite(maxAgentsPerAccount) && maxAgentsPerAccount > 0 && agents.length >= maxAgentsPerAccount) {
      toast.error('You have reached the maximum number of websites allowed for your plan.')
      return
    }

    if (isCreatingAgent) return
    setIsCreatingAgent(true)
    try {
      const res = await createAIAgentApi()
      if (!res?.status || !res?.agent?._id) {
        toast.error(res?.message || 'Failed to create agent')
        return
      }
      const newAgentId = res.agent._id
      const previousAgentId = localStorage.getItem('currentAgentId') ?? ''
      localStorage.setItem('previousAgentId', previousAgentId)
      localStorage.setItem('currentAgentId', newAgentId)
      router.push('/website/new')
    } catch {
      toast.error('Failed to create agent. Please try again.')
    } finally {
      setIsCreatingAgent(false)
    }
  }

  const handleDelete = async (agentId: string) => {
    setDeletingId(agentId)
    setConfirmDeleteId(null)
    try {
      const res = await deleteAIAgentApi(agentId)
      if (!res?.status) {
        toast.error(res?.message || 'Failed to delete agent')
        return
      }
      // Remove from localStorage if it was the active agent
      const currentAgentId = localStorage.getItem('currentAgentId')
      if (currentAgentId === agentId) {
        localStorage.removeItem('currentAgentId')
        window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId: null } }))
      }
      setAgents(prev => prev.filter(a => a._id !== agentId))
      localStorage.setItem('agents', JSON.stringify(agents.filter(a => a._id !== agentId) || []))
      toast.success('Agent deleted successfully')
    } catch {
      toast.error('Failed to delete agent')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleWidget = async (agent: Agent) => {
    if (togglingId === agent._id) return
    const newStatus = agent.widgetIsActive === 1 ? 0 : 1
    setTogglingId(agent._id)
    // Optimistic update
    setAgents(prev => prev.map(a => a._id === agent._id ? { ...a, widgetIsActive: newStatus } : a))
    try {
      const res = await toggleWidgetStatusApi(agent._id, newStatus === 1)
      if (!res?.status) {
        // Revert on failure
        setAgents(prev => prev.map(a => a._id === agent._id ? { ...a, widgetIsActive: agent.widgetIsActive } : a))
        toast.error(res?.message || 'Failed to update widget status')
      }
    } catch {
      setAgents(prev => prev.map(a => a._id === agent._id ? { ...a, widgetIsActive: agent.widgetIsActive } : a))
      toast.error('Failed to update widget status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleEditTraining = (agentId: string) => {
    localStorage.setItem('currentAgentId', agentId)
    window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId } }))
    router.push('/training')
  }

  // if (isLoading) {
  //   return (
  //     <div className="bg-[#F3F4F6] flex items-center justify-center h-screen">
  //       <div
  //         className="flex items-center justify-center"
  //         aria-label="Loading"
  //         role="status"
  //       >
  //         <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#111827]" />
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <>
      <div className="min-h-screen w-full bg-[#F8F9FA]">
        <TopHead
          title="Website"
          subtitle="Manage your websites"
          showDatePicker={false}
          showWebsiteSelect={false}
          showNotificationBell={false}
          showStatusBadge={false}
          rightContent={(
            <button
              onClick={handleNewAgent}
              disabled={isCreatingAgent}
              className="flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreatingAgent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isCreatingAgent ? 'Creating...' : 'Add New Website'}
            </button>
          )}
        />

        <div className="rounded-tl-[30px] bg-[#F3F4F6] px-4 pb-[33px] pt-6 lg:px-6 flex flex-col gap-6 h-[calc(100%-89px)]">

          {/* Empty state */}
          {/* {agents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF2FF] mb-4">
                <Plus className="w-8 h-8 text-[#4B56F2]" />
              </div>
              <h2 className="text-lg font-semibold text-[#111827] mb-1">No agents yet</h2>
              <p className="text-sm text-[#64748B] mb-6 text-center max-w-xs">
                Create your first AI agent and train it with your website content.
              </p>
              <button
                onClick={handleNewAgent}
                disabled={isCreatingAgent}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#111827] text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-70"
              >
                {isCreatingAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isCreatingAgent ? 'Creating...' : 'Create your first agent'}
              </button>
            </div>
          )} */}

          {/* Agent grid */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div
                className="flex items-center justify-center"
                aria-label="Loading"
                role="status"
              >
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#111827]" />
              </div>
            </div>
          ) : null}

          {!isLoading && agents.length > 0 && (
            <div className="grid gap-[24px] sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent, index) => {
                const name = agent.agentName || agent.website_name || 'Unnamed Agent'
                const isOnline = agent.widgetIsActive === 1
                const { label: trainedLabel, isRecent } = formatLastTrained(agent.lastTrained)
                const isDeleting = deletingId === agent._id
                const isConfirming = confirmDeleteId === agent._id

                return (
                  <div
                    key={agent._id}
                    className="overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md"
                  >
                    {/* Gradient banner */}
                    <CardBanner index={index} />

                    {/* Card body */}
                    <div>
                      {/* Name row */}
                      <div className="flex items-center justify-between gap-2 p-[20px]">
                        <div className='flex flex-col gap-[8px]'>
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="truncate text-[16px] font-bold text-[#111827] max-w-[170px]">{name}</p>
                            <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-[#FF6D6D]'}`} />
                          </div>

                          {/* Last trained badge */}
                          <div>
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${isRecent
                              ? 'bg-[#ECFDF5] text-[#059669]'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                              }`}>
                              {trainedLabel}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleEditTraining(agent._id)}
                            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#64748B] transition-colors hover:bg-gray-50 hover:text-[#374151]"
                            title="Edit / Training"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {agents.length > 1 && (
                            isConfirming ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(agent._id)}
                                  disabled={isDeleting}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-70"
                                >
                                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(agent._id)}
                                disabled={isDeleting}
                                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#F87171] transition-colors hover:bg-red-50 hover:text-[#EF4444] disabled:opacity-50"
                                title="Delete agent"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-[#EF4444]" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-[#F87171]" />
                                )}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Widget status toggle */}
                      <div className="flex items-center justify-between border-t border-gray-100 px-[20px] py-[16px]">
                        <span className="text-[13px] font-semibold text-[#111827]">Widget Status</span>
                        <button
                          onClick={() => handleToggleWidget(agent)}
                          disabled={togglingId === agent._id}
                          role="switch"
                          aria-checked={isOnline}
                          className={`relative inline-flex h-7 min-w-[86px] items-center rounded-[8px] px-2.5 text-[12px] font-semibold transition-colors duration-300 ${isOnline
                            ? 'bg-[#34D399] hover:bg-[#10B981]'
                            : 'bg-[#E5E7EB] hover:bg-[#D1D5DB]'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {togglingId === agent._id ? (
                            <span className="flex w-full items-center justify-center">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                            </span>
                          ) : (
                            <span className={`flex w-full items-center transition-all duration-300 ${isOnline ? 'justify-between' : 'justify-between flex-row-reverse'}`}>
                              <span className={`${isOnline ? 'text-white' : 'text-[#94A3B8]'}`}>{isOnline ? 'Online' : 'Offline'}</span>
                              <span className={`inline-block h-4 w-4 rounded-[4px] transition-all duration-300 ${isOnline ? 'bg-white' : 'bg-[#F8FAFC]'}`} />
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
