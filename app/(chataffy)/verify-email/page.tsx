import { Suspense } from 'react'
import { Metadata } from 'next'
import { VerifyEmailClient } from './_components/verify-email-client'

export const metadata: Metadata = {
  title: 'Chataffy | verify Email',
  description: 'Chataffy | verify Email',
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  )
}
