import { LoginForm } from './_components/login'
import {Metadata} from 'next'

// export const metadata: Metadata = {
//   title: 'Chataffy | login',
//   description: 'Chataffy | login',
  
// }


export const metadata: Metadata = {
  title: 'Login | Chataffy AI Customer Support Platform',
  description: 'Securely sign in to your Chataffy dashboard to manage your AI Customer Support Platform, monitor live chat and customer conversations and review analytics.',
}

export default function Home() {

  return (
    <>
      <LoginForm />
    </>
  )
}