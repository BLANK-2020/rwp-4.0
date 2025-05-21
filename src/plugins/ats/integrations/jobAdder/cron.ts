import payload from 'payload'
import axios from 'axios'
import { getAccessToken } from './oauth'
import { JobAdderClient } from './client'
import { syncJobs, syncCandidates } from './sync'

// Define Job interface for TypeScript
interface Job {
  title: string
  description: any[]
  location: string
  type: string
  salary: {
    min?: number
    max?: number
    currency: string
  }
  status: string
  tenant: string | number
  atsData: {
    jobAdderId?: string
    [key: string]: any
  }
  [key: string]: any
}

interface JobAdderResponse {
  data: any[]
  pagination: {
    total: number
    count: number
    limit: number
    offset: number
  }
}

/**
 * Maps a JobAdder job to our platform's job format
 * @param jobAdderJob The job from JobAdder
 * @param tenantId The tenant ID
 * @returns Mapped job data
 */
function mapJobAdderToJob(jobAdderJob: any, tenantId: string): Partial<Job> {
  // Extract salary information
  const salaryMin = jobAdderJob.salary?.minimum
  const salaryMax = jobAdderJob.salary?.maximum
  const salaryCurrency = jobAdderJob.salary?.currency || 'AUD'

  // Map employment type
  const employmentTypeMap: Record<string, string> = {
    FullTime: 'full-time',
    PartTime: 'part-time',
    Contract: 'contract',
    Temporary: 'temporary',
    Casual: 'temporary',
  }

  // Map job status
  const statusMap: Record<string, string> = {
    Open: 'published',
    Filled: 'closed',
    Cancelled: 'closed',
    OnHold: 'draft',
  }

  // Create rich text description from JobAdder HTML
  const description = jobAdderJob.description || ''

  return {
    title: jobAdderJob.title,
    description: [
      {
        type: 'paragraph',
        children: [{ text: description }],
      },
    ],
    location: jobAdderJob.location?.name || '',
    type: employmentTypeMap[jobAdderJob.employmentType] || 'full-time',
    salary: {
      min: salaryMin,
      max: salaryMax,
      currency: salaryCurrency,
    },
    status: statusMap[jobAdderJob.status] || 'draft',
    tenant: tenantId,
    atsData: {
      jobAdderId: jobAdderJob.id,
    },
  }
}

/**
 * Run initial job sync after OAuth connection
 * @param tenantId Tenant ID
 */
export async function initialJobSync(tenantId: string): Promise<void> {
  try {
    // Get access token
    const accessToken = await getAccessToken(tenantId)

    if (!accessToken) {
      throw new Error('No access token available')
    }

    console.log(`Starting initial JobAdder sync for tenant ${tenantId}`)

    // Get all active jobs from JobAdder
    const jobsResponse = await axios.get<JobAdderResponse>('https://api.jobadder.com/v2/jobs', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { status: 'Open', limit: 100 },
    })

    const jobAdderJobs = jobsResponse.data.data || []

    // Process each job
    for (const jobAdderJob of jobAdderJobs) {
      const mappedJob = mapJobAdderToJob(jobAdderJob, tenantId)

      // Check if job already exists
      const existingJobs = await payload.find({
        collection: 'jobs',
        where: {
          'atsData.jobAdderId': { equals: jobAdderJob.id },
          tenant: { equals: tenantId },
        },
      })

      if (existingJobs.docs.length > 0) {
        // Update existing job
        await payload.update({
          collection: 'jobs',
          id: existingJobs.docs[0].id,
          data: mappedJob as any,
        })
        console.log(`Updated job ${existingJobs.docs[0].id} during initial sync`)
      } else {
        // Create new job
        const newJob = await payload.create({
          collection: 'jobs',
          data: mappedJob as any,
        })
        console.log(`Created new job ${newJob.id} during initial sync`)
      }
    }

    console.log(`Completed initial JobAdder sync for tenant ${tenantId}`)
  } catch (error) {
    console.error('JobAdder initial sync error:', error)
    throw error
  }
}

/**
 * Scheduled job sync (runs periodically)
 */
