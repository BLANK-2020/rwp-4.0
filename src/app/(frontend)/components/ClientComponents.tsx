'use client'

import React from 'react'
import { ConsentBanner } from './ConsentBanner'
import { MarketingPixels } from './MarketingPixels'

/**
 * Client Components Wrapper
 *
 * This component wraps all client-side components that need to be included in the layout.
 * It's used to separate client-side code from the server component layout.
 */
export const ClientComponents: React.FC = () => {
  return (
    <>
      <ConsentBanner />
      <MarketingPixels />
    </>
  )
}
