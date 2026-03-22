'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSocket } from "../../../../../socketContext"
import { toast } from 'react-toastify'
import { continueScrapping, deleteTrainingDataApi, retrainTrainingDataApi } from '@/app/_api/dashboard/action'

// Components
import AddcontentModal from './addContentModal'
import ContentDetailsModal from './contentDetailsModal'

// UI Components
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Icons
import {
  Globe, FileText, HelpCircle, Plus, Search, Eye,
  RotateCcw, Trash2, Loader2, CheckCircle, Clock,
  XCircle, Zap, AlertCircle, ChevronLeft, ChevronRight, Database, Link as LinkIcon
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrainingItem {
  _id: string
  title: string
  url?: string
  sourceType: 'Web Pages' | 'Doc/Snippets' | 'FAQs' | 'Files'
  lastEdit: string
  status: 'pending' | 'completed' | 'failed'
  trainingStatus: number
  createdAt: string
  fileSize?: number
  type: number
  isActive?: boolean
}

interface ClientData {
  userId?: string
  currentDataSize: number
  upgradePlanStatus: {
    storageLimitExceeded: boolean
    agentLimitExceeded: boolean
    chatLimitExceeded: boolean
  }
  plan: string
  planStatus: string
  paymentStatus?: string
  planExpiry?: Date | null
  billingCycle?: string
  totalAmountPaid?: number
}

interface AgentData {
  _id?: string
  userId?: string
  dataTrainingStatus: number
  scrapingStartTime?: string | Date
  pagesAdded: {
    success: number
    failed: number
    total: number
  }
  isSitemapAdded?: boolean
  filesAdded: number
  faqsAdded: number
}

interface ScrapingProgress {
  percentage: number
  processed: number
  total: number
  elapsedTime: string
  elapsedSeconds: number
  estimatedTimeRemaining: string | null
  estimatedSecondsRemaining: number | null
  isProcessing: boolean
  phase?: 'scraping' | 'training'
  stoppedReason?: string
  error?: boolean
}

// ─── Circular Progress SVG ────────────────────────────────────────────────────

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const size = 68
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#4686FE" strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="middle"
        fill="#111827" fontSize="12" fontWeight="700"
      >
        {percentage}%
      </text>
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EnhancedTrainingPage() {
  const { socket } = useSocket()

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showContentModal, setShowContentModal] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Data states
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [agentData, setAgentData] = useState<AgentData | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [trainingList, setTrainingList] = useState<{
    data: TrainingItem[]
    loading: boolean
    totalCount: number
    currentPage: number
    totalPages: number
  }>({ data: [], loading: true, totalCount: 0, currentPage: 1, totalPages: 0 })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  // Filter / search
  const [searchValue, setSearchValue] = useState('')
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all')
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all')

  // Progress & alert states
  const [showContinueScrapping, setShowContinueScrapping] = useState(false)
  const [scrapingProgress, setScrapingProgress] = useState<ScrapingProgress | null>(null)

  // Row selection
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})

  // Per-row loading states
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [retrainingIds, setRetrainingIds] = useState<Set<string>>(new Set())

  // ── Helpers ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAgentId(localStorage.getItem('currentAgentId'))
    }
  }, [])

  const getSourceTypeFromNumber = (type: number): TrainingItem['sourceType'] => {
    switch (type) {
      case 0: return 'Web Pages'
      case 1: return 'Files'
      case 2: return 'Doc/Snippets'
      case 3: return 'FAQs'
      default: return 'Web Pages'
    }
  }

  const formatDate = (dateValue: string) => {
    if (!dateValue) return '-'
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return '-'
    const d = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const t = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${d}, ${t}`
  }

  const getStatusConfig = (status: number) => {
    const map: Record<number, { label: string; className: string }> = {
      0: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
      1: { label: 'Completed', className: 'bg-green-50 text-green-700 border border-green-200' },
      2: { label: 'Failed', className: 'bg-red-50 text-red-700 border border-red-200' },
    }
    return map[status] ?? map[0]
  }

  // ── Filtered rows (client-side search) ───────────────────────────────────────

  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return trainingList.data
    const kw = searchValue.toLowerCase()
    return trainingList.data.filter(item =>
      item.title.toLowerCase().includes(kw) ||
      (item.url && item.url.toLowerCase().includes(kw))
    )
  }, [trainingList.data, searchValue])

  // ── Selection helpers ─────────────────────────────────────────────────────────

  const allSelected = filteredData.length > 0 && filteredData.every(item => selectedRows[item._id])
  const hasPartialSelection = filteredData.some(item => selectedRows[item._id]) && !allSelected
  const selectedCount = Object.values(selectedRows).filter(Boolean).length
  const selectedIds = Object.entries(selectedRows).filter(([, v]) => v).map(([k]) => k)

  const handleSelectAll = (checked: boolean) => {
    const updated: Record<string, boolean> = { ...selectedRows }
    filteredData.forEach(item => { updated[item._id] = checked })
    setSelectedRows(updated)
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev => ({ ...prev, [id]: checked }))
  }

  // ── Action handlers ───────────────────────────────────────────────────────────

  const handleViewContent = (item: TrainingItem) => {
    setSelectedItemId(item._id)
    setShowContentModal(true)
  }

  const refreshList = () => {
    socket?.emit('get-training-list', {
      skip: (currentPage - 1) * pageSize,
      limit: pageSize,
      sourcetype: sourceTypeFilter,
      actionType: actionTypeFilter,
    })
  }

  const handleDelete = async (ids: string[]) => {
    if (!agentId) { toast.error('Agent ID not found'); return }
    setDeletingIds(prev => new Set([...prev, ...ids]))
    try {
      const res = await deleteTrainingDataApi(ids, agentId)
      if (res?.success) {
        toast.success('Delete job queued successfully')
        setSelectedRows({})
        refreshList()
      } else {
        toast.error(res?.error || 'Failed to delete training data')
      }
    } catch {
      toast.error('Failed to delete training data')
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      })
    }
  }

  const handleRetrain = async (ids: string[]) => {
    if (!agentId) { toast.error('Agent ID not found'); return }
    setRetrainingIds(prev => new Set([...prev, ...ids]))
    try {
      const res = await retrainTrainingDataApi(ids, agentId)
      if (res?.success) {
        toast.success('Retrain job queued successfully')
        setSelectedRows({})
      } else {
        toast.error(res?.error || 'Failed to retrain training data')
      }
    } catch {
      toast.error('Failed to retrain training data')
    } finally {
      setRetrainingIds(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      })
    }
  }

  const handleBulkDelete = () => handleDelete(selectedIds)

  const handleBulkRetrain = () => {
    const webPageIds = selectedIds.filter(id => {
      const item = trainingList.data.find(d => d._id === id)
      return item?.type === 0
    })
    if (webPageIds.length === 0) {
      toast.warning('No web pages selected for retraining')
      return
    }
    handleRetrain(webPageIds)
  }

  const handleContinueScrapping = async () => {
    setShowContinueScrapping(false)
    try {
      const data = await continueScrapping()
      if (data?.success === false) toast.error('Failed to continue scrapping. Please try again.')
    } catch {
      toast.error('Failed to continue scrapping. Please try again.')
    }
  }

  // ── Pagination ────────────────────────────────────────────────────────────────

  const handlePageChange = (page: number) => setCurrentPage(page)
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1) }
  const handleNextPage = () => { if (currentPage < trainingList.totalPages) setCurrentPage(currentPage + 1) }

  // ── Socket ────────────────────────────────────────────────────────────────────

  const setupSocketListeners = () => {
    if (!socket) return

    socket.on('client-connect-response', () => {
      socket.emit('get-agent-data')
      socket.emit('get-client-data')
      socket.emit('get-training-list', {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        sourcetype: sourceTypeFilter,
        actionType: actionTypeFilter,
      })
    })

    socket.on('get-agent-data-response', ({ agentData: data }: any) => setAgentData(data))
    socket.on('get-client-data-response', ({ clientData: data }: any) => setClientData(data))

    socket.on('get-training-list-response', ({ data }: any) => {
      console.log(data, 'get-training-list-response data')
      const transformedData: TrainingItem[] = data?.data?.entries?.map((item: any) => ({
        _id: item._id,
        title: item.title || item.webPage?.url || 'Untitled',
        url: item.webPage?.url,
        sourceType: getSourceTypeFromNumber(item.type),
        lastEdit: item.updatedAt || item.createdAt,
        status: item.status || 'pending',
        trainingStatus: item.trainingStatus || 0,
        createdAt: item.createdAt,
        fileSize: item.fileSize,
        type: item.type,
      })) || []

      const totalCount = data?.data?.pagination?.total || 0
      const totalPages = Math.ceil(totalCount / pageSize)

      setTrainingList({ data: transformedData, loading: false, totalCount, currentPage, totalPages })
    })

    socket.on('show-continue-scrapping-button', () => setShowContinueScrapping(true))

    socket.on('training-event', ({ client, agent, message, scrapingProgress: progress }: any) => {
      if (progress) {
        setScrapingProgress(progress)
        if (!progress.isProcessing && progress.percentage === 100 && !progress.error && !progress.stoppedReason) {
          setTimeout(() => setScrapingProgress(null), 5000)
        }
      } else if (agent?.dataTrainingStatus === 0) {
        setScrapingProgress(null)
      }

      if (agent) {
        if (
          agent.dataTrainingStatus === 1 &&
          agentData?.dataTrainingStatus !== 1 &&
          agentData?.dataTrainingStatus !== null &&
          progress == undefined
        ) {
          toast.info('Training started...')
        } else if (
          agent.dataTrainingStatus === 0 &&
          agentData?.dataTrainingStatus !== 0 &&
          agentData?.dataTrainingStatus !== null
        ) {
          setScrapingProgress(null)
          if (message) { toast.error(message) } else { toast.success('Training completed successfully!') }
        }
        setAgentData(agent)
      }

      if (client) { setClientData(client) }

      socket.emit('get-training-list-count')
      socket.emit('get-training-list', {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        sourcetype: sourceTypeFilter,
        actionType: actionTypeFilter,
      })
    })

    socket.emit('client-connect')
    socket.emit('continue-scrapping-button')
  }

  useEffect(() => { setupSocketListeners() }, [socket])

  useEffect(() => {
    if (socket) {
      socket.emit('get-training-list', {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        sourcetype: sourceTypeFilter,
        actionType: actionTypeFilter,
      })
    }
  }, [sourceTypeFilter, actionTypeFilter, currentPage, socket])

  // ── Checkbox styles ───────────────────────────────────────────────────────────

  const checkboxUiClass =
    'h-[18px] w-[18px] rounded-[5px] border border-[#CBD5E1] shadow-none ' +
    'data-[state=checked]:border-[#111827] data-[state=checked]:bg-[#111827] data-[state=checked]:text-white ' +
    'data-[state=indeterminate]:border-[#111827] data-[state=indeterminate]:bg-[#111827] data-[state=indeterminate]:text-white ' +
    '[&_svg]:h-[12px] [&_svg]:w-[12px]'

  const headerCheckboxUiClass =
    checkboxUiClass +
    ' data-[state=indeterminate]:border-[#CBD5E1] data-[state=indeterminate]:bg-white data-[state=indeterminate]:text-[#111827]'

  const isTrainingActive = agentData?.dataTrainingStatus === 1 || (scrapingProgress?.isProcessing ?? false)

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6" style={{ paddingBottom: selectedCount > 0 ? '80px' : '24px' }}>

      {/* ── Alerts ── */}
      {clientData?.upgradePlanStatus?.storageLimitExceeded && (
        <Alert className="border-orange-200 bg-orange-50 mb-4">
          <Zap className="h-4 w-4" />
          <AlertDescription>Storage limit exceeded. Upgrade your plan to continue training.</AlertDescription>
        </Alert>
      )}

      {showContinueScrapping && (
        <Alert className="border-orange-200 bg-orange-50 mb-4">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Continue your scrapping. Some pages are still left to train.</span>
              <button
                onClick={handleContinueScrapping}
                className="text-sm font-medium text-orange-700 underline ml-4"
              >
                Continue Scrapping
              </button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* Web Pages */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#111827] leading-tight">
                  {agentData?.pagesAdded.total ?? 0}
                </div>
                <div className="text-[13px] text-[#64748B]">Total Web Pages</div>
              </div>
            </div>
            {(agentData?.pagesAdded.failed ?? 0) > 0 && (
              <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md leading-none">
                {agentData?.pagesAdded.failed} Failed
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[#111827] rounded-full transition-all duration-500"
              style={{
                width: `${(agentData?.pagesAdded.total ?? 0) > 0
                  ? Math.round(((agentData?.pagesAdded.success ?? 0) / (agentData?.pagesAdded.total ?? 1)) * 100)
                  : 0}%`
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#64748B]">Data Status</span>
            <span className="text-[#16A34A] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#16A34A] rounded-full" />
              {agentData?.pagesAdded.success ?? 0} Synced
            </span>
          </div>
        </div>

        {/* Files */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#111827] leading-tight">
                  {agentData?.filesAdded ?? 0}
                </div>
                <div className="text-[13px] text-[#64748B]">Total Files</div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[#111827] rounded-full transition-all duration-500"
              style={{ width: (agentData?.filesAdded ?? 0) > 0 ? '100%' : '0%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#64748B]">Data Status</span>
            <span className="text-[#64748B] font-medium">{agentData?.filesAdded ?? 0} Synced</span>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#111827] leading-tight">
                  {agentData?.faqsAdded ?? 0}
                </div>
                <div className="text-[13px] text-[#64748B]">Total FAQs</div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[#111827] rounded-full transition-all duration-500"
              style={{ width: (agentData?.faqsAdded ?? 0) > 0 ? '100%' : '0%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#64748B]">Data Status</span>
            <span className="text-[#64748B] font-medium">{agentData?.faqsAdded ?? 0} Synced</span>
          </div>
        </div>

      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 border-b border-[#F1F5F9]">
          {/* Search */}
          <div className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 flex items-center gap-2 w-full md:w-64">
            <Search className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Search Pages"
              className="text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8] w-full bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            {/* Add Content */}
            <button
              onClick={() => setShowModal(true)}
              disabled={isTrainingActive || clientData?.upgradePlanStatus?.storageLimitExceeded}
              className="inline-flex items-center gap-2 h-10 px-4 bg-[#111827] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1f2937] disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Content
            </button>

            {/* Source filter */}
            <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
              <SelectTrigger className="h-10 w-44 text-[13px] border-[#E2E8F0]">
                <SelectValue placeholder="Show All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Show All Sources</SelectItem>
                <SelectItem value="Web Pages">Web Pages</SelectItem>
                <SelectItem value="Doc/Snippets">Doc/Snippets</SelectItem>
                <SelectItem value="FAQs">FAQs</SelectItem>
                <SelectItem value="Files">Files</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger className="h-10 w-32 text-[13px] border-[#E2E8F0]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Header */}
        <div className="h-11 bg-[#F8FAFC] border-b border-[#F1F5F9] px-4 grid items-center gap-3"
          style={{ gridTemplateColumns: '36px 1fr 130px 170px 120px 108px' }}>
          <Checkbox
            className={headerCheckboxUiClass}
            checked={allSelected ? true : hasPartialSelection ? 'indeterminate' : false}
            onCheckedChange={checked => handleSelectAll(checked === true)}
          />
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">Source Name</span>
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">Type</span>
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">Last Synced</span>
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">Status</span>
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide text-right">Action</span>
        </div>

        {/* Table Body */}
        {trainingList.loading ? (
          <div className="divide-y divide-[#F1F5F9]">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-[54px] px-4 grid items-center gap-3"
                style={{ gridTemplateColumns: '36px 1fr 130px 170px 120px 108px' }}
              >
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Database className="w-10 h-10 text-[#CBD5E1] mb-3" />
            <p className="text-[15px] font-medium text-[#111827] mb-1">No Training Data</p>
            <p className="text-[13px] text-[#64748B]">Start by adding content to train your AI chatbot.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {filteredData.map(item => {
              const statusConfig = getStatusConfig(item.trainingStatus)
              const isDeleting = deletingIds.has(item._id)
              const isRetraining = retrainingIds.has(item._id)
              const isWebPage = item.type === 0

              return (
                <div
                  key={item._id}
                  className="min-h-[54px] px-4 py-2 grid items-center gap-3 hover:bg-[#F8FAFC] transition-colors"
                  style={{ gridTemplateColumns: '36px 1fr 130px 170px 120px 108px' }}
                >
                  {/* Checkbox */}
                  <Checkbox
                    className={checkboxUiClass}
                    checked={!!selectedRows[item._id]}
                    onCheckedChange={checked => handleSelectRow(item._id, checked === true)}
                  />

                  {/* Source Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    {isWebPage ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEF2FF]"
                        title={item.url}
                      >
                        <LinkIcon className="w-[14px] h-[14px] text-[#94A3B8]" />
                      </a>
                    ) : (
                      <FileText className="flex-shrink-0 w-[14px] h-[14px] text-[#94A3B8]" />
                    )}
                    <span
                      className="text-[13px] text-[#111827] truncate"
                      title={item.title}
                    >
                      {item.title}
                    </span>
                  </div>

                  {/* Type */}
                  <span className="text-[12px] text-[#64748B] font-medium truncate">{item.sourceType}</span>

                  {/* Last Synced */}
                  <span className="text-[12px] text-[#64748B]">{formatDate(item.lastEdit)}</span>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      onClick={() => handleViewContent(item)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9] transition-colors"
                      title="View content"
                    >
                      <Eye className="w-[15px] h-[15px]" />
                    </button>

                    {isWebPage && (
                      <button
                        onClick={() => handleRetrain([item._id])}
                        disabled={isRetraining}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#111827] hover:bg-[#F1F5F9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Retrain"
                      >
                        {isRetraining
                          ? <Loader2 className="w-[15px] h-[15px] animate-spin" />
                          : <RotateCcw className="w-[15px] h-[15px]" />
                        }
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete([item._id])}
                      disabled={isDeleting}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      {isDeleting
                        ? <Loader2 className="w-[15px] h-[15px] animate-spin" />
                        : <Trash2 className="w-[15px] h-[15px]" />
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {trainingList.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
            <p className="text-[13px] text-[#64748B]">
              Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, trainingList.totalCount)} of {trainingList.totalCount}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, trainingList.totalPages) }, (_, i) => {
                let pg: number
                if (trainingList.totalPages <= 5) pg = i + 1
                else if (currentPage <= 3) pg = i + 1
                else if (currentPage >= trainingList.totalPages - 2) pg = trainingList.totalPages - 4 + i
                else pg = currentPage - 2 + i

                return (
                  <button
                    key={i}
                    onClick={() => handlePageChange(pg)}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                      currentPage === pg
                        ? 'bg-[#111827] text-white'
                        : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {pg}
                  </button>
                )
              })}

              <button
                onClick={handleNextPage}
                disabled={currentPage >= trainingList.totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Training Progress Card (fixed bottom-left) ── */}
      {isTrainingActive && (
        <div className={`fixed left-6 bg-white rounded-xl border border-[#E2E8F0] shadow-lg p-4 flex items-center gap-4 z-50 min-w-[280px] ${selectedCount > 0 ? 'bottom-20' : 'bottom-6'}`}>
          <CircularProgress percentage={scrapingProgress?.percentage ?? 0} />
          <div className="flex flex-col gap-0.5">
            <p className="text-[14px] font-semibold text-[#111827]">Training Progress</p>
            {scrapingProgress ? (
              <>
                <p className="text-[12px] text-[#64748B]">
                  Processing {scrapingProgress.processed}/{scrapingProgress.total} pages
                </p>
                {scrapingProgress.estimatedTimeRemaining && (
                  <p className="text-[12px] text-[#64748B]">
                    Estimated time: {scrapingProgress.estimatedTimeRemaining}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[12px] text-[#64748B]">Preparing training job...</p>
            )}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#16A34A] mt-0.5">
              <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-pulse" />
              Running
            </span>
          </div>
        </div>
      )}

      {/* ── Bulk Action Bar ── */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-6 py-3 flex items-center justify-between z-40 shadow-lg">
          <p className="text-[13px] text-[#64748B]">
            <span className="font-semibold text-[#111827]">{selectedCount} selected</span>
            {' '}will apply to selected content
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 h-9 px-4 text-[13px] font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
            <button
              onClick={handleBulkRetrain}
              className="inline-flex items-center gap-2 h-9 px-4 text-[13px] font-semibold text-white bg-[#111827] rounded-lg hover:bg-[#1f2937] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retrain Selection
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <AddcontentModal showModal={showModal} onHide={() => setShowModal(false)} />

      {selectedItemId && (
        <ContentDetailsModal
          show={showContentModal}
          onHide={() => { setShowContentModal(false); setSelectedItemId(null) }}
          itemId={selectedItemId}
        />
      )}
    </div>
  )
}
