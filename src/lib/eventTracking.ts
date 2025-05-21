/**
 * Client-side utility for tracking events
 * This is used to track job views, apply starts, and apply completions
 */

// Define the event types
export type EventType =
  | 'job_viewed'
  | 'apply_started'
  | 'apply_completed'
  | 'ab_test_assignment'
  | 'ab_test_conversion'

// Define the UTM parameters
interface UTMParams {
  source?: string
  medium?: string
  campaign?: string
}

/**
 * Extract UTM parameters from the current URL
 * @returns UTM parameters object
 */
export function extractUtmParams(): UTMParams {
  if (typeof window === 'undefined') return {}

  const url = new URL(window.location.href)
  return {
    source: url.searchParams.get('utm_source') || undefined,
    medium: url.searchParams.get('utm_medium') || undefined,
    campaign: url.searchParams.get('utm_campaign') || undefined,
  }
}

/**
 * Get or create a session ID
 * @returns Session ID
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server-side'

  // Check if we already have a session ID in localStorage
  let sessionId = localStorage.getItem('session_id')

  // If not, create a new one
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem('session_id', sessionId)
  }

  return sessionId
}

/**
 * Track an event
 * @param eventType Type of event to track
 * @param data Data to include with the event (jobId or metadata)
 * @param metadata Additional metadata to include with the event
 * @returns Promise that resolves when the event is tracked
 */
export async function trackEvent(
  eventType: EventType,
  data: string | Record<string, any>,
  metadata?: Record<string, any>,
): Promise<void> {
  try {
    // Get session ID and UTM parameters
    const sessionId = getOrCreateSessionId()
    const utmParams = extractUtmParams()
    const referrer = typeof document !== 'undefined' ? document.referrer : ''

    // Determine if data is a jobId or metadata
    const isJobId = typeof data === 'string'
    const jobId = isJobId ? data : undefined
    const eventData = isJobId ? metadata : data

    // Send the event to the API
    const response = await fetch('/api/events/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        jobId,
        sessionId,
        utmParams,
        referrer,
        metadata: eventData,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error tracking event:', error)
    }
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}

/**
 * Track a job view event
 * @param jobId ID of the job
 * @returns Promise that resolves when the event is tracked
 */
export function trackJobView(jobId: string): Promise<void> {
  return trackEvent('job_viewed', jobId)
}

/**
 * Track an apply started event
 * @param jobId ID of the job
 * @returns Promise that resolves when the event is tracked
 */
export function trackApplyStarted(jobId: string): Promise<void> {
  return trackEvent('apply_started', jobId)
}

/**
 * Track an apply completed event
 * @param jobId ID of the job
 * @returns Promise that resolves when the event is tracked
 */
export function trackApplyCompleted(jobId: string): Promise<void> {
  return trackEvent('apply_completed', jobId)
}

/**
 * Track an A/B test assignment event
 * @param metadata Test assignment metadata
 * @returns Promise that resolves when the event is tracked
 */
export function trackABTestAssignment(metadata: Record<string, any>): Promise<void> {
  return trackEvent('ab_test_assignment', metadata)
}

/**
 * Track an A/B test conversion event
 * @param metadata Test conversion metadata
 * @returns Promise that resolves when the event is tracked
 */
export function trackABTestConversion(metadata: Record<string, any>): Promise<void> {
  return trackEvent('ab_test_conversion', metadata)
}
