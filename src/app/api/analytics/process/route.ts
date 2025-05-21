import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { analyticsService } from '../../../../services/analytics'

/**
 * API route to process analytics for a tenant
 *
 * This endpoint can be called manually or scheduled via a cron job
 * to generate analytics data for a specific tenant or all tenants.
 *
 * Query parameters:
 * - tenantId: Optional tenant ID to process analytics for a specific tenant
 * - apiKey: API key for authentication (required)
 *
 * Example:
 * GET /api/analytics/process?tenantId=123&apiKey=your_api_key
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    const apiKey = searchParams.get('apiKey')

    // Validate API key
    if (!apiKey || apiKey !== process.env.ANALYTICS_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 })
    }

    // Process analytics for specific tenant or all tenants
    if (tenantId) {
      // Process analytics for specific tenant
      await analyticsService.processJobMetrics(tenantId)

      return NextResponse.json({
        success: true,
        message: `Analytics processed for tenant: ${tenantId}`,
      })
    } else {
      // Process analytics for all tenants
      const tenants = await payload.find({
        collection: 'tenants' as any,
        limit: 100,
      })

      if (!tenants.docs || tenants.docs.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No tenants found',
        })
      }

      // Process analytics for each tenant
      const results = await Promise.allSettled(
        tenants.docs.map(async (tenant) => {
          try {
            await analyticsService.processJobMetrics(tenant.id)
            return { tenantId: tenant.id, success: true }
          } catch (error: any) {
            return {
              tenantId: tenant.id,
              success: false,
              error: error.message || 'Unknown error',
            }
          }
        }),
      )

      // Count successful and failed operations
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && (r.value as any).success,
      ).length
      const failed = results.filter(
        (r) => r.status === 'rejected' || !(r.value as any).success,
      ).length

      return NextResponse.json({
        success: true,
        message: `Analytics processed for ${successful} tenants, ${failed} failed`,
        results: results.map((r) =>
          r.status === 'fulfilled' ? r.value : { success: false, error: (r as any).reason },
        ),
      })
    }
  } catch (error: any) {
    console.error('Error processing analytics:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * API route to process analytics for a tenant via POST
 *
 * This endpoint can be called with a POST request containing
 * the tenant ID in the request body.
 *
 * Request body:
 * {
 *   "tenantId": "123",
 *   "apiKey": "your_api_key"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { tenantId, apiKey } = body

    // Validate API key
    if (!apiKey || apiKey !== process.env.ANALYTICS_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 })
    }

    // Validate tenant ID
    if (!tenantId) {
      return NextResponse.json({ error: 'Bad request: Missing tenant ID' }, { status: 400 })
    }

    // Process analytics for tenant
    await analyticsService.processJobMetrics(tenantId)

    return NextResponse.json({
      success: true,
      message: `Analytics processed for tenant: ${tenantId}`,
    })
  } catch (error: any) {
    console.error('Error processing analytics:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
