
import { Metadata } from 'next'
import Widget from './_components/widget'

export const metadata: Metadata = {
  title: 'Chataffy | widget',
  description: 'Chataffy | widget',

}


export default function Home() {

  return (
    <>
    <Widget />
    </>
  )
}