'use client'

import React, { useEffect, useState } from 'react'

interface ABTestJobDescriptionProps {
  jobId: string
  jobTitle: string
  defaultDescription: string
  testId?: string
  className?: string
}

/**
 * A/B Test Job Description Component
 *
 * This component displays a job description with A/B testing.
 * It tests different description variations to see which performs better.
 */
export const ABTestJobDescription: React.FC<ABTestJobDescriptionProps> = ({
  jobId,
  jobTitle,
  defaultDescription,
  testId,
  className = 'prose max-w-none',
}) => {
  const [description, setDescription] = useState<string>(defaultDescription)

  // In a real application, this would fetch test variations from an API
  // and track impressions and conversions
  useEffect(() => {
    // For now, we'll just use the default description
    // In a real A/B test, we would randomly select a variation
    setDescription(defaultDescription)

    // Track the impression
    console.log(`Tracking impression for job ${jobId}, test ${testId}`)

    // This would be a call to an analytics service in a real application
  }, [jobId, testId, defaultDescription])

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: description }}
      data-testid="job-description"
    />
  )
}

export default ABTestJobDescription
