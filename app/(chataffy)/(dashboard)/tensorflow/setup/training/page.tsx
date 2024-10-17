
import { Metadata } from 'next'
import { cookies } from 'next/headers'



export const metadata: Metadata = {
  title: 'Chataffy | training',
  description: 'Chataffy | training',

}

import Training from './_components/training'

export default function Home() {
  const token = cookies().get('token')?.value ?? ''
  return (
    <>
      <Training
      token={token}
      />
    </>
  )
}