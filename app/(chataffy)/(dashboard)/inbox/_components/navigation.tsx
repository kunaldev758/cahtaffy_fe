'use client'

import Link from "next/link"
import { useSelectedLayoutSegment } from 'next/navigation'

export default function Home() {
  const segment = useSelectedLayoutSegment()
  return (
    <>
      <div className="submenu-sidebar">
        <ul>
          <li className={segment == 'inbox' ? 'active' : ''}><Link href={`/inbox`} replace>Your Inbox</Link></li>
          <li className={segment == 'archive' ? 'active' : ''}><Link href={`/inbox/archive`} replace>Archive</Link></li>
        </ul>
      </div>
    </>)
}