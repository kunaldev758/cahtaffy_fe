'use client'

import Link from "next/link"
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, LayoutDashboard, Globe, Settings2, Inbox, Brain, Users, CreditCard, Loader2 } from "lucide-react"
import { toast } from 'react-toastify'

import logoPic from '@/images/logo.png'
import ClientProfileMenu from '../inbox/_components/ClientProfileMenu'
import { getClientData } from '@/app/_api/dashboard/action'
import { createAIAgentApi } from '@/app/_api/login/action'

export default function IntegratedSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [clientData, setClientData] = useState<any>(null)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)

  useEffect(() => {
    const fetchClient = async () => {
      if (typeof window !== 'undefined') {
        const storedClientAgent = localStorage.getItem('clientAgent')
        const storedAgent = localStorage.getItem('agent')

        if (storedClientAgent) {
          try {
            const parsed = JSON.parse(storedClientAgent)
            if (parsed.isClient) setClientData(parsed)
          } catch {}
        } else if (storedAgent) {
          try {
            const parsed = JSON.parse(storedAgent)
            if (parsed.isClient) setClientData(parsed)
          } catch {}
        }

        try {
          const data = await getClientData()
          if (data && data.clientAgent) {
            setClientData(data.clientAgent)
            localStorage.setItem('clientAgent', JSON.stringify(data.clientAgent))
          }
        } catch {}
      }
    }

    fetchClient()

    const handleClientStatusChange = (event: CustomEvent) => {
      setClientData(event.detail)
    }

    window.addEventListener('client-status-changed', handleClientStatusChange as EventListener)
    return () => {
      window.removeEventListener('client-status-changed', handleClientStatusChange as EventListener)
    }
  }, [])

  const imageLoader = ({ src, width, quality }: { src: any; width: any; quality: any }) => {
    return `${src}?w=${width}&q=${quality || 75}`
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
      try {
        const existing = JSON.parse(localStorage.getItem('agents') || '[]')
        if (!existing.some((a: any) => a._id === newAgentId)) {
          localStorage.setItem('agents', JSON.stringify([...existing, res.agent]))
        }
      } catch { /* keep existing agents array as-is */ }
      window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId: newAgentId } }))
      router.push('/website/new')
    } catch {
      toast.error('Failed to create agent. Please try again.')
    } finally {
      setIsCreatingAgent(false)
    }
  }

  const isActive = (path: string) => pathname === path
  const isParentActive = (path: string) => !!pathname?.startsWith(path)

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
      active
        ? 'bg-[#111827] text-white'
        : 'text-[#64748B] hover:bg-gray-100 hover:text-[#111827]'
    }`

  const iconClass = (active: boolean) =>
    `w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-[#64748B]'}`

  return (
    <div className="bg-[#F9F9F9] border-r border-gray-200 w-64 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            loader={imageLoader as any}
            src={logoPic}
            alt="Chataffy"
            title="Chataffy"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-bold text-gray-900">Chataffy</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        {/* HOME section */}
        <p className="px-3 pt-4 pb-2 text-[#94A3B8] text-[13px] font-bold uppercase tracking-wide">
          Home
        </p>

        <Link href="/dashboard" className={navItemClass(isActive('/dashboard'))}>
          <LayoutDashboard className={iconClass(isActive('/dashboard'))} />
          Overview
        </Link>

        <Link href="/website" className={navItemClass(isActive('/website'))}>
          <Globe className={iconClass(isActive('/website'))} />
          Website
        </Link>

        <Link href="/setup/widget" className={navItemClass(isParentActive('/setup'))}>
          <Settings2 className={iconClass(isParentActive('/setup'))} />
          Setup
        </Link>

        <Link href="/inbox" className={navItemClass(isParentActive('/inbox'))}>
          <Inbox className={iconClass(isParentActive('/inbox'))} />
          Inbox
        </Link>

        <Link href="/training" className={navItemClass(isActive('/training'))}>
          <Brain className={iconClass(isActive('/training'))} />
          Training
        </Link>

        {/* CONFIGURATION section */}
        <p className="px-3 pt-6 pb-2 text-[#94A3B8] text-[13px] font-bold uppercase tracking-wide">
          Configuration
        </p>

        <Link href="/humanAgent" className={navItemClass(isActive('/humanAgent'))}>
          <Users className={iconClass(isActive('/humanAgent'))} />
          Human Agent
        </Link>

        <button
          className={navItemClass(false) + ' w-full text-left cursor-default'}
          tabIndex={-1}
        >
          <CreditCard className={iconClass(false)} />
          Pricing
        </button>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-3">
        {/* New AI Agent button */}
        <button
          onClick={handleNewAgent}
          disabled={isCreatingAgent}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#111827] text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isCreatingAgent ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {isCreatingAgent ? 'Creating...' : 'New AI agent'}
        </button>

        {/* Agent card */}
        <div className="border-t border-gray-200 pt-3">
          <ClientProfileMenu
            clientEmail={clientData?.email}
            clientId={clientData?._id}
            isActive={clientData?.isActive !== false}
            clientName={clientData?.name}
            clientAvatar={clientData?.avatar}
          />
        </div>
      </div>
    </div>
  )
}
