import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, Clock, AlertCircle, FileText, Globe, MessageSquare, File, Zap } from 'lucide-react'
import {getDataField} from '../../../../../_api/dashboard/action'

interface ContentData {
  _id: string
  title: string
  content: string
  type: number
  trainingStatus: number
  dataSize: number
  lastEdit: string
  createdAt: string
  webPage?: {
    url:string
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
      0: { name: 'Web Page', icon: <Globe className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800' },
      1: { name: 'File', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800' },
      2: { name: 'Doc/Snippets', icon: <FileText className="w-4 h-4" />, color: 'bg-green-100 text-green-800' },
      3: { name: 'FAQ', icon: <File className="w-4 h-4" />, color: 'bg-orange-100 text-orange-800' }
    }
    return types[type as keyof typeof types] || types[0]
  }

  const getTrainingStatusInfo = (status: number) => {
    const statuses = {
      0: { name: 'Pending', icon: <Clock className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-800', progress: 25 },
      1: { name: 'Completed', icon: <Clock className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800', progress: 100 },
      2: { name: 'Failed', icon: <Clock className="w-4 h-4" />, color: 'bg-red-100 text-red-800', progress: 0 },
      10: { name: 'Upgrade Plan', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-800', progress: 0 }
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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!show) return null

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Content Details</DialogTitle>
          <DialogDescription>
            View detailed information about this training item
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : error ? (
          <Alert className="border-red-200">
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
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <FileText className="w-5 h-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Title</label>
                    <p className="text-sm text-gray-900 mt-1">{contentData.title?contentData.title:contentData?.webPage?.url}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <div className="mt-1">
                      <Badge className={`${getContentTypeInfo(contentData.type).color} flex items-center gap-1 w-fit`}>
                        {getContentTypeInfo(contentData.type).icon}
                        {getContentTypeInfo(contentData.type).name}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Data Size</label>
                    <p className="text-sm text-gray-900 mt-1">{formatBytes(contentData.dataSize)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(contentData.createdAt)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Edit</label>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(contentData.lastEdit)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Training Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Status</label>
                    <div className="mt-1">
                      <Badge className={`${getTrainingStatusInfo(contentData.trainingStatus).color} flex items-center gap-1 w-fit`}>
                        {getTrainingStatusInfo(contentData.trainingStatus).icon}
                        {getTrainingStatusInfo(contentData.trainingStatus).name}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Progress</label>
                    <div className="mt-2">
                      <Progress value={getTrainingStatusInfo(contentData.trainingStatus).progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {getTrainingStatusInfo(contentData.trainingStatus).progress}% Complete
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <FileText className="w-5 h-5 mr-2" />
                  Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {contentData.content}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={onHide}>
                Close
              </Button>
              {/* <Button onClick={() => {
                // Implement edit functionality
                console.log('Edit content:', contentData._id)
              }}>
                Edit Content
              </Button> */}
            </div>
          </div>
        ) : (
          <Alert>
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