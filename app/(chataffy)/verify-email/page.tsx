import { LoginForm } from '../login/_components/login'
import { Metadata } from 'next'
import {verifyEmailApi} from '../../_api/login/action'

export const metadata: Metadata = {
  title: 'Chataffy | verify Email',
  description: 'Chataffy | verify Email',

}


export default async function Home({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const token = searchParams.token
  const response = await verifyEmailApi(token)
  return (
    <>
    {response.message}
      <LoginForm />
    </>
  )
}