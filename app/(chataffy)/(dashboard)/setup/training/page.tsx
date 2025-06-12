
import { Metadata } from 'next'



export const metadata: Metadata = {
  title: 'Chataffy | training',
  description: 'Chataffy | training',

}

import Training from './_components/training'

export default function Home() {
  return (
    <>
      <Training/>
    </>
  )
}