'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, Briefcase, ChevronDown, X } from 'lucide-react'

interface JobSearchBarProps {
  className?: string
  onSearch?: (query: string, location: string, jobType: string) => void
}

const JobSearchBar: React.FC<JobSearchBarProps> = ({ className = '', onSearch }) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial values from URL params
  const initialQuery = searchParams.get('query') || ''
  const initialLocation = searchParams.get('location') || ''
  const initialJobType = searchParams.get('jobType') || ''

  // State for search inputs
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)
  const [jobType, setJobType] = useState(initialJobType)
  const [jobTypeOpen, setJobTypeOpen] = useState(false)

  // Ref for job type dropdown
  const jobTypeRef = useRef<HTMLDivElement>(null)

  // Job type options
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Remote']

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (jobTypeRef.current && !jobTypeRef.current.contains(event.target as Node)) {
        setJobTypeOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Build query string
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (location) params.set('location', location)
    if (jobType) params.set('jobType', jobType)

    // Navigate to search results
    router.push(`/jobs?${params.toString()}`)

    // Call onSearch callback if provided
    if (onSearch) {
      onSearch(query, location, jobType)
    }
  }

  // Clear individual fields
  const clearQuery = () => setQuery('')
  const clearLocation = () => setLocation('')
  const clearJobType = () => setJobType('')

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        {/* Job title/keywords search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job title, keywords, or company"
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Location search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, state, or remote"
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {location && (
            <button
              type="button"
              onClick={clearLocation}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Job type dropdown */}
        <div className="relative flex-1" ref={jobTypeRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Briefcase className="h-5 w-5 text-gray-400" />
          </div>
          <button
            type="button"
            onClick={() => setJobTypeOpen(!jobTypeOpen)}
            className="block w-full pl-10 pr-10 py-3 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {jobType || 'Job type'}
          </button>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {jobType ? (
              <X
                className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  clearJobType()
                }}
              />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Dropdown menu */}
          {jobTypeOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 max-h-60 overflow-auto">
              {jobTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setJobType(type)
                    setJobTypeOpen(false)
                  }}
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    jobType === type ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors"
        >
          Search Jobs
        </button>
      </form>
    </div>
  )
}

export default JobSearchBar
