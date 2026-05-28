import { Metadata } from 'next'
import { ForgetPasswordForm } from './_components/forget-password'

export const metadata: Metadata = {
  title: 'Chataffy | Forgot Password',
  description: 'Chataffy | Forgot Password',
}

export default function ForgetPasswordPage() {
  return <ForgetPasswordForm />
}
