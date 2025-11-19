'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from "../../../../../socketContext"
import { toast } from 'react-toastify'
import { logoutApi } from '@/app/_api/dashboard/action'
import { continueScrapping } from '@/app/_api/dashboard/action'

// Components
import AddcontentModal from './addContentModal'
import ContentDetailsModal from './contentDetailsModal'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Icons
import { 
  PlusIcon, 
  MoreHorizontalIcon, 
  EditIcon, 
  TrashIcon, 
  EyeIcon, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  Database,
  FileText,
  HelpCircle,
  Globe,
  Loader2,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Types
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
  userId: string
  dataTrainingStatus: number // 0-NoCurrentScrapping, 1-RunningScrapping
  pagesAdded: {
    success: number
    failed: number
    total: number
  }
  filesAdded: number
  faqsAdded: number
  currentDataSize: number
  upgradePlanStatus: {
    storageLimitExceeded: boolean
    agentLimitExceeded: boolean
    chatLimitExceeded: boolean
  }
  plan: string
  planStatus: string
  paymentStatus: string
  planExpiry: Date | null
  billingCycle: string
  totalAmountPaid: number
}

interface ErrorItem {
  id: string
  message: string
  type: 'error' | 'warning'
  timestamp: Date
  source?: string
}

export default function EnhancedTrainingPage() {
  const router = useRouter()
  const { socket } = useSocket()

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showContentModal, setShowContentModal] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Data states
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [trainingList, setTrainingList] = useState<{ 
    data: TrainingItem[], 
    loading: boolean,
    totalCount: number,
    currentPage: number,
    totalPages: number
  }>({ 
    data: [], 
    loading: true,
    totalCount: 0,
    currentPage: 1,
    totalPages: 0
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20) // You can make this configurable if needed

  // Filter states
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("all")
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all")
  
  // Progress and error states
  const [showContinueScrapping,setShowContinueScrapping] =useState(false)
  const [errors, setErrors] = useState<ErrorItem[]>([])

  // Helper functions
  const addError = (message: string, type: 'error' | 'warning' = 'error', source?: string) => {
    const newError: ErrorItem = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
      source
    }
    setErrors(prev => [newError, ...prev.slice(0, 4)]) // Keep only last 5 errors
  }

  const clearErrors = () => {
    setErrors([])
  }

  const getSourceTypeFromNumber = (type: number): TrainingItem['sourceType'] => {
    switch(type) {
      case 0: return 'Web Pages'
      case 1: return 'Files'
      case 2: return 'Doc/Snippets'
      case 3: return 'FAQs'
      default: return 'Web Pages'
    }
  }

  const getStatusLabel = (status: number) => {
    const statusMap: Record<number, { label: string; className: string; icon: React.ReactNode }> = {
      0: { label: "Pending", className: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> },
      1: { label: "Completed", className: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
      2: { label: "Failed", className: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" /> },
    }
    return statusMap[status] || statusMap[0]
  }

  const getTrainingStatusMessage = (dataTrainingStatus: number) => {
    switch(dataTrainingStatus) {
      case 0:
        return { message: "No training in progress", color: "text-gray-600", icon: <CheckCircle className="w-4 h-4" /> }
      case 1:
        return { message: "Training in progress...", color: "text-blue-600", icon: <Loader2 className="w-4 h-4 animate-spin" /> }
      default:
        return { message: "Unknown status", color: "text-gray-600", icon: <Clock className="w-4 h-4" /> }
    }
  }

  const handleContinueScrapping = async () => {
    try {
      setShowContinueScrapping(false);
      const data = await continueScrapping()
      if(data?.success == false){
        addError('Failed to continue scrapping. Please try again.', 'error', 'Scrapping');
      }
      // Handle the response data as needed
    } catch (error) {
      console.error('Error in continue scrapping:', error);
      addError('Failed to continue scrapping. Please try again.', 'error', 'Scrapping');
    }
  }

  // Action handlers
  const handleViewContent = (item: TrainingItem) => {
    setSelectedItemId(item._id)
    setShowContentModal(true)
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < trainingList.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Column definitions
  const columns: ColumnDef<TrainingItem>[] = [
    {
      id: "select",
      // header: ({ table }) => (
        // <Checkbox
        //   checked={table.getIsAllPageRowsSelected()}
        //   onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        //   aria-label="Select all"
        // />
      // ),
      // cell: ({ row }) => (
        // <Checkbox
        //   checked={row.getIsSelected()}
        //   onCheckedChange={(value) => row.toggleSelected(!!value)}
        //   aria-label="Select row"
        // />
      // ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Title/URL",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="space-y-1">
            <div 
              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer truncate max-w-[300px]" 
              title={item.title}
              onClick={() => handleViewContent(item)}
            >
              {item.title}
            </div>
            {item.url && (
              <div className="text-xs text-gray-500 truncate max-w-[300px]" title={item.url}>
                {item.url}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "sourceType",
      header: "Type",
      cell: ({ row }) => {
        const sourceType = row.getValue("sourceType") as string
        const variants: Record<string, string> = {
          "Web Pages": "bg-blue-100 text-blue-800",
          "Doc/Snippets": "bg-green-100 text-green-800",
          "FAQs": "bg-purple-100 text-purple-800",
          "Files": "bg-orange-100 text-orange-800",
        }
        
        return (
          <Badge variant="secondary" className={variants[sourceType] || "bg-gray-100 text-gray-800"}>
            {sourceType}
          </Badge>
        )
      },
    },
    {
      accessorKey: "lastEdit",
      header: "Last Edit",
      cell: ({ row }) => {
        const dateValue = row.getValue("lastEdit")
        if (!dateValue) return <div className="text-sm text-gray-400">-</div>
        
        const date = new Date(dateValue as any)
        if (isNaN(date.getTime())) return <div className="text-sm text-gray-400">-</div>
        
        return (
          <div className="text-sm text-gray-600">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )
      },
    },
    {
      accessorKey: "trainingStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.trainingStatus
        const config = getStatusLabel(status)
        
        return (
          <Badge variant="secondary" className={`${config.className} flex items-center gap-1`}>
            {config.icon}
            {config.label}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewContent(item)}>
                <EyeIcon className="mr-2 h-4 w-4" />
                View Content
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Socket event handlers
  const setupSocketListeners = () => {
    if (!socket) return

    // Basic connection and data fetching
    socket.on('client-connect-response', function () {
      socket.emit('get-training-list-count')
      socket.emit('get-training-list', { 
        skip: (currentPage - 1) * pageSize, 
        limit: pageSize,
        sourcetype: sourceTypeFilter,
        actionType: actionTypeFilter 
      })
    })

    // Updated handler for the new client data response
    socket.on('get-training-list-count-response', function ({ data }: any) {
      console.log(data, "client data response");
      setClientData(data)
    })

    socket.on('get-training-list-response', function ({ data }: any) {
      console.log(data, "get-training-list-response data");
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
      
      const totalCount = data?.data?.pagination?.total || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      setTrainingList({ 
        data: transformedData, 
        loading: false,
        totalCount,
        currentPage,
        totalPages
      })
    })

    socket.on('show-continue-scrapping-button',function({data}:any) {
      console.log("show-continue-scrapping-button'")
      setShowContinueScrapping(true);
    })

    // Main training event handler - handles all training-related updates
    socket.on('training-event', function({ client, message }: { client?: ClientData, message?: string }) {
      console.log('Training event received:', { client, message })
      
      if (client) {
        setClientData(client)
        
        // Handle different training states
        if (client.dataTrainingStatus === 1 && clientData?.dataTrainingStatus !== 1) {
          // setShowProgressTracker(true)
          toast.info('Training started...')
        } else if (client.dataTrainingStatus === 0 && clientData?.dataTrainingStatus !== 0) {
          // setShowProgressTracker(false)
          if (message) {
            // if (message.includes('error') || message.includes('failed')) {
            toast.error(message)
            addError(message, 'error', 'Training')
          }
          else {
            toast.success('Training completed successfully!')
          }

        }

        // Handle upgrade plan status alerts
        if (client.upgradePlanStatus) {
          if (client.upgradePlanStatus.storageLimitExceeded) {
            addError('Storage limit exceeded. Please upgrade your plan to continue.', 'warning', 'Storage')
          }
        }
      }

      if (message) {
        console.log('Training message:', message)
      }

      // Refresh data after training events
      socket.emit('get-training-list-count')
      socket.emit('get-training-list', { 
        skip: (currentPage - 1) * pageSize, 
        limit: pageSize,
        sourcetype: sourceTypeFilter,
        actionType: actionTypeFilter 
      })
    })

    // Connect
    socket.emit('client-connect')
    socket.emit('continue-scrapping-button')
  }

  useEffect(() => {
    setupSocketListeners()
  }, [socket])

  useEffect(() => {
    if (socket) {
      socket.emit('get-training-list', { 
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        sourcetype: sourceTypeFilter,
        actionType: actionTypeFilter 
      })
    }
  }, [sourceTypeFilter, actionTypeFilter, currentPage, socket])

  // Calculate totals and percentages
  const totalItems = clientData ? (clientData.pagesAdded.total + clientData.filesAdded + clientData.faqsAdded) : 0
  const totalSuccess = clientData ? (clientData.pagesAdded.success + clientData.filesAdded + clientData.faqsAdded) : 0
  const totalFailed = clientData ? clientData.pagesAdded.failed : 0
  const successRate = totalItems > 0 ? (totalSuccess / totalItems) * 100 : 0

  const trainingStatus = clientData ? getTrainingStatusMessage(clientData.dataTrainingStatus) : null

  console.log(trainingList.data,"trainingList.data")
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your AI training data and content</p>
            {trainingStatus && (
              <div className={`flex items-center gap-2 mt-2 text-sm ${trainingStatus.color}`}>
                {trainingStatus.icon}
                {trainingStatus.message}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* Plan Information */}
            {/* {clientData && (
              <Card className="min-w-48">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Plan</span>
                    <Badge variant={clientData.plan === 'free' ? 'secondary' : 'default'}>
                      {clientData.plan.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    Status: {clientData.planStatus}
                  </div>
                  {clientData.currentDataSize > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Data: {formatDataSize(clientData.currentDataSize)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )} */}

            {/* Add Content Button */}
            <Button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={clientData?.dataTrainingStatus === 1 || clientData?.upgradePlanStatus?.storageLimitExceeded}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </div>
        </div>
      </div>

      {/* Upgrade Plan Alerts */}
      {clientData?.upgradePlanStatus && (
        <div className="mx-6 mt-4 space-y-2">
          {clientData.upgradePlanStatus.storageLimitExceeded && (
            <Alert className="border-orange-200 bg-orange-50">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Storage limit exceeded. Upgrade your plan to continue training.</span>
                  {/* <Button size="sm" variant="outline">
                    Upgrade Plan
                  </Button> */}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

  {showContinueScrapping && (
        <div className="mx-6 mt-4 space-y-2">
          {/* {clientData.upgradePlanStatus.storageLimitExceeded && ( */}
            <Alert className="border-orange-200 bg-orange-50">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Continue your scrapping Some Pages are still left to train.</span>
                  <Button size="sm" variant="outline" onClick={handleContinueScrapping}>
                    Continue Scrapping
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          {/* )} */}
        </div>
      )}


      {/* Error Block */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 mx-6 mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Recent Errors</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={clearErrors}>
              Clear All
            </Button>
          </div>
          <div className="space-y-2">
            {errors.map((error) => (
              <Alert key={error.id} className="border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{error.source}: </span>
                      {error.message}
                    </div>
                    <span className="text-xs text-gray-500">
                      {error.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Training Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Web Pages Summary */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-medium">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                Web Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span className="font-medium">{clientData?.pagesAdded.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success:</span>
                  <span className="font-medium text-green-600">{clientData?.pagesAdded.success || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed:</span>
                  <span className="font-medium text-red-600">{clientData?.pagesAdded.failed || 0}</span>
                </div>
                {/* {clientData?.pagesAdded.total > 0 && (
                  <Progress 
                    value={(clientData.pagesAdded.success / clientData.pagesAdded.total) * 100} 
                    className="h-2 mt-2" 
                  />
                )} */}
              </div>
            </CardContent>
          </Card>

          {/* Files Summary */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-medium">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Added:</span>
                  <span className="font-medium">{clientData?.filesAdded || 0}</span>
                </div>
                {/* <div className="flex justify-between text-sm">
                  <span>Data Size:</span>
                  <span className="font-medium text-blue-600">
                    {formatDataSize(clientData?.currentDataSize || 0)}
                  </span>
                </div> */}
              </div>
            </CardContent>
          </Card>

          {/* FAQs Summary */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-medium">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                </div>
                FAQs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Added:</span>
                  <span className="font-medium">{clientData?.faqsAdded || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Summary */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-medium">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                </div>
                Overall
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Items:</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success:</span>
                  <span className="font-medium text-green-600">{totalSuccess}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed:</span>
                  <span className="font-medium text-red-600">{totalFailed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success Rate:</span>
                  <span className="font-medium text-blue-600">{successRate.toFixed(1)}%</span>
                </div>
                {totalItems > 0 && (
                  <Progress value={successRate} className="h-2 mt-2" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <CardTitle>Training Data</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Training Status Indicator */}
                {clientData && (
                  <div className="flex items-center gap-2">
                    {clientData.dataTrainingStatus === 1 ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Training Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                  </div>
                )}

                {/* Filters */}
                <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Show All Sources</SelectItem>
                    <SelectItem value="Web Pages">Web Pages</SelectItem>
                    <SelectItem value="Doc/Snippets">Doc/Snippets</SelectItem>
                    <SelectItem value="FAQs">FAQs</SelectItem>
                    <SelectItem value="Files">Files</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    {/* <SelectItem value="processing">Processing</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trainingList.loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[300px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[50px]" />
                  </div>
                ))}
              </div>
            ) : trainingList.data.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Training Data</h3>
                <p className="text-gray-500 mb-4">
                  Start by adding content to train your AI chatbot.
                </p>
                <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Your First Content
                </Button>
              </div>
            ) : (
              <>
                <DataTable 
                  columns={columns} 
                  data={trainingList.data}
                  searchKey="title"
                  searchPlaceholder="Search training data..."
                  showPagination={false}
                  // manualPagination={true}
                />
                {/* Pagination Controls */}
                {trainingList.totalPages > 1 && (
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">
                        Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                        {Math.min(currentPage * pageSize, trainingList.totalCount)} of{' '}
                        {trainingList.totalCount} results
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, trainingList.totalPages) }, (_, i) => {
                          const pageNumber = i + 1;
                          if (trainingList.totalPages <= 5) {
                            return (
                              <Button
                                key={pageNumber}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNumber)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNumber}
                              </Button>
                            );
                          } else {
                            // More complex pagination logic for many pages
                            let displayPage;
                            if (i === 0) displayPage = 1;
                            else if (i === 4) displayPage = trainingList.totalPages;
                            else if (currentPage <= 3) displayPage = i + 1;
                            else if (currentPage >= trainingList.totalPages - 2) displayPage = trainingList.totalPages - 4 + i;
                            else displayPage = currentPage - 2 + i;
                            
                            return (
                              <Button
                                key={i}
                                variant={currentPage === displayPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(displayPage)}
                                className="w-8 h-8 p-0"
                              >
                                {displayPage}
                              </Button>
                            );
                          }
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage >= trainingList.totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Modals */}
      <AddcontentModal
        showModal={showModal}
        onHide={() => setShowModal(false)}
      />

      {selectedItemId && (
        <ContentDetailsModal
          show={showContentModal}
          onHide={() => {
            setShowContentModal(false)
            setSelectedItemId(null)
          }}
          itemId={selectedItemId}
        />
      )}
    </div>
  )
}