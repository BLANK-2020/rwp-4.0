import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Define the props for the component
interface JobFiltersProps {
  sectors: Array<{ id: string; name: string; slug: string }>
  locations: string[]
  currentFilters: {
    sector?: string
    location?: string
    type?: string
    salary?: string
    search?: string
    page?: string
  }
}

export const JobFilters: React.FC<JobFiltersProps> = ({ sectors, locations, currentFilters }) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Get form data
    const formData = new FormData(e.currentTarget)

    // Build the query string
    const params = new URLSearchParams()

    // Add each filter to the query string if it has a value
    const sector = formData.get('sector') as string
    if (sector) params.set('sector', sector)

    const location = formData.get('location') as string
    if (location) params.set('location', location)

    const type = formData.get('type') as string
    if (type) params.set('type', type)

    const salary = formData.get('salary') as string
    if (salary) params.set('salary', salary)

    const search = formData.get('search') as string
    if (search) params.set('search', search)

    // Reset to page 1 when filters change
    params.set('page', '1')

    // Navigate to the new URL
    router.push(`/jobs?${params.toString()}`)
  }

  // Handle clearing all filters
  const handleClearFilters = () => {
    router.push('/jobs')
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter Jobs</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Keyword Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Keyword
            </label>
            <input
              type="text"
              id="search"
              name="search"
              defaultValue={currentFilters.search || ''}
              placeholder="Job title, skills, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sector Filter */}
          <div>
            <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
              Sector
            </label>
            <select
              id="sector"
              name="sector"
              defaultValue={currentFilters.sector || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sectors</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              id="location"
              name="location"
              defaultValue={currentFilters.location || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Job Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={currentFilters.type || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
            </select>
          </div>

          {/* Salary Filter */}
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
              Salary (AUD)
            </label>
            <select
              id="salary"
              name="salary"
              defaultValue={currentFilters.salary || ''}
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
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Clear Filters
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  )
}
