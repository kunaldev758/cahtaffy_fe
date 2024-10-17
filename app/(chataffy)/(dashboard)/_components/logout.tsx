

import { logoutApi } from '@/app/_api/dashboard/action'
import { useRouter } from 'next/navigation'
import logoutIconPic from '@/images/not-delivery-icon.svg'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()

  return (<><button style={{ border: 'none' }} onClick={async () => {
    await logoutApi()
    router.replace('/login')
  }}><Image src={logoutIconPic} alt="Logout" title="Logout" width={26} height={26} /></button></>)
}