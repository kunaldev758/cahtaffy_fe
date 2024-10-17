
import {Metadata} from 'next'
import { cookies } from 'next/headers'



export const metadata: Metadata = {
  title: 'Chataffy | Inbox',
  description: 'Chataffy | Inbox',
  
}

import Conversation from './_components/conversation'
import Inbox from './_components/inbox'

export default function Home() {
  const token = cookies().get('token')?.value ?? ''
  return (
    <div className="main-content">
        {/* <Conversation /> */}        
        <Inbox
          token={token}
        />
    </div>
  )
}