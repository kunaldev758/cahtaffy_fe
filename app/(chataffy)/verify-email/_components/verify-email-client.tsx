'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { verifyEmailApi, setClientSessionCookies } from '../../../_api/login/action'
import { useSocket, dispatchAuthStorageSync } from '../../../socketContext'
import { LoginForm } from '../../login/_components/login'
import { redirectAfterClientLogin } from '@/lib/postLoginRedirect'
import { setSocketToken } from '@/lib/socketSession'

const TOAST_ID = 'verify-email-result'

export function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const { socket } = useSocket()
  const [ui, setUi] = useState<'verifying' | 'login' | 'redirecting'>('verifying')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      // New-tab / edge cases: ensure we read the query token reliably (JWT must stay intact)
      const token =
        searchParams.get('token') ||
        (typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('token')
          : null)
      if (!token) {
        if (!cancelled) {
          setUi('login')
          toast.error('Invalid or missing verification link', { toastId: TOAST_ID })
        }
        return
      }

      try {
        const response = await verifyEmailApi(token)
        if (cancelled) return

        const ok = response?.status === true || response?.status_code === 200
        const sessionToken = response?.token

        if (ok && sessionToken) {
          setUi('redirecting')
          try {
            await setClientSessionCookies(sessionToken)
          } catch {
            // httpOnly cookies optional for client-driven navigation; sessionStorage backs API calls
          }
          toast.success(response.message || 'Email verified successfully', { toastId: TOAST_ID })
          setSocketToken('client', sessionToken)
          if (response.userId) sessionStorage.setItem('userId', String(response.userId))
          if (response.agents?.length) {
            sessionStorage.setItem('agents', JSON.stringify(response.agents))
            sessionStorage.setItem('currentAgentId', response.agents[0]?._id ?? '')
          }
          dispatchAuthStorageSync()
          if (socket && response.userId) {
            socket.on('user-logged-in', () => {
              socket.emit('join', response.userId)
            })
          }
          redirectAfterClientLogin(!!response.isOnboarded)
          return
        }

        setUi('login')
        toast.error(response?.message || 'Email verification failed', { toastId: TOAST_ID })
      } catch {
        if (!cancelled) {
          setUi('login')
          toast.error('Email verification failed', { toastId: TOAST_ID })
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [searchParams, socket])

  if (ui === 'verifying' || ui === 'redirecting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-gray-600">{ui === 'redirecting' ? 'Redirecting…' : 'Verifying your email…'}</p>
      </div>
    )
  }

  return <LoginForm />
}
