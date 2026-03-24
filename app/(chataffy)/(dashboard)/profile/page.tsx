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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[40vh] text-[#64748B] text-sm">
        Loading profile…
      </div>
    )
  }

  const inputWrap =
    'flex items-center gap-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#1e293b]/15 focus-within:border-[#1e293b]/30 transition-shadow'
  const iconMuted = 'w-5 h-5 text-[#94A3B8] flex-shrink-0'

  return (
    <div className="flex-1 bg-[#F1F5F9] min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile Setting</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage your personal details and account security.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
          {/* General */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-6 md:p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">General Information</h2>
              <p className="text-sm text-[#64748B] mt-0.5">Manage your personal details and profile.</p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 ring-4 ring-white shadow-md">
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
                  className="absolute -top-0.5 -right-0.5 w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg hover:bg-[#1d4ed8] transition-colors"
                  aria-label="Change photo"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={onPickAvatar}
                />
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Full Name</label>
                <div className={inputWrap}>
                  <User className={iconMuted} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 min-w-0 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                    placeholder="Your name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Email Address</label>
                <div className={inputWrap}>
                  <Mail className={iconMuted} />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="flex-1 min-w-0 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent bg-gray-100 cursor-not-allowed"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Phone Number</label>
                <div className={inputWrap}>
                  <Phone className={iconMuted} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 min-w-0 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUpdateProfile}
              disabled={savingProfile}
              className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] text-white text-sm font-semibold py-3 px-4 hover:bg-[#1e293b] disabled:opacity-60 transition-colors"
            >
              <UserPen className="w-4 h-4" />
              {savingProfile ? 'Saving…' : 'Update Profile'}
            </button>
          </section>

          {/* Security */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-6 md:p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-[#64748B] mt-0.5">Update your password and secure your account.</p>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Current Password</label>
                <div className={inputWrap}>
                  <Lock className={iconMuted} />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="flex-1 min-w-0 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
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
                  <Lock className={iconMuted} />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 min-w-0 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
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
                  <Lock className={iconMuted} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 min-w-0 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
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

            <div className="mt-4 flex gap-3 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-900">
              <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <p>
                Password must be at least 8 characters long and include a combination of numbers, symbols, and
                uppercase letters for maximum security.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={savingPassword || !passwordFormValid}
              className={`mt-6 w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold py-3 px-4 transition-colors ${
                passwordFormValid
                  ? 'bg-[#E2E8F0] text-gray-900 hover:bg-[#CBD5E1]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } disabled:opacity-70`}
            >
              <KeyRound className="w-4 h-4" />
              {savingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
