

import { logoutApi } from '@/app/_api/dashboard/action'
import { useRouter } from 'next/navigation'
import logoutIconPic from '@/images/not-delivery-icon.svg'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()

  return (<><button style={{ border: 'none' }} onClick={async () => {
    await logoutApi()
    localStorage.clear();
    router.replace('/login')
  }}>Logout</button></>)
}