'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'react-toastify'
import TopHead from '../_components/TopHead'
import {
  generateAndPublishBlogApi,
  getBlogPublisherHomeApi,
  getBlogPublishingJobApi,
  getPublisherShopifyBlogsApi,
} from '@/app/_api/dashboard/action'
import { isAuthApiError } from '@/lib/apiAuth'

type StoreOption = {
  _id: string
  name: string
  storeHash: string
  hasWriteContent: boolean
  defaultShopifyBlogId?: string | null
  defaultShopifyBlogTitle?: string | null
}

type BlogCollection = {
  id: string
  title: string
  handle: string
}

type PublishingJob = {
  _id: string
  topic: string
  status: 'generating' | 'queued' | 'publishing' | 'published' | 'failed'
  errorMessage?: string | null
  shopifyArticleUrl?: string | null
  shopifyIsPublished?: boolean
  generatedBlog?: {
    title?: string
    content?: string
    summary?: string
    tags?: string[]
  }
  updatedAt?: string
}

const fieldClass =
  'w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8] focus:border-[#111827]'

const STEPS = [
  'AI blog generated',
  'Blog saved',
  'n8n workflow started',
  'Shopify article created',
  'Publishing status updated',
]

function stepIndex(status: PublishingJob['status']) {
  if (status === 'generating') return 0
  if (status === 'queued') return 2
  if (status === 'publishing') return 3
  if (status === 'published') return 4
  return -1
}

function statusLabel(job: PublishingJob) {
  if (job.status === 'published' && job.shopifyIsPublished) return 'Published'
  if (job.status === 'published') return 'Draft on Shopify'
  if (job.status === 'failed') return 'Failed'
  if (job.status === 'publishing') return 'Publishing'
  if (job.status === 'queued') return 'Queued'
  return 'Generating'
}

