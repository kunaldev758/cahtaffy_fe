import dynamic from 'next/dynamic'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Signup Chataffy | Free Forever AI Customer Service Agent',
  description: 'Create your Chataffy account to build your free forever AI customer service agent that automates customer support and enables seamless human handoffs.',
}

const RegistrationForm = dynamic(
  () => import('./_components/signup').then((mod) => mod.RegistrationForm),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-sm text-gray-600">Loading…</p>
      </div>
    ),
  }
)

export default function Home() {
  return <RegistrationForm />
}
