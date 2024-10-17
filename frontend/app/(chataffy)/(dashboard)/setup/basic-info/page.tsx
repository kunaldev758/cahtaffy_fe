
import { Metadata } from 'next'
import { cookies } from 'next/headers'



export const metadata: Metadata = {
  title: 'Chataffy | Basic Info',
  description: 'Chataffy | Basic Info',

}

import TopBar from '../_components/topBar'
import BasicInfoForm from './_components/basicInfoForm'

export default function Home() {
//   const token = cookies().get('token')?.value ?? ''
  return (
    <>
        <TopBar heading={`Basic Information`} />
        <BasicInfoForm />
    </>
  )
}