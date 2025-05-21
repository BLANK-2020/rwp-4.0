import { logger } from '@/lib/logger'
import { JobAdderClient } from './client'
import { transformJob, transformCandidate } from './transform'
import { SyncStats, CandidateSyncStats } from './types'
import payload from 'payload'
import { Pool } from 'pg'

// Create a PostgreSQL connection pool for analytics database
const analyticsPool = new Pool({
  connectionString: process.env.ANALYTICS_DATABASE_URI || process.env.DATABASE_URI || '',
})

// ============================================================================
// Job Synchronization
// ============================================================================

export async function syncJobs(client: JobAdderClient, tenantId: number): Promise<SyncStats> {
  const stats: SyncStats = {
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: 0,
  }

  try {
    logger.info('[JobAdder] Starting job sync')
    const startTime = Date.now()

    // Fetch jobs from JobAdder
    logger.debug('[JobAdder] Fetching jobs from API')
    const jobs = await client.getJobs()
    logger.info(`[JobAdder] Found ${jobs.length} jobs to sync`)
    stats.total = jobs.length

    // Process each job
    for (const job of jobs) {
      try {
        logger.debug(`[JobAdder] Processing job ${job.id}`)

        // Transform job data
        const transformedJob = await transformJob(job, tenantId)
        logger.debug(`[JobAdder] Transformed job ${job.id}`, {
          original: job,
          transformed: transformedJob,
        })

        // Check if job exists
        const existingJobs = await payload.find({
          collection: 'jobs',
          where: {
            'atsData.jobAdder.id': {
              equals: job.id,
            },
          },
        })

        if (existingJobs.docs.length > 0) {
          // Update existing job
          logger.debug(`[JobAdder] Updating job ${job.id}`)
          await payload.update({
            collection: 'jobs',
            id: existingJobs.docs[0].id,
            data: transformedJob as any, // TODO: Fix type casting
          })
          stats.updated++
        } else {
          // Create new job
          logger.debug(`[JobAdder] Creating new job ${job.id}`)
          await payload.create({
            collection: 'jobs',
            data: transformedJob as any, // TODO: Fix type casting
          })
          stats.created++
        }
      } catch (error) {
        logger.error(`[JobAdder] Error processing job ${job.id}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          job,
        })
        stats.errors++
      }
    }

    const duration = Date.now() - startTime
    logger.info('[JobAdder] Job sync completed', {
      duration,
      stats,
    })

    return stats
  } catch (error) {
    logger.error('[JobAdder] Job sync failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

// ============================================================================
// Candidate Synchronization
// ============================================================================

export async function syncCandidates(
  client: JobAdderClient,
  tenantId: number,
  options: {
    updatedSince?: string
    priorityOnly?: boolean
    limit?: number
    enrichmentEnabled?: boolean
  } = {},
): Promise<CandidateSyncStats> {
  const stats: CandidateSyncStats = {
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: 0,
    enriched: 0,
    skipped: 0,
    privacyFiltered: 0,
  }

  try {
    logger.info('[JobAdder] Starting candidate sync', { options })
    const startTime = Date.now()

    // Default options
    const { updatedSince, priorityOnly = false, limit = 100, enrichmentEnabled = true } = options

    // Fetch candidates from JobAdder
    logger.debug('[JobAdder] Fetching candidates from API', {
      updatedSince,
      priorityOnly,
      limit,
    })

    const candidates = await client.getCandidates({
      updatedSince,
      limit,
      // If priorityOnly is true, only fetch active candidates
      status: priorityOnly ? 'active' : undefined,
    })

    logger.info(`[JobAdder] Found ${candidates.length} candidates to sync`)
    stats.total = candidates.length

    // Process each candidate
    for (const candidate of candidates) {
      try {
        logger.debug(`[JobAdder] Processing candidate ${candidate.id}`)

        // Check privacy consent before proceeding
        const hasConsent = await checkCandidateConsent(candidate.id)
        if (!hasConsent) {
          logger.info(`[JobAdder] Skipping candidate ${candidate.id} due to privacy consent`)
          stats.privacyFiltered++
          continue
        }

        // Fetch additional candidate data
        let resume, experiences, education, placements

        try {
          // Fetch resume if available
          try {
            resume = await client.getCandidateResume(candidate.id)
            logger.debug(`[JobAdder] Fetched resume for candidate ${candidate.id}`)
          } catch (error) {
            logger.warn(`[JobAdder] Could not fetch resume for candidate ${candidate.id}`, {
              error: error instanceof Error ? error.message : 'Unknown error',
            })
            // Continue without resume
          }

          // Fetch experiences
          experiences = await client.getCandidateExperiences(candidate.id)
          logger.debug(
            `[JobAdder] Fetched ${experiences.length} experiences for candidate ${candidate.id}`,
          )

          // Fetch education
          education = await client.getCandidateEducation(candidate.id)
          logger.debug(
            `[JobAdder] Fetched ${education.length} education records for candidate ${candidate.id}`,
          )

          // Fetch placements
          placements = await client.getCandidatePlacements(candidate.id)
          logger.debug(
            `[JobAdder] Fetched ${placements.length} placements for candidate ${candidate.id}`,
          )
        } catch (error) {
          logger.error(`[JobAdder] Error fetching additional data for candidate ${candidate.id}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          // Continue with partial data
        }

        // Transform candidate data
        const transformedCandidate = await transformCandidate(
          candidate,
          tenantId,
          resume,
          experiences || [],
          education || [],
          placements || [],
        )

        logger.debug(`[JobAdder] Transformed candidate ${candidate.id}`)

        // Check if candidate exists in Payload CMS
        const existingCandidates = await payload.find({
          collection: 'candidates' as any, // Type assertion to bypass TypeScript check
          where: {
            'atsData.jobAdder.id': {
              equals: candidate.id,
            },
          },
        })

        let candidateId: string

        if (existingCandidates.docs.length > 0) {
          // Update existing candidate
          logger.debug(`[JobAdder] Updating candidate ${candidate.id}`)
          const updatedCandidate = await payload.update({
            collection: 'candidates' as any, // Type assertion to bypass TypeScript check
            id: existingCandidates.docs[0].id,
            data: transformedCandidate as any, // TODO: Fix type casting
          })
          candidateId = updatedCandidate.id as string // Type assertion
          stats.updated++
        } else {
          // Create new candidate
          logger.debug(`[JobAdder] Creating new candidate ${candidate.id}`)
          const newCandidate = await payload.create({
            collection: 'candidates' as any, // Type assertion to bypass TypeScript check
            data: transformedCandidate as any, // TODO: Fix type casting
          })
          candidateId = newCandidate.id as string // Type assertion
          stats.created++
        }

        // Queue candidate for AI enrichment if enabled
        if (enrichmentEnabled) {
          await queueCandidateForEnrichment(candidateId, candidate.id, tenantId)
          stats.enriched++
          logger.debug(`[JobAdder] Queued candidate ${candidate.id} for AI enrichment`)
        } else {
          stats.skipped++
        }

        // Log candidate data access for compliance
        await logCandidateDataAccess(candidate.id, 'sync', 'system')
      } catch (error) {
        logger.error(`[JobAdder] Error processing candidate ${candidate.id}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          candidateId: candidate.id,
        })
        stats.errors++
      }
    }

    const duration = Date.now() - startTime
    logger.info('[JobAdder] Candidate sync completed', {
      duration,
      stats,
    })

    return stats
  } catch (error) {
    logger.error('[JobAdder] Candidate sync failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      options,
    })
    throw error
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a candidate has given consent for data processing
 */
async function checkCandidateConsent(candidateId: string): Promise<boolean> {
  try {
    // In a real implementation, this would check the candidate's consent status
    // For now, we'll assume consent is given
    return true
  } catch (error) {
    logger.error(`[JobAdder] Error checking candidate consent`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      candidateId,
    })
    // Default to false if there's an error
    return false
  }
}

/**
 * Queue a candidate for AI enrichment
 */
async function queueCandidateForEnrichment(
  payloadCandidateId: string,
  jobAdderCandidateId: string,
  tenantId: number,
): Promise<void> {
  try {
    // In a real implementation, this would add the candidate to a queue for processing
    // For now, we'll just log that it would be queued
    logger.info(`[JobAdder] Would queue candidate for AI enrichment`, {
      payloadCandidateId,
      jobAdderCandidateId,
      tenantId,
    })

    // Insert a record in the analytics database to track the enrichment request
    await analyticsPool.query(
      `
      INSERT INTO candidate_enrichment_queue
      (candidate_id, source_id, tenant_id, status, created_at)
      VALUES ($1, $2, $3, 'pending', NOW())
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        status = 'pending',
        updated_at = NOW()
      `,
      [payloadCandidateId, jobAdderCandidateId, tenantId],
    )
  } catch (error) {
    logger.error(`[JobAdder] Error queueing candidate for AI enrichment`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      payloadCandidateId,
      jobAdderCandidateId,
    })
    // Don't throw the error, just log it
  }
}

/**
 * Log candidate data access for compliance
 */
async function logCandidateDataAccess(
  candidateId: string,
  accessType: string,
  userId: string,
): Promise<void> {
  try {
    // In a real implementation, this would log the access to the candidate data
    // For now, we'll just log that it would be logged
    logger.debug(`[JobAdder] Logging candidate data access`, {
      candidateId,
      accessType,
      userId,
    })

    // Insert a record in the analytics database to track the data access
    await analyticsPool.query(
      `
      INSERT INTO candidate_data_access_log
      (candidate_id, access_type, user_id, access_time, ip_address)
      VALUES ($1, $2, $3, NOW(), $4)
      `,
      [candidateId, accessType, userId, '127.0.0.1'], // IP would be captured in a real implementation
    )
  } catch (error) {
    logger.error(`[JobAdder] Error logging candidate data access`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      candidateId,
      accessType,
      userId,
    })
    // Don't throw the error, just log it
  }
}
