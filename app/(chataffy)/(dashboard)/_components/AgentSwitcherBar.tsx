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

function initialsFromDisplayName(name: string): string {
  const t = name.trim()
  if (!t || t === 'Loading...' || t === 'No agent selected') return '?'
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return t.slice(0, 2).toUpperCase()
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

  const triggerInitials = initialsFromDisplayName(displayName)

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
      <span className="hidden text-xs font-semibold uppercase tracking-wide text-[#94A3B8] sm:inline">
        Active Agent
      </span>

      <span className="hidden h-4 w-px bg-[#D1D5DB] sm:block" />

      {/* Dropdown trigger */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex max-w-[min(280px,42vw)] min-w-[180px] items-center gap-2.5 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-medium text-[#111827] shadow-sm transition-colors hover:border-[#B8C0CC] hover:bg-[#FAFBFC] sm:min-w-[220px]"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#64748B]" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[11px] font-bold text-[#4338CA]">
              {triggerInitials}
            </div>
          )}

          <span className="min-w-0 flex-1 truncate text-left">{displayName}</span>

          {/* Training indicator */}
          {currentAgent?.dataTrainingStatus === 1 && (
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse inline-block" />
              Training
            </span>
          )}

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
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
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            currentAgent.dataTrainingStatus === 1
              ? 'bg-[#FFFBEB] text-[#D97706]'
              : currentAgent.isActive
              ? 'bg-[#ECFDF5] text-[#15803D]'
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

      <NotificationBell badgeStyle="dot" />
      </div>
    </div>
  )
}
