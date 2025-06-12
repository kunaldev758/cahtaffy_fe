import { LoginForm } from './_components/login'
import {Metadata} from 'next'

export const metadata: Metadata = {
  title: 'Chataffy | login',
  description: 'Chataffy | login',
  
}


export default function Home() {

  return (
    <>
      <LoginForm />
    </>
  )
}