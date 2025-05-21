import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { emailService } from '../../../../lib/emailService'
import {
  abandonedApplicationTemplate,
  abandonedApplicationTextTemplate,
} from '../../../../lib/emailTemplates'

// Define the time window for abandoned applications (in milliseconds)
const ABANDONED_APPLICATION_WINDOW = 60 * 60 * 1000 // 1 hour

// Define the email template parameters type
interface EmailTemplateParams {
  firstName?: string
  jobTitle: string
  jobLocation: string
  companyName: string
  applicationUrl: string
  logoUrl?: string
}

/**
 * This API route checks for abandoned job applications and triggers retargeting events.
 * It should be called by a cron job every hour.
 *
 * An abandoned application is defined as:
 * 1. A user started an application (apply_started event)
 * 2. No apply_completed event was recorded for the same user and job within the time window
 */
export async function GET(req: NextRequest) {
  try {
    // Check for API key authentication
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate the time window
    const now = new Date()
    const windowStart = new Date(now.getTime() - ABANDONED_APPLICATION_WINDOW)

    // Find all apply_started events within the time window
    const applyStartedEvents = await payload.find({
      collection: 'events' as any,
      where: {
        type: { equals: 'apply_started' },
        timestamp: {
          greater_than: windowStart.toISOString(),
          less_than: now.toISOString(),
        },
      },
      limit: 1000, // Set a reasonable limit
    })

    // Process each apply_started event
    const abandonedApplications = []
    const emailsSent = []

    for (const event of applyStartedEvents.docs) {
      // Check if there's a corresponding apply_completed event
      const applyCompletedEvents = await payload.find({
        collection: 'events' as any,
        where: {
          type: { equals: 'apply_completed' },
          job: { equals: event.job },
          sessionId: { equals: event.sessionId },
          timestamp: { greater_than: event.timestamp },
        },
        limit: 1,
      })

      // If no apply_completed event was found, this is an abandoned application
      if (applyCompletedEvents.totalDocs === 0) {
        abandonedApplications.push(event)

        // Create a retarget_triggered event
        await payload.create({
          collection: 'events' as any,
          data: {
            type: 'retarget_triggered',
            job: event.job,
            sessionId: event.sessionId,
            source: event.source,
            medium: event.medium,
            campaign: event.campaign,
            referrer: event.referrer,
            tenant: event.tenant,
            timestamp: new Date(),
            metadata: {
              originalEventId: event.id,
              reason: 'abandoned_application',
              timeSinceApplyStarted: now.getTime() - new Date(event.timestamp).getTime(),
            },
          },
        })

        // Get the job details
        const job = await payload.findByID({
          collection: 'jobs' as any,
          id: event.job,
        })

        // Get the tenant details
        const tenant = await payload.findByID({
          collection: 'tenants' as any,
          id: event.tenant,
        })

        // Check if we have user contact information in the event metadata
        if (event.metadata?.email) {
          try {
            // Get the tenant's retargeting configuration
            const retargetingConfig = tenant.retargetingConfig || {}

            // Check if the tenant has a custom email template
            const emailTemplate = retargetingConfig.emailTemplate || ''

            // Generate the application URL
            const applicationUrl =
              job.apply_link || `${process.env.NEXT_PUBLIC_SERVER_URL}/jobs/${job.slug}`

            // Get the tenant's logo URL if available
            const logoUrl = tenant.brandingConfig?.logo?.url || ''

            // Prepare the email parameters
            const emailParams: EmailTemplateParams = {
              firstName: event.metadata.firstName || '',
              jobTitle: job.title,
              jobLocation: job.location,
              companyName: tenant.name,
              applicationUrl,
              logoUrl,
            }

            // Create a mapping for template variable replacement
            const templateMapping: Record<string, string> = {
              firstName: emailParams.firstName || '',
              jobTitle: emailParams.jobTitle,
              jobLocation: emailParams.jobLocation,
              companyName: emailParams.companyName,
              applicationUrl: emailParams.applicationUrl,
              logoUrl: emailParams.logoUrl || '',
            }

            // Send the email
            await emailService.sendEmail({
              to: event.metadata.email,
              subject: `Complete Your Application for ${job.title}`,
              html: emailTemplate
                ? emailTemplate.replace(/{{([^{}]+)}}/g, (match: string, key: string) => {
                    const trimmedKey = key.trim()
                    return templateMapping[trimmedKey] || ''
                  })
                : abandonedApplicationTemplate(emailParams),
              text: abandonedApplicationTextTemplate(emailParams),
              from: `${tenant.name} Recruitment <${process.env.EMAIL_DEFAULT_FROM}>`,
            })

            // Add to the emails sent count
            emailsSent.push(event.metadata.email)

            // Update the retarget_triggered event with the email sent status
            await payload.update({
              collection: 'events' as any,
              id: event.id,
              data: {
                metadata: {
                  ...event.metadata,
                  emailSent: true,
                  emailSentAt: new Date(),
                },
              },
            })
          } catch (error) {
            console.error('Error sending abandoned application email:', error)

            // Update the retarget_triggered event with the email error
            await payload.update({
              collection: 'events' as any,
              id: event.id,
              data: {
                metadata: {
                  ...event.metadata,
                  emailSent: false,
                  emailError: error instanceof Error ? error.message : String(error),
                },
              },
            })
          }
        }
      }
    }

    // Return the results
    return NextResponse.json({
      success: true,
      totalChecked: applyStartedEvents.totalDocs,
      abandonedApplications: abandonedApplications.length,
      emailsSent: emailsSent.length,
    })
  } catch (error) {
    console.error('Error checking abandoned applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
