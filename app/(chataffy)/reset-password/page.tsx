import { Suspense } from 'react'
import { Metadata } from 'next'
import { ResetPasswordForm } from './_components/reset-password'

export const metadata: Metadata = {
  title: 'Chataffy | Reset Password',
  description: 'Chataffy | Reset Password',
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
