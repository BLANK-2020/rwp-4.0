import { NextRequest, NextResponse } from 'next/server'
import { jobAdderIntegration } from '../../../../../plugins/ats/integrations/jobAdder'

/**
 * API route to initiate JobAdder OAuth flow
 * This endpoint generates an authorization URL and redirects the user to JobAdder's authorization page
 */
export async function GET(req: NextRequest) {
  try {
    // Get the tenant ID from the query parameters
    const url = new URL(req.url)
    const tenantId = url.searchParams.get('tenantId')

    if (!tenantId) {
      return new NextResponse('Missing tenant ID', { status: 400 })
    }

    // Generate the authorization URL
    const authUrl = jobAdderIntegration.oauth.getAuthorizationUrl(tenantId)

    // Redirect to JobAdder's authorization page
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error initiating JobAdder OAuth flow:', error)

    // Redirect to the admin dashboard with an error message
    const tenantId = new URL(req.url).searchParams.get('tenantId')
    const redirectUrl = tenantId
      ? `/admin/collections/tenants/${tenantId}?error=Failed+to+initiate+JobAdder+OAuth+flow`
      : '/admin/collections/tenants?error=Failed+to+initiate+JobAdder+OAuth+flow'

    return NextResponse.redirect(new URL(redirectUrl, req.url))
  }
}