export async function scheduledJobSync(): Promise<void> {
  try {
    console.log('Starting scheduled JobAdder sync')

    // Get all tenants with JobAdder integration enabled
    const tenants = await payload.find({
      collection: 'tenants',
      where: {
        'features.jobAdder': { equals: true },
      },
    })

    // Process each tenant
    for (const tenant of tenants.docs) {
      try {
        // Get access token
        const accessToken = await getAccessToken(String(tenant.id))

        if (!accessToken) {
          console.error(`No access token for tenant ${tenant.id}`)
          continue
        }

        // Get jobs updated in the last day
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        const jobsResponse = await axios.get<JobAdderResponse>('https://api.jobadder.com/v2/jobs', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            updatedAfter: yesterday.toISOString(),
            limit: 100,
          },
        })

        const jobAdderJobs = jobsResponse.data.data || []
        console.log(`Found ${jobAdderJobs.length} updated jobs for tenant ${tenant.id}`)

        // Process each job
        for (const jobAdderJob of jobAdderJobs) {
          const mappedJob = mapJobAdderToJob(jobAdderJob, String(tenant.id))

          // Check if job already exists
          const existingJobs = await payload.find({
            collection: 'jobs',
            where: {
              'atsData.jobAdderId': { equals: jobAdderJob.id },
              tenant: { equals: tenant.id },
            },
          })

          if (existingJobs.docs.length > 0) {
            // Update existing job
            await payload.update({
              collection: 'jobs',
              id: existingJobs.docs[0].id,
              data: mappedJob as any,
            })
            console.log(`Updated job ${existingJobs.docs[0].id} during scheduled sync`)
          } else {
            // Create new job
            const newJob = await payload.create({
              collection: 'jobs',
              data: mappedJob as any,
            })
            console.log(`Created new job ${newJob.id} during scheduled sync`)
          }
        }
      } catch (tenantError) {
        console.error(`Error syncing jobs for tenant ${tenant.id}:`, tenantError)
        // Continue with next tenant
      }
    }

    console.log('Completed scheduled JobAdder sync')
  } catch (error) {
    console.error('JobAdder scheduled sync error:', error)
    // Don't throw error to prevent CRON job from failing
  }
}

/**
 * Run initial candidate sync after OAuth connection
 * @param tenantId Tenant ID
 */
export async function initialCandidateSync(tenantId: string): Promise<void> {
  try {
    console.log(`Starting initial JobAdder candidate sync for tenant ${tenantId}`)

    // Get access token
    const accessToken = await getAccessToken(tenantId)

    if (!accessToken) {
      throw new Error('No access token available')
    }

    // Create JobAdder client
    const client = new JobAdderClient({
      clientId: '', // Not needed for token-based operations
      clientSecret: '', // Not needed for token-based operations
      accessToken,
      refreshToken: '', // Not needed for this operation
    })

    // Sync candidates
    const stats = await syncCandidates(client, Number(tenantId), {
      limit: 100, // Limit initial sync to 100 candidates
      enrichmentEnabled: true,
    })

    console.log(`Completed initial JobAdder candidate sync for tenant ${tenantId}`, { stats })
  } catch (error) {
    console.error('JobAdder initial candidate sync error:', error)
    throw error
  }
}

/**
 * Scheduled candidate sync (runs periodically)
 */
export async function scheduledCandidateSync(): Promise<void> {
  try {
    console.log('Starting scheduled JobAdder candidate sync')

    // Get all tenants with JobAdder integration enabled
    const tenants = await payload.find({
      collection: 'tenants',
      where: {
        'features.jobAdder': { equals: true },
      },
    })

    // Process each tenant
    for (const tenant of tenants.docs) {
      try {
        // Get access token
        const accessToken = await getAccessToken(String(tenant.id))

        if (!accessToken) {
          console.error(`No access token for tenant ${tenant.id}`)
          continue
        }

        // Create JobAdder client
        const client = new JobAdderClient({
          clientId: '', // Not needed for token-based operations
          clientSecret: '', // Not needed for token-based operations
          accessToken,
          refreshToken: '', // Not needed for this operation
        })

        // Get candidates updated in the last day
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        // Sync candidates with updatedSince filter
        const stats = await syncCandidates(client, Number(tenant.id), {
          updatedSince: yesterday.toISOString(),
          enrichmentEnabled: true,
        })

        console.log(`Completed candidate sync for tenant ${tenant.id}`, { stats })
      } catch (tenantError) {
        console.error(`Error syncing candidates for tenant ${tenant.id}:`, tenantError)
        // Continue with next tenant
      }
    }

    console.log('Completed scheduled JobAdder candidate sync')
  } catch (error) {
    console.error('JobAdder scheduled candidate sync error:', error)
    // Don't throw error to prevent CRON job from failing
  }
}
