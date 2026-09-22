'use client'

import { useEffect } from 'react'

const RELOAD_FLAG = 'chataffy-chunk-reload'

function isChunkLoadError(value: unknown): boolean {
  if (!value) return false
  const message = value instanceof Error ? value.message : String(value)
  const name = value instanceof Error ? value.name : ''
  return (
    name === 'ChunkLoadError' ||
    message.includes('ChunkLoadError') ||
    message.includes('Loading chunk') ||
    message.includes('Failed to load chunk')
  )
}

export default function ChunkErrorReloader() {
  useEffect(() => {
    const clearFlag = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOAD_FLAG)
      } catch {
        // ignore storage failures
      }
    }, 3000)

    const reloadOnce = () => {
      try {
        if (sessionStorage.getItem(RELOAD_FLAG)) return
        sessionStorage.setItem(RELOAD_FLAG, '1')
      } catch {
        return
      }
      window.location.reload()
    }

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
        reloadOnce()
      }
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        reloadOnce()
      }
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.clearTimeout(clearFlag)
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
