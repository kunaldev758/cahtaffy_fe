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
const HIDE_ON_PATHS = ['/setup/training', '/training']

type PageHeading = { title: string; subtitle?: string }

/** Longest-prefix match: page title + subtitle on the left of the top bar */
const PAGE_HEADINGS: Record<string, PageHeading> = {
  '/setup/widget': {
    title: 'Agent Management',
    subtitle:
      'Give your AI assistant a unique personality and style. You can always refine it later in settings.',
  },
  '/setup/training': {
    title: 'Agent training',
    subtitle: 'Manage pages, documents, and FAQs your agent learns from.',
  },
  '/training': {
    title: 'Agent training',
    subtitle: 'Manage pages, documents, and FAQs your agent learns from.',
  },
  '/inbox': {
    title: 'Inbox',
    subtitle: 'Manage your inbox.',
  },
  '/humanAgent': {
    title: 'Human Agent Management',
    subtitle: 'Manage human agents and assign them to websites (AI agents)',
  },
}

function pageHeadingForPath(pathname: string | null): PageHeading | null {
  if (!pathname) return null
  const keys = Object.keys(PAGE_HEADINGS).sort((a, b) => b.length - a.length)
  for (const prefix of keys) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return PAGE_HEADINGS[prefix]
    }
  }
  return null
}

function getInitials(name: string): string {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

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

  const isHiddenPath = HIDE_ON_PATHS.some((p) => pathname === p || pathname?.startsWith(p + '/'))
  const shouldShow = !isHiddenPath && SHOW_ON_PATHS.some((p) => pathname === p || pathname?.startsWith(p + '/'))
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

  const pageHeading = pageHeadingForPath(pathname ?? null)

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

  const triggerInitials = getInitials(displayName)

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
    <div className="flex items-center justify-between gap-6 border-b border-[#E8ECF0] bg-[#F8F9FB] px-5 py-3 md:px-6">
      {/* Page title (setup pages) */}
      <div className="min-w-0 flex-1">
        {pageHeading ? (
          <>
            <h1 className="text-[17px] font-bold leading-tight tracking-tight text-[#0F172A] md:text-lg">
              {pageHeading.title}
            </h1>
            {pageHeading.subtitle ? (
              <p className="mt-0.5 max-w-2xl text-[13px] leading-snug text-[#64748B]">
                {pageHeading.subtitle}
              </p>
            ) : null}
          </>
        ) : (
          <div className="h-px w-px shrink-0 overflow-hidden" aria-hidden />
        )}
      </div>

      {/* Agent switcher + notifications */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex h-[40px] min-w-[200px] items-center gap-[9px] rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] text-[#111827]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#64748B] shrink-0" />
            ) : (
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[10px] font-bold text-[#4B56F2]">
                {triggerInitials || <Globe className="h-3 w-3" />}
              </span>
            )}
            <span className="flex-1 truncate text-left">{displayName}</span>
            {currentAgent?.dataTrainingStatus === 1 && (
              <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />
            )}
            <ChevronDown className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[250px]">
              <div className="overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] p-[10px]">
                <div className="max-h-[min(16rem,50vh)] overflow-y-auto">
                  {visibleAgents.length === 0 && !isLoading && (
                    <p className="py-6 text-center text-[13px] text-[#64748B]">No websites found</p>
                  )}
                  <ul className="flex flex-col gap-1.5">
                    {visibleAgents.map((agent) => {
                      const rowLabel = agent.website_name || agent.agentName || 'Unnamed Agent'
                      const isSelected = agent._id === currentAgentId
                      const initials = getInitials(rowLabel.replace(/^https?:\/\//i, '').split('/')[0] || rowLabel)
                      return (
                        <li key={agent._id}>
                          <button
                            type="button"
                            onClick={() => handleSwitch(agent._id)}
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

                {!isHumanAgentPage && (
                  <button
                    type="button"
                    onClick={handleNewAgent}
                    disabled={isCreating}
                    className="mt-1.5 flex h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-[#111827] text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1f2937] disabled:opacity-60"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 text-white" strokeWidth={2.25} />
                    )}
                    {isCreating ? 'Creating...' : 'Add Website'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <NotificationBell badgeStyle="dot" />
      </div>
    </div>
  )
}
