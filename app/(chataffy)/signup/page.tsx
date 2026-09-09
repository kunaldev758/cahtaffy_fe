import  { RegistrationForm } from './_components/signup'
import {Metadata} from 'next'

// export const metadata: Metadata = {
//   title: 'Chataffy | Signup',
//   description: 'Chataffy | Signup',
  
// }

export const metadata: Metadata = {
  title: 'Signup Chataffy | Free Forever AI Customer Service Agent',
  description: 'Create your Chataffy account to build your free forever AI customer service agent that automates customer support and enables seamless human handoffs.',
}

export default function Home() {

  return (
    <>
      <RegistrationForm />
    </>
  )
}