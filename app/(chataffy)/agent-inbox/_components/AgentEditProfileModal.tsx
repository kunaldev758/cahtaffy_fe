'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Save, AlertCircle, Shield, ImagePlus } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { updateAgent, uploadAgentAvatar } from '@/app/_api/dashboard/action'
import defaultImageImport from '@/images/default-image.png'

const defaultImage = (defaultImageImport as any).src || defaultImageImport

export type AgentEditProfileAgent = {
  id?: string
  _id?: string
  name?: string
  email?: string
  avatar?: string | null
  isActive?: boolean
  status?: string
  lastActive?: string
}

function getAgentId(agent: AgentEditProfileAgent | null): string | null {
  if (!agent) return null
  const id = agent.id ?? agent._id
  return id != null ? String(id) : null
}

type Props = {
  open: boolean
  onClose: () => void
  agent: AgentEditProfileAgent | null
  onAgentUpdated?: (agent: AgentEditProfileAgent) => void
}

export default function AgentEditProfileModal({ open, onClose, agent, onAgentUpdated }: Props) {
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  useEffect(() => {
    if (!open || !agent) return
    setError('')
    setSuccess('')
    setEditForm({
      name: agent.name || '',
      email: agent.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setAvatarFile(null)
    setAvatarError(false)
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    const av = agent.avatar
    if (av && av !== 'null' && String(av).trim() !== '') {
      const avatarPath = String(av).startsWith('http')
        ? String(av)
        : `${process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9001'}${av}`
      setAvatarPreview(avatarPath)
    } else {
      setAvatarPreview(defaultImage)
    }
  }, [open, agent])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        setError('Please select a valid image file (JPG, PNG or WEBP)')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setAvatarFile(file)
      setAvatarError(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleAvatarUpload = async (agentId: string, baseAgent: AgentEditProfileAgent) => {
    if (!avatarFile) return
    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)
      const result = await uploadAgentAvatar(formData, agentId)
      if (result.status_code === 200 && result.agent) {
        const updatedAgent = {
          ...baseAgent,
          avatar: result.agent.avatar,
        }
        localStorage.setItem('agent', JSON.stringify(updatedAgent))
        onAgentUpdated?.(updatedAgent)
        const avatarPath = result.agent.avatar.startsWith('http')
          ? result.agent.avatar
          : `${process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9001'}${result.agent.avatar}`
        setAvatarPreview(avatarPath)
        setAvatarFile(null)
        setAvatarError(false)
        setSuccess('Avatar uploaded successfully!')
        window.dispatchEvent(new CustomEvent('agent-status-updated'))
      } else {
        throw new Error(result.message || 'Failed to upload avatar')
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agent) return
    const agentId = getAgentId(agent)
    if (!agentId) {
      setError('Missing agent id')
      return
    }

    setIsUpdating(true)
    setError('')
    setSuccess('')

    try {
      const updateData: Record<string, unknown> = {
        name: editForm.name,
      }
      if (editForm.newPassword) {
        if (editForm.newPassword !== editForm.confirmPassword) {
          setError("New passwords don't match")
          setIsUpdating(false)
          return
        }
        updateData.currentPassword = editForm.currentPassword
        updateData.newPassword = editForm.newPassword
      }

      const result = await updateAgent(agentId, updateData)
      const payloadAgent = result?.humanAgent
      if (!payloadAgent) {
        throw new Error((result as any)?.message || 'Failed to update agent')
      }

      const updatedAgent: AgentEditProfileAgent = {
        ...agent,
        name: payloadAgent.name ?? agent.name,
        avatar: payloadAgent.avatar ?? agent.avatar,
      }
      localStorage.setItem('agent', JSON.stringify(updatedAgent))
      onAgentUpdated?.(updatedAgent)
      window.dispatchEvent(new CustomEvent('agent-status-updated'))

      setEditForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))

      if (avatarFile && agentId) {
        await handleAvatarUpload(agentId, updatedAgent)
      } else {
        setSuccess('Profile updated successfully!')
      }

      setTimeout(() => {
        onClose()
        setSuccess('')
        setAvatarError(false)
      }, 2000)
    } catch (err) {
      console.error('Update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!open || !agent) return null

  const handleClose = () => {
    onClose()
    setAvatarError(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose()
      }}
    >
      <DialogContent className="w-full max-w-[520px] gap-0 border border-[#E2E8F0] bg-white p-0 overflow-hidden sm:rounded-lg [&>button]:hidden">
        <div className="flex items-center gap-2 border-b border-[#E5E5E5] bg-[#F9FBFD] px-[20px] py-[15px]">
          <span
            role="button"
            tabIndex={0}
            className="material-symbols-outlined !text-[20px] cursor-pointer"
            onClick={handleClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClose()
              }
            }}
          >
            arrow_back
          </span>
          <h1 className="text-sm font-semibold text-[#111827]">Edit Profile</h1>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-[20px] py-[20px] custom-scrollbar">
          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-lg border border-red-300 bg-red-100 p-3">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-300 bg-green-100 p-3">
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          <form id="agent-edit-profile-form" onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="flex h-[90px] w-[90px] items-center justify-center overflow-hidden rounded-full bg-gray-200 ring-2 ring-[#F1F5F9]">
                    {avatarError || !avatarPreview ? (
                      <img src={defaultImage} alt="Avatar preview" className="h-[90px] w-[90px] object-cover" />
                    ) : (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-28 w-28 object-cover"
                        onError={() => {
                          if (!avatarError) {
                            setAvatarError(true)
                            setAvatarPreview(defaultImage)
                          }
                        }}
                      />
                    )}
                  </div>
                  <label
                    htmlFor="agent-edit-avatar-input"
                    className={`absolute -right-1 -top-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#4686FE] text-white shadow-md ring-4 ring-white transition hover:bg-[#3575e8] ${isUploadingAvatar ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <span className="material-symbols-outlined !text-[23px] text-white">
                      add_photo_alternate
                    </span>
                    <span className="sr-only">{avatarFile ? 'Change profile photo' : 'Upload profile photo'}</span>
                    <input
                      id="agent-edit-avatar-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="sr-only"
                      disabled={isUploadingAvatar}
                    />
                  </label>
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
            </div>

            <div>
              <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Name</label>
              <div className="flex h-[40px] w-full items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-[14px]">
                <span className="material-symbols-outlined shrink-0 !text-[16px] text-[#64748B]">person</span>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-4 mt-[24px] flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50">
                  <span className="material-symbols-outlined !text-[16px] text-[#4686FE]">
                    encrypted
                  </span>
                </div>
                <span className="shrink-0 text-sm font-medium text-slate-900">Change Password (Optional)</span>
                <div className="h-px min-w-0 flex-1 bg-[#E2E8F0]" aria-hidden />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Current Password</label>
                  <div className="flex h-[40px] w-full items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-[14px]">
                    <span className="material-symbols-outlined !text-[16px] text-[#64748B]">
                      lock_open
                    </span>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={editForm.currentPassword}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
                      placeholder="Current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                      className="shrink-0 text-[#64748B] transition-colors hover:text-[#111827]"
                      aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    >
                      {showCurrentPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">New Password</label>
                  <div className="flex h-[40px] w-full items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-[14px]">
                    <span className="material-symbols-outlined !text-[16px] text-[#64748B]">
                      password
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
                      placeholder="New password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="shrink-0 text-[#64748B] transition-colors hover:text-[#111827]"
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Confirm New Password</label>
                  <div className="flex h-[40px] w-full items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-[14px]">
                    <span className="material-symbols-outlined !text-[16px] text-[#64748B]">
                      password
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={editForm.confirmPassword}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="shrink-0 text-[#64748B] transition-colors hover:text-[#111827]"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E5E5] bg-[#F9FBFD] px-[20px] py-[20px]">
          <button
            type="button"
            className="cursor-pointer text-sm font-bold text-[#64748B] hover:text-[#111827]"
            onClick={handleClose}
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="agent-edit-profile-form"
            disabled={isUpdating || isUploadingAvatar}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#64748B]"
          >
            {isUpdating || isUploadingAvatar ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{isUploadingAvatar ? 'Uploading Avatar...' : 'Updating...'}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
