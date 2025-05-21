'use client'

import React, { useEffect } from 'react'
import { trackJobView, trackApplyStarted, trackApplyCompleted } from '../../../lib/eventTracking'
import {
  trackJobViewPixel,
  trackApplyStartPixel,
  trackApplyCompletePixel,
} from '../../../lib/pixelTracking'

interface JobEventTrackerProps {
  jobId: string
  jobTitle: string
  jobLocation?: string
  jobSector?: string
  jobType?: string
  trackView?: boolean
}

/**
 * Client-side component to handle job event tracking
 * This is used to track job views and apply clicks
 */
export const JobEventTracker: React.FC<JobEventTrackerProps> = ({
  jobId,
  jobTitle,
  jobLocation,
  jobSector,
  jobType,
  trackView = true,
}) => {
  // Track job view on component mount
  useEffect(() => {
    if (trackView) {
      // Track with internal event tracking
      trackJobView(jobId)

      // Track with marketing pixels
      trackJobViewPixel(jobId, jobTitle, jobLocation, jobSector, jobType)
    }
  }, [jobId, jobTitle, jobLocation, jobSector, jobType, trackView])

  return null // This component doesn't render anything
}

/**
 * Hook to track apply button clicks
 * @param jobId The ID of the job
 * @param jobTitle The title of the job
 * @returns A function to track apply button clicks
 */
export const useApplyTracking = (jobId: string, jobTitle: string) => {
  return () => {
    // Track with internal event tracking
    trackApplyStarted(jobId)

    // Track with marketing pixels
    trackApplyStartPixel(jobId, jobTitle)
  }
}

/**
 * Component to wrap apply buttons and track clicks
 */
interface ApplyButtonProps {
  jobId: string
  jobTitle: string
  href: string
  children: React.ReactNode
  className?: string
}

export const ApplyButton: React.FC<ApplyButtonProps> = ({
  jobId,
  jobTitle,
  href,
  children,
  className = '',
}) => {
  const handleApplyClick = useApplyTracking(jobId, jobTitle)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(e) => {
        handleApplyClick()
      }}
    >
      {children}
    </a>
  )
}

/**
 * Hook to track apply completion
 * @param jobId The ID of the job
 * @param jobTitle The title of the job
 * @returns A function to track apply completion
 */
export const useApplyCompletionTracking = (jobId: string, jobTitle: string) => {
  return () => {
    // Track with internal event tracking
    trackApplyCompleted(jobId)

    // Track with marketing pixels
    trackApplyCompletePixel(jobId, jobTitle)
  }
}
