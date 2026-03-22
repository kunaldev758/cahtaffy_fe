'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import NotificationBell from '@/app/(chataffy)/(dashboard)/_components/NotificationBell'
import { toast } from 'react-toastify'
import { getAIAgents } from '@/app/_api/dashboard/action'
import { toggleWidgetStatusApi } from '@/app/_api/dashboard/action'
import { deleteAIAgentApi, createAIAgentApi } from '@/app/_api/login/action'

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
    <div className={`relative h-[140px] rounded-t-2xl bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
      {/* Browser mockup */}
      <div className="bg-white/20 backdrop-blur-sm rounded-xl w-[130px] p-2 shadow-lg">
        <div className="flex items-center gap-1 mb-1.5 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
          <span className="w-16 h-1.5 rounded-full bg-white/40" />
        </div>
        <div className="space-y-1.5 px-1">
          <div className="h-1.5 rounded-full bg-white/50 w-full" />
          <div className="h-1.5 rounded-full bg-white/40 w-4/5" />
          <div className="h-4 rounded bg-white/30 w-full mt-2" />
        </div>
      </div>
    </div>
  )
}

function formatLastTrained(lastTrained: string | null): { label: string; isRecent: boolean } {
  if (!lastTrained) return { label: 'NOT TRAINED YET', isRecent: false }
  const diff = Date.now() - new Date(lastTrained).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 24) return { label: `Last trained ${hours <= 1 ? '1 hour' : `${hours} hours`} ago`, isRecent: true }
  return { label: `LAST TRAINED ${days} DAY${days !== 1 ? 'S' : ''} AGO`, isRecent: false }
}

export default function WebsitePage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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
      } catch {
        toast.error('Failed to load agents')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [])

  const handleNewAgent = async () => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#111827]" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Agents</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {agents.length === 0 ? 'No agents yet. Create your first one.' : 'Manage your AI agents'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewAgent}
            disabled={isCreatingAgent}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111827] text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isCreatingAgent ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isCreatingAgent ? 'Creating...' : 'Add New Website'}
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* Empty state */}
      {agents.length === 0 && (
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
      )}

      {/* Agent grid */}
      {agents.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, index) => {
            const name = agent.agentName || agent.website_name || 'Unnamed Agent'
            const isOnline = agent.widgetIsActive === 1
            const { label: trainedLabel, isRecent } = formatLastTrained(agent.lastTrained)
            const isDeleting = deletingId === agent._id
            const isConfirming = confirmDeleteId === agent._id

            return (
              <div
                key={agent._id}
                className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Gradient banner */}
                <CardBanner index={index} />

                {/* Card body */}
                <div className="p-4">
                  {/* Name row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                      <p className="text-sm font-bold text-[#111827] truncate">{name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditTraining(agent._id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit / Training"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#64748B]" />
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
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete agent"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Last trained badge */}
                  <div className="mb-3">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isRecent
                        ? 'bg-[#ECFDF5] text-[#059669]'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      {trainedLabel}
                    </span>
                  </div>

                  {/* Widget status toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-[#64748B] font-medium">Widget Status</span>
                    <button
                      onClick={() => handleToggleWidget(agent)}
                      disabled={togglingId === agent._id}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isOnline
                          ? 'bg-[#22c55e] text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {togglingId === agent._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-gray-400'}`} />
                      )}
                      {isOnline ? 'Online' : 'Offline'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
