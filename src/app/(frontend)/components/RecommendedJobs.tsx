'use client'

import React, { useEffect, useState } from 'react'
import { JobCard, Job } from './JobCard'

interface RecommendedJobsProps {
  currentJobId?: string
  limit?: number
}

/**
 * Recommended Jobs Component
 *
 * This component displays a list of recommended jobs based on the user's
 * view history or similarity to the current job being viewed.
 */
export const RecommendedJobs: React.FC<RecommendedJobsProps> = ({ currentJobId, limit = 3 }) => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendedJobs = async () => {
      try {
        setIsLoading(true)

        // Build the API URL
        const url = new URL('/api/jobs/recommended', window.location.origin)

        // Add parameters
        if (currentJobId) {
          url.searchParams.append('jobId', currentJobId)
        }
        url.searchParams.append('limit', limit.toString())

        // Fetch the recommended jobs
        const response = await fetch(url.toString())

        if (!response.ok) {
          throw new Error(`Failed to fetch recommended jobs: ${response.statusText}`)
        }

        const data = await response.json()
        setJobs(data.jobs)
      } catch (err) {
        console.error('Error fetching recommended jobs:', err)
        setError('Failed to load recommended jobs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendedJobs()
  }, [currentJobId, limit])

  // Don't render anything if there are no recommendations
  if (!isLoading && (jobs.length === 0 || error)) {
    return null
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended for You</h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job as Job} />
          ))}
        </div>
      )}
    </div>
  )
}
