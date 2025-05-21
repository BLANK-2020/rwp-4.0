import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { getTenantByDomain } from '../../../../lib/tenants'

/**
 * API route for fetching recommended jobs
 *
 * This endpoint provides job recommendations based on:
 * 1. The current job being viewed (if jobId is provided)
 * 2. The user's view history (based on session ID)
 * 3. Popular jobs if no context is available
 */
export async function GET(req: NextRequest) {
  try {
    // Get the tenant from the request hostname
    const hostname = req.headers.get('host') || ''
    const tenant = await getTenantByDomain(hostname)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get parameters from the URL
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const sessionId = searchParams.get('sessionId')
    const limit = parseInt(searchParams.get('limit') || '3', 10)

    // Base query conditions
    const baseConditions = {
      tenant: { equals: tenant.id },
      status: { equals: 'published' },
      expiry_date: { greater_than: new Date().toISOString() },
    }

    let recommendedJobs: any[] = []

    // Strategy 1: Similar jobs based on current job
    if (jobId) {
      // Get the current job details
      const currentJob = await payload.findByID({
        collection: 'jobs',
        id: jobId,
      })

      if (currentJob) {
        // Find jobs with the same sector or job type
        const similarJobs = await payload.find({
          collection: 'jobs',
          where: {
            ...baseConditions,
            id: { not_equals: jobId }, // Exclude the current job
            or: [
              // Same sector
              (currentJob as any).sector ? { sector: { equals: (currentJob as any).sector } } : {},
              // Same job type
              (currentJob as any).type ? { type: { equals: (currentJob as any).type } } : {},
              // Similar location
              (currentJob as any).location
                ? { location: { like: (currentJob as any).location.split(',')[0] } }
                : {},
            ],
          },
          limit,
          sort: '-created_at',
        })

        recommendedJobs = similarJobs.docs
      }
    }

    // Strategy 2: Based on user's view history
    if (recommendedJobs.length === 0 && sessionId) {
      // Get the user's recently viewed jobs
      const viewEvents = await payload.find({
        collection: 'events' as any,
        where: {
          tenant: { equals: tenant.id },
          type: { equals: 'job_viewed' },
          sessionId: { equals: sessionId },
        },
        limit: 5,
        sort: '-timestamp',
      })

      if (viewEvents.docs.length > 0) {
        // Extract job IDs from view events
        const viewedJobIds = viewEvents.docs.map((event: any) => event.job)

        // Find jobs similar to the viewed jobs
        const viewedJobs = await payload.find({
          collection: 'jobs',
          where: {
            id: { in: viewedJobIds },
          },
          limit: viewedJobIds.length,
        })

        // Extract sectors and job types from viewed jobs
        const sectors = viewedJobs.docs.map((job: any) => job.sector).filter(Boolean)

        const jobTypes = viewedJobs.docs.map((job: any) => job.type).filter(Boolean)

        // Find similar jobs based on sectors and job types
        if (sectors.length > 0 || jobTypes.length > 0) {
          const similarJobs = await payload.find({
            collection: 'jobs',
            where: {
              ...baseConditions,
              id: { not_in: viewedJobIds }, // Exclude already viewed jobs
              or: [
                // Same sectors
                sectors.length > 0 ? { sector: { in: sectors } } : {},
                // Same job types
                jobTypes.length > 0 ? { type: { in: jobTypes } } : {},
              ],
            },
            limit,
            sort: '-created_at',
          })

          recommendedJobs = similarJobs.docs
        }
      }
    }

    // Strategy 3: Fallback to popular or featured jobs
    if (recommendedJobs.length === 0) {
      // First try featured jobs
      const featuredJobs = await payload.find({
        collection: 'jobs',
        where: {
          ...baseConditions,
          featured: { equals: true },
        },
        limit,
        sort: '-created_at',
      })

      if (featuredJobs.docs.length > 0) {
        recommendedJobs = featuredJobs.docs
      } else {
        // Fallback to latest jobs
        const latestJobs = await payload.find({
          collection: 'jobs',
          where: baseConditions,
          limit,
          sort: '-created_at',
        })

        recommendedJobs = latestJobs.docs
      }
    }

    // Return the recommended jobs
    return NextResponse.json({
      jobs: recommendedJobs.map((job: any) => ({
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
      })),
    })
  } catch (error) {
    console.error('Error fetching recommended jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
