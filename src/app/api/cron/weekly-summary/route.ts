import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { getAnalyticsData } from '../../../../lib/analyticsDb'
import { generateEmailSummary } from '../../../../lib/openai'
import { emailService } from '../../../../lib/emailService'

/**
 * API route for generating and sending weekly analytics summaries
 *
 * This endpoint is designed to be called by a cron job once a week.
 * It generates an AI summary of analytics data for each tenant and sends it via email.
 */
export async function GET(req: NextRequest) {
  try {
    // Check for API key authentication
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all tenants
    const tenantsResponse = await payload.find({
      collection: 'tenants',
      where: {
        // Only include tenants with analytics enabled
        'features.analytics': { equals: true },
      },
    })

    const results = {
      totalTenants: tenantsResponse.docs.length,
      successCount: 0,
      errorCount: 0,
      errors: [] as string[],
    }

    // Process each tenant
    for (const tenant of tenantsResponse.docs) {
      try {
        // Skip tenants without email
        if (!tenant.email) {
          continue
        }

        // Get analytics data for the last 7 days
        const analyticsData = await getAnalyticsData(String(tenant.id), 7)

        // Generate the email summary
        const emailHtml = await generateEmailSummary(analyticsData, tenant.name)

        // Send the email
        await emailService.sendEmail({
          to: tenant.email,
          subject: `Weekly Analytics Summary for ${tenant.name}`,
          html: emailHtml,
          text: 'Please view this email in an HTML-compatible email client.',
          from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_DEFAULT_FROM}>`,
        })

        results.successCount++
      } catch (error) {
        console.error(`Error processing tenant ${tenant.id}:`, error)
        results.errorCount++
        results.errors.push(
          `Tenant ${tenant.id}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    // Return the results
    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Error generating weekly summaries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
