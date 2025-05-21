import { NextRequest, NextResponse } from 'next/server'
import { jobAdderIntegration } from '../../../../plugins/ats/integrations/jobAdder'
import { getPayload } from 'payload'
import config from '../../../../payload.config'

/**
 * API route to manually trigger job synchronization
 * This endpoint can be used to manually sync jobs from JobAdder for a specific tenant
 * or to run the scheduled sync for all tenants
 */
export async function POST(req: NextRequest) {
  try {
    // Check if the request is authenticated
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({
      headers: req.headers,
    } as any)

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { tenantId, mode = 'initial' } = body

    if (tenantId) {
      // Sync jobs for a specific tenant
      if (mode === 'initial') {
        await jobAdderIntegration.initialJobSync(tenantId)
        return new NextResponse(
          JSON.stringify({
            success: true,
            message: `Initial job sync completed for tenant ${tenantId}`,
          }),
        )
      } else {
        // Get tenant details
        const tenant = await payload.findByID({
          collection: 'tenants',
          id: tenantId,
        })

        if (!tenant) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `Tenant ${tenantId} not found`,
            }),
            { status: 404 },
          )
        }

        // Check if JobAdder is enabled for this tenant
        if (!tenant.features?.jobAdder) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `JobAdder is not enabled for tenant ${tenantId}`,
            }),
            { status: 400 },
          )
        }

        // Get access token
        console.log('Attempting to get access token using jobAdderIntegration.getAccessToken')
        console.log('Available methods on jobAdderIntegration:', Object.keys(jobAdderIntegration))
        const accessToken = await jobAdderIntegration.getAccessToken(String(tenantId))

        if (!accessToken) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `No access token available for tenant ${tenantId}`,
            }),
            { status: 400 },
          )
        }

        // Register webhook if it doesn't exist
        await jobAdderIntegration.registerWebhook(accessToken, String(tenantId))

        return new NextResponse(
          JSON.stringify({
            success: true,
            message: `Webhook registered for tenant ${tenantId}`,
          }),
        )
      }
    } else {
      // Run scheduled sync for all tenants
      await jobAdderIntegration.scheduledJobSync()
      return new NextResponse(
        JSON.stringify({
          success: true,
          message: 'Scheduled job sync completed for all tenants',
        }),
      )
    }
  } catch (error: any) {
    console.error('Error syncing jobs:', error)
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: `Error syncing jobs: ${error.message || 'Unknown error'}`,
      }),
      { status: 500 },
    )
  }
}
