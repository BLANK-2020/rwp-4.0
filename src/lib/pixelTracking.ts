/**
 * Pixel Tracking Utilities
 *
 * This module provides functions to track events with marketing pixels.
 * It includes functions for tracking with Meta Pixel (Facebook), LinkedIn Insight Tag, and Google Tag Manager.
 * It uses tenant-specific pixel IDs fetched from the API.
 */

import { ConsentCategory, hasConsent } from './consentManager'

// Define the event types
export enum PixelEventType {
  JOB_VIEW = 'JobView',
  APPLY_START = 'ApplyStart',
  APPLY_COMPLETE = 'ApplyComplete',
  SEARCH = 'Search',
  FILTER = 'Filter',
}

// Define the event parameters
export interface PixelEventParams {
  jobId?: string
  jobTitle?: string
  jobLocation?: string
  jobSector?: string
  jobType?: string
  searchTerm?: string
  filterType?: string
  filterValue?: string
  [key: string]: any
}

// Define the marketing configuration interface
interface MarketingConfig {
  facebookPixel?: {
    enabled: boolean
    pixelId: string
    advancedMatching: boolean
  }
  googleTagManager?: {
    enabled: boolean
    containerId: string
  }
  linkedInInsightTag?: {
    enabled: boolean
    partnerId: string
  }
  googleAnalytics?: {
    enabled: boolean
    measurementId: string
  }
}

// Cache the marketing configuration to avoid fetching it for every event
let cachedMarketingConfig: MarketingConfig | null = null
let lastFetchTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch the tenant's marketing configuration
 * @returns The marketing configuration
 */
async function getMarketingConfig(): Promise<MarketingConfig | null> {
  // If we have a cached configuration that's not expired, use it
  const now = Date.now()
  if (cachedMarketingConfig && now - lastFetchTime < CACHE_TTL) {
    return cachedMarketingConfig
  }

  try {
    // Get the current hostname
    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    if (!hostname) return null

    // Fetch the tenant configuration based on the hostname
    const response = await fetch(`/api/tenants/marketing-config?hostname=${hostname}`)

    if (response.ok) {
      const data = await response.json()
      cachedMarketingConfig = data.marketingConfig
      lastFetchTime = now
      return cachedMarketingConfig
    } else {
      console.error('Failed to fetch marketing configuration')
      return null
    }
  } catch (error) {
    console.error('Error fetching marketing configuration:', error)
    return null
  }
}

/**
 * Track an event with all marketing pixels
 * @param eventType The type of event to track
 * @param params The event parameters
 */
export async function trackPixelEvent(
  eventType: PixelEventType,
  params: PixelEventParams = {},
): Promise<void> {
  if (!hasConsent(ConsentCategory.MARKETING)) {
    return
  }

  // Get the marketing configuration
  const marketingConfig = await getMarketingConfig()
  if (!marketingConfig) {
    console.warn('No marketing configuration available for tracking')
    return
  }

  // Track with Facebook Pixel
  if (marketingConfig.facebookPixel?.enabled) {
    trackFacebookPixelEvent(eventType, params, marketingConfig.facebookPixel.pixelId)
  }

  // Track with LinkedIn Insight Tag
  if (marketingConfig.linkedInInsightTag?.enabled) {
    trackLinkedInEvent(eventType, params, marketingConfig.linkedInInsightTag.partnerId)
  }

  // Track with Google Tag Manager
  if (marketingConfig.googleTagManager?.enabled) {
    trackGTMEvent(eventType, params)
  }

  // Track with Google Analytics
  if (marketingConfig.googleAnalytics?.enabled) {
    trackGAEvent(eventType, params, marketingConfig.googleAnalytics.measurementId)
  }
}

/**
 * Track an event with Facebook Pixel
 * @param eventType The type of event to track
 * @param params The event parameters
 * @param pixelId The Facebook Pixel ID
 */
function trackFacebookPixelEvent(
  eventType: PixelEventType,
  params: PixelEventParams,
  pixelId: string,
): void {
  if (typeof window === 'undefined' || !window.fbq) {
    return
  }

  // Map event types to Facebook Pixel event names
  const eventMap: Record<PixelEventType, string> = {
    [PixelEventType.JOB_VIEW]: 'ViewContent',
    [PixelEventType.APPLY_START]: 'InitiateCheckout',
    [PixelEventType.APPLY_COMPLETE]: 'Lead',
    [PixelEventType.SEARCH]: 'Search',
    [PixelEventType.FILTER]: 'Search',
  }

  // Map params to Facebook Pixel params
  const fbParams: Record<string, any> = {
    content_type: 'job',
  }

  if (params.jobId) {
    fbParams.content_ids = [params.jobId]
  }

  if (params.jobTitle) {
    fbParams.content_name = params.jobTitle
  }

  if (params.jobLocation) {
    fbParams.content_category = params.jobLocation
  }

  if (params.searchTerm) {
    fbParams.search_string = params.searchTerm
  }

  // Track the event
  window.fbq('track', eventMap[eventType], fbParams)
}

