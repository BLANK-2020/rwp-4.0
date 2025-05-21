'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Briefcase, DollarSign, Calendar, Building } from 'lucide-react'
import { format } from 'date-fns'

import JobSearchBar from '../components/JobSearchBar'

interface Job {
  id: string
  slug: string
  title: string
  company: string
  location: string
  jobType: string
  salary: string
  description: string
  postedDate: Date
  logo?: string
}

export default function JobsPage() {
  const searchParams = useSearchParams()

  // Get search parameters
  const query = searchParams.get('query') || ''
  const location = searchParams.get('location') || ''
  const jobType = searchParams.get('jobType') || ''

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch jobs data
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)

        // In a real application, you would fetch this data from an API
        // with the search parameters
        // For now, we'll just use mock data
        const mockJobs: Job[] = [
          {
            id: '1',
            slug: 'senior-software-engineer',
            title: 'Senior Software Engineer',
            company: 'Acme Inc.',
            location: 'London, UK (Hybrid)',
            jobType: 'Full-time',
            salary: '£70,000 - £90,000',
            description:
              'We are looking for a Senior Software Engineer to join our growing team...',
            postedDate: new Date('2025-05-01'),
            logo: '/acme-logo.png',
          },
          {
            id: '2',
            slug: 'product-manager',
            title: 'Product Manager',
            company: 'TechCorp',
            location: 'Manchester, UK',
            jobType: 'Full-time',
            salary: '£65,000 - £80,000',
            description:
              'TechCorp is seeking an experienced Product Manager to lead our product development...',
            postedDate: new Date('2025-05-03'),
            logo: '/techcorp-logo.png',
          },
          {
            id: '3',
            slug: 'ux-designer',
            title: 'UX Designer',
            company: 'DesignHub',
            location: 'Remote',
            jobType: 'Contract',
            salary: '£500 - £600 per day',
            description:
              'DesignHub is looking for a talented UX Designer to join our remote team...',
            postedDate: new Date('2025-05-05'),
            logo: '/designhub-logo.png',
          },
          {
            id: '4',
            slug: 'data-scientist',
            title: 'Data Scientist',
            company: 'DataWorks',
            location: 'Edinburgh, UK',
            jobType: 'Full-time',
            salary: '£60,000 - £75,000',
            description: 'DataWorks is seeking a Data Scientist to join our analytics team...',
            postedDate: new Date('2025-05-07'),
            logo: '/dataworks-logo.png',
          },
          {
            id: '5',
            slug: 'devops-engineer',
            title: 'DevOps Engineer',
            company: 'CloudTech',
            location: 'Bristol, UK (Hybrid)',
            jobType: 'Full-time',
            salary: '£65,000 - £85,000',
            description:
              'CloudTech is looking for a DevOps Engineer to help us scale our infrastructure...',
            postedDate: new Date('2025-05-10'),
            logo: '/cloudtech-logo.png',
          },
        ]

        // Filter jobs based on search parameters
        let filteredJobs = [...mockJobs]

        if (query) {
          const queryLower = query.toLowerCase()
          filteredJobs = filteredJobs.filter(
            (job) =>
              job.title.toLowerCase().includes(queryLower) ||
              job.company.toLowerCase().includes(queryLower) ||
              job.description.toLowerCase().includes(queryLower),
          )
        }

        if (location) {
          const locationLower = location.toLowerCase()
          filteredJobs = filteredJobs.filter((job) =>
            job.location.toLowerCase().includes(locationLower),
          )
        }

        if (jobType) {
          filteredJobs = filteredJobs.filter((job) => job.jobType === jobType)
        }

        setJobs(filteredJobs)
        setError(null)
      } catch (err) {
        console.error('Error fetching jobs:', err)
        setError('Failed to fetch jobs. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [query, location, jobType])

  // Format posted date as "X days ago"
  const formatPostedDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else {
      return `${diffDays} days ago`
    }
  }

  // Handle search
  const handleSearch = (newQuery: string, newLocation: string, newJobType: string) => {
    console.log('Search:', { newQuery, newLocation, newJobType })
    // The search is handled by the JobSearchBar component
    // which updates the URL parameters
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Your Perfect Job</h1>

      {/* Search bar */}
      <div className="mb-8">
        <JobSearchBar onSearch={handleSearch} />
      </div>

      {/* Search results */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {loading ? 'Searching...' : `${jobs.length} jobs found`}
          {(query || location || jobType) && ' for '}
          {query && <span className="text-blue-600">{query}</span>}
          {query && (location || jobType) && ', '}
          {location && <span className="text-blue-600">{location}</span>}
          {(query || location) && jobType && ', '}
          {jobType && <span className="text-blue-600">{jobType}</span>}
        </h2>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* No results */}
      {!loading && !error && jobs.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p>No jobs found matching your search criteria. Try adjusting your filters.</p>
        </div>
      )}

      {/* Job listings */}
      <div className="space-y-6">
        {!loading &&
          !error &&
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.slug}`}
              className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row">
                {/* Company logo */}
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  {job.logo ? (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                      <Image
                        src={job.logo}
                        alt={`${job.company} logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Building className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Job details */}
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                  <h4 className="text-lg text-blue-600 mb-3">{job.company}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm">{job.location}</span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm">{job.jobType}</span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm">{job.salary}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3 line-clamp-2">{job.description}</p>

                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Posted {formatPostedDate(job.postedDate)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}
