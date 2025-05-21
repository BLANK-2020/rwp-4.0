'use client'

import React, { useState, useEffect } from 'react'
import {
  ConsentCategory,
  getConsentStatus,
  setConsentStatus,
  acceptAllConsent,
  rejectAllConsent,
} from '../../../lib/consentManager'

/**
 * Consent Banner Component
 *
 * This component displays a banner to get user consent for tracking and marketing pixels.
 * It shows up at the bottom of the page if the user hasn't made a consent choice yet.
 */
export const ConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consentChoices, setConsentChoices] = useState({
    [ConsentCategory.NECESSARY]: true,
    [ConsentCategory.ANALYTICS]: false,
    [ConsentCategory.MARKETING]: false,
    [ConsentCategory.PREFERENCES]: false,
  })

  // Check if we need to show the banner on component mount
  useEffect(() => {
    const status = getConsentStatus()

    // If the user hasn't made a choice for marketing cookies, show the banner
    const hasNoMarketingChoice =
      status[ConsentCategory.MARKETING] === false && status[ConsentCategory.ANALYTICS] === false

    setShowBanner(hasNoMarketingChoice)
    setConsentChoices(status)
  }, [])

  // Handle accepting all cookies
  const handleAcceptAll = () => {
    acceptAllConsent()
    setShowBanner(false)
  }

  // Handle rejecting all optional cookies
  const handleRejectAll = () => {
    rejectAllConsent()
    setShowBanner(false)
  }

  // Handle saving custom choices
  const handleSaveChoices = () => {
    setConsentStatus(consentChoices)
    setShowBanner(false)
  }

  // Handle toggling a specific consent category
  const handleToggleConsent = (category: ConsentCategory) => {
    // Don't allow toggling necessary cookies
    if (category === ConsentCategory.NECESSARY) {
      return
    }

    setConsentChoices((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4 border-t border-gray-200">
      <div className="container mx-auto">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cookie Consent</h3>
              <p className="text-gray-600 mt-1">
                We use cookies to enhance your browsing experience, serve personalized ads or
                content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to
                our use of cookies.
              </p>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {showDetails && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Necessary Cookies</h4>
                    <p className="text-sm text-gray-600">
                      These cookies are essential for the website to function properly.
                    </p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={consentChoices[ConsentCategory.NECESSARY]}
                      disabled
                      className="checked:bg-blue-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-not-allowed"
                    />
                    <label className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-not-allowed"></label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
                    <p className="text-sm text-gray-600">
                      These cookies help us understand how visitors interact with our website.
                    </p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={consentChoices[ConsentCategory.ANALYTICS]}
                      onChange={() => handleToggleConsent(ConsentCategory.ANALYTICS)}
                      className="checked:bg-blue-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Marketing Cookies</h4>
                    <p className="text-sm text-gray-600">
                      These cookies are used to track visitors across websites to display relevant
                      advertisements.
                    </p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={consentChoices[ConsentCategory.MARKETING]}
                      onChange={() => handleToggleConsent(ConsentCategory.MARKETING)}
                      className="checked:bg-blue-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Preferences Cookies</h4>
                    <p className="text-sm text-gray-600">
                      These cookies enable the website to remember your preferences and choices.
                    </p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={consentChoices[ConsentCategory.PREFERENCES]}
                      onChange={() => handleToggleConsent(ConsentCategory.PREFERENCES)}
                      className="checked:bg-blue-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reject All
            </button>
            {showDetails && (
              <button
                onClick={handleSaveChoices}
                className="px-4 py-2 text-blue-700 border border-blue-500 rounded-md hover:bg-blue-50"
              >
                Save Preferences
              </button>
            )}
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
