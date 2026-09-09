import { Metadata } from 'next'
import { ForgetPasswordForm } from './_components/forget-password'

// export const metadata: Metadata = {
//   title: 'Chataffy | Forgot Password',
//   description: 'Chataffy | Forgot Password',
// }

export const metadata: Metadata = {
  title: 'Reset Password | Chataffy Customer Service AI Chatbot',
  description: 'Forgot your password? Reset your Chataffy account quickly and securely to regain access to your Customer Service AI Chatbot and customer support dashboard.',
}


export default function ForgetPasswordPage() {
  return <ForgetPasswordForm />
}
