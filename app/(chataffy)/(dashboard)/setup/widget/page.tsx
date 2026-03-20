

import { Metadata } from 'next'
import WidgetSetup from '../../../onboarding/components/widget-setup'

export const metadata: Metadata = {
  title: 'Chataffy | widget',
  description: 'Chataffy | widget',
}

export default function WidgetSetupPage() {
  return (
    <div className="mx-auto w-full max-w-[1106px] px-4 py-6 md:px-6">
      <WidgetSetup />
    </div>
  )
}
