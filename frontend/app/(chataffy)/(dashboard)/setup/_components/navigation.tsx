'use client'

import Link from "next/link"
import { useSelectedLayoutSegment } from 'next/navigation'

export default function Home() {
  const segment = useSelectedLayoutSegment()
  return (
    <>
      <div className="submenu-sidebar">
        <ul>
          <li className={segment == 'basic-info' ? 'active' : ''}><Link href={`/setup/basic-info`} replace>Basic Info</Link></li>
          <li className={segment == 'training' ? 'active' : ''}><Link href={`/setup/training`} replace>Training</Link></li>
          <li className={segment == 'widget' ? 'active' : ''}><Link href={`/setup/widget`} replace>Widget</Link></li>
        </ul>
      </div>
    </>)
}