/**
 * Track an event with LinkedIn Insight Tag
 * @param eventType The type of event to track
 * @param params The event parameters
 * @param partnerId The LinkedIn Partner ID
 */
function trackLinkedInEvent(
  eventType: PixelEventType,
  params: PixelEventParams,
  partnerId: string,
): void {
  if (typeof window === 'undefined' || !window.lintrk) {
    return
  }

  // Map event types to LinkedIn Insight Tag event names
  const eventMap: Record<PixelEventType, string> = {
    [PixelEventType.JOB_VIEW]: 'PageView',
    [PixelEventType.APPLY_START]: 'StartApplication',
    [PixelEventType.APPLY_COMPLETE]: 'SubmitApplication',
    [PixelEventType.SEARCH]: 'Search',
    [PixelEventType.FILTER]: 'Filter',
  }

  // Map params to LinkedIn Insight Tag params
  const liParams: Record<string, any> = {}

  if (params.jobId) {
    liParams.job_id = params.jobId
  }

  if (params.jobTitle) {
    liParams.job_title = params.jobTitle
  }

  if (params.jobLocation) {
    liParams.job_location = params.jobLocation
  }

  if (params.searchTerm) {
    liParams.search_term = params.searchTerm
  }

  // Track the event
  window.lintrk('track', { conversion_id: eventMap[eventType], custom_data: liParams })
}

/**
 * Track an event with Google Tag Manager
 * @param eventType The type of event to track
 * @param params The event parameters
 */
function trackGTMEvent(eventType: PixelEventType, params: PixelEventParams): void {
  if (typeof window === 'undefined' || !window.dataLayer) {
    return
  }

  // Push the event to the dataLayer
  window.dataLayer.push({
    event: `job_${eventType.toLowerCase()}`,
    job_id: params.jobId,
    job_title: params.jobTitle,
    job_location: params.jobLocation,
    job_sector: params.jobSector,
    job_type: params.jobType,
    search_term: params.searchTerm,
    filter_type: params.filterType,
    filter_value: params.filterValue,
  })
}

/**
 * Track an event with Google Analytics
 * @param eventType The type of event to track
 * @param params The event parameters
 * @param measurementId The GA4 Measurement ID
 */
function trackGAEvent(
  eventType: PixelEventType,
  params: PixelEventParams,
  measurementId: string,
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  // Map event types to GA4 event names
  const eventMap: Record<PixelEventType, string> = {
    [PixelEventType.JOB_VIEW]: 'view_item',
    [PixelEventType.APPLY_START]: 'begin_checkout',
    [PixelEventType.APPLY_COMPLETE]: 'generate_lead',
    [PixelEventType.SEARCH]: 'search',
    [PixelEventType.FILTER]: 'view_item_list',
  }

  // Map params to GA4 params
  const gaParams: Record<string, any> = {}

  if (params.jobId) {
    gaParams.item_id = params.jobId
  }

  if (params.jobTitle) {
    gaParams.item_name = params.jobTitle
  }

  if (params.jobLocation) {
    gaParams.item_category = params.jobLocation
  }

  if (params.jobSector) {
    gaParams.item_category2 = params.jobSector
  }

  if (params.jobType) {
    gaParams.item_category3 = params.jobType
  }

  if (params.searchTerm) {
    gaParams.search_term = params.searchTerm
  }

  // Track the event
  window.gtag('event', eventMap[eventType], gaParams)
}

/**
 * Track a job view event
 * @param jobId The ID of the job
 * @param jobTitle The title of the job
 * @param jobLocation The location of the job
 * @param jobSector The sector of the job
 * @param jobType The type of the job
 */
export function trackJobViewPixel(
  jobId: string,
  jobTitle: string,
  jobLocation?: string,
  jobSector?: string,
  jobType?: string,
): void {
  trackPixelEvent(PixelEventType.JOB_VIEW, {
    jobId,
    jobTitle,
    jobLocation,
    jobSector,
    jobType,
  })
}

/**
 * Track an apply start event
 * @param jobId The ID of the job
 * @param jobTitle The title of the job
 */
export function trackApplyStartPixel(jobId: string, jobTitle: string): void {
  trackPixelEvent(PixelEventType.APPLY_START, {
    jobId,
    jobTitle,
  })
}

/**
 * Track an apply complete event
 * @param jobId The ID of the job
 * @param jobTitle The title of the job
 */
export function trackApplyCompletePixel(jobId: string, jobTitle: string): void {
  trackPixelEvent(PixelEventType.APPLY_COMPLETE, {
    jobId,
    jobTitle,
  })
}

/**
 * Track a search event
 * @param searchTerm The search term
 */
export function trackSearchPixel(searchTerm: string): void {
  trackPixelEvent(PixelEventType.SEARCH, {
    searchTerm,
  })
}

/**
 * Track a filter event
 * @param filterType The type of filter
 * @param filterValue The value of the filter
 */
export function trackFilterPixel(filterType: string, filterValue: string): void {
  trackPixelEvent(PixelEventType.FILTER, {
    filterType,
    filterValue,
  })
}
