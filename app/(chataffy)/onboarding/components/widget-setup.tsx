"use client"

import React, { useEffect, useState, useReducer, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import PhoneInput from 'react-phone-number-input'
import type { Value } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { toast } from 'react-toastify'
import {
  getThemeSettings,
  updateThemeSettings,
  uploadLogo,
  getAgentSettingsApi,
  updateAgentSettingsApi,
} from '@/app/_api/dashboard/action'
import { isValidPhoneNumber } from 'libphonenumber-js'
import Image from 'next/image'

// ─── Constants ───────────────────────────────────────────────────────────────

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'tel', label: 'Phone', icon: '📞' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_FILE_TYPES = ['jpg', 'jpeg', 'png']

const COLOR_FIELD_LABELS: Record<string, string> = {
  title_bar: 'Brand Accent',
  title_bar_text: 'Header Text',
  visitor_bubble: 'Visitor Bubble',
  visitor_bubble_text: 'Visitor Bubble Text',
  ai_bubble: 'AI Bubble',
  ai_bubble_text: 'AI Bubble Text',
}

// ─── Widget state (appearance / pre-chat form) ────────────────────────────────

const widgetInitialState = {
  logo: '/images/widget/human-avatar.png',
  titleBar: 'Support Chat',
  welcomeMessage: "👋 Hi there! How can I help?",
  showLogo: true,
  showWhiteLabel: false,
  isPreChatFormEnabled: true,
  fields: [
    { id: 1, name: 'Name', value: 'Name', type: 'text', placeholder: 'Enter your name', required: true, validation: { minLength: 2, maxLength: 50, pattern: '' } },
    { id: 2, name: 'Email', value: 'Email', type: 'email', placeholder: 'Enter your email', required: true, validation: { minLength: 0, maxLength: 255, pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' } },
  ],
  colorFields: [
    { id: 1, name: 'title_bar', value: '#000000' },
    { id: 2, name: 'title_bar_text', value: '#FFFFFF' },
    { id: 3, name: 'visitor_bubble', value: '#000000' },
    { id: 4, name: 'visitor_bubble_text', value: '#FFFFFF' },
    { id: 5, name: 'ai_bubble', value: '#F3F4F6' },
    { id: 6, name: 'ai_bubble_text', value: '#111827' },
  ],
  position: { align: 'right', sideSpacing: 20, bottomSpacing: 20 },
}

type WidgetState = typeof widgetInitialState
type WidgetAction =
  | { type: 'SET_ALL'; payload: Partial<WidgetState> }
  | { type: 'SET'; field: keyof WidgetState; value: any }
  | { type: 'UPDATE_COLOR'; id: number; value: string }
  | { type: 'UPDATE_POSITION'; payload: Partial<WidgetState['position']> }
  | { type: 'ADD_FIELD'; payload: any }
  | { type: 'REMOVE_FIELD'; id: number }
  | { type: 'TOGGLE_FIELD_REQUIRED'; id: number }

function widgetReducer(state: WidgetState, action: WidgetAction): WidgetState {
  switch (action.type) {
    case 'SET_ALL': {
      const p = action.payload
      return {
        ...state,
        ...p,
        fields: ((p.fields as any)?.length ? p.fields! : state.fields),
        colorFields: ((p.colorFields as any)?.length ? p.colorFields! : state.colorFields),
        position: ((p.position as any) ? p.position! : state.position),
      }
    }
    case 'SET':
      return { ...state, [action.field]: action.value }
    case 'UPDATE_COLOR':
      return { ...state, colorFields: state.colorFields.map(f => f.id === action.id ? { ...f, value: action.value } : f) }
    case 'UPDATE_POSITION':
      return { ...state, position: { ...state.position, ...action.payload } }
    case 'ADD_FIELD':
      return { ...state, fields: [...state.fields, action.payload] }
    case 'REMOVE_FIELD':
      return { ...state, fields: state.fields.filter(f => f.id !== action.id) }
    case 'TOGGLE_FIELD_REQUIRED':
      return { ...state, fields: state.fields.map(f => f.id === action.id ? { ...f, required: !f.required } : f) }
    default:
      return state
  }
}

// ─── Agent settings state ─────────────────────────────────────────────────────

const agentInitialState = {
  agentName: '',
  email: '',
  phone: '',
  fallbackMessage: '',
  liveAgentSupport: false,
}
type AgentState = typeof agentInitialState

// ─── File validation ──────────────────────────────────────────────────────────

function validateFile(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_FILE_TYPES.includes(ext))
    errors.push(`File type .${ext} is not allowed. Only ${ALLOWED_FILE_TYPES.join(', ')} are allowed.`)
  if (file.size > MAX_FILE_SIZE)
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum 5MB.`)
  return { isValid: errors.length === 0, errors }
}

// ─── Field Creation Modal ─────────────────────────────────────────────────────

function FieldCreationModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (f: any) => void }) {
  const [fieldData, setFieldData] = useState({ name: '', value: '', type: 'text', placeholder: '', required: false, validation: { minLength: 0, maxLength: 255, pattern: '' } })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fieldData.name.trim()) e.name = 'Field name is required'
    if (!fieldData.value.trim()) e.value = 'Field label is required'
    if (!fieldData.placeholder.trim()) e.placeholder = 'Placeholder is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({ ...fieldData, id: Date.now(), validation: { ...fieldData.validation, minLength: Number(fieldData.validation.minLength) || 0, maxLength: Number(fieldData.validation.maxLength) || 255 } })
    setFieldData({ name: '', value: '', type: 'text', placeholder: '', required: false, validation: { minLength: 0, maxLength: 255, pattern: '' } })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="w-full max-w-md rounded-[20px] p-6">
        <DialogHeader className="mb-1">
          <DialogTitle className="text-[15px] font-bold text-[#111827]">Add New Field</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {[
            { label: 'Field Name', key: 'name', placeholder: 'e.g., Name, Company' },
            { label: 'Field Label', key: 'value', placeholder: 'Label shown to users' },
            { label: 'Placeholder', key: 'placeholder', placeholder: 'Placeholder text' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="mb-[6px] block text-[12px] font-medium text-[#64748B]">{label} *</label>
              <input
                type="text"
                value={(fieldData as any)[key]}
                onChange={e => setFieldData({ ...fieldData, [key]: e.target.value })}
                placeholder={placeholder}
                className={`h-[40px] w-full rounded-[8px] border px-[14px] text-[13px] text-[#111827] outline-none ${errors[key] ? 'border-red-400 bg-red-50' : 'border-[#E2E8F0]'}`}
              />
              {errors[key] && <p className="mt-1 text-[11px] text-red-500">{errors[key]}</p>}
            </div>
          ))}

          <div>
            <label className="mb-[6px] block text-[12px] font-medium text-[#64748B]">Field Type</label>
            <select value={fieldData.type} onChange={e => setFieldData({ ...fieldData, type: e.target.value })} className="h-[40px] w-full rounded-[8px] border border-[#E2E8F0] px-[14px] text-[13px] text-[#111827] outline-none">
              {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#111827]">Required Field</span>
            <button type="button" onClick={() => setFieldData({ ...fieldData, required: !fieldData.required })}
              className={`relative h-[28px] w-[50px] rounded-[6px] transition-colors ${fieldData.required ? 'bg-[#34D399]' : 'bg-[#E2E8F0]'}`}>
              <span className={`absolute top-[6px] h-4 w-4 rounded-[3px] bg-white transition-transform ${fieldData.required ? 'left-[inherit] right-[6px]' : 'left-[6px] right-0'}`} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex gap-3">
          <button onClick={onClose} className="flex-1 h-[40px] rounded-[10px] border border-[#E2E8F0] text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]">Cancel</button>
          <button onClick={handleSave} className="flex-1 h-[40px] rounded-[10px] bg-[#111827] text-[13px] font-semibold text-white hover:bg-[#1f2937]">Add Field</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Widget Preview ───────────────────────────────────────────────────────────

function WidgetPreview({ widgetState, agentState, logoSrc }: { widgetState: WidgetState; agentState: AgentState; logoSrc: string }) {
  const titleBarColor = widgetState.colorFields[0]?.value ?? '#000000'
  const titleBarTextColor = widgetState.colorFields[1]?.value ?? '#FFFFFF'
  const visitorBgColor = widgetState.colorFields[2]?.value ?? '#000000'
  const visitorTextColor = widgetState.colorFields[3]?.value ?? '#FFFFFF'
  const aiBgColor = widgetState.colorFields[4]?.value ?? '#F3F4F6'
  const aiTextColor = widgetState.colorFields[5]?.value ?? '#111827'
  const displayName = agentState.agentName || widgetState.titleBar || 'Support Chat'

  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] shadow-[0px_8px_30px_0px_rgba(0,0,0,0.12)] w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-[12px] px-[20px] h-[70px] border-b border-[#d9d9d9]" style={{ backgroundColor: titleBarColor }}>
        <div className='flex items-center gap-[12px]'>
          {widgetState.showLogo && (
            <div className='outline outline-2 outline-[#ffffff] rounded-full h-[38px] w-[38px]'>
              <img src={logoSrc} alt="logo" className="h-[38px] w-[38px] rounded-full object-cover shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = '/images/widget/human-avatar.png' }} />
            </div>
          )}

          <p className="max-w-[150px] truncate text-[14px] font-semibold leading-5" style={{ color: titleBarTextColor }}>{displayName}</p>
        </div>

        <div className='flex items-center gap-[12px]'>
          <span className="material-symbols-outlined !text-[18px]" style={{ color: titleBarTextColor }}>
            more_horiz
          </span>
          <span className="material-symbols-outlined !text-[18px]" style={{ color: titleBarTextColor }}>
            close_fullscreen
          </span>
          <span className="material-symbols-outlined !text-[18px]" style={{ color: titleBarTextColor }}>
            close
          </span>
        </div>

      </div>
      {/* Chat area */}
      <div className="flex flex-col gap-[24px] bg-[#ffffff] p-[20px] flex-1 min-h-[380px]">
        <div className="flex items-start gap-2">
          <div className="h-9 w-9 shrink-0 rounded-full bg-[#E2E8F0] flex items-center justify-center border border-[#d9d9d9]" style={{ backgroundColor: titleBarColor }}>
            <span className="material-symbols-outlined !text-[18px]" style={{ color: titleBarTextColor }}>
              smart_toy
            </span>
          </div>
          <div className="rounded-[22px] px-[20px] py-[12px] text-sm leading-5 flex-1" style={{ backgroundColor: aiBgColor, color: aiTextColor }}>
            {widgetState.welcomeMessage || '👋 Hi! Im your assistant. How can I help you today?'}
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-[22px] px-[20px] py-[12px] text-sm leading-5" style={{ backgroundColor: visitorBgColor, color: visitorTextColor }}>
            Hello! I need some help.
          </div>
        </div>
      </div>
      {/* Input */}
      <div className="bg-white px-[20px] py-[12px]">
        <div className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#ffffff] px-[18px] py-[12px]">
          <span className="flex-1 text-[12px] text-[#94A3B8] cursor-not-allowed">Type a message…</span>
          <div className='flex items-center gap-2'>
            <span className="material-symbols-outlined !text-[20px] text-[#94A3B8] cursor-not-allowed">
              mic
            </span>

            <div className='flex items-center justify-center h-8 w-8 rounded-full bg-[#F8FAFC] cursor-not-allowed'>
              <span className="material-symbols-outlined !text-[18px] text-[#CBD5E1]">
                arrow_upward
              </span>
            </div>
          </div>
        </div>
      </div>
      {!widgetState.showWhiteLabel && (
        <div className="bg-white pb-[12px] text-center text-[11px] text-[#94A3B8]">
          Powered by <span className="font-semibold text-[#4686FE]">Chataffy</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type WidgetSetupProps = { onFinish: () => void }

export default function WidgetSetup({ onFinish }: WidgetSetupProps) {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [widgetState, dispatchWidget] = useReducer(widgetReducer, widgetInitialState)
  const [widgetLauncherStyle, setWidgetLauncherStyle] = useState<'bubble' | 'bar'>('bubble')
  const [agentData, setAgentData] = useState<AgentState>(agentInitialState)
  const [logoSrc, setLogoSrc] = useState('/images/widget/human-avatar.png')
  const [logoErrors, setLogoErrors] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [embedScript, setEmbedScript] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const checkboxUiClass = "h-[20px] w-[20px] rounded-[8px] border border-[#CBD5E1] shadow-none data-[state=checked]:border-[#4686FE] data-[state=checked]:bg-[#4686FE] data-[state=checked]:text-white [&_svg]:h-[14px] [&_svg]:w-[14px]"

  // ── Bootstrap agentId from localStorage ──────────────────────────────────

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('currentAgentId')
      setAgentId(id)
    }
  }, [])

  // ── Fetch widget + agent data once agentId is available ──────────────────
  console.log(agentId, "agentId from widget setup")
  useEffect(() => {
    if (!agentId) return
      ; (async () => {
        try {
          const [widgetRes, agentRes] = await Promise.all([
            getThemeSettings(agentId),
            getAgentSettingsApi(agentId),
          ])

          if (widgetRes?.status_code === 200 && widgetRes.data) {
            const d = widgetRes.data
            dispatchWidget({ type: 'SET_ALL', payload: d })
            if (d.logo) setLogoSrc(`${process.env.NEXT_PUBLIC_FILE_HOST}${d.logo}`)
            // Build embed script
            const wid = d.widgetId || d._id
            if (wid) {
              setEmbedScript(`<script src="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://chataffy.com'}widget/${wid}"></script>`)
            }
          }

          if (agentRes?.status_code === 200 && agentRes.data) {
            const a = agentRes.data
            setAgentData({
              agentName: a.agentName ?? '',
              email: a.email ?? '',
              phone: a.phone ?? '',
              fallbackMessage: a.fallbackMessage ?? '',
              liveAgentSupport: a.liveAgentSupport ?? false,
            })
            // Pre-fill widget titleBar from agentName if not already set
            if (a.agentName) {
              dispatchWidget({ type: 'SET', field: 'titleBar', value: a.agentName })
            }
          }
        } catch {
          toast.error('Failed to load settings')
        }
      })()
  }, [agentId])

  // Default embed script fallback
  useEffect(() => {
    if (!embedScript) {
      setEmbedScript(`<script src="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://chataffy.com'}widget/"></script>`)
    }
  }, [embedScript])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedScript)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 1500)
    } catch { setIsCopied(false) }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validation = validateFile(file)
    if (!validation.isValid) { setLogoErrors(validation.errors); return }
    setLogoErrors([])
    const formData = new FormData()
    formData.append('logo', file)
    try {
      setIsUploading(true)
      await uploadLogo(formData, agentId)
      const preview = URL.createObjectURL(file)
      setLogoSrc(preview)
      dispatchWidget({ type: 'SET', field: 'logo', value: preview })
    } catch {
      toast.error('Failed to upload logo. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const setAgent = (field: keyof AgentState, value: any) => {
    setAgentData(prev => ({ ...prev, [field]: value }))
    // Keep widget titleBar in sync with agentName for the preview
    if (field === 'agentName') {
      dispatchWidget({ type: 'SET', field: 'titleBar', value })
    }
  }

  // Validation for agent fields
  const validateAgentField = (name: string, value: any): string => {
    switch (name) {
      case 'agentName':
        if (!String(value).trim()) return 'Agent name is required'
        if (String(value).trim().length < 2) return 'Must be at least 2 characters'
        return ''
      case 'email':
        if (!String(value).trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
        return ''
      case 'phone':
        if (!String(value).trim()) return 'Phone number is required'
        try { if (!isValidPhoneNumber(String(value))) return 'Please enter a valid phone number' } catch { return 'Please enter a valid phone number' }
        return ''
      case 'fallbackMessage':
        if (!String(value).trim()) return 'Fallback message is required'
        if (String(value).trim().length < 10) return 'Must be at least 10 characters'
        if (String(value).trim().length > 500) return 'Must be less than 500 characters'
        return ''
      default:
        return ''
    }
  }

  const handleAgentBlur = (name: string) => {
    const err = validateAgentField(name, (agentData as any)[name])
    setFieldErrors(prev => ({ ...prev, [name]: err }))
  }

  const handleSave = async () => {
    const fieldsToValidate = ['agentName', 'email', 'phone', 'fallbackMessage'] as const
    const newErrors: Record<string, string> = {}
    fieldsToValidate.forEach(f => {
      const err = validateAgentField(f, agentData[f])
      if (err) newErrors[f] = err
    })
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors)
      toast.error('Please fix the errors before saving')
      return
    }

    try {
      setIsSaving(true)
      const [widgetRes, agentRes] = await Promise.all([
        updateThemeSettings({
          agentId,
          themeSettings: {
            logo: widgetState.logo,
            titleBar: agentData.agentName || widgetState.titleBar,
            welcomeMessage: widgetState.welcomeMessage,
            showLogo: widgetState.showLogo,
            showWhiteLabel: widgetState.showWhiteLabel,
            isPreChatFormEnabled: widgetState.isPreChatFormEnabled,
            fields: widgetState.fields,
            colorFields: widgetState.colorFields,
            position: widgetState.position,
          },
        }),
        updateAgentSettingsApi({
          agentId,
          agentName: agentData.agentName,
          email: agentData.email,
          phone: agentData.phone,
          fallbackMessage: agentData.fallbackMessage,
          liveAgentSupport: agentData.liveAgentSupport,
        }),
      ])

      if (widgetRes?.status_code === 200 && agentRes?.status_code === 200) {
        toast.success('Settings saved successfully!')
        onFinish()
      } else {
        toast.error('Failed to save settings. Please try again.')
      }
    } catch {
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex gap-[24px]">

        {/* ── Left panel ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-[20px] flex-1 min-w-0">

          {/* Embed Code card */}
          <div className="rounded-[20px] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] p-[20px]">
            <div className="flex flex-col gap-[16px]">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-[#111827]">Widget Embed Code</h2>
                <p className="text-[13px] text-[#64748B]">
                  Add this script to your website's{' '}
                  <Badge className="ml-1 rounded-[6px] bg-[#FAF5FF] text-[10px] font-semibold text-[#A855F7] shadow-none hover:bg-[#F1F5F9] h-[17px] border border-[#A855F7] px-[7px]">
                    &lt;Footer&gt;
                  </Badge>{' '}
                  section to activate the chatbot.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input value={embedScript} readOnly
                  className="h-[44px] flex-1 min-w-0 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-[14px] text-[13px] text-[#111827] outline-none" />
                <button type="button" onClick={handleCopy}
                  className="inline-flex h-[44px] min-w-[120px] shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#111827] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#1f2937]">
                  <span className="material-symbols-outlined !text-[18px]">content_copy</span>
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Basic Setup card */}
          <div className="rounded-[20px] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] p-[20px]">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-[#111827]">Agent Setup</h2>
              <p className="text-[13px] text-[#64748B]">Configure your agent identity and contact information</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Logo + Agent Name */}
              <div className="flex gap-4 items-start">
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    className="relative h-[70px] w-[70px] rounded-full border border-[#D9DFE8] bg-[#F8FAFC] flex items-center justify-center overflow-hidden group hover:border-[#4686FE] transition-colors">
                    {logoSrc && logoSrc !== '/images/widget/human-avatar.png' ? (
                      <img src={logoSrc} alt="logo" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <span className="text-[38px] font-bold text-[#3B82F6] leading-none">
                        {agentData.agentName?.[0]?.toUpperCase() ?? 'C'}
                      </span>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="material-symbols-outlined !text-[20px] text-white">upload</span>
                    </div>
                    {isUploading && (
                      <div className="absolute inset-0 rounded-full bg-white/80 flex items-center justify-center">
                        <span className="material-symbols-outlined !text-[18px] text-[#4686FE] animate-spin">progress_activity</span>
                      </div>
                    )}
                  </button>
                  <p className="text-[11px] text-[#94A3B8] text-center">JPG/PNG<br />max 5MB</p>
                  {logoErrors.map((e, i) => <p key={i} className="text-[11px] text-red-500 text-center max-w-[80px]">{e}</p>)}
                  <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleLogoChange} />
                </div>

                <div className="flex-1">
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Agent Name <span className="text-red-500">*</span></label>
                  <input type="text" value={agentData.agentName}
                    onChange={e => setAgent('agentName', e.target.value)}
                    onBlur={() => handleAgentBlur('agentName')}
                    className={`h-[40px] w-full rounded-[8px] border bg-white px-[14px] text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8] focus:border-[#4686FE] ${fieldErrors.agentName ? 'border-red-400' : 'border-[#E2E8F0]'}`}
                    placeholder="Enter agent name" />
                  {fieldErrors.agentName && <p className="mt-1 text-[11px] text-red-500">{fieldErrors.agentName}</p>}
                </div>
              </div>

              {/* Greeting Message */}
              <div>
                <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Greeting Message</label>
                <textarea rows={3} value={widgetState.welcomeMessage}
                  onChange={e => dispatchWidget({ type: 'SET', field: 'welcomeMessage', value: e.target.value })}
                  className="w-full resize-none rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] py-3 text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8] focus:border-[#4686FE]"
                  placeholder="Enter greeting message" />
              </div>

              {/* Email + Phone */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Email <span className="text-red-500">*</span></label>
                  <div className={`h-[40px] w-full rounded-[8px] border bg-white px-[14px] flex items-center gap-2 ${fieldErrors.email ? 'border-red-400' : 'border-[#E2E8F0]'}`}>
                    <span className="material-symbols-outlined !text-[18px] text-[#94A3B8]">alternate_email</span>
                    <input type="email" value={agentData.email}
                      onChange={e => setAgent('email', e.target.value)}
                      onBlur={() => handleAgentBlur('email')}
                      className="w-full text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
                      placeholder="contact@yourcompany.com" />
                  </div>
                  {fieldErrors.email && <p className="mt-1 text-[11px] text-red-500">{fieldErrors.email}</p>}
                </div>
                <div className="country-select-container">
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Phone Number <span className="text-red-500">*</span></label>
                  <PhoneInput international defaultCountry="US"
                    value={agentData.phone as Value}
                    onChange={v => setAgent('phone', v ?? '')}
                    className={`h-[40px] w-full rounded-[8px] border bg-white px-[14px] flex items-center gap-2 ${fieldErrors.phone ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                  {fieldErrors.phone && <p className="mt-1 text-[11px] text-red-500">{fieldErrors.phone}</p>}
                </div>
              </div>

              {/* Fallback Message */}
              <div>
                <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                  Fallback Message <span className="text-red-500">*</span>
                </label>
                <textarea rows={3} value={agentData.fallbackMessage}
                  onChange={e => setAgent('fallbackMessage', e.target.value)}
                  onBlur={() => handleAgentBlur('fallbackMessage')}
                  className={`w-full resize-none rounded-[8px] border bg-white px-[14px] py-3 text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8] ${fieldErrors.fallbackMessage ? 'border-red-400' : 'border-[#E2E8F0]'}`}
                  placeholder="Message shown when AI cannot respond to a query…" />
                <div className="flex items-center justify-between mt-1">
                  {fieldErrors.fallbackMessage
                    ? <p className="text-[11px] text-red-500">{fieldErrors.fallbackMessage}</p>
                    : <span />
                  }
                  <span className="text-[11px] text-[#94A3B8]">{agentData.fallbackMessage.length}/500</span>
                </div>
              </div>

              {/* Live Chat toggle */}
              <div className="flex items-center gap-[12px]">
                <Checkbox id="live-chat-enabled" className={checkboxUiClass}
                  checked={agentData.liveAgentSupport}
                  onCheckedChange={v => setAgent('liveAgentSupport', v === true)} />
                <label htmlFor="live-chat-enabled" className="cursor-pointer text-[13px] leading-5 text-[#111827]">
                  Visitors can request live chat with chat agents
                </label>
              </div>
            </div>
          </div>

          {/* Appearance card */}
          <div className="rounded-[20px] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] p-[20px]">
            <div className='flex flex-col gap-[34px]'>
              <div className='flex flex-col gap-[16px]'>
                <div>
                  <h2 className="text-sm font-bold text-[#111827]">Brand colors</h2>
                  <p className="text-[13px] text-[#64748B]">Set the brand colors for your widget.</p>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Colors */}
                  <div>
                    <div className='grid gap-[20px] md:grid-cols-3'>
                      {widgetState.colorFields.map(field => (
                        <div key={field.id} className='bg-[#F8FAFC] rounded-[12px] p-2 border border-[#F4F7FA] flex items-center gap-[12px]'>

                          <div className='relative h-[40px] w-[40px] rounded-[10px] overflow-hidden border border-[#D9DFE8] shrink-0'>
                            <div className='absolute inset-0'>
                              <input type="color" value={field.value}
                                onChange={e => dispatchWidget({ type: 'UPDATE_COLOR', id: field.id, value: e.target.value })}
                                className="absolute inset-0 h-[42px] w-[42px] left-[-1px] top-[-1px] cursor-pointer" />
                            </div>
                          </div>

                          <div className='flex flex-col'>
                            <label className="text-[10px] font-bold text-[#64748B] uppercase">{COLOR_FIELD_LABELS[field.name] ?? field.name}</label>
                            <div className="flex items-center gap-2">

                              <span className="text-[11px] font-bold text-[#334155]">{field.value}</span>

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <div className='flex flex-col gap-[16px]'>
                <div>
                  <h2 className="text-sm font-bold text-[#111827]">Placement of widget on your website</h2>
                  <p className="text-[13px] text-[#64748B]">lorem ipsum is dummy text</p>
                </div>

                <div>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3 max-w-[192px]">
                      {[
                        { id: 'bubble' as const, icon: '/images/new/widget-bouble-icon.svg', label: 'Bubble widget launcher' },
                        { id: 'bar' as const, icon: '/images/new/widget-bar-icon.svg', label: 'Bar widget launcher' },
                      ].map(option => {
                        const isSelected = widgetLauncherStyle === option.id
                        return (
                          <label key={option.id} className="cursor-pointer">
                            <input
                              type="radio"
                              name="widget-launcher-style"
                              value={option.id}
                              checked={isSelected}
                              onChange={() => setWidgetLauncherStyle(option.id)}
                              className="sr-only"
                            />
                            <div
                              className={`relative flex h-[60px] w-[90px] items-center justify-center rounded-[10px] border bg-white transition-colors ${isSelected
                                ? 'border-[#3B82F6] bg-white shadow-[0px_0px_0px_1px_rgba(59,130,246,0.15)]'
                                : 'border-[#DDE5EE] bg-[#F1F5F9]  shadow-[0px_0px_0px_1px_rgba(59,130,246,0.15)]'
                                }`}
                            >
                              <img
                                src={option.icon}
                                alt={option.label}
                                className={`h-[26px] w-[26px] object-contain ${isSelected ? '' : 'grayscale opacity-50'}`}
                              />
                              {isSelected && (
                                <span className="absolute right-[-6px] top-[-6px] inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#3B82F6] shadow-[0_0_0_6px_#fff]">
                                  <span className="material-symbols-outlined !text-[12px] leading-none text-white">check</span>
                                </span>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-w-[192px]">
                      {[
                        { id: 'left' as const, icon: '/images/new/widget-left-icon.svg', label: 'Align widget left' },
                        { id: 'right' as const, icon: '/images/new/widget-right-icon.svg', label: 'Align widget right' },
                      ].map(option => {
                        const isSelected = widgetState.position.align === option.id
                        return (
                          <label key={option.id} className="cursor-pointer">
                            <input
                              type="radio"
                              name="widget-position-align"
                              value={option.id}
                              checked={isSelected}
                              onChange={() => dispatchWidget({ type: 'UPDATE_POSITION', payload: { align: option.id } })}
                              className="sr-only"
                            />
                            <div
                              className={`relative h-[60px] w-[90px] rounded-[10px] border transition-colors ${isSelected
                                ? 'border-[#3B82F6] bg-white shadow-[0px_0px_0px_1px_rgba(59,130,246,0.15)]'
                                : 'border-[#DDE5EE]  shadow-[0px_0px_0px_1px_rgba(59,130,246,0.15)]'
                                }`}
                            >
                              <img
                                src={option.icon}
                                alt={option.label}
                                className={`absolute bottom-[8px] ${option.id === 'left' ? 'left-[8px]' : 'right-[8px]'} h-[24px] w-[24px] object-contain ${isSelected ? '' : 'grayscale opacity-50'}`}
                              />
                              {isSelected && (
                                <span className="absolute right-[-6px] top-[-6px] inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#3B82F6] shadow-[0_0_0_6px_#fff]">
                                  <span className="material-symbols-outlined !text-[12px] leading-none text-white">check</span>
                                </span>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {widgetLauncherStyle === 'bar' && (
                  <div className='flex-1'>
                    <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                      Widget Text
                    </label>
                    <input
                      type="text"
                      defaultValue="We’re Online! Chat Now!"
                      className="h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                      placeholder="Enter widget text"
                    />
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Pre-chat form */}
          <div className="rounded-[20px] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]">
            <div>
              <div className="flex items-center justify-between p-[20px] border-b border-[#E2E8F0]">
                <div className='flex flex-col'>
                  <div>
                    <h2 className="text-sm font-bold text-[#111827]">Pre-Chat Form</h2>
                    <p className="text-[13px] text-[#64748B]">Set the pre-chat form for your widget.</p>
                  </div>
                </div>
                <button type="button"
                  onClick={() => dispatchWidget({ type: 'SET', field: 'isPreChatFormEnabled', value: !widgetState.isPreChatFormEnabled })}
                  className={`relative h-[28px] w-[50px] rounded-[6px] transition-colors ${widgetState.isPreChatFormEnabled ? 'bg-[#34D399]' : 'bg-[#E2E8F0]'}`}>
                  <span className={`absolute top-[6px] h-4 w-4 rounded-[3px] bg-white transition-transform ${widgetState.isPreChatFormEnabled ? 'left-[inherit] right-[6px]' : 'left-[6px] right-0'}`} />
                </button>
              </div>

              {widgetState.isPreChatFormEnabled && (
                <div className="flex flex-col gap-[20px]  p-[20px]">
                  {widgetState.fields.map(field => (
                    <div key={field.id} className="flex flex-col gap-2 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">

                      <div className='flex justify-between items-center w-full'>
                        <p className="text-[12px] font-medium text-[#64748B]">{field.value}</p>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox
                            className={checkboxUiClass}
                            checked={field.required}
                            onCheckedChange={() => dispatchWidget({ type: 'TOGGLE_FIELD_REQUIRED', id: field.id })}
                          />
                          <span className="text-[12px] text-[#64748B]">Required</span>
                        </label>
                      </div>

                      <div className='flex items-center gap-3'>
                        <input
                          type="text"
                          value={FIELD_TYPES.find(t => t.value === field.type)?.label ?? ''}
                          readOnly
                          className="h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8] flex-1"
                        />

                        <button type="button"
                          onClick={() => dispatchWidget({ type: 'REMOVE_FIELD', id: field.id })}
                          className="w-10 h-10 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-200 inline-flex justify-center items-center">
                          <span className="material-symbols-outlined !text-[20px] text-[#FF6D6D]">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setIsFieldModalOpen(true)}
                    className="inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#0F172A] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#111827]">
                    <span className="material-symbols-outlined !text-[18px]">add</span>
                    Add New Field
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Additional Tweaks */}
          <div className="rounded-[20px] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]">
            <div>
              <div className="flex items-center justify-between p-[20px] border-b border-[#E2E8F0]">
                <div className='flex flex-col'>
                  <div>
                    <h2 className="text-sm font-bold text-[#111827]">Additional Tweaks</h2>
                    <p className="text-[13px] text-[#64748B]">Customize your widget with additional tweaks.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-[20px]">
                {[
                  { field: 'showLogo' as keyof WidgetState, label: 'Show Logo', desc: '' },
                  { field: 'showWhiteLabel' as keyof WidgetState, label: 'White Label', desc: 'Remove "Powered by Chataffy" branding' },
                ].map(({ field, label, desc }) => (
                  <div key={field} className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-[#111827]">{label}</p>
                      {desc && <p className="text-[12px] text-[#94A3B8]">{desc}</p>}
                    </div>
                    <button type="button"
                      onClick={() => dispatchWidget({ type: 'SET', field, value: !(widgetState as any)[field] })}
                      className={`relative h-[28px] w-[50px] rounded-[6px] transition-colors ${(widgetState as any)[field] ? 'bg-[#34D399]' : 'bg-[#E2E8F0]'}`}>
                      <span className={`absolute top-[6px] h-4 w-4 rounded-[3px] bg-white transition-transform ${(widgetState as any)[field] ? 'left-[inherit] right-[6px]' : 'left-[6px] right-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* Finish Setup button */}
          <div className='flex justify-end'>
            <button type="button" onClick={handleSave} disabled={isSaving}
              className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[14px] bg-[#111827] px-[20px] text-[14px] font-semibold text-white transition-colors hover:bg-[#1f2937] disabled:opacity-60">
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined !text-[18px]">
                    bookmarks
                  </span>
                  <span>Save Setting</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Right panel — Live Preview ──────────────────────────────── */}
        <div className="w-[358px] shrink-0">
          <div className="sticky top-6">
            <div className={`flex flex-col items-${widgetState.position.align === 'left' ? 'start' : 'end'} gap-3 rounded-[14px] bg-[#F1F5F9] min-h-[400px] relative`}>

              <div className="mt-6 w-full flex flex-col items-end gap-3">
                <WidgetPreview widgetState={widgetState} agentState={agentData} logoSrc={logoSrc} />
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full shadow-lg cursor-pointer"
                  style={{ backgroundColor: widgetState.colorFields[0]?.value ?? '#000000' }}>
                  <span className="material-symbols-outlined !text-[26px]" style={{ color: widgetState.colorFields[1]?.value ?? '#FFFFFF' }}>chat_bubble</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <FieldCreationModal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        onSave={field => dispatchWidget({ type: 'ADD_FIELD', payload: field })}
      />
    </>
  )
}
