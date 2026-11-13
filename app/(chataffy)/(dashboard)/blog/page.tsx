'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Unplug,
  Wifi,
  Sparkles,
  Send,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'react-toastify'
import TopHead from '../_components/TopHead'
import {
  generateBlogApi,
  updateBlogApi,
  listBlogPostsApi,
  wixConnectApi,
  wixStatusApi,
  wixDisconnectApi,
  publishBlogToWixApi,
} from '@/app/_api/dashboard/action'

type WixConnection = {
  isConnected: boolean
  siteUrl: string
  siteDisplayName?: string
  siteId?: string
  instanceId?: string
  lastVerifiedAt?: string | null
}

type BlogPost = {
  _id: string
  topic: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  metaTitle: string
  metaDescription: string
  status: string
  wixDraftPostId?: string
  wixPostId?: string
  wixPostUrl?: string
  wixStatus?: string
  publishedPlatform?: string
  publishedAt?: string | null
  createdAt?: string
}

const emptyBlog: Partial<BlogPost> = {
  title: '',
  content: '',
  excerpt: '',
  tags: [],
  metaTitle: '',
  metaDescription: '',
}

export default function BlogPage() {
  const [wixConnection, setWixConnection] = useState<WixConnection>({
    isConnected: false,
    siteUrl: '',
    siteDisplayName: '',
  })
  const [wixConnecting, setWixConnecting] = useState(false)
  const [wixDisconnecting, setWixDisconnecting] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('Professional')
  const [language, setLanguage] = useState('English')
  const [length, setLength] = useState('1500 words')
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishAsDraft, setPublishAsDraft] = useState(false)

  const [blog, setBlog] = useState<Partial<BlogPost>>(emptyBlog)
  const [history, setHistory] = useState<BlogPost[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const wixRes = await wixStatusApi()
      if (wixRes?.status && wixRes.connection) {
        setWixConnection(wixRes.connection)
      }
    } catch {
      toast.error('Failed to load Wix connection')
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await listBlogPostsApi({ page: 1, limit: 20 })
      if (res?.status && Array.isArray(res.posts)) {
        setHistory(res.posts)
      }
    } catch {
      // silent — history is secondary
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    loadHistory()
  }, [loadStatus, loadHistory])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const wix = params.get('wix')
    if (!wix) return
    if (wix === 'connected') {
      toast.success('Wix connected successfully')
      loadStatus()
    } else if (wix === 'error') {
      toast.error(params.get('message') || 'Wix connection failed')
    }
    const url = new URL(window.location.href)
    url.searchParams.delete('wix')
    url.searchParams.delete('message')
    url.searchParams.delete('site')
    window.history.replaceState({}, '', url.pathname)
  }, [loadStatus])

  const handleWixConnect = async () => {
    setWixConnecting(true)
    try {
      const res = await wixConnectApi()
      if (!res?.status || !res.authorizeUrl) {
        toast.error(res?.message || 'Failed to start Wix connection')
        return
      }
      window.location.href = res.authorizeUrl
    } catch {
      toast.error('Failed to start Wix connection')
      setWixConnecting(false)
    }
  }

  const handleWixDisconnect = async () => {
    setWixDisconnecting(true)
    try {
      const res = await wixDisconnectApi()
      if (!res?.status) {
        toast.error(res?.message || 'Failed to disconnect Wix')
        return
      }
      setWixConnection(res.connection || { isConnected: false, siteUrl: '' })
      toast.success('Wix disconnected')
    } catch {
      toast.error('Failed to disconnect Wix')
    } finally {
      setWixDisconnecting(false)
    }
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Enter a blog topic')
      return
    }
    setGenerating(true)
    try {
      const agentId =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('currentAgentId')
          : null
      const res = await generateBlogApi({
        topic: topic.trim(),
        tone,
        language,
        length,
        agentId,
      })
      if (!res?.status || !res.blog) {
        toast.error(res?.message || 'Failed to generate blog')
        return
      }
      setBlog(res.blog)
      toast.success('Blog generated — review the preview below')
      loadHistory()
    } catch {
      toast.error('Failed to generate blog')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveEdits = async () => {
    if (!blog?._id) return
    setSaving(true)
    try {
      const res = await updateBlogApi({
        blogId: blog._id,
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        tags: blog.tags,
        metaTitle: blog.metaTitle,
        metaDescription: blog.metaDescription,
      })
      if (!res?.status) {
        toast.error(res?.message || 'Failed to save')
        return
      }
      setBlog(res.blog)
      toast.success('Changes saved')
    } catch {
      toast.error('Failed to save blog')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!wixConnection.isConnected) {
      toast.error('Connect Wix first')
      return
    }
    if (!blog?._id) {
      toast.error('Generate a blog first')
      return
    }
    setPublishing(true)
    try {
      if (blog.title || blog.content) {
        await updateBlogApi({
          blogId: blog._id,
          title: blog.title,
          content: blog.content,
          excerpt: blog.excerpt,
          tags: blog.tags,
          metaTitle: blog.metaTitle,
          metaDescription: blog.metaDescription,
        })
      }
      const res = await publishBlogToWixApi({
        blogId: blog._id,
        status: publishAsDraft ? 'draft' : 'publish',
      })
      if (!res?.status) {
        toast.error(res?.message || 'Publish failed')
        return
      }
      setBlog(res.blog)
      toast.success(res.message || 'Published to Wix')
      loadHistory()
    } catch {
      toast.error('Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  const selectHistoryItem = (item: BlogPost) => {
    setBlog(item)
    setTopic(item.topic || '')
  }

  return (
    <div className="flex-1 bg-[#F9F9F9] min-h-screen">
      <TopHead
        title="Blog"
        subtitle="Generate AI blogs and publish them directly to your Wix site."
        showDatePicker={false}
        showStatusBadge={false}
      />

      <div className="px-8 pb-12 space-y-8 max-w-6xl">
        {/* Wix connection */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Wix connection</h2>
              <p className="text-sm text-[#64748B] mt-1">
                Connect via Wix OAuth. Posts publish through the Wix Blog REST API.
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                wixConnection.isConnected
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {loadingStatus ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : wixConnection.isConnected ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Unplug className="w-3.5 h-3.5" />
              )}
              {loadingStatus
                ? 'Checking...'
                : wixConnection.isConnected
                  ? 'Wix Connected'
                  : 'Disconnected'}
            </div>
          </div>

          {wixConnection.isConnected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wide mb-1">
                    Site
                  </p>
                  <p className="text-[#111827] font-medium">
                    {wixConnection.siteDisplayName || wixConnection.siteId || 'Connected site'}
                  </p>
                  {wixConnection.siteUrl ? (
                    <a
                      href={wixConnection.siteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[#64748B] inline-flex items-center gap-1 hover:underline mt-1"
                    >
                      {wixConnection.siteUrl}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null}
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wide mb-1">
                    Instance
                  </p>
                  <p className="text-[#111827] font-mono text-xs break-all">
                    {wixConnection.instanceId || '—'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleWixDisconnect}
                disabled={wixDisconnecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-100 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {wixDisconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unplug className="w-4 h-4" />
                )}
                Disconnect Wix
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#64748B]">
                You will be redirected to Wix to select your site and allow Blog permissions.
              </p>
              <button
                type="button"
                onClick={handleWixConnect}
                disabled={wixConnecting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-70"
              >
                {wixConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                Connect Wix
              </button>
            </div>
          )}
        </section>

        {/* Generate */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827] mb-1">AI Blog Generator</h2>
          <p className="text-sm text-[#64748B] mb-5">
            Enter a topic and generate a full blog post ready to publish on Wix.
          </p>

          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-[#64748B] font-medium">Blog topic</span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="How AI is Transforming E-commerce"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#111827] outline-none focus:border-gray-400"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block text-sm">
                <span className="text-[#64748B] font-medium">Tone</span>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#111827] outline-none focus:border-gray-400 bg-white"
                >
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Conversational</option>
                  <option>Authoritative</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-[#64748B] font-medium">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#111827] outline-none focus:border-gray-400 bg-white"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-[#64748B] font-medium">Length</span>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#111827] outline-none focus:border-gray-400 bg-white"
                >
                  <option>800 words</option>
                  <option>1200 words</option>
                  <option>1500 words</option>
                  <option>2000 words</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-70"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {generating ? 'Generating...' : 'Generate blog'}
            </button>
          </div>
        </section>

        {/* Preview + edit */}
        {blog?._id && (
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Preview & edit</h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Review the generated post, edit if needed, then publish to Wix.
                </p>
              </div>
              {blog.wixPostUrl && (
                <a
                  href={blog.wixPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
                >
                  View on Wix
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <label className="block text-sm">
              <span className="text-[#64748B] font-medium">Title</span>
              <input
                type="text"
                value={blog.title || ''}
                onChange={(e) => setBlog((b) => ({ ...b, title: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#111827] outline-none focus:border-gray-400"
              />
            </label>

            <label className="block text-sm">
              <span className="text-[#64748B] font-medium">Excerpt</span>
              <textarea
                value={blog.excerpt || ''}
                onChange={(e) => setBlog((b) => ({ ...b, excerpt: e.target.value }))}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#111827] outline-none focus:border-gray-400 resize-y"
              />
            </label>

            <label className="block text-sm">
              <span className="text-[#64748B] font-medium">Content (HTML)</span>
              <textarea
                value={blog.content || ''}
                onChange={(e) => setBlog((b) => ({ ...b, content: e.target.value }))}
                rows={14}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#111827] font-mono text-xs outline-none focus:border-gray-400 resize-y"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="text-[#64748B] font-medium">SEO title</span>
                <input
                  type="text"
                  value={blog.metaTitle || ''}
                  onChange={(e) => setBlog((b) => ({ ...b, metaTitle: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#111827] outline-none focus:border-gray-400"
                />
              </label>
              <label className="block text-sm">
                <span className="text-[#64748B] font-medium">Tags (comma separated)</span>
                <input
                  type="text"
                  value={(blog.tags || []).join(', ')}
                  onChange={(e) =>
                    setBlog((b) => ({
                      ...b,
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#111827] outline-none focus:border-gray-400"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="text-[#64748B] font-medium">SEO description</span>
              <textarea
                value={blog.metaDescription || ''}
                onChange={(e) =>
                  setBlog((b) => ({ ...b, metaDescription: e.target.value }))
                }
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#111827] outline-none focus:border-gray-400 resize-y"
              />
            </label>

            <div className="rounded-xl border border-gray-100 bg-[#F9F9F9] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mb-3">
                Live preview
              </p>
              <h3 className="text-xl font-semibold text-[#111827] mb-3">
                {blog.title || 'Untitled'}
              </h3>
              <div
                className="prose prose-sm max-w-none text-[#334155]"
                dangerouslySetInnerHTML={{ __html: blog.content || '' }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-sm text-[#64748B] mr-2">
                <input
                  type="checkbox"
                  checked={publishAsDraft}
                  onChange={(e) => setPublishAsDraft(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Save as Wix draft (recommended for first test)
              </label>
              <button
                type="button"
                onClick={handleSaveEdits}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-[#111827] hover:bg-gray-50 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Save edits
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || !wixConnection.isConnected}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-70"
              >
                {publishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {publishAsDraft ? 'Save draft to Wix' : 'Publish to Wix'}
              </button>
            </div>
          </section>
        )}

        {/* History */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">Publishing history</h2>
            <button
              type="button"
              onClick={loadHistory}
              disabled={loadingHistory}
              className="text-sm text-[#64748B] hover:text-[#111827] inline-flex items-center gap-1"
            >
              {loadingHistory ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Refresh
            </button>
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No blogs generated yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((item) => (
                <li key={item._id} className="py-3 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => selectHistoryItem(item)}
                    className="text-left flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {item.title || item.topic}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {item.status}
                      {item.wixStatus ? ` · ${item.wixStatus}` : ''}
                      {item.publishedAt
                        ? ` · ${new Date(item.publishedAt).toLocaleString()}`
                        : item.createdAt
                          ? ` · ${new Date(item.createdAt).toLocaleString()}`
                          : ''}
                    </p>
                  </button>
                  {item.wixPostUrl ? (
                    <a
                      href={item.wixPostUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-emerald-700 inline-flex items-center gap-1 shrink-0"
                    >
                      Open
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
