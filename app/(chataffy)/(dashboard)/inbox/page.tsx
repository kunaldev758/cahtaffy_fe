
import {Metadata} from 'next'
import { cookies } from 'next/headers'



export const metadata: Metadata = {
  title: 'Chataffy | Inbox',
  description: 'Chataffy | Inbox',
  
}

import Inbox from './_components/Inbox'

export default function Home() {
  const token = cookies().get('token')?.value ?? ''
  return (
    <><Inbox
      token={token}
    /></>)
}