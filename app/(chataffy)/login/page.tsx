import dynamic from 'next/dynamic'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | Chataffy AI Customer Support Platform',
  description: 'Securely sign in to your Chataffy dashboard to manage your AI Customer Support Platform, monitor live chat and customer conversations and review analytics.',
}

const LoginForm = dynamic(
  () => import('./_components/login').then((mod) => mod.LoginForm),
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
  return <LoginForm />
}
