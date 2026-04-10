'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  UserPen,
  ImageIcon,
  Info,
  Phone,
} from 'lucide-react'
import { toast } from 'react-toastify'
import TopHead from '../_components/TopHead'
import {
  getClientProfile,
  updateClientProfileGeneral,
  updateClientPassword,
  uploadAgentAvatar,
} from '@/app/_api/dashboard/action'

function avatarSrc(path: string | null | undefined) {
  if (!path || path === 'null' || !String(path).trim()) return null
  const p = String(path)
  if (p.startsWith('http')) return p
  const base = process.env.NEXT_PUBLIC_API_HOST || process.env.NEXT_PUBLIC_FILE_HOST || ''
  return `${base}${p}`
}

export default function ClientProfileSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [clientAgentId, setClientAgentId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarPath, setAvatarPath] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const syncLocalClientAgent = useCallback(
    (partial: { name?: string; email?: string; avatar?: string | null }) => {
      if (typeof window === 'undefined') return
      try {
        const raw = localStorage.getItem('clientAgent')
        const base = raw ? JSON.parse(raw) : {}
        const next = { ...base, ...partial }
        localStorage.setItem('clientAgent', JSON.stringify(next))
        window.dispatchEvent(new CustomEvent('client-profile-updated', { detail: next }))
      } catch {
        /* ignore */
      }
    },
    []
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClientProfile()
      if (data === 'error' || data?.status_code === 401) {
        toast.error('Session expired. Please sign in again.')
        return
      }
      if (!data?.status || data.status_code !== 200) {
        toast.error(data?.message || 'Could not load profile')
        return
      }
      const ca = data.clientAgent
      const u = data.user
      setClientAgentId(ca?._id ? String(ca._id) : null)
      setName(ca?.name || '')
      setEmail(u?.email || ca?.email || '')
      setPhone(u?.phone || '')
      setAvatarPath(ca?.avatar || null)
      setAvatarPreview(null)
      setAvatarFile(null)
    } catch {
      toast.error('Could not load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const displayAvatar = avatarPreview || avatarSrc(avatarPath)

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)) {
      toast.error('Use JPG or PNG')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or less')
      return
    }
    setAvatarFile(f)
    setAvatarPreview(URL.createObjectURL(f))
  }

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setSavingProfile(true)
    try {
      const res = await updateClientProfileGeneral({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      })
      if (res === 'error' || res?.status_code === 401) {
        toast.error('Session expired')
        return
      }
      if (!res?.status || res.status_code !== 200) {
        toast.error(res?.message || 'Update failed')
        return
      }
      if (res.clientAgent) {
        setName(res.clientAgent.name || name)
        setAvatarPath(res.clientAgent.avatar || avatarPath)
        setEmail(res.user?.email || email)
        setPhone(res.user?.phone || phone)
        syncLocalClientAgent({
          name: res.clientAgent.name,
          email: res.clientAgent.email,
          avatar: res.clientAgent.avatar,
        })
      }
      if (avatarFile && clientAgentId) {
        const fd = new FormData()
        fd.append('avatar', avatarFile)
        const up = await uploadAgentAvatar(fd, clientAgentId)
        if (up === 'error') {
          toast.error('Profile saved but photo upload failed')
        } else if (up?.status_code === 200 && up?.agent?.avatar) {
          setAvatarPath(up.agent.avatar)
          setAvatarFile(null)
          setAvatarPreview(null)
          syncLocalClientAgent({ avatar: up.agent.avatar })
          toast.success('Profile and photo updated')
        } else {
          toast.error(up?.message || 'Photo upload failed')
        }
      } else {
        toast.success('Profile updated')
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      toast.error('Update failed')
    } finally {
      setSavingProfile(false)
    }
  }

  const passwordFormValid =
    currentPassword.length > 0 && newPassword.length > 0 && newPassword === confirmPassword

  const handleUpdatePassword = async () => {
    if (!passwordFormValid) {
      toast.error('Fill all password fields and ensure new passwords match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    try {
      const res = await updateClientPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      if (res === 'error' || res?.status_code === 401) {
        toast.error('Session expired')
        return
      }
      if (!res?.status || res.status_code !== 200) {
        toast.error(res?.message || 'Could not update password')
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated')
    } catch {
      toast.error('Could not update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const inputWrap =
    'flex h-[40px] w-full items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-[14px]'
  const iconMuted = 'w-5 h-5 text-[#94A3B8] flex-shrink-0'

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA]">
      <TopHead
        title="Profile"
        subtitle="Manage your personal details and account settings."
        showDatePicker={false}
        showWebsiteSelect={false}
        showNotificationBell={false}
        showStatusBadge={false}
      />

      <div className="rounded-tl-[30px] bg-[#F3F4F6] px-4 pb-[33px] pt-6 lg:px-6 flex flex-col gap-6 h-[calc(100%-89px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
          {/* General */}
          <div className="rounded-[20px] bg-white p-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="mb-6">
              <h2 className="text-[18px] font-bold text-[#111827]">General Information</h2>
              <p className="text-[13px] leading-5 text-[#64748B]">Manage your personal details and profile.</p>
            </div>

            <div className="flex flex-col items-center justify-center mb-[20px]">
              <div className="relative mb-4">
                <div className="w-[90px] h-[90px] rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 ring-4 ring-white shadow-md">
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-14 h-14 text-white/90" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -right-1 -top-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#4686FE] text-white shadow-md ring-4 ring-white transition hover:bg-[#3575e8] "
                  aria-label="Change photo"
                >
                  <span className='material-symbols-outlined !text-[23px] text-white'>
                    add_photo_alternate
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={onPickAvatar}
                />
              </div>

              <div className="inline-flex items-center gap-1 p-1 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-surface-container-low transition-colors rounded-lg cursor-default group">
                  <span className="material-symbols-outlined text-primary/70 group-hover:text-primary !text-[18px]" data-icon="image">image</span>
                  <div className="flex flex-col">
                    <span className="font-label text-[8px] uppercase tracking-wider text-on-surface-variant leading-none mb-0.5">Format</span>
                    <span className="font-body text-[10px] font-semibold text-on-surface leading-none">JPG, PNG, WEBP</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-surface-container-low transition-colors rounded-lg cursor-default group">
                  <span className="material-symbols-outlined text-primary/70 group-hover:text-primary !text-[18px]" data-icon="database">database</span>
                  <div className="flex flex-col">
                    <span className="font-label text-[8px] uppercase tracking-wider text-on-surface-variant leading-none mb-0.5">Size</span>
                    <span className="font-body text-[10px] font-semibold text-on-surface leading-none">Max 5MB</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-surface-container-low transition-colors rounded-lg cursor-default group">
                  <span className="material-symbols-outlined text-primary/70 group-hover:text-primary !text-[18px]" data-icon="aspect_ratio">aspect_ratio</span>
                  <div className="flex flex-col">
                    <span className="font-label text-[8px] uppercase tracking-wider text-on-surface-variant leading-none mb-0.5">Resolution</span>
                    <span className="font-body text-[10px] font-semibold text-on-surface leading-none">90×90px</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Full Name</label>
                <div className={inputWrap}>
                  <span className="material-symbols-outlined shrink-0 !text-[16px] text-[#64748B]">person</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Email Address</label>
                <div className={inputWrap}>
                  <span className="material-symbols-outlined shrink-0 !text-[16px] text-[#64748B]">mail</span>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8] cursor-not-allowed"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="w-full flex justify-center h-10 items-center gap-2 rounded-lg bg-[#111827] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1f2937]"
              >
                <UserPen className="w-4 h-4" />
                {savingProfile ? 'Saving…' : 'Update Profile'}
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="rounded-[20px] bg-white p-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="mb-6">
              <h2 className="text-[18px] font-bold text-[#111827]">Security</h2>
              <p className="text-[13px] leading-5 text-[#64748B]">Update your password and secure your account.</p>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Current Password</label>
                <div className={inputWrap}>
                  <span className="material-symbols-outlined !text-[16px] text-[#64748B]">lock_open</span>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="p-1 text-[#94A3B8] hover:text-gray-700"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">New Password</label>
                <div className={inputWrap}>
                  <span className="material-symbols-outlined !text-[16px] text-[#64748B]">password</span>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="p-1 text-[#94A3B8] hover:text-gray-700"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Confirm New Password</label>
                <div className={inputWrap}>
                  <span className="material-symbols-outlined !text-[16px] text-[#64748B]">password</span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="p-1 text-[#94A3B8] hover:text-gray-700"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-[20px]'>
              <div className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] px-[14px] py-[20px]">
                <span className="material-symbols-outlined !text-[16px] text-[#64748B]">info</span>
                <p className='text-[13px] text-[#64748B] italic'>
                  Password must be at least 8 characters long and include a combination of numbers, symbols, and
                  uppercase letters for maximum security.
                </p>
              </div>

              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={savingPassword || !passwordFormValid}
                className={`w-full flex justify-center h-10 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold text-white transition-colors ${passwordFormValid
                  ? 'bg-[#111827] text-gray-900 hover:bg-[#1f2937]'
                  : 'bg-[#B4B4B4] text-gray-400 cursor-not-allowed'
                  } disabled:opacity-70`}
              >
                <KeyRound className="w-4 h-4" />
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
