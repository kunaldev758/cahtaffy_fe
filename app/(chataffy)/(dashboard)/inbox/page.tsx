
import {Metadata} from 'next'
import { cookies } from 'next/headers'
import { CLIENT_TOKEN, LEGACY_TOKEN } from '@/lib/authCookies'



export const metadata: Metadata = {
  title: 'Chataffy | Inbox',
  description: 'Chataffy | Inbox',
  
}

import Inbox from './_components/inbox'
import InboxSkeleton from './_components/InboxSkeleton'
import { Suspense } from 'react'

export default function Home() {
  const token =
    cookies().get(CLIENT_TOKEN)?.value ??
    cookies().get(LEGACY_TOKEN)?.value ??
    ''
  return (
    <Suspense fallback={<InboxSkeleton />}>
      <Inbox token={token} />
    </Suspense>
  );
}