'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe, Check, Loader2, Circle } from 'lucide-react'
import { getAIAgents } from '@/app/_api/dashboard/action'
import NotificationBell from '@/app/(chataffy)/(dashboard)/_components/NotificationBell'
import Image from 'next/image'

type AIAgent = {
  _id: string
  agentName: string
  website_name: string
  isActive: boolean
  dataTrainingStatus: number
}

type HumanAgent = {
  id: string
  name: string
  email: string
  isActive: boolean
  assignedAgents?: string[]
}

export default function AgentTopBar() {
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [humanAgent, setHumanAgent] = useState<HumanAgent | null>(null)
  const [allAgents, setAllAgents] = useState<AIAgent[]>([])
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Read human agent from localStorage
    try {
      const raw = localStorage.getItem('agent')
      if (raw) setHumanAgent(JSON.parse(raw))
    } catch { }

    setCurrentAgentId(localStorage.getItem('currentAgentId'))

    // Fetch all AI agents then filter to assigned ones
    const fetchAgents = async () => {
      setIsLoading(true)
      try {
        const data = await getAIAgents()
        setAllAgents(Array.isArray(data) ? data : [])
      } catch { }
      finally { setIsLoading(false) }
    }
    fetchAgents()

    // Stay in sync with other parts of the app
    const handleAgentChanged = (e: CustomEvent) => {
      setCurrentAgentId(e.detail?.agentId ?? localStorage.getItem('currentAgentId'))
    }
    const handleAgentStatusUpdate = () => {
      try {
        const raw = localStorage.getItem('agent')
        if (raw) setHumanAgent(JSON.parse(raw))
      } catch { }
    }

    window.addEventListener('agent-changed', handleAgentChanged as EventListener)
    window.addEventListener('agent-status-updated', handleAgentStatusUpdate)
    return () => {
      window.removeEventListener('agent-changed', handleAgentChanged as EventListener)
      window.removeEventListener('agent-status-updated', handleAgentStatusUpdate)
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Only show agents assigned to this human agent
  const assignedIds = humanAgent?.assignedAgents?.map((id: any) => id?.toString()) ?? []
  const visibleAgents =
    assignedIds.length > 0
      ? allAgents.filter((a) => assignedIds.includes(a._id))
      : allAgents

  const currentAgent = visibleAgents.find((a) => a._id === currentAgentId)
    ?? allAgents.find((a) => a._id === currentAgentId)

  const displayName = currentAgent
    ? currentAgent.agentName || currentAgent.website_name || 'Unnamed Agent'
    : isLoading
      ? 'Loading...'
      : 'No agent selected'

  const handleSwitch = (agentId: string) => {
    if (agentId === currentAgentId) { setIsOpen(false); return }
    localStorage.setItem('currentAgentId', agentId)
    setCurrentAgentId(agentId)
    window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId } }))
    setIsOpen(false)
  }

  return (
    <div className="flex flex-col gap-5 bg-[#F9F9F9] px-[24px] lg:flex-row lg:items-center lg:justify-between">
      {/* Agent switcher */}
      <div className='flex items-center gap-[20px]'>
        <div className='border-r border-[#E8E8E8] pr-[20px] py-[20px]'>
          <Image
            src="/images/agent-logo.svg"
            alt="Agent Logo"
            width={123}
            height={46}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-[14px]">
            <h1 className="text-[24px] font-bold leading-5 text-[#111827]">Inbox</h1>
          </div>
          <p className="text-[13px] leading-5 text-[#64748B]">View and respond to messages from your customers.</p>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen((p) => !p)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-[#F9F9F9] hover:bg-gray-100 transition-colors text-sm font-medium text-[#111827] min-w-[180px] max-w-xs"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#64748B] shrink-0" />
          ) : (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#EEF2FF]">
              <Globe className="w-3 h-3 text-[#4B56F2]" />
            </div>
          )}
          <span className="flex-1 text-left truncate">{displayName}</span>
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

        {isOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto py-1">
              {visibleAgents.length === 0 && !isLoading && (
                <p className="px-4 py-3 text-sm text-[#64748B] text-center">No assigned agents</p>
              )}
              {visibleAgents.map((agent) => {
                const name = agent.agentName || agent.website_name || 'Unnamed Agent'
                const isSelected = agent._id === currentAgentId
                return (
                  <button
                    key={agent._id}
                    onClick={() => handleSwitch(agent._id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-[#EEF2FF]' : ''}`}
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
          </div>
        )}
      </div>

      {/* Status pill for current agent */}
      {!isLoading && currentAgent && (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${currentAgent.dataTrainingStatus === 1
          ? 'bg-[#FFFBEB] text-[#D97706]'
          : currentAgent.isActive
            ? 'bg-[#ECFDF5] text-[#059669]'
            : 'bg-gray-100 text-gray-500'
          }`}>
          {currentAgent.dataTrainingStatus === 1 ? 'Training...' : currentAgent.isActive ? 'Active' : 'Inactive'}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notification Bell */}
      <NotificationBell />

      {/* Human agent info */}
      {humanAgent && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-px h-4 bg-gray-200" />
          <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <Circle
              className={`w-2 h-2 fill-current ${humanAgent.isActive ? 'text-[#22C55E]' : 'text-[#94A3B8]'}`}
            />
            {humanAgent.isActive ? 'Online' : 'Offline'}
          </span>
          <span className="w-px h-4 bg-gray-200" />
          <span className="text-sm font-medium text-[#111827]">{humanAgent.name}</span>
        </div>
      )}
    </div>
  )
}
