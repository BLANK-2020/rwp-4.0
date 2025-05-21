import { Request, Response } from 'express'
import axios from 'axios'
import payload from 'payload'
import crypto from 'crypto'
import { webhookLogger as logger } from '@/lib/logger'
import { transformJob, transformCandidate } from './transform'
import { getAccessToken } from './oauth'
import { JobAdderClient } from './client'
import {
  JobAdderJob,
  JobAdderCandidate,
  JobAdderWebhookPayload,
  isJobAdderWebhookPayload,
} from './types'

/**
 * Verifies the webhook signature from JobAdder
 * @param req Express request
 * @param secret Webhook secret
 * @returns Boolean indicating if signature is valid
 */
function verifyWebhookSignature(req: Request, secret: string): boolean {
  try {
    // If no secret is configured, skip verification in development
    if (!secret && process.env.NODE_ENV !== 'production') {
      logger.warn('Webhook signature verification skipped - no secret configured')
      return true
    }

    const signature = req.headers['x-jobadder-signature'] as string
    if (!signature) {
      logger.warn('Missing webhook signature header')
      return false
    }

    const payload = JSON.stringify(req.body)
    const hmac = crypto.createHmac('sha256', secret)
    const digest = hmac.update(payload).digest('hex')

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  } catch (error) {
    logger.error('Error verifying webhook signature', { error })
    return false
  }
}

/**
 * Registers a webhook with JobAdder
 * @param accessToken JobAdder access token
 * @param tenantId Tenant ID
 */
export async function registerWebhook(accessToken: string, tenantId: string): Promise<void> {
  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/webhooks/jobadder`
  const webhookSecret = process.env.JOBADDER_WEBHOOK_SECRET || ''

  try {
    logger.info('Registering JobAdder webhook', { tenantId, webhookUrl })

    // Check if webhook already exists
    const webhooks = await axios.get<{ data: any[] }>('https://api.jobadder.com/v2/webhooks', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    // Define all events we want to listen for
    const events = [
      'job.created',
      'job.updated',
      'job.deleted',
      'candidate.created',
      'candidate.updated',
      'candidate.deleted',
    ]

    const existingWebhook = (webhooks.data.data || []).find(
      (webhook: any) => webhook.url === webhookUrl && webhook.events.includes('job.created'),
    )

    if (!existingWebhook) {
      // Register new webhook
      const response = await axios.post<{ data: { id: string } }>(
        'https://api.jobadder.com/v2/webhooks',
        {
          url: webhookUrl,
          events,
          metadata: { tenantId },
          secret: webhookSecret,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )

      logger.info('Registered JobAdder webhook', {
        tenantId,
        webhookId: response.data?.data?.id,
        events,
      })
    } else {
      // Check if we need to update the webhook with new events
      const missingEvents = events.filter((event) => !existingWebhook.events.includes(event))

      if (missingEvents.length > 0) {
        // Update existing webhook with new events
        await axios.put(
          `https://api.jobadder.com/v2/webhooks/${existingWebhook.id}`,
          {
            url: webhookUrl,
            events: [...new Set([...existingWebhook.events, ...events])],
            metadata: { tenantId, ...existingWebhook.metadata },
            secret: webhookSecret,
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        )

        logger.info('Updated JobAdder webhook with new events', {
          tenantId,
          webhookId: existingWebhook.id,
          addedEvents: missingEvents,
        })
      } else {
        logger.info('JobAdder webhook already exists with all required events', {
          tenantId,
          webhookId: existingWebhook.id,
        })
      }
    }
  } catch (error) {
    logger.error('Error registering JobAdder webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId,
      webhookUrl,
    })
    throw error
  }
}

/**
 * Handles incoming webhooks from JobAdder
 * @param req Express request
 * @param res Express response
 */
