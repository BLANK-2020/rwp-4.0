/**
 * Consent Manager
 *
 * This module handles user consent for tracking and marketing pixels.
 * It provides functions to get, set, and check consent status.
 */

// Define the consent categories
export enum ConsentCategory {
  NECESSARY = 'necessary',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PREFERENCES = 'preferences',
}

// Define the consent status
export interface ConsentStatus {
  [ConsentCategory.NECESSARY]: boolean // Always true, as necessary cookies are required
  [ConsentCategory.ANALYTICS]: boolean
  [ConsentCategory.MARKETING]: boolean
  [ConsentCategory.PREFERENCES]: boolean
}

// Default consent status (necessary cookies are always allowed)
const DEFAULT_CONSENT: ConsentStatus = {
  [ConsentCategory.NECESSARY]: true,
  [ConsentCategory.ANALYTICS]: false,
  [ConsentCategory.MARKETING]: false,
  [ConsentCategory.PREFERENCES]: false,
}

// Cookie name for storing consent
const CONSENT_COOKIE_NAME = 'consent_status'

/**
 * Get the current consent status from cookies
 * @returns The current consent status
 */
export function getConsentStatus(): ConsentStatus {
  if (typeof window === 'undefined') {
    return DEFAULT_CONSENT
  }

  try {
    const consentCookie = getCookie(CONSENT_COOKIE_NAME)
    if (!consentCookie) {
      return DEFAULT_CONSENT
    }

    const parsedConsent = JSON.parse(consentCookie)
    return {
      ...DEFAULT_CONSENT,
      ...parsedConsent,
    }
  } catch (error) {
    console.error('Error parsing consent cookie:', error)
    return DEFAULT_CONSENT
  }
}

/**
 * Set the consent status
 * @param status The consent status to set
 */
export function setConsentStatus(status: Partial<ConsentStatus>): void {
  if (typeof window === 'undefined') {
    return
  }

  const currentStatus = getConsentStatus()
  const newStatus = {
    ...currentStatus,
    ...status,
    [ConsentCategory.NECESSARY]: true, // Always set necessary to true
  }

  // Save to cookie (expires in 365 days)
  setCookie(CONSENT_COOKIE_NAME, JSON.stringify(newStatus), 365)

  // Trigger consent change event
  window.dispatchEvent(new CustomEvent('consentChanged', { detail: newStatus }))
}

/**
 * Check if consent is given for a specific category
 * @param category The consent category to check
 * @returns True if consent is given, false otherwise
 */
export function hasConsent(category: ConsentCategory): boolean {
  const status = getConsentStatus()
  return status[category] === true
}

/**
 * Accept all consent categories
 */
export function acceptAllConsent(): void {
  setConsentStatus({
    [ConsentCategory.ANALYTICS]: true,
    [ConsentCategory.MARKETING]: true,
    [ConsentCategory.PREFERENCES]: true,
  })
}

/**
 * Reject all optional consent categories
 */
export function rejectAllConsent(): void {
  setConsentStatus({
    [ConsentCategory.ANALYTICS]: false,
    [ConsentCategory.MARKETING]: false,
    [ConsentCategory.PREFERENCES]: false,
  })
}

/**
 * Helper function to get a cookie value
 * @param name The name of the cookie
 * @returns The cookie value or null if not found
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1))
    }
  }
  return null
}

/**
 * Helper function to set a cookie
 * @param name The name of the cookie
 * @param value The value of the cookie
 * @param days The number of days until the cookie expires
 */
function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') {
    return
  }

  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`
}
