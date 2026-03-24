'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Globe, Loader2, Plus } from 'lucide-react'
import { getAIAgents } from '@/app/_api/dashboard/action'
import { createAIAgentApi } from '@/app/_api/login/action'
import { toast } from 'react-toastify'

type Agent = {
  _id: string
  agentName: string
  website_name: string
  isActive: boolean
  dataTrainingStatus: number
}

const getInitials = (name: string) => {
  if (!name) return '??'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function WebsiteSelect() {
  const router = useRouter()

  const [agents, setAgents] = useState<Agent[]>([])
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false)
  const [isAgentLoading, setIsAgentLoading] = useState(true)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)
  const agentDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedId = localStorage.getItem('currentAgentId')
    setCurrentAgentId(storedId)

    const handleAgentChanged = (e: Event) => {
      const id = (e as CustomEvent).detail?.agentId ?? localStorage.getItem('currentAgentId')
      setCurrentAgentId(id)
    }
    window.addEventListener('agent-changed', handleAgentChanged)

    ;(async () => {
      setIsAgentLoading(true)
      try {
        const data = await getAIAgents()
        setAgents(Array.isArray(data) ? data : [])
      } catch {
        // silent
      } finally {
        setIsAgentLoading(false)
      }
    })()

    return () => window.removeEventListener('agent-changed', handleAgentChanged)
  }, [])

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
    if (agentId === currentAgentId) {
      setIsAgentDropdownOpen(false)
      return
    }
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
      if (!res?.status || !res?.agent?._id) {
        toast.error(res?.message || 'Failed to create agent')
        return
      }
      const newAgentId = res.agent._id
      localStorage.setItem('previousAgentId', localStorage.getItem('currentAgentId') ?? '')
      localStorage.setItem('currentAgentId', newAgentId)
      window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId: newAgentId } }))
      router.push('/website/new')
    } catch {
      toast.error('Failed to create agent. Please try again.')
    } finally {
      setIsCreatingAgent(false)
    }
  }

  const currentAgent = agents.find((a) => a._id === currentAgentId)
  const agentDisplayName = currentAgent
    ? currentAgent.agentName || currentAgent.website_name || 'Unnamed Agent'
    : currentAgentId
      ? 'Loading...'
      : 'No agent'
  const agentInitials = agentDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('')

  return (
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
        <div className="absolute right-0 top-full z-50 mt-2 w-[250px]">
          <div className="overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white p-[10px] shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            <div className="max-h-[min(16rem,50vh)] overflow-y-auto">
              {agents.length === 0 && !isAgentLoading && (
                <p className="py-6 text-center text-[13px] text-[#64748B]">No websites found</p>
              )}
              <ul className="flex flex-col gap-1.5">
                {agents.map((agent) => {
                  const rowLabel = agent.website_name || agent.agentName || 'Unnamed Agent'
                  const isSelected = agent._id === currentAgentId
                  const initials = getInitials(rowLabel.replace(/^https?:\/\//i, '').split('/')[0] || rowLabel)
                  return (
                    <li key={agent._id}>
                      <button
                        type="button"
                        onClick={() => handleSwitchAgent(agent._id)}
                        className="flex w-full items-center gap-2 rounded-lg py-1.5 text-left"
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#BFDBFE] bg-white text-[10px] font-bold text-[#1E3A8A]">
                          {initials === '??' ? <Globe className="h-4 w-4 text-[#4B56F2]" /> : initials}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#0F172A]">
                          {rowLabel}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {agent.dataTrainingStatus === 1 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" title="Training" />
                          )}
                          {isSelected && <Check className="h-4 w-4 text-[#4B56F2]" aria-hidden />}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
            <button
              type="button"
              onClick={handleNewAgent}
              disabled={isCreatingAgent}
              className="mt-1.5 flex h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-[#111827] text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1f2937] disabled:opacity-60"
            >
              {isCreatingAgent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 text-white" strokeWidth={2.25} />
              )}
              {isCreatingAgent ? 'Creating...' : 'Add Website'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