export async function handleWebhook(req: Request, res: Response) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    logger.info('Received JobAdder webhook', {
      requestId,
      ip: req.ip,
      event: req.body?.event,
    })

    // Validate webhook payload
    if (!isJobAdderWebhookPayload(req.body)) {
      logger.warn('Invalid webhook payload', {
        requestId,
        body: req.body,
      })
      return res.status(400).send('Invalid webhook payload')
    }

    const webhookEvent = req.body as JobAdderWebhookPayload
    const { event, data, metadata } = webhookEvent
    const { tenantId } = metadata

    // Verify webhook signature
    const webhookSecret = process.env.JOBADDER_WEBHOOK_SECRET || ''
    if (!verifyWebhookSignature(req, webhookSecret)) {
      logger.warn('Invalid webhook signature', { requestId, tenantId })
      return res.status(401).send('Invalid webhook signature')
    }

    if (!tenantId) {
      logger.warn('Missing tenant ID in webhook', { requestId })
      return res.status(400).send('Missing tenant ID')
    }

    // Verify tenant exists
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
    })

    if (!tenant) {
      logger.warn('Tenant not found', { requestId, tenantId })
      return res.status(404).send('Tenant not found')
    }

    // Get access token
    const accessToken = await getAccessToken(tenantId)

    if (!accessToken) {
      logger.error('Unable to authenticate with JobAdder', { requestId, tenantId })
      return res.status(401).send('Unable to authenticate with JobAdder')
    }

    switch (event) {
      case 'job.created':
      case 'job.updated': {
        // Get full job details from JobAdder
        logger.debug('Fetching job details from JobAdder', {
          requestId,
          jobId: data.id,
          tenantId,
        })

        const jobResponse = await axios.get<{ data: JobAdderJob }>(
          `https://api.jobadder.com/v2/jobs/${data.id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        )

        const jobAdderJob = jobResponse.data.data

        // Map JobAdder job to platform job
        const mappedJob = await transformJob(jobAdderJob, parseInt(tenantId))

        // Check if job already exists
        const existingJobs = await payload.find({
          collection: 'jobs',
          where: {
            'atsData.jobAdder.id': { equals: data.id },
            tenant: { equals: parseInt(tenantId) },
          },
        })

        if (existingJobs.docs.length > 0) {
          // Update existing job
          await payload.update({
            collection: 'jobs',
            id: existingJobs.docs[0].id,
            data: mappedJob as any,
          })

          logger.info('Updated job from webhook', {
            requestId,
            jobId: existingJobs.docs[0].id,
            jobAdderJobId: data.id,
            tenantId,
            event,
          })
        } else {
          // Create new job
          const newJob = await payload.create({
            collection: 'jobs',
            data: mappedJob as any,
          })

          logger.info('Created new job from webhook', {
            requestId,
            jobId: newJob.id,
            jobAdderJobId: data.id,
            tenantId,
            event,
          })
        }
        break
      }

      case 'job.deleted': {
        // Find and update job status to closed
        logger.debug('Processing job deletion', {
          requestId,
          jobId: data.id,
          tenantId,
        })

        const existingJobs = await payload.find({
          collection: 'jobs',
          where: {
            'atsData.jobAdder.id': { equals: data.id },
            tenant: { equals: parseInt(tenantId) },
          },
        })

        if (existingJobs.docs.length > 0) {
          await payload.update({
            collection: 'jobs',
            id: existingJobs.docs[0].id,
            data: { status: 'closed' },
          })

          logger.info('Closed job from webhook', {
            requestId,
            jobId: existingJobs.docs[0].id,
            jobAdderJobId: data.id,
            tenantId,
            event,
          })
        } else {
          logger.warn('Job not found for deletion', {
            requestId,
            jobAdderJobId: data.id,
            tenantId,
          })
        }
        break
      }

      case 'candidate.created':
      case 'candidate.updated': {
        // Create JobAdder client
        const client = new JobAdderClient({
          clientId: '', // Not needed for token-based operations
          clientSecret: '', // Not needed for token-based operations
          accessToken,
          refreshToken: '', // Not needed for this operation
        })

        // Get full candidate details from JobAdder
        logger.debug('Fetching candidate details from JobAdder', {
          requestId,
          candidateId: data.id,
          tenantId,
        })

        try {
          // Get candidate details
          const candidate = await client.getCandidate(data.id)

          // Get additional candidate data
          let resume, experiences, education, placements

          try {
            // Fetch resume if available
            try {
              resume = await client.getCandidateResume(data.id)
              logger.debug(`Fetched resume for candidate ${data.id}`)
            } catch (error) {
              logger.warn(`Could not fetch resume for candidate ${data.id}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
              })
              // Continue without resume
            }

            // Fetch experiences
            experiences = await client.getCandidateExperiences(data.id)
            logger.debug(`Fetched ${experiences.length} experiences for candidate ${data.id}`)

            // Fetch education
            education = await client.getCandidateEducation(data.id)
            logger.debug(`Fetched ${education.length} education records for candidate ${data.id}`)

            // Fetch placements
            placements = await client.getCandidatePlacements(data.id)
            logger.debug(`Fetched ${placements.length} placements for candidate ${data.id}`)
          } catch (error) {
            logger.error(`Error fetching additional data for candidate ${data.id}`, {
              error: error instanceof Error ? error.message : 'Unknown error',
            })
            // Continue with partial data
          }

          // Transform candidate data
          const transformedCandidate = await transformCandidate(
            candidate,
            parseInt(tenantId),
            resume,
            experiences || [],
            education || [],
            placements || [],
          )

          // Check if candidate already exists
          const existingCandidates = await payload.find({
            collection: 'candidates' as any, // Type assertion to bypass TypeScript check
            where: {
              'atsData.jobAdder.id': {
                equals: data.id,
              },
            },
          })

          if (existingCandidates.docs.length > 0) {
            // Update existing candidate
            const updatedCandidate = await payload.update({
              collection: 'candidates' as any, // Type assertion to bypass TypeScript check
              id: existingCandidates.docs[0].id,
              data: transformedCandidate as any,
            })

            logger.info('Updated candidate from webhook', {
              requestId,
              candidateId: updatedCandidate.id,
              jobAdderCandidateId: data.id,
              tenantId,
              event,
            })
          } else {
            // Create new candidate
            const newCandidate = await payload.create({
              collection: 'candidates' as any, // Type assertion to bypass TypeScript check
              data: transformedCandidate as any,
            })

            logger.info('Created new candidate from webhook', {
              requestId,
              candidateId: newCandidate.id,
              jobAdderCandidateId: data.id,
              tenantId,
              event,
            })
          }
        } catch (error) {
          logger.error(`Error processing candidate webhook for ${data.id}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId,
            candidateId: data.id,
            tenantId,
            event,
          })
        }
        break
      }

      case 'candidate.deleted': {
        // Find and update candidate status to inactive
        logger.debug('Processing candidate deletion', {
          requestId,
          candidateId: data.id,
          tenantId,
        })

        const existingCandidates = await payload.find({
          collection: 'candidates' as any, // Type assertion to bypass TypeScript check
          where: {
            'atsData.jobAdder.id': { equals: data.id },
            tenant: { equals: parseInt(tenantId) },
          },
        })

        if (existingCandidates.docs.length > 0) {
          await payload.update({
            collection: 'candidates' as any, // Type assertion to bypass TypeScript check
            id: existingCandidates.docs[0].id,
            data: { status: 'inactive' },
          })

          logger.info('Marked candidate as inactive from webhook', {
            requestId,
            candidateId: existingCandidates.docs[0].id,
            jobAdderCandidateId: data.id,
            tenantId,
            event,
          })
        } else {
          logger.warn('Candidate not found for deletion', {
            requestId,
            jobAdderCandidateId: data.id,
            tenantId,
          })
        }
        break
      }

      default:
        logger.warn('Unhandled webhook event', {
          requestId,
          event,
          tenantId,
        })
    }

    const duration = Date.now() - startTime
    logger.info('Webhook processed successfully', {
      requestId,
      duration,
      event,
      tenantId,
    })

    res.status(200).send('Webhook processed successfully')
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Error processing webhook', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    })

    // Don't expose internal errors to the client
    res.status(500).send('Error processing webhook')
  }
}
