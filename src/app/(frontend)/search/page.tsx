import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import payload from 'payload'
import { JobCard } from '../components/JobCard'
import { Pagination } from '../components/Pagination'
import { trackSearchPixel } from '../../../lib/pixelTracking'

// Define the page metadata for SEO
export const metadata: Metadata = {
  title: 'Search Jobs | Find Your Next Career Opportunity',
  description: 'Search for job opportunities that match your skills and experience.',
}

// Define the props for the page component
interface SearchPageProps {
  searchParams: {
    q?: string
    page?: string
    sector?: string
    location?: string
    type?: string
    salary?: string
  }
}

// Number of jobs to display per page
const JOBS_PER_PAGE = 10

// Main page component
export default async function SearchPage({ searchParams }: SearchPageProps) {
  // Parse the page number from the search params
  const page = parseInt(searchParams.page || '1', 10)
  const searchQuery = searchParams.q || ''

  // Build the search URL with all parameters
  const searchUrl = new URL(
    '/api/jobs/search',
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  )

  // Add all search parameters
  searchUrl.searchParams.append('page', page.toString())
  searchUrl.searchParams.append('limit', JOBS_PER_PAGE.toString())

  if (searchQuery) {
    searchUrl.searchParams.append('q', searchQuery)
  }

  if (searchParams.sector) {
    searchUrl.searchParams.append('sector', searchParams.sector)
  }

  if (searchParams.location) {
    searchUrl.searchParams.append('location', searchParams.location)
  }

  if (searchParams.type) {
    searchUrl.searchParams.append('type', searchParams.type)
  }

  if (searchParams.salary) {
    // Convert the salary filter to minSalary
    searchUrl.searchParams.append('minSalary', searchParams.salary)
  }

  // Fetch jobs from the search API
  const response = await fetch(searchUrl.toString(), { next: { revalidate: 60 } })

  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.statusText}`)
  }

  const searchResults = await response.json()

  // Extract jobs and pagination info
  const jobs = searchResults.jobs
  const totalPages = searchResults.pagination.totalPages

  // Fetch sectors for the filter
  const sectorsResponse = await payload.find({
    collection: 'sectors' as any,
    limit: 100,
  })

  // Extract unique locations from jobs for the filter
  const locationsResponse = await payload.find({
    collection: 'jobs' as any,
    where: {
      status: { equals: 'published' },
    },
    limit: 0,
    pagination: false,
  })

  // Get unique locations (this is a simplified approach; in a real app, you might use aggregation)
  const uniqueLocations = Array.from(
    new Set(locationsResponse.docs.map((job: any) => job.location)),
  ).filter(Boolean) as string[]

  // In a client-side component, we would track this search event
  // trackSearchPixel(searchQuery)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {searchQuery ? `Search Results for "${searchQuery}"` : 'Search Jobs'}
      </h1>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form action="/search" method="GET" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="q" className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
              <input
                type="text"
                id="q"
                name="q"
                defaultValue={searchQuery}
                placeholder="Job title, skills, or keywords"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-full md:w-1/4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                id="location"
                name="location"
                defaultValue={searchParams.location || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Location</option>
                {uniqueLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-1/4">
              <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
                Sector
              </label>
              <select
                id="sector"
                name="sector"
                defaultValue={searchParams.sector || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sectors</option>
                {sectorsResponse.docs.map((sector: any) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                id="type"
                name="type"
                defaultValue={searchParams.type || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>

            <div className="w-full md:w-1/3">
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                Salary (AUD)
              </label>
              <select
                id="salary"
                name="salary"
                defaultValue={searchParams.salary || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Salary</option>
                <option value="50000">$50,000+</option>
                <option value="75000">$75,000+</option>
                <option value="100000">$100,000+</option>
                <option value="150000">$150,000+</option>
                <option value="200000">$200,000+</option>
              </select>
            </div>

            <div className="w-full md:w-1/3 flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search Jobs
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Search Results */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {searchResults.pagination.totalDocs}{' '}
            {searchResults.pagination.totalDocs === 1 ? 'job' : 'jobs'} found
          </h2>

          {Object.keys(searchParams).length > 0 && (
            <Link href="/search" className="text-blue-500 hover:text-blue-700">
              Clear all filters
            </Link>
          )}
        </div>

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {jobs.map((job: any) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">No jobs found matching your search criteria.</p>
            <p className="text-gray-600">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/search"
          searchParams={searchParams}
        />
      )}
    </div>
  )
}
