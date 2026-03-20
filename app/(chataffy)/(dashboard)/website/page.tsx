'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, FileText, HelpCircle, Layers, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { getAIAgents } from '@/app/_api/dashboard/action'
import { deleteAIAgentApi, createAIAgentApi } from '@/app/_api/login/action'

type Agent = {
  _id: string
  website_name: string
  agentName: string
  isActive: boolean
  lastTrained: string | null
  dataTrainingStatus: number  // 0 = idle, 1 = running
  pagesAdded: { success: number; failed: number; total: number } | null
  filesAdded: number
  faqsAdded: number
  currentDataSize: number
}

export default function WebsitePage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)

  useEffect(() => {
    const cleanupOrphan = async () => {
      // If previousAgentId exists, a prior onboarding session was abandoned (e.g. browser closed)
      // Silently delete the orphaned agent and restore the previous one
      const previousAgentId = localStorage.getItem('previousAgentId')
      const currentAgentId = localStorage.getItem('currentAgentId')
      if (previousAgentId !== null) {
        if (currentAgentId) {
          try {
            await deleteAIAgentApi(currentAgentId)
          } catch {
            // best-effort
          }
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

  const handleSelectAgent = (agentId: string) => {
    localStorage.setItem('currentAgentId', agentId)
    window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId } }))
    router.push('/dashboard')
  }

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

  const getStatusBadge = (status: number, isActive: boolean, agent: Agent) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-500">
          <XCircle className="w-3 h-3" />
          Inactive
        </span>
      )
    }
    if (status === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706]">
          <Loader2 className="w-3 h-3 animate-spin" />
          Training
        </span>
      )
    }
    const hasPagesData = (agent.pagesAdded?.total ?? 0) > 0
    const hasOtherData = (agent.filesAdded ?? 0) > 0 || (agent.faqsAdded ?? 0) > 0
    if (hasPagesData || hasOtherData) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#ECFDF5] text-[#059669]">
          <CheckCircle className="w-3 h-3" />
          Trained
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F1F5F9] text-[#64748B]">
        Not trained
      </span>
    )
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">AI Agents</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {agents.length === 0
              ? 'No agents yet. Create your first one.'
              : `${agents.length} agent${agents.length !== 1 ? 's' : ''} configured`}
          </p>
        </div>
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
          {isCreatingAgent ? 'Creating...' : 'New AI agent'}
        </button>
      </div>

      {/* Empty state */}
      {agents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF2FF] mb-4">
            <Globe className="w-8 h-8 text-[#4B56F2]" />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const name = agent.agentName || agent.website_name || 'Unnamed Agent'
            return (
              <button
                key={agent._id}
                onClick={() => handleSelectAgent(agent._id)}
                className="group text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-[#4686FE] hover:shadow-md transition-all duration-200"
              >
                {/* Icon + name row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF]">
                      <Globe className="w-5 h-5 text-[#4B56F2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate leading-tight">{name}</p>
                      {agent.website_name && agent.agentName && agent.agentName !== agent.website_name && (
                        <p className="text-xs text-[#64748B] truncate mt-0.5">{agent.website_name}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(agent.dataTrainingStatus, agent.isActive, agent)}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {agent.pagesAdded?.total ?? 0} pages
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {agent.filesAdded ?? 0} files
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    {agent.faqsAdded ?? 0} FAQs
                  </span>
                </div>

                {agent.lastTrained && (
                  <p className="mt-3 text-[11px] text-[#94A3B8]">
                    Last trained {new Date(agent.lastTrained).toLocaleDateString()}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-[#64748B]">
                    <Layers className="w-3.5 h-3.5" />
                    {((agent.currentDataSize ?? 0) / 1024).toFixed(1)} KB
                  </span>
                  <span className="text-xs font-medium text-[#4686FE] opacity-0 group-hover:opacity-100 transition-opacity">
                    Open →
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
