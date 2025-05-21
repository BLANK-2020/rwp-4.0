import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import payload from 'payload'

// Define the page metadata for SEO
export const metadata: Metadata = {
  title: 'Job Sectors | Browse Jobs by Industry',
  description: 'Browse job opportunities by industry sector and find your next career move.',
}

// Define the props for the page component
interface SectorsPageProps {
  searchParams: {
    page?: string
  }
}

// Main page component
export default async function SectorsPage({ searchParams }: SectorsPageProps) {
  // Parse the page number from the search params
  const page = parseInt(searchParams.page || '1', 10)

  // Fetch sectors with pagination
  const sectorsResponse = await payload.find({
    collection: 'sectors' as any, // Type assertion to bypass TypeScript check
    limit: 20,
    page,
    sort: 'name',
    depth: 1, // Include parent sector data
  })

  // Extract the sectors from the response
  const sectors = sectorsResponse.docs

  // Group sectors by parent
  const parentSectors = sectors.filter((sector: any) => !sector.parent)
  const childSectors = sectors.filter((sector: any) => sector.parent)

  // Group child sectors by parent ID
  const childSectorsByParent: Record<string, any[]> = {}
  childSectors.forEach((sector: any) => {
    const parentId = typeof sector.parent === 'object' ? sector.parent.id : sector.parent
    if (!childSectorsByParent[parentId]) {
      childSectorsByParent[parentId] = []
    }
    childSectorsByParent[parentId].push(sector)
  })

  // Fetch job counts for each sector
  const sectorJobCounts: Record<string, number> = {}

  // This would be more efficient with a proper aggregation query,
  // but for now we'll do individual queries for each sector
  await Promise.all(
    sectors.map(async (sector: any) => {
      const jobsResponse = await payload.find({
        collection: 'jobs' as any,
        where: {
          sector: { equals: sector.id },
          status: { equals: 'published' },
          expiry_date: { greater_than: new Date().toISOString() },
        },
        limit: 0, // We only need the count, not the actual docs
      })

      sectorJobCounts[sector.id] = jobsResponse.totalDocs
    }),
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Jobs by Sector</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {parentSectors.map((sector: any) => (
          <div key={sector.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                <Link href={`/sectors/${sector.slug}`} className="hover:text-blue-600">
                  {sector.name}
                </Link>
                <span className="ml-2 text-sm text-gray-500">
                  ({sectorJobCounts[sector.id] || 0} jobs)
                </span>
              </h2>

              {sector.description && (
                <div className="text-gray-600 mb-4 line-clamp-2">
                  {typeof sector.description === 'string'
                    ? sector.description
                    : JSON.stringify(sector.description)}
                </div>
              )}

              {childSectorsByParent[sector.id] && childSectorsByParent[sector.id].length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Sub-sectors:</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {childSectorsByParent[sector.id].map((childSector: any) => (
                      <li key={childSector.id}>
                        <Link
                          href={`/sectors/${childSector.slug}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {childSector.name}
                          <span className="ml-1 text-xs text-gray-500">
                            ({sectorJobCounts[childSector.id] || 0})
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <Link
                  href={`/jobs?sector=${sector.id}`}
                  className="inline-block text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all jobs in this sector →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
