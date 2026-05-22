

import { logoutApi } from '@/app/_api/dashboard/action'
import { dispatchAuthStorageSync } from '@/app/socketContext'
import { clearWebAuthStorage } from '@/app/(chataffy)/_lib/embeddedSession'
import { clearSocketToken } from '@/lib/socketSession'
import { useRouter } from 'next/navigation'
import logoutIconPic from '@/images/not-delivery-icon.svg'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()

  return (<><button style={{ border: 'none' }} onClick={async () => {
    await logoutApi()
    clearWebAuthStorage();
    clearSocketToken('client');
    dispatchAuthStorageSync()
    router.replace('/login')
  }}>Logout</button></>)
}