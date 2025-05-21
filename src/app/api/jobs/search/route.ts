import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { getTenantByDomain } from '../../../../lib/tenants'

/**
 * API route for searching jobs
 *
 * This endpoint provides advanced search and filtering capabilities for jobs.
 * It supports pagination, sorting, and various filter parameters.
 */
export async function GET(req: NextRequest) {
  try {
    // Get the tenant from the request hostname
    const hostname = req.headers.get('host') || ''
    const tenant = await getTenantByDomain(hostname)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get search parameters from the URL
    const { searchParams } = new URL(req.url)

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Parse search and filter parameters
    const query = searchParams.get('q') || ''
    const sector = searchParams.get('sector') || ''
    const location = searchParams.get('location') || ''
    const jobType = searchParams.get('type') || ''
    const minSalary = searchParams.get('minSalary')
      ? parseInt(searchParams.get('minSalary') || '0', 10)
      : null
    const maxSalary = searchParams.get('maxSalary')
      ? parseInt(searchParams.get('maxSalary') || '0', 10)
      : null
    const salaryPeriod = searchParams.get('salaryPeriod') || ''
    const featured = searchParams.get('featured') === 'true'
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build the query conditions
    const where: any = {
      tenant: { equals: tenant.id },
      status: { equals: 'published' },
      expiry_date: { greater_than: new Date().toISOString() },
    }

    // Add search query if provided
    if (query) {
      where.or = [
        { title: { like: query } },
        { description: { like: query } },
        { location: { like: query } },
      ]
    }

    // Add sector filter if provided
    if (sector) {
      where.sector = { equals: sector }
    }

    // Add location filter if provided
    if (location) {
      where.location = { like: location }
    }

    // Add job type filter if provided
    if (jobType) {
      where.type = { equals: jobType }
    }

    // Add salary filters if provided
    if (minSalary !== null || maxSalary !== null) {
      const salaryConditions = []

      if (minSalary !== null) {
        // Jobs with min salary >= specified min
        salaryConditions.push({
          'salary.min': { greater_than_equal: minSalary },
        })

        // Jobs with max salary >= specified min
        salaryConditions.push({
          'salary.max': { greater_than_equal: minSalary },
        })
      }

      if (maxSalary !== null) {
        // Jobs with max salary <= specified max
        salaryConditions.push({
          'salary.max': { less_than_equal: maxSalary },
        })

        // Jobs with min salary <= specified max
        salaryConditions.push({
          'salary.min': { less_than_equal: maxSalary },
        })
      }

      // Add salary period filter if provided
      if (salaryPeriod) {
        // Create a new array with the period condition added to each condition
        const conditionsWithPeriod = salaryConditions.map((condition) => ({
          ...condition,
          'salary.period': { equals: salaryPeriod },
        }))

        // Replace the original conditions with the new ones
        salaryConditions.length = 0
        salaryConditions.push(...conditionsWithPeriod)
      }

      // Add the salary conditions to the where clause
      where.or = where.or || []
      where.or.push(...salaryConditions)
    }

    // Add featured filter if requested
    if (featured) {
      where.featured = { equals: true }
    }

    // Build the sort parameter
    const sort = `${sortOrder === 'asc' ? '' : '-'}${sortField}`

    // Fetch jobs with pagination
    const jobsResponse = await payload.find({
      collection: 'jobs',
      where,
      limit,
      page,
      sort,
      depth: 1, // Include related data like sector
    })

    // Map the payload jobs to a cleaner structure
    const jobs = jobsResponse.docs.map((job: any) => ({
      id: job.id,
      title: job.title,
      slug: job.slug,
      location: job.location,
      type: job.type,
      salary: job.salary,
      featured: job.featured,
      sector: job.sector,
      expiry_date: job.expiry_date,
      created_at: job.created_at,
      apply_link: job.apply_link,
    }))

    // Return the search results
    return NextResponse.json({
      jobs,
      pagination: {
        totalDocs: jobsResponse.totalDocs,
        limit: jobsResponse.limit,
        totalPages: jobsResponse.totalPages,
        page: jobsResponse.page,
        hasPrevPage: jobsResponse.hasPrevPage,
        hasNextPage: jobsResponse.hasNextPage,
        prevPage: jobsResponse.prevPage,
        nextPage: jobsResponse.nextPage,
      },
    })
  } catch (error) {
    console.error('Error searching jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
