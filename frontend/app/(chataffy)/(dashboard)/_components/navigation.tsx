'use client'

import Link from "next/link"
import Image from 'next/image'
import { basePath } from '../../../../next.config'
import logoPic from '@/images/logo.png'
import trainingIconPic from '@/images/training-icon.svg'
import inboxMenuIconPic from '@/images/inbox-menu-icon.svg'
import profileIconPic from '@/images/profile-icon.svg'
import { useSelectedLayoutSegment } from 'next/navigation'
import Logout from './logout'

export default function Home() {
  const segment = useSelectedLayoutSegment()

  const imageLoader = ({ src, width, quality }:any) => {
    return `${src}?w=${width}&q=${quality || 75}`
  }

  return (
    <>
      <div className="sidebar-area">
        <div className="sidebar-small">
          <div className="sidebar-small-menu sidebar-small-top">
            <ul>
              <li><Link href={`/dashboard`} replace><Image loader={imageLoader} src={logoPic} alt="Chataffy" title="Chataffy" width={18} height={34} /></Link></li>
              {/* <li><hr/></li>
              <li><strong>Open AI</strong></li> */}
              <li className={segment == 'setup' ? 'active' : ''}><Link href={`/setup/basic-info`} replace><Image src={trainingIconPic} alt="Training" title="Training" width={26} height={26} /></Link></li>
              <li className={segment == 'inbox' ? 'active' : ''}><Link href={`/inbox`} replace><Image src={inboxMenuIconPic} alt="Inbox" title="Inbox" width={26} height={26} /></Link></li>
              {/* <li><hr/></li>
              <li><hr/></li>
              <li><strong>Tensor Flow</strong></li>
              <li className={segment == 'setup' ? 'active' : ''}><Link href={`/tensorflow/setup/training`} replace><Image src={trainingIconPic} alt="Training" title="Training" width={26} height={26} /></Link></li>
              <li className={segment == 'inbox' ? 'active' : ''}><Link href={`/tensorflow/inbox`} replace><Image src={docSnippetsIconPic} alt="Inbox" title="Inbox" width={26} height={26} /></Link></li>
              <li><hr/></li>
              <li><hr/></li> */}
            </ul>
          </div>
          <div className="sidebar-small-menu sidebar-small-bottom">
              <ul>
                <li className={segment == 'profile' ? 'active' : ''}><Link href={`/profile`} replace><Image src={profileIconPic} alt="Profile" title="Profile" width={26} height={26} /></Link></li>
                <li><Logout /></li>
              </ul>
          </div>
        </div>
      </div>
    </>)
}