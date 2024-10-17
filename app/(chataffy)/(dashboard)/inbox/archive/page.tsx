
import {Metadata} from 'next'
import { cookies } from 'next/headers'



export const metadata: Metadata = {
  title: 'Chataffy | Archive',
  description: 'Chataffy | Archive',
  
}

import Inbox from '../_components/inbox'

export default function Archive() {
  const token = cookies().get('token')?.value ?? ''
  return (
    <><Inbox
      token={token}
    /></>)
}