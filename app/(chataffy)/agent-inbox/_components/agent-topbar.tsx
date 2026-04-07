'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronDown, Globe, Check, Loader2 } from 'lucide-react'
import { getAIAgents, logoutApi, toggleActiveStatus } from '@/app/_api/dashboard/action'
import { dispatchAuthStorageSync } from '@/app/socketContext'
import NotificationBell from '@/app/(chataffy)/(dashboard)/_components/NotificationBell'
import AgentEditProfileModal, { type AgentEditProfileAgent } from './AgentEditProfileModal'
import defaultImageImport from '@/images/default-image.png'
import { publicAsset } from '@/lib/publicAsset'

const defaultImage = (defaultImageImport as any).src || defaultImageImport

function avatarSrc(path: string | null | undefined) {
  if (!path || path === 'null' || !String(path).trim()) return null
  const p = String(path)
  if (p.startsWith('http')) return p
  const base =
    process.env.NEXT_PUBLIC_API_HOST ||
    process.env.NEXT_PUBLIC_FILE_HOST ||
    'http://localhost:9001'
  return `${base}${p}`
}

function HumanMenuAvatar({
  avatarUrl,
  displayName,
  sizePx,
  className,
}: {
  avatarUrl: string | null
  displayName: string
  sizePx: number
  className?: string
}) {
  return (
    <div
      className={`agent-avatar-wrapper rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 ${className ?? ''}`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={displayName}
          className="agent-avatar-img object-cover w-full h-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = defaultImage
          }}
        />
      ) : (
        <Image
          src={defaultImage}
          alt={displayName}
          width={sizePx}
          height={sizePx}
          className="agent-avatar-img object-cover w-full h-full"
        />
      )}
    </div>
  )
}

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
  avatar?: string | null
}

const getInitials = (name: string) => {
  if (!name) return '??'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Same outer size as the real status pill so the header does not jump on hydrate. */
function StatusBarSkeleton() {
  return (
    <div
      className="inline-flex h-[40px] min-w-[148px] items-center gap-[9px] rounded-[8px] border border-[#E2E8F0] bg-white px-[14px]"
      aria-hidden
    >
      <div className="flex flex-1 items-center justify-between gap-3">
        <div className="flex flex-col gap-[6px] py-0.5">
          <div className="h-2.5 w-9 rounded-sm bg-[#E2E8F0] animate-pulse" />
          <div className="h-2.5 w-12 rounded-sm bg-[#F1F5F9] animate-pulse" />
        </div>
        <div className="h-[22px] w-[38px] shrink-0 rounded-full bg-[#F1F5F9] animate-pulse" />
      </div>
    </div>
  )
}

/** Same footprint as the profile avatar control (w-9 h-9). */
function ProfileAvatarSkeleton() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] animate-pulse shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]"
      aria-hidden
    />
  )
}

