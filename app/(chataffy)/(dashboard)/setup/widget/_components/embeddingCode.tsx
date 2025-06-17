'use client'

import { useEffect, useState } from 'react'
import { getWidgetToken } from '@/app/_api/dashboard/action'
import { useRouter } from 'next/navigation'

export default function EmbeddingCode() {
  const router = useRouter()
  const [widgetId, setWidgetId] = useState('')
  const [widgetToken, setWidgetToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const widgetCode = `${process.env.NEXT_PUBLIC_APP_URL}openai/widget/${widgetId}/${widgetToken}`


  useEffect(() => {
    getWidgetToken().then((data) => {
      if(data=='error'){
        router.push('/login')
      }
      console.log(data,"data this is the data of the widget token")
      setLoading(false)
      if (data.status_code == 200) {
        setWidgetId(data.data.widgetId)
        setWidgetToken(data.data.widgetToken)
      }

    })
  }, [])

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // Avoid scrolling to bottom of page in MS Edge
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
    
    document.body.removeChild(textArea)
  }

  return (
    <>
      {loading ? 'Loading...' :
        <div>
          <div className="break-all bg-gray-50 rounded p-3 text-sm font-mono border border-gray-200 mb-2 max-w-full overflow-x-auto">
            {widgetCode}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                // Try using the Clipboard API first
                if (navigator.clipboard && window.isSecureContext) {
                  navigator.clipboard.writeText(widgetCode)
                    .then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1500)
                    })
                    .catch(() => {
                      // Fallback to execCommand if clipboard API fails
                      fallbackCopyToClipboard(widgetCode)
                    })
                } else {
                  // Fallback for non-secure contexts
                  fallbackCopyToClipboard(widgetCode)
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              {copied ? 'Copied!' : 'Copy Widget'}
            </button>
          </div>
        </div>}
     

    </>
  )
}