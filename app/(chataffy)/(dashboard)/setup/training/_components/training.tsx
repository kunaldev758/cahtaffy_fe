'use client'

import Image from 'next/image'
import AddcontentModal from './addContentModal'
import { useEffect, useState } from 'react'
import ScrapeProgressTracker from './scrapeProgressTracker'
import { logoutApi } from '@/app/_api/dashboard/action'
import { useRouter } from 'next/navigation'
import { useSocket } from "../../../../../socketContext";
import { toast } from 'react-toastify';

// Images
import webPageIconPic from '@/images/web-page-icon.svg'
import docSnippetsIconPic from '@/images/doc-snippets-icon.svg'
import faqIconPic from '@/images/faq-icon.svg'

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

// Data Table components
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

// Icons
import { 
  PlusIcon, 
  MoreHorizontalIcon, 
  EditIcon, 
  TrashIcon,
  EyeIcon,
  Download
} from 'lucide-react'

// Types
interface TrainingItem {
  _id: string
  title: string
  url?: string
  sourceType: 'Web Pages' | 'Doc/Snippets' | 'FAQs'
  lastEdit: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  trainingStatus: number
  createdAt: string
  fileSize?: number
}

// Column definitions for the data table
const createColumns = (
  onEdit: (item: TrainingItem) => void,
  onDelete: (item: TrainingItem) => void,
  onView: (item: TrainingItem) => void
): ColumnDef<TrainingItem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
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
          <div className="font-medium text-gray-900 truncate max-w-[300px]" title={item.title}>
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
      }
      
      return (
        <Badge variant="secondary" className={variants[sourceType] || "bg-gray-100 text-gray-800"}>
          {sourceType}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "lastEdit",
    header: "Last Edit",
    cell: ({ row }) => {
      const dateValue = row.getValue("lastEdit")
      
      // Handle invalid or missing dates
      if (!dateValue) {
        return <div className="text-sm text-gray-400">-</div>
      }
      
      const date = new Date(dateValue)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return <div className="text-sm text-gray-400">-</div>
      }
      
      return (
        <div className="text-sm text-gray-600">
          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.trainingStatus
      const statusConfig: Record<number, { label: string; className: string }> = {
        0: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
        1: { label: "Processing", className: "bg-blue-100 text-blue-800" },
        2: { label: "Crawled", className: "bg-indigo-100 text-indigo-800" },
        3: { label: "Minified", className: "bg-orange-100 text-orange-800" },
        4: { label: "Completed", className: "bg-green-100 text-green-800" },
        5: { label: "Failed", className: "bg-red-100 text-red-800" },
      }
      
      const config = statusConfig[status] || statusConfig[0]
      
      return (
        <Badge variant="secondary" className={config.className}>
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
              <span className="sr-only">Open menu</span>
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(item)}>
              <EyeIcon className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <EditIcon className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(item)}
              className="text-red-600 focus:text-red-600"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function ModernTrainingPage() {
  const router = useRouter()
  const { socket } = useSocket();

  const [showModal, setShowModal] = useState(false)
  const [webPageCount, setWebPageCount] = useState({ crawled: 0, total: 0, loading: true })
  const [docCount, setDocCount] = useState({ crawled: 0, total: 0, loading: true })
  const [faqCount, setFaqCount] = useState({ crawled: 0, total: 0, loading: true })
  const [credit, setCredit] = useState({ used: 0, total: 0 })
  const [trainingList, setTrainingList] = useState<{ data: TrainingItem[], loading: boolean }>({ 
    data: [], 
    loading: true 
  })
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("all")
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all")
  
  // Progress tracking states
  const [scrapeProgress, setScrapeProgress] = useState({
    status: 'waiting',
    stage: '',
    total: 0,
    scrapingCompleted: 0,
    minifyingCompleted: 0,
    trainingCompleted: 0,
    failed: 0,
    overallProgress: 0
  });
  const [isScrapingComplete, setIsScrapingComplete] = useState(false);
  const [completionStats, setCompletionStats] = useState({} as any);
  const [showProgressTracker, setShowProgressTracker] = useState(false);

  // Action handlers
  const handleView = (item: TrainingItem) => {
    console.log('View item:', item)
    // Implement view logic
  }

  const handleEdit = (item: TrainingItem) => {
    console.log('Edit item:', item)
    // Implement edit logic
  }

  const handleDelete = (item: TrainingItem) => {
    console.log('Delete item:', item)
    // Implement delete logic
    if (confirm('Are you sure you want to delete this item?')) {
      // Call delete API
    }
  }

  // Create columns with action handlers
  const columns = createColumns(handleEdit, handleDelete, handleView)

  const getData = () => {
    if (!socket) return;
    setTrainingList({ data: [], loading: true });
    
    socket.on('client-connect-response', function () {
      socket.emit('get-credit-count')
      socket.emit('get-training-list-count')
      socket.emit('get-training-list', { 
        skip: 0, 
        limit: 1000, // Get all data for client-side pagination
        sourcetype: sourceTypeFilter,
        actionType: actionTypeFilter 
      })
    })

    socket.on('get-credit-count-response', function ({ data }: any) {
      setCredit({ used: data.used, total: data.total })
    })

    socket.on('get-training-list-count-response', function ({ data }: any) {
      setWebPageCount({ crawled: data.crawledPages, total: data.totalPages, loading: false })
      setDocCount({ crawled: data.crawledDocs, total: data.totalDocs, loading: false })
      setFaqCount({ crawled: data.crawledFaqs, total: data.totalFaqs, loading: false })
    })

    socket.on('get-training-list-response', function ({ data }: any) {
      console.log(data, "training list data");
      // Transform data to match our interface
      const transformedData: TrainingItem[] = data.map((item: any) => ({
        _id: item._id,
        title: item.title || item.url || 'Untitled',
        url: item.url,
        sourceType: item.sourceType || 'Web Pages',
        lastEdit: item.updatedAt || item.createdAt,
        status: item.status || 'pending',
        trainingStatus: item.trainingStatus || 0,
        createdAt: item.createdAt,
        fileSize: item.fileSize
      }))
      
      setTrainingList({ data: transformedData, loading: false })
    })

    socket.on('error-handler', async function (data: any) {
      await logoutApi()
      router.replace('/login')
    })

    socket.on('web-page-error-insufficient-credits', async function (data: any) {
      toast.error("Insufficient credits")
    })

    socket.on('web-page-error', async function (data: any) {
      toast.error("Something went wrong Training Stopped")
    })

    // Progress tracking socket events
    socket.on('scraping-progress', (data) => {
      console.log("scraping-progress data", data)
      setScrapeProgress(data);
      setShowProgressTracker(true);
      if (data.status === 'complete') {
        setIsScrapingComplete(true);
      }
    });

    socket.on('scraping-complete', (data) => {
      setCompletionStats(data);
      setIsScrapingComplete(true);
      
      socket.emit('get-credit-count');
      socket.emit('get-training-list-count');
      socket.emit('get-training-list', { 
        skip: 0, 
        limit: 1000,
        sourcetype: sourceTypeFilter,
        actionType: actionTypeFilter 
      });
      
      setTimeout(() => {
        setShowProgressTracker(false);
      }, 5000);
    });

    socket.on('web-pages-added', function (data: any) {
      console.log("added", data);
      setShowProgressTracker(true);
      
      socket.emit('get-credit-count')
      socket.emit('get-training-list-count')
      socket.emit('get-training-list', { 
        skip: 0, 
        limit: 1000,
        sourcetype: sourceTypeFilter,
        actionType: actionTypeFilter 
      })
    }) 

    socket.on('faq-added', ({ trainingList }) => {
      const newItem: TrainingItem = {
        _id: trainingList._id,
        title: trainingList.title || 'New FAQ',
        sourceType: 'FAQs',
        lastEdit: trainingList.createdAt,
        status: 'pending',
        trainingStatus: 0,
        createdAt: trainingList.createdAt
      }
      
      setTrainingList((prev) => ({
        data: [newItem, ...prev.data],
        loading: false,
      }));
      socket.emit('get-training-list-count')
    });

    socket.on('doc-snippet-added', ({ trainingList }) => {
      const newItem: TrainingItem = {
        _id: trainingList._id,
        title: trainingList.title || 'New Document',
        sourceType: 'Doc/Snippets',
        lastEdit: trainingList.createdAt,
        status: 'pending',
        trainingStatus: 0,
        createdAt: trainingList.createdAt
      }
      
      setTrainingList((prev) => ({
        data: [newItem, ...prev.data],
        loading: false,
      }));
      socket.emit('get-training-list-count')
    });

    socket.emit('client-connect')
  }

  useEffect(() => {
    getData()
  }, [])

  useEffect(() => {
    if (socket) {
      socket.emit('get-training-list', { 
        skip: 0,
        limit: 1000,
        sourcetype: sourceTypeFilter,
        actionType: actionTypeFilter 
      })
    }
  }, [sourceTypeFilter, actionTypeFilter])

  const creditPercentage = credit.total > 0 ? (credit.used / credit.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your AI training data and content</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Credit Display */}
            <Card className="min-w-48">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Free Credit</span>
                  <span className="text-sm font-bold text-gray-900">
                    {credit.used}/{credit.total}
                  </span>
                </div>
                <Progress value={creditPercentage} className="h-2" />
              </CardContent>
            </Card>

            {/* Add Content Button */}
            <Button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      {showProgressTracker && (
        <ScrapeProgressTracker 
          progress={scrapeProgress}
          isComplete={isScrapingComplete}
          completionStats={completionStats}
          onClose={() => setShowProgressTracker(false)}
        />
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Web Pages Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-medium">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Image src={webPageIconPic} alt="Web Pages" width={20} height={20} />
                </div>
                Web Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  {webPageCount.loading ? (
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {webPageCount.crawled.toLocaleString()}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Crawled Pages</p>
                </div>
                <div className="text-center">
                  {webPageCount.loading ? (
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {webPageCount.total.toLocaleString()}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Total Pages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doc/Snippets Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-medium">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Image src={docSnippetsIconPic} alt="Documents" width={20} height={20} />
                </div>
                Doc/Snippets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  {docCount.loading ? (
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {docCount.crawled.toLocaleString()}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Crawled Docs</p>
                </div>
                <div className="text-center">
                  {docCount.loading ? (
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {docCount.total.toLocaleString()}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Total Docs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQs Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-medium">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Image src={faqIconPic} alt="FAQs" width={20} height={20} />
                </div>
                FAQs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  {faqCount.loading ? (
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {faqCount.crawled.toLocaleString()}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Crawled FAQs</p>
                </div>
                <div className="text-center">
                  {faqCount.loading ? (
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {faqCount.total.toLocaleString()}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Total FAQs</p>
                </div>
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
                  </SelectContent>
                </Select>

                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="Action 1">Action 1</SelectItem>
                    <SelectItem value="Action 2">Action 2</SelectItem>
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
            ) : (
              <DataTable 
                columns={columns} 
                data={trainingList.data}
                searchKey="title"
                searchPlaceholder="Search training data..."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <AddcontentModal
        showModal={showModal}
        onHide={() => setShowModal(false)}
      />
    </div>
  )
}