'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Globe, Check, Loader2, Plus } from 'lucide-react'
import { getAIAgents } from '@/app/_api/dashboard/action'
import { createAIAgentApi } from '@/app/_api/login/action'
import { toast } from 'react-toastify'
import NotificationBell from './NotificationBell'

type Agent = {
  _id: string
  agentName: string
  website_name: string
  isActive: boolean
  dataTrainingStatus: number
}

// Routes where the bar should appear (dashboard has its own integrated header)
const SHOW_ON_PATHS = ['/setup', '/inbox', '/training', '/humanAgent']

export default function AgentSwitcherBar() {
  const pathname = usePathname()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [agents, setAgents] = useState<Agent[]>([])
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  // IDs of AI agents assigned to the logged-in human agent (empty = show all)
  const [assignedAgentIds, setAssignedAgentIds] = useState<string[]>([])

  const shouldShow = SHOW_ON_PATHS.some((p) => pathname === p || pathname?.startsWith(p + '/'))
  const isHumanAgentPage = pathname === '/humanAgent' || pathname?.startsWith('/humanAgent/')

  // Load agents + read current agent from localStorage
  useEffect(() => {
    if (!shouldShow) return

    // Check if a human agent is logged in — they have assignedAgents in their data
    try {
      const agentRaw = localStorage.getItem('agent')
      if (agentRaw) {
        const parsed = JSON.parse(agentRaw)
        if (Array.isArray(parsed?.assignedAgents) && parsed.assignedAgents.length > 0) {
          setAssignedAgentIds(parsed.assignedAgents.map((id: any) => id?.toString()))
        }
      }
    } catch {
      // ignore
    }

    const fetchAgents = async () => {
      setIsLoading(true)
      try {
        const data = await getAIAgents()
        const list: Agent[] = Array.isArray(data) ? data : []
        setAgents(list)
      } catch {
        // silent
      } finally {
        setIsLoading(false)
      }
    }

    const storedId = localStorage.getItem('currentAgentId')
    setCurrentAgentId(storedId)
    fetchAgents()

    // Keep in sync if another part of the app changes the agent
    const handleAgentChanged = (e: CustomEvent) => {
      setCurrentAgentId(e.detail?.agentId ?? localStorage.getItem('currentAgentId'))
    }
    window.addEventListener('agent-changed', handleAgentChanged as EventListener)
    return () => window.removeEventListener('agent-changed', handleAgentChanged as EventListener)
  }, [shouldShow])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!shouldShow) return null

  // On /humanAgent, if a human agent is logged in, restrict the list to their assigned agents
  const visibleAgents =
    isHumanAgentPage && assignedAgentIds.length > 0
      ? agents.filter((a) => assignedAgentIds.includes(a._id))
      : agents

  const currentAgent = visibleAgents.find((a) => a._id === currentAgentId)
    ?? agents.find((a) => a._id === currentAgentId) // fallback: still show name even if filtered out
  const displayName = currentAgent
    ? currentAgent.agentName || currentAgent.website_name || 'Unnamed Agent'
    : currentAgentId
    ? 'Loading...'
    : 'No agent selected'

  const handleSwitch = (agentId: string) => {
    if (agentId === currentAgentId) { setIsOpen(false); return }
    localStorage.setItem('currentAgentId', agentId)
    setCurrentAgentId(agentId)
    window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId } }))
    setIsOpen(false)
    toast.success(`Switched to ${agents.find((a) => a._id === agentId)?.agentName || 'agent'}`)
  }

  const handleNewAgent = async () => {
    if (isCreating) return
    setIsOpen(false)
    setIsCreating(true)
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
      window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId: newAgentId } }))
      router.push('/website/new')
    } catch {
      toast.error('Failed to create agent. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center gap-3">
      {/* Label */}
      <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide shrink-0">
        Active Agent
      </span>


      {/* Divider */}
      <span className="w-px h-4 bg-gray-200 shrink-0" />

      {/* Dropdown trigger */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-[#F9F9F9] hover:bg-gray-100 transition-colors text-sm font-medium text-[#111827] min-w-[200px] max-w-xs"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#64748B] shrink-0" />
          ) : (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#EEF2FF]">
              <Globe className="w-3 h-3 text-[#4B56F2]" />
            </div>
          )}

          <span className="flex-1 text-left truncate">{displayName}</span>

          {/* Training indicator */}
          {currentAgent?.dataTrainingStatus === 1 && (
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse inline-block" />
              Training
            </span>
          )}

          <ChevronDown
            className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            {/* Agent list */}
            <div className="max-h-60 overflow-y-auto py-1">
              {visibleAgents.length === 0 && !isLoading && (
                <p className="px-4 py-3 text-sm text-[#64748B] text-center">No agents found</p>
              )}
              {visibleAgents.map((agent) => {
                const name = agent.agentName || agent.website_name || 'Unnamed Agent'
                const isSelected = agent._id === currentAgentId
                return (
                  <button
                    key={agent._id}
                    onClick={() => handleSwitch(agent._id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-[#EEF2FF]' : ''
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF]">
                      <Globe className="w-4 h-4 text-[#4B56F2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827] truncate">{name}</p>
                      {agent.website_name && agent.agentName && agent.agentName !== agent.website_name && (
                        <p className="text-xs text-[#94A3B8] truncate">{agent.website_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {agent.dataTrainingStatus === 1 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
                      )}
                      {isSelected && <Check className="w-4 h-4 text-[#4B56F2]" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer: New agent — hidden on human agent panel */}
            {!isHumanAgentPage && (
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={handleNewAgent}
                  disabled={isCreating}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[#111827] hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isCreating ? 'Creating...' : 'New AI agent'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick status pill */}
      {!isLoading && currentAgent && (
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            currentAgent.dataTrainingStatus === 1
              ? 'bg-[#FFFBEB] text-[#D97706]'
              : currentAgent.isActive
              ? 'bg-[#ECFDF5] text-[#059669]'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {currentAgent.dataTrainingStatus === 1
            ? 'Training...'
            : currentAgent.isActive
            ? 'Active'
            : 'Inactive'}
        </span>
      )}

      {/* Spacer pushes notification bell to the right */}
      <div className="flex-1" />

      {/* Notification Bell */}
      <NotificationBell />
    </div>
  )
}
