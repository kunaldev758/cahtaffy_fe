import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Calendar, Copy, ExternalLink, File, FileText, Globe, RotateCcw, ShieldCheck } from 'lucide-react'
// import DOMPurify from "isomorphic-dompurify";
import sanitizeHtml from 'sanitize-html'
import { getDataField } from '../../../../../_api/dashboard/action'

interface ContentData {
  _id: string
  title: string
  content: string
  fileContent: string
  type: number
  trainingStatus: number
  dataSize: number
  lastEdit: string
  createdAt: string
  webPage?: {
    url: string
  }
}

interface ContentDetailsModalProps {
  show: boolean
  onHide: () => void
  itemId: string
}

export default function ContentDetailsModal({ show, onHide, itemId }: ContentDetailsModalProps) {
  const [contentData, setContentData] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchContentData = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await getDataField(id);
      setContentData(response.data)
    } catch (err) {
      console.error('Error fetching content data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load content data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (show && itemId) {
      fetchContentData(itemId)
    }
  }, [show, itemId])

  const getContentTypeInfo = (type: number) => {
    const types = {
      0: {
        name: 'Web Page',
        icon: <span className="material-symbols-outlined text-[#64748B] !text-[20px]">language</span>,
      },
      1: {
        name: 'File',
        icon: <span className="material-symbols-outlined text-[#64748B] !text-[20px]">files</span>,
      },
      2: {
        name: 'Doc/Snippets',
        icon: <span className="material-symbols-outlined text-[#64748B] !text-[20px]">article</span>,
      },
      3: {
        name: 'FAQ',
        icon: <span className="material-symbols-outlined text-[#64748B] !text-[20px]">quiz</span>,
      }
    }
    return types[type as keyof typeof types] || types[0]
  }

  const getTrainingStatusInfo = (status: number) => {
    const statuses = {
      0: { name: 'Sync Pending', subtitle: 'Content is in processing queue.', dot: 'bg-[#D97706]' },
      1: { name: 'Syns Completed', subtitle: 'All data has been successfully vectorized.', dot: 'bg-[#34D399]' },
      2: { name: 'Sync Failed', subtitle: 'This content could not be synchronized.', dot: 'bg-[#EF4444]' },
      10: { name: 'Upgrade Required', subtitle: 'Upgrade plan to continue synchronization.', dot: 'bg-[#6366F1]' }
    }
    return statuses[status as keyof typeof statuses] || statuses[0]
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString).getTime()
    const now = Date.now()
    const diff = Math.max(0, now - date)
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
    const days = Math.floor(hrs / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  const getRawContent = () => contentData?.content || contentData?.fileContent || ''

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(getRawContent())
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  if (!show) return null

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-[1040px] border border-[#E2E8F0] bg-[#F8FAFC] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Content Details</DialogTitle>
          <DialogDescription>
            View detailed information about this training item
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="grid grid-cols-[280px_1fr] min-h-[620px]">
            <div className="border-r border-[#E2E8F0] bg-[#F8FAFC] p-[20px]">
              <Skeleton className="h-10 w-10 rounded-[12px]" />
              <Skeleton className="mt-5 h-7 w-36" />
              <Skeleton className="mt-2 h-4 w-40" />
            </div>
            <div className="p-[20px]">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="mt-4 h-[420px] w-full rounded-[16px]" />
            </div>
          </div>
        ) : error ? (
          <Alert className="m-6 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Error loading content: {error}</span>
                <Button variant="outline" size="sm" onClick={() => fetchContentData(itemId)}>
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : contentData ? (
          <div className="grid grid-cols-[300px_1fr]">
            <aside className="border-r border-[#E2E8F0] bg-[#F8FAFC] p-[20px] flex flex-col justify-between gap-[20px]">
              <div className='flex flex-col gap-[16px]'>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#4686FE] bg-[#EFF5FF] text-[#3B82F6]">
                  <span className="material-symbols-outlined text-[#4686FE] !text-[20px]">
                    database
                  </span>
                </div>

                <div className='flex flex-col gap-[4px]'>
                  <h3 className="text-[22px] leading-7 font-light text-[#111827]">Content Details</h3>
                  <p className="text-[13px] font-normal text-[#64748B]">Source Identity & Metadata</p>
                </div>
              </div>

              <div className="space-y-7">
                <InfoBlock
                  label="Resource Type"
                  value={getContentTypeInfo(contentData.type).name}
                  icon={getContentTypeInfo(contentData.type).icon}
                />
                <InfoBlock
                  label="Data Size"
                  value={formatBytes(contentData.dataSize)}
                  icon={<File className="h-[18px] w-[18px]" />}
                />
                <InfoBlock
                  label="Created"
                  value={formatDate(contentData.createdAt)}
                  icon={<Calendar className="h-[18px] w-[18px]" />}
                />
                <InfoBlock
                  label="Last Synchronization"
                  value={getRelativeTime(contentData.lastEdit)}
                  icon={<RotateCcw className="h-[18px] w-[18px]" />}
                />
              </div>

              <div className="flex flex-col gap-[16px]">
                <Button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold">
                  <span className="material-symbols-outlined text-[#ffffff] !text-[20px]">
                    rotate_left
                  </span>
                  Retrain
                </Button>
                <Button variant="outline" onClick={onHide} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#ffffff] px-[20px] text-center text-[14px] leading-5 transition-colors duration-200  font-semibold text-[#111827]">
                  Close
                </Button>
              </div>
            </aside>

            <section className="bg-[#ffffff] p-[20px] flex flex-col gap-[20px]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#A7F3D0] bg-[#ECFDF5] text-[#34D399]">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-[14px] font-medium text-[#111827]">
                      <span className={`h-2.5 w-2.5 rounded-full ${getTrainingStatusInfo(contentData.trainingStatus).dot}`} />
                      {getTrainingStatusInfo(contentData.trainingStatus).name}
                    </p>
                    <p className="mt-1 text-[13px] font-normal text-[#64748B]">{getTrainingStatusInfo(contentData.trainingStatus).subtitle}</p>
                  </div>
                </div>
                <div className="min-w-[220px]">
                  <p className="text-[14px] font-medium text-[#111827]">Origin Endpoint</p>
                  {contentData?.webPage?.url ? (
                    <a
                      href={contentData.webPage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block truncate max-w-[220px] text-[14px] font-normal text-[#4686FE] hover:underline"
                    >
                      {contentData.webPage.url}
                    </a>
                  ) : (
                    <p className="mt-2 text-[14px] font-normal text-[#64748B]">N/A</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="flex items-center gap-2 text-[12px] font-bold tracking-wide text-[#111827]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />
                  DATA STREAM OUTPUT
                </p>
                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="inline-flex items-center gap-1.5 text-[12px] font-normal text-[#64748B] hover:text-[#111827]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy RAW'}
                </button>
              </div>

              <div className="rounded-[20px] bg-[#0B1736] p-6">
                {(() => {
                  const rawContent = getRawContent()
                  const looksLikeHtml = typeof rawContent === 'string' && /<[^>]+>/i.test(rawContent.trim())

                  if (looksLikeHtml) {
                    const sanitizedHTML = sanitizeHtml(rawContent, {
                      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
                      allowedAttributes: {
                        a: ['href', 'name', 'target', 'rel'],
                        img: ['src', 'alt'],
                      },
                      transformTags: {
                        a: sanitizeHtml.simpleTransform('a', {
                          target: '_blank',
                          rel: 'noopener noreferrer',
                        }),
                      },
                    })

                    return (
                      <div
                        className="max-h-[430px] overflow-y-auto text-[24px] leading-9 text-[#E2E8F0] [&_a]:text-[#93C5FD] [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
                      />
                    )
                  }

                  return (
                    <pre className="max-h-[430px] overflow-y-auto whitespace-pre-wrap text-[14px] leading-6 text-[#E2E8F0]">
                      {rawContent}
                    </pre>
                  )
                })()}
              </div>
            </section>
          </div>
        ) : (
          <Alert className="m-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No content data available for this item.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InfoBlock({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-2'>
      <p className="text-[14px] font-medium text-[#111827]">{label}</p>
      <p className="inline-flex items-center gap-2 text-[14px] font-normal text-[#64748B]">
        {icon}
        {value}
      </p>
    </div>
  )
}