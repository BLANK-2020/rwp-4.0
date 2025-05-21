import React from 'react'
import Link from 'next/link'

// Define the Job type based on our collection schema
export interface Job {
  id: string
  title: string
  slug: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'temporary'
  salary?: {
    min?: number
    max?: number
    currency?: string
    period?: 'annual' | 'hourly'
  }
  featured?: boolean
  sector?: {
    id: string
    name: string
    slug: string
  }
  expiry_date?: string
  created_at?: string
}

interface JobCardProps {
  job: Job
  featured?: boolean
  compact?: boolean
}

export const JobCard: React.FC<JobCardProps> = ({ job, featured = false, compact = false }) => {
  // Format the salary range
  const formatSalary = () => {
    if (!job.salary) return null

    const { min, max, currency = 'AUD', period = 'annual' } = job.salary

    if (!min && !max) return null

    let salaryText = ''

    if (min && max) {
      salaryText = `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`
    } else if (min) {
      salaryText = `From ${formatCurrency(min, currency)}`
    } else if (max) {
      salaryText = `Up to ${formatCurrency(max, currency)}`
    }

    return `${salaryText} ${period === 'annual' ? 'per year' : 'per hour'}`
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format the job type for display
  const formatJobType = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className={`block ${compact ? 'p-4' : 'p-6'} rounded-lg shadow-md transition-all hover:shadow-lg ${
        featured ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white'
      }`}
    >
      <div className="flex justify-between items-start">
        <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-gray-800 mb-2`}>
          {job.title}
        </h3>
        {job.featured && (
          <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
            Featured
          </span>
        )}
      </div>

      <div className={compact ? 'mb-2' : 'mb-4'}>
        <div className="flex items-center text-gray-600 mb-1">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{job.location}</span>
        </div>

        <div className="flex items-center text-gray-600 mb-1">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{formatJobType(job.type)}</span>
        </div>

        {job.sector && (
          <div className="flex items-center text-gray-600 mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{job.sector.name}</span>
          </div>
        )}

        {formatSalary() && (
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{formatSalary()}</span>
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {new Date(job.created_at || Date.now()).toLocaleDateString()}
          </span>
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            Apply Now
          </span>
        </div>
      )}
    </Link>
  )
}
