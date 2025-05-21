import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import payload from 'payload'
import { JobCard } from '../../components/JobCard'
import { Pagination } from '../../components/Pagination'
import { trackFilterPixel } from '../../../../lib/pixelTracking'

// Define the props for the page component
interface SectorPageProps {
  params: {
    slug: string
  }
  searchParams: {
    page?: string
    location?: string
    type?: string
    salary?: string
  }
}

// Number of jobs to display per page
const JOBS_PER_PAGE = 10

// Generate metadata for the page
export async function generateMetadata({ params }: SectorPageProps): Promise<Metadata> {
  // Fetch the sector by slug
  const sector = await getSectorBySlug(params.slug)

  if (!sector) {
    return {
      title: 'Sector Not Found',
    }
  }

  return {
    title: `${sector.name} Jobs | Find Your Next Career Opportunity`,
    description:
      sector.seo?.description ||
      `Browse ${sector.name} jobs and find your next career opportunity in this industry.`,
    openGraph: {
      title: sector.seo?.title || `${sector.name} Jobs`,
      description:
        sector.seo?.description ||
        `Browse ${sector.name} jobs and find your next career opportunity in this industry.`,
      type: 'website',
    },
  }
}

// Helper function to fetch a sector by slug
async function getSectorBySlug(slug: string) {
  try {
    // Find the sector by slug
    const sectors = await payload.find({
      collection: 'sectors' as any,
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    })

    if (sectors.docs.length === 0) {
      return null
    }

    return sectors.docs[0]
  } catch (error) {
    console.error('Error fetching sector:', error)
    return null
  }
}

// Main page component
export default async function SectorPage({ params, searchParams }: SectorPageProps) {
  // Parse the page number from the search params
  const page = parseInt(searchParams.page || '1', 10)

  // Fetch the sector by slug
  const sector = await getSectorBySlug(params.slug)

  // If the sector doesn't exist, show a 404 page
  if (!sector) {
    notFound()
  }

  // Build the query conditions based on search params
  const where: any = {
    sector: { equals: sector.id },
    status: { equals: 'published' },
    expiry_date: { greater_than: new Date().toISOString() },
  }

  // Add location filter if provided
  if (searchParams.location) {
    where.location = { like: searchParams.location }
  }

  // Add job type filter if provided
  if (searchParams.type) {
    where.type = { equals: searchParams.type }
  }

  // Add salary filter if provided
  if (searchParams.salary) {
    const salaryValue = parseInt(searchParams.salary, 10)
    where.or = [
      { 'salary.min': { less_than_equal: salaryValue } },
      { 'salary.max': { greater_than_equal: salaryValue } },
    ]
  }

  // Fetch jobs with pagination
  const jobsResponse = await payload.find({
    collection: 'jobs' as any,
    where,
    limit: JOBS_PER_PAGE,
    page,
    sort: '-created_at',
  })

  // Map the payload jobs to our Job interface
  const mapPayloadJobToJob = (payloadJob: any) => {
    return {
      id: payloadJob.id,
      title: payloadJob.title,
      slug: payloadJob.slug || payloadJob.id,
      location: payloadJob.location,
      type: payloadJob.type,
      salary: payloadJob.salary,
      featured: payloadJob.featured,
      sector: payloadJob.sector,
      expiry_date: payloadJob.expiry_date,
      created_at: payloadJob.created_at,
    }
  }

  // Extract and map the jobs from the response
  const jobs = jobsResponse.docs.map(mapPayloadJobToJob)

  // Calculate pagination info
  const totalPages = Math.ceil(jobsResponse.totalDocs / JOBS_PER_PAGE)

  // Fetch child sectors if any
  const childSectorsResponse = await payload.find({
    collection: 'sectors' as any,
    where: {
      parent: { equals: sector.id },
    },
    limit: 100,
  })

  const childSectors = childSectorsResponse.docs

  // In a client-side component, we would track this filter event
  // trackFilterPixel('sector', sector.name)

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="text-sm mb-6">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              Home
            </Link>
            <span className="mx-2">/</span>
          </li>
          <li className="flex items-center">
            <Link href="/sectors" className="text-blue-500 hover:text-blue-700">
              Sectors
            </Link>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-700">{sector.name}</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{sector.name} Jobs</h1>

        {sector.description && (
          <div className="prose max-w-none mb-6">
            <div
              dangerouslySetInnerHTML={{
                __html:
                  typeof sector.description === 'string'
                    ? sector.description
                    : JSON.stringify(sector.description),
              }}
            />
          </div>
        )}

        <div className="text-gray-600">Found {jobsResponse.totalDocs} jobs in this sector</div>
      </div>

      {/* Child Sectors */}
      {childSectors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Browse Sub-sectors</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {childSectors.map((childSector: any) => (
              <Link
                key={childSector.id}
                href={`/sectors/${childSector.slug}`}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-800">{childSector.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="mb-8">
        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No jobs found in this sector matching your criteria.</p>
            <Link
              href={`/sectors/${sector.slug}`}
              className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Clear Filters
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl={`/sectors/${sector.slug}`}
          searchParams={searchParams}
        />
      )}
    </div>
  )
}
