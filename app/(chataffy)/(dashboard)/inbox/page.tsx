
import {Metadata} from 'next'
import { cookies } from 'next/headers'
import { readTokenFromCookieStore } from '@/lib/clientCookie'



export const metadata: Metadata = {
  title: 'Chataffy | Inbox',
  description: 'Chataffy | Inbox',
  
}

import Inbox from './_components/inbox'
import { Suspense } from 'react'

export default function Home() {
  const token = readTokenFromCookieStore(cookies()) ?? ''
  return (
    <Suspense fallback={null}>
      <Inbox token={token} />
    </Suspense>
  );
}