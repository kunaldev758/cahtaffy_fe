

import { Metadata } from 'next'
import WidgetSetup from '../../../onboarding/components/widget-setup'

export const metadata: Metadata = {
  title: 'Chataffy | widget',
  description: 'Chataffy | widget',
}

export default function WidgetSetupPage() {
  return (
    <>
      <div className='rounded-tl-[30px] bg-[#F3F4F6] px-4 pb-[33px] pt-6 lg:px-6 flex gap-6 h-[calc(100%-89px)]'>
        <div className="mx-auto w-full max-w-[1106px] px-[16px]">
          <WidgetSetup />
        </div>
      </div>
    </>
  )
}
