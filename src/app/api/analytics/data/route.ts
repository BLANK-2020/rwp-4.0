import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsData } from '../../../../lib/analyticsDb'
import { getTenantByDomain } from '../../../../lib/tenants'
import payload from 'payload'

/**
 * API route for fetching analytics data
 *
 * This endpoint returns analytics data for the current tenant.
 * It requires authentication and supports filtering by date range.
 */
export async function GET(req: NextRequest) {
  try {
    // Check if the user is authenticated
    const { user } = req as any
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the tenant from the request hostname
    const hostname = req.headers.get('host') || ''
    const tenant = await getTenantByDomain(hostname)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check if the user has access to this tenant
    if (user.role !== 'admin' && user.tenant !== tenant.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the date range from the query parameters
    const searchParams = new URL(req.url).searchParams
    const days = parseInt(searchParams.get('days') || '30')

    // Get the analytics data
    const analyticsData = await getAnalyticsData(String(tenant.id), days)

    // Return the analytics data
    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
