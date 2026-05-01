
import {Metadata} from 'next'
import { cookies } from 'next/headers'



export const metadata: Metadata = {
  title: 'Chataffy | Inbox',
  description: 'Chataffy | Inbox',
  
}

import Inbox from './_components/inbox'
import { Suspense } from 'react'

export default function Home() {
  const token = cookies().get('token')?.value ?? ''
  return (
    <Suspense fallback={null}>
      <Inbox token={token} />
    </Suspense>
  );
}