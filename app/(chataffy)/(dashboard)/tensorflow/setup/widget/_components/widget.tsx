
'use client'

import { useEffect, useState } from 'react'
import { getWidgetToken } from '@/app/_api/dashboard/action'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [widgetId, setWidgetId] = useState('')
  const [widgetToken, setWidgetToken] = useState('')
  const [loading, setLoading] = useState(true)

  const widgetCode = `${process.env.NEXT_PUBLIC_APP_URL}tensorflow/widget/${widgetId}/${widgetToken}`


  useEffect(() => {
    getWidgetToken().then((data) => {
      if(data=='error'){
        router.push('/login')
      }
      setLoading(false)
      if (data.status_code == 200) {
        setWidgetId(data.data.widgetId)
        setWidgetToken(data.data.widgetToken)
      }

    })
  }, [])

  return (
    <>
      {loading ? 'Loading...' :
        <div>
          <div>{widgetCode}</div>
          <div><button onClick={() => { navigator.clipboard.writeText(widgetCode) }}> Copy Widget</button></div>
        </div>}
     

    </>
  )
}