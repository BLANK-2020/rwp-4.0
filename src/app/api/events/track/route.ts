import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { getTenantByDomain } from '../../../../lib/tenants'

// Define the expected request body structure
interface TrackEventRequest {
  eventType: 'job_viewed' | 'apply_started' | 'apply_completed' | 'retarget_triggered'
  jobId: string
  sessionId: string
  utmParams?: {
    source?: string
    medium?: string
    campaign?: string
  }
  referrer?: string
  metadata?: Record<string, any>
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = (await req.json()) as TrackEventRequest
    const { eventType, jobId, sessionId, utmParams, referrer, metadata } = body

    // Validate required fields
    if (!eventType || !jobId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, jobId, and sessionId are required' },
        { status: 400 },
      )
    }

    // Get the tenant from the request hostname
    const hostname = req.headers.get('host') || ''
    const tenant = await getTenantByDomain(hostname)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Verify that the job exists and belongs to the tenant
    const job = await payload.findByID({
      collection: 'jobs',
      id: jobId,
      depth: 0,
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.tenant !== tenant.id) {
      return NextResponse.json(
        { error: 'Job does not belong to the current tenant' },
        { status: 403 },
      )
    }

    // Create the event
    // We need to cast 'events' as any to bypass TypeScript's type checking
    // since it doesn't recognize 'events' as a valid collection slug yet
    const event = await payload.create({
      collection: 'events' as any,
      data: {
        type: eventType,
        job: jobId,
        sessionId,
        source: utmParams?.source,
        medium: utmParams?.medium,
        campaign: utmParams?.campaign,
        referrer,
        tenant: tenant.id,
        timestamp: new Date(),
        metadata,
      },
    })

    // If this is an apply_started event, schedule a check for abandoned applications
    if (eventType === 'apply_started') {
      // In a production environment, you would use a queue system like Bull
      // For now, we'll just log that we would schedule a check
      console.log(`Scheduled abandoned application check for session ${sessionId}, job ${jobId}`)

      // TODO: Implement abandoned application check
      // This would be done with a background job that runs after a delay (e.g., 1 hour)
      // If no apply_completed event is found for the same session and job, trigger a retarget_triggered event
    }

    // Return the created event
    return NextResponse.json({ success: true, event }, { status: 201 })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
