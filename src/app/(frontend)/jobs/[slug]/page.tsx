'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { RecommendedJobs } from '../../components/RecommendedJobs'
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Calendar,
  Building,
  Share2,
  Bookmark,
  ChevronLeft,
} from 'lucide-react'
import { format } from 'date-fns'

// Import A/B testing components
import { ABTestJobDescription } from '../../components/ABTestJobDescription'

interface Job {
  id: string
  title: string
  company: string
  location: string
  jobType: string
  salary: string
  description: string
  requirements: string[]
  benefits: string[]
  postedDate: Date
  applicationDeadline?: Date
  logo?: string
  companyDescription?: string
  applyLink?: string
}

export default function JobPage() {
  const params = useParams()
  const slug = params.slug as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch job data
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true)

        // In a real application, you would fetch this data from an API
        // For now, we'll just use mock data
        const mockJob: Job = {
          id: '1',
          title: 'Senior Software Engineer',
          company: 'Acme Inc.',
          location: 'London, UK (Hybrid)',
          jobType: 'Full-time',
          salary: '£70,000 - £90,000',
          description: `
            <p>We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining high-quality software solutions.</p>
            
            <p>As a Senior Software Engineer, you will work closely with product managers, designers, and other engineers to build innovative features and improve existing ones. You will mentor junior engineers and contribute to the technical direction of the team.</p>
            
            <h3>Responsibilities:</h3>
            <ul>
              <li>Design, develop, and maintain high-quality software solutions</li>
              <li>Write clean, efficient, and maintainable code</li>
              <li>Collaborate with cross-functional teams to define, design, and ship new features</li>
              <li>Identify and resolve performance bottlenecks and bugs</li>
              <li>Participate in code reviews and provide constructive feedback to other developers</li>
              <li>Mentor junior engineers and help them grow technically</li>
              <li>Stay up-to-date with emerging trends and technologies</li>
            </ul>
          `,
          requirements: [
            "Bachelor's degree in Computer Science or related field",
            '5+ years of experience in software development',
            'Strong proficiency in JavaScript/TypeScript and React',
            'Experience with Node.js and Express',
            'Familiarity with cloud services (AWS, Azure, or GCP)',
            'Knowledge of database systems (SQL and NoSQL)',
            'Excellent problem-solving and communication skills',
          ],
          benefits: [
            'Competitive salary and equity package',
            'Flexible working arrangements',
            'Health, dental, and vision insurance',
            '25 days of paid vacation',
            'Professional development budget',
            'Regular team events and activities',
            'Modern office with free snacks and drinks',
          ],
          postedDate: new Date('2025-05-01'),
          applicationDeadline: new Date('2025-06-15'),
          logo: '/acme-logo.png',
          companyDescription:
            'Acme Inc. is a leading technology company specializing in innovative software solutions for businesses of all sizes. With over 500 employees worldwide, we are dedicated to creating products that help our customers succeed.',
          applyLink: '/apply/senior-software-engineer',
        }

        setJob(mockJob)
        setError(null)
      } catch (err) {
        console.error('Error fetching job:', err)
        setError('Failed to fetch job details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [slug])

  // Format posted date
  const formatPostedDate = (date: Date) => {
    return format(date, 'MMMM d, yyyy')
  }

  // Format application deadline
  const formatDeadline = (date?: Date) => {
    if (!date) return 'Open until filled'
    return format(date, 'MMMM d, yyyy')
  }

  // Handle apply button click
  const handleApply = () => {
    if (job?.applyLink) {
      window.open(job.applyLink, '_blank')
    }
  }

  // Handle share button click
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title} at ${job?.company}`,
        url: window.location.href,
      })
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  // Handle save button click
  const handleSave = () => {
    // In a real application, you would save the job to the user's saved jobs
    alert('Job saved!')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Job not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        href="/jobs"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Back to jobs
      </Link>

      {/* Job header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row">
          {/* Company logo */}
          <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            {job.logo ? (
              <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                <Image src={job.logo} alt={`${job.company} logo`} fill className="object-contain" />
              </div>
            ) : (
              <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                <Building className="h-10 w-10 text-gray-500" />
              </div>
            )}
          </div>

          {/* Job details */}
          <div className="flex-grow">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <h2 className="text-xl text-blue-600 mb-4">{job.company}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                <span>{job.location}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
                <span>{job.jobType}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <DollarSign className="h-5 w-5 mr-2 text-gray-500" />
                <span>{job.salary}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                <span>Posted {formatPostedDate(job.postedDate)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={handleApply}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
              >
                Apply Now
              </button>

              <button
                onClick={handleSave}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-md transition-colors flex items-center"
              >
                <Bookmark className="h-5 w-5 mr-2" />
                Save
              </button>

              <button
                onClick={handleShare}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-md transition-colors flex items-center"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Job content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Job description */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Job Description</h3>

            {/* Use A/B testing for job description */}
            <ABTestJobDescription
              jobId={job.id}
              jobTitle={job.title}
              defaultDescription={job.description}
              testId="job-description-test"
            />
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements</h3>
            <ul className="list-disc pl-5 space-y-2">
              {job.requirements.map((requirement, index) => (
                <li key={index} className="text-gray-700">
                  {requirement}
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Benefits</h3>
            <ul className="list-disc pl-5 space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="text-gray-700">
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Company info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">About {job.company}</h3>
            <p className="text-gray-700 mb-4">{job.companyDescription}</p>
            <a
              href={`/companies/${job.company.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View company profile
            </a>
          </div>

          {/* Job details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Job Details</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Job Type</h4>
                <p className="text-gray-700">{job.jobType}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Salary</h4>
                <p className="text-gray-700">{job.salary}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Location</h4>
                <p className="text-gray-700">{job.location}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Posted Date</h4>
                <p className="text-gray-700">{formatPostedDate(job.postedDate)}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Application Deadline</h4>
                <p className="text-gray-700">{formatDeadline(job.applicationDeadline)}</p>
              </div>
            </div>

            {/* Recommended Jobs */}
            <RecommendedJobs currentJobId={job.id} limit={3} />
          </div>
        </div>
      </div>
    </div>
  )
}