export default function BlogPublisherPage() {
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [stores, setStores] = useState<StoreOption[]>([])
  const [collections, setCollections] = useState<BlogCollection[]>([])
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [jobs, setJobs] = useState<PublishingJob[]>([])
  const [activeJob, setActiveJob] = useState<PublishingJob | null>(null)
  const [topic, setTopic] = useState('')
  const [storeId, setStoreId] = useState('')
  const [shopifyBlogId, setShopifyBlogId] = useState('')

  const selectedStore = stores.find((store) => store._id === storeId) || null
  const selectedBlog = collections.find((blog) => blog.id === shopifyBlogId) || null

  const applyHome = (data: { stores?: StoreOption[]; jobs?: PublishingJob[] }) => {
    const nextStores = Array.isArray(data.stores) ? data.stores : []
    const nextJobs = Array.isArray(data.jobs) ? data.jobs : []
    setStores(nextStores)
    setJobs(nextJobs)
    setStoreId((current) => current || nextStores[0]?._id || '')
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBlogPublisherHomeApi()
      if (isAuthApiError(data)) return
      if (!data?.status) {
        toast.error(data?.message || 'Could not load the blog publisher')
        return
      }
      applyHome(data)
    } catch {
      toast.error('Could not load the blog publisher')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!storeId) {
      setCollections([])
      return
    }
    const store = stores.find((item) => item._id === storeId)
    let cancelled = false
    const run = async () => {
      setLoadingCollections(true)
      try {
        const data = await getPublisherShopifyBlogsApi(storeId)
        if (cancelled || isAuthApiError(data)) return
        if (!data?.status) {
          setCollections([])
          return
        }
        const next = Array.isArray(data.blogs) ? data.blogs : []
        setCollections(next)
        setShopifyBlogId((current) => {
          if (current && next.some((blog: BlogCollection) => blog.id === current)) return current
          if (store?.defaultShopifyBlogId && next.some((blog: BlogCollection) => blog.id === store.defaultShopifyBlogId)) {
            return store.defaultShopifyBlogId
          }
          return next.length === 1 ? next[0].id : ''
        })
      } catch {
        if (!cancelled) setCollections([])
      } finally {
        if (!cancelled) setLoadingCollections(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [storeId, stores])

  useEffect(() => {
    if (!activeJob || !['generating', 'queued', 'publishing'].includes(activeJob.status)) return
    const timer = setInterval(async () => {
      const data = await getBlogPublishingJobApi(activeJob._id)
      if (isAuthApiError(data) || !data?.job) return
      setActiveJob(data.job)
      setJobs((prev) => [data.job, ...prev.filter((job) => job._id !== data.job._id)])
    }, 2500)
    return () => clearInterval(timer)
  }, [activeJob])

  const handlePublish = async () => {
    if (topic.trim().length < 3) {
      toast.error('Add a blog topic of at least 3 characters.')
      return
    }
    if (!storeId) {
      toast.error('Select a connected Shopify store.')
      return
    }
    if (selectedStore && !selectedStore.hasWriteContent) {
      toast.error('This store still needs write_content. Reopen Chataffy in Shopify Admin and approve it.')
      return
    }
    if (!shopifyBlogId) {
      toast.error('Select the Shopify blog destination.')
      return
    }
    setRunning(true)
    try {
      const data = await generateAndPublishBlogApi({
        topic: topic.trim(),
        storeId,
        shopifyBlogId,
        shopifyBlogTitle: selectedBlog?.title || '',
      })
      if (isAuthApiError(data)) return
      if (data?.job) {
        setActiveJob(data.job)
        setJobs((prev) => [data.job, ...prev.filter((job) => job._id !== data.job._id)])
      }
      if (!data?.status) {
        toast.error(data?.message || 'Publishing did not finish')
        return
      }
      toast.success('Blog generated. n8n is publishing it to Shopify.')
    } catch {
      toast.error('Could not start publishing')
    } finally {
      setRunning(false)
    }
  }

  const busy = running || ['generating', 'queued', 'publishing'].includes(activeJob?.status || '')
  const reached = activeJob ? stepIndex(activeJob.status) : -1

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA]">
      <TopHead
        title="Blog"
        subtitle="Enter a topic. AI writes the article and n8n publishes it to Shopify."
        showDatePicker={false}
        showWebsiteSelect={false}
        showStatusBadge={false}
      />

      <div className="rounded-tl-[30px] bg-[#F3F4F6] px-4 pb-[33px] pt-6 lg:px-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <div className="rounded-[20px] bg-white p-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]">
            <h2 className="text-[16px] font-bold text-[#111827]">AI Blog Publisher</h2>
            <p className="mt-1 text-[13px] text-[#64748B]">
              One click generates the article and sends it to Shopify.
              {selectedStore ? ` ${selectedStore.name} is connected.` : ''}
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#111827]">Blog topic</span>
                <input
                  className={fieldClass}
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Top 10 AI Trends in 2026"
                  maxLength={500}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-[#111827]">Shopify store</span>
                  <select
                    className={fieldClass}
                    value={storeId}
                    onChange={(event) => {
                      setStoreId(event.target.value)
                      setShopifyBlogId('')
                    }}
                  >
                    <option value="">Select Shopify store</option>
                    {stores.map((store) => (
                      <option key={store._id} value={store._id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-[#111827]">Blog destination</span>
                  <select
                    className={fieldClass}
                    value={shopifyBlogId}
                    onChange={(event) => setShopifyBlogId(event.target.value)}
                    disabled={!storeId || loadingCollections}
                  >
                    <option value="">
                      {loadingCollections ? 'Loading blogs...' : 'Select a Shopify blog'}
                    </option>
                    {collections.map((blog) => (
                      <option key={blog.id} value={blog.id}>
                        {blog.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedStore && !selectedStore.hasWriteContent && (
                <p className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[13px] leading-5 text-[#92400E]">
                  {selectedStore.name} needs the write_content permission before an article can be created.
                </p>
              )}
              {!loading && stores.length === 0 && (
                <p className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[13px] leading-5 text-[#64748B]">
                  No Shopify store is connected on this account. Open Chataffy from Shopify Admin first.
                </p>
              )}

              <button
                type="button"
                onClick={handlePublish}
                disabled={busy}
                className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-[#111827] px-4 text-[13px] font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {busy ? 'Working...' : 'Generate & Publish'}
              </button>

              {activeJob && (
                <div className="rounded-xl border border-[#E2E8F0] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-[#111827]">
                      {activeJob.generatedBlog?.title || activeJob.topic}
                    </p>
                    <span className="rounded bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-medium text-[#64748B]">
                      {statusLabel(activeJob)}
                    </span>
                  </div>
                  <ol className="flex flex-col gap-2">
                    {STEPS.map((label, index) => {
                      const done = reached >= index
                      return (
                        <li key={label} className="flex items-center gap-2 text-[13px] text-[#111827]">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${done ? 'bg-[#111827] text-white' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                            {done ? <Check className="h-3 w-3" /> : index + 1}
                          </span>
                          {label}
                        </li>
                      )
                    })}
                  </ol>
                  {activeJob.generatedBlog?.summary ? (
                    <p className="mt-3 text-[13px] leading-5 text-[#64748B]">{activeJob.generatedBlog.summary}</p>
                  ) : null}
                  {activeJob.errorMessage ? (
                    <p className="mt-3 text-[13px] leading-5 text-[#DC2626]">{activeJob.errorMessage}</p>
                  ) : null}
                  {activeJob.shopifyArticleUrl ? (
                    <a
                      href={activeJob.shopifyArticleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-[13px] font-medium text-[#111827] underline"
                    >
                      {activeJob.shopifyIsPublished ? 'View article on Shopify' : 'Shopify article link'}
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[20px] bg-white p-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]">
            <h2 className="mb-4 text-[16px] font-bold text-[#111827]">Recent publishing</h2>
            {loading ? (
              <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-[13px] leading-5 text-[#64748B]">
                Generated articles and their Shopify status show up here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {jobs.map((job) => (
                  <li key={job._id}>
                    <button
                      type="button"
                      onClick={() => setActiveJob(job)}
                      className={`w-full rounded-xl border px-3 py-3 text-left ${
                        activeJob?._id === job._id ? 'border-[#111827] bg-[#F8FAFC]' : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-semibold text-[#111827]">{job.generatedBlog?.title || job.topic}</p>
                        <span className="shrink-0 text-[11px] font-medium text-[#64748B]">{statusLabel(job)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
