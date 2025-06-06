import  { RegistrationForm } from './_components/signup'
import {Metadata} from 'next'

export const metadata: Metadata = {
  title: 'Chataffy | Signup',
  description: 'Chataffy | Signup',
  
}


export default function Home() {

  return (
    <>
      <RegistrationForm />
    </>
  )
}