export default function AgentTopBar() {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [humanAgent, setHumanAgent] = useState<HumanAgent | null>(null)
  const [allAgents, setAllAgents] = useState<AIAgent[]>([])
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  /** False on first paint; true after localStorage is read so we can reserve space for status/profile. */
  const [hasReadAgentFromStorage, setHasReadAgentFromStorage] = useState(false)

  useEffect(() => {
    // Read human agent from localStorage
    try {
      const raw = localStorage.getItem('agent')
      if (raw) setHumanAgent(JSON.parse(raw))
    } catch { }

    setCurrentAgentId(localStorage.getItem('currentAgentId'))
    setHasReadAgentFromStorage(true)

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
      } catch {}
      void fetchAgents()
    }

    window.addEventListener('agent-changed', handleAgentChanged as EventListener)
    window.addEventListener('agent-status-updated', handleAgentStatusUpdate)
    return () => {
      window.removeEventListener('agent-changed', handleAgentChanged as EventListener)
      window.removeEventListener('agent-status-updated', handleAgentStatusUpdate)
    }
  }, [])

  // Close on outside click (website switcher + profile menu)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(t)) setIsOpen(false)
      if (profileMenuRef.current && !profileMenuRef.current.contains(t)) setIsProfileMenuOpen(false)
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

  const agentInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  const handleSwitch = (agentId: string) => {
    if (agentId === currentAgentId) { setIsOpen(false); return }
    localStorage.setItem('currentAgentId', agentId)
    setCurrentAgentId(agentId)
    window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId } }))
    setIsOpen(false)
  }

  const humanDisplayName = humanAgent?.name?.trim() || 'Agent'
  const humanDisplayEmail = humanAgent?.email?.trim() || ''
  const humanAvatarUrl = avatarSrc(humanAgent?.avatar)

  const handleProfileLogout = async () => {
    try {
      await logoutApi()
    } catch { /* ignore */ }
    localStorage.clear()
    dispatchAuthStorageSync()
    router.replace('/login')
  }

  const toggleHumanStatus = async () => {
    if (!humanAgent || isTogglingStatus) return
    const agentId = humanAgent.id || (humanAgent as any)?._id
    if (!agentId) return

    setIsTogglingStatus(true)
    try {
      await toggleActiveStatus(String(agentId), !humanAgent.isActive)
      const updated = { ...humanAgent, isActive: !humanAgent.isActive }
      setHumanAgent(updated)
      try {
        localStorage.setItem('agent', JSON.stringify(updated))
      } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent('agent-status-updated'))
    } catch {
      // silent
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const editProfileAgent: AgentEditProfileAgent | null = humanAgent
    ? {
      ...humanAgent,
      id: humanAgent.id || (humanAgent as { _id?: string })._id,
    }
    : null

  return (
    <>
      <div className="flex flex-col gap-5 bg-[#F9F9F9] px-[24px] lg:flex-row lg:items-center lg:justify-between">
        {/* Agent switcher */}
        <div className='flex items-center gap-[20px]'>
          <div className='border-r border-[#E8E8E8] pr-[20px] py-[20px]'>
            <Image
              src={publicAsset('/images/agent-logo.svg')}
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

        <div className='flex items-center gap-[20px]'>
          {/* Status Toggle — skeleton until localStorage agent is read to avoid layout shift */}
          {!hasReadAgentFromStorage && <StatusBarSkeleton />}
          {hasReadAgentFromStorage && humanAgent && (
            <div className="inline-flex h-[40px] items-center gap-[9px] rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] text-[#111827]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-[4px]">
                  <span className="text-[10px] leading-[12px] text-[#64748B] font-semibold">Status</span>
                  <p
                    className={`text-[12px] leading-[10px] font-bold ${
                      humanAgent.isActive ? 'text-green-500' : 'text-[#FF6D6D]'
                    }`}
                  >
                    {humanAgent.isActive ? 'Online' : 'Offline'}
                  </p>
                </div>
                <label className={`toggle ${isTogglingStatus ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <input
                    className="toggle-checkbox"
                    type="checkbox"
                    checked={humanAgent.isActive}
                    onChange={toggleHumanStatus}
                    disabled={isTogglingStatus}
                  />
                  <div className="toggle-switch" />
                </label>
              </div>
            </div>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen((p) => !p)}
              className="inline-flex h-[40px] min-w-[200px] items-center gap-[9px] rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] text-[#111827]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#64748B] shrink-0" />
              ) : (
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[10px] font-bold text-[#4B56F2]">
                  {agentInitials || <Globe className="h-3 w-3 text-[#4B56F2]" />}
                </span>
              )}
              <span className="flex-1 text-left truncate">{displayName}</span>
              {currentAgent?.dataTrainingStatus === 1 && (
                <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />
              )}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[250px]">
                <div className="overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white p-[10px] shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
                  <div className="max-h-[min(16rem,50vh)] overflow-y-auto">
                    {visibleAgents.length === 0 && !isLoading && (
                      <p className="py-6 text-center text-[13px] text-[#64748B]">No assigned agents</p>
                    )}
                    <ul className="flex flex-col gap-1.5">
                      {visibleAgents.map((agent) => {
                        const rowLabel = agent.website_name || agent.agentName || 'Unnamed Agent'
                        const initials = getInitials(rowLabel.replace(/^https?:\/\//i, '').split('/')[0] || rowLabel)
                        const isSelected = agent._id === currentAgentId
                        return (
                          <li key={agent._id}>
                            <button
                              type="button"
                              onClick={() => handleSwitch(agent._id)}
                              className="flex w-full items-center gap-2 rounded-lg py-1.5 text-left transition-colors"
                            >
                              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#BFDBFE] bg-white text-[10px] font-bold text-[#1E3A8A]">
                                {initials === '??' ? <Globe className="h-4 w-4 text-[#4B56F2]" /> : initials}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#0F172A]">
                                {rowLabel}
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                {agent.dataTrainingStatus === 1 && (
                                  <span
                                    className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse"
                                    title="Training"
                                  />
                                )}
                                {isSelected && <Check className="h-4 w-4 text-[#4B56F2]" aria-hidden />}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status pill for current agent */}
          {/* {!isLoading && currentAgent && (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${currentAgent.dataTrainingStatus === 1
          ? 'bg-[#FFFBEB] text-[#D97706]'
          : currentAgent.isActive
            ? 'bg-[#ECFDF5] text-[#059669]'
            : 'bg-gray-100 text-gray-500'
          }`}>
          {currentAgent.dataTrainingStatus === 1 ? 'Training...' : currentAgent.isActive ? 'Active' : 'Inactive'}
        </span>
      )} */}


          {/* Notification Bell */}
          <NotificationBell />


          {/* Human agent profile (same pattern as ClientProfileMenu) */}
          {!hasReadAgentFromStorage && <ProfileAvatarSkeleton />}
          {hasReadAgentFromStorage && humanAgent && (
            <div className="relative shrink-0" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((p) => !p)}
                className="flex items-center gap-3 max-w-[280px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] transition-colors duration-150 group"
              >
                <HumanMenuAvatar
                  avatarUrl={humanAvatarUrl}
                  displayName={humanDisplayName}
                  sizePx={40}
                  className="w-9 h-9"
                />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[250px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                  <div className="py-[16px] text-center border-b border-gray-100">
                    <div className="mx-auto mb-[12px] flex justify-center">
                      <HumanMenuAvatar
                        avatarUrl={humanAvatarUrl}
                        displayName={humanDisplayName}
                        sizePx={56}
                        className="w-14 h-14"
                      />
                    </div>
                    <p className="text-[14px] font-semibold text-[#111827] truncate px-[20px]">{humanDisplayName}</p>
                    <p className="text-[13px] text-[#64748B] mt-0.5 truncate px-[20px]">
                      {humanDisplayEmail || 'No email'}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        setShowEditProfileModal(true)
                      }}
                      className="flex items-center gap-[12px] w-full px-[16px] py-[12px] text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                    >
                      <span className="material-symbols-outlined text-[#64748B] !text-[20px]">person</span>
                      Profile
                    </button>
                  </div>

                  <div className="border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        void handleProfileLogout()
                      }}
                      className="flex items-center gap-[12px] w-full px-[16px] py-[12px] text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150 justify-center"
                    >
                      <span className="material-symbols-outlined !text-[20px]">logout</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AgentEditProfileModal
        open={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        agent={editProfileAgent}
        onAgentUpdated={(updated) => setHumanAgent(updated as HumanAgent)}
      />
    </>
  )
}
