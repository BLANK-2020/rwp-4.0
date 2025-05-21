import { NextRequest, NextResponse } from 'next/server'
import { jobAdderIntegration } from '../../../../../plugins/ats/integrations/jobAdder'

/**
 * API route to handle JobAdder OAuth callback
 * This endpoint receives the authorization code from JobAdder after a user authorizes the application
 */
export async function GET(req: NextRequest) {
  try {
    // Get the authorization code and state (tenant ID) from the query parameters
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // This is the tenant ID

    if (!code) {
      return new NextResponse('Missing authorization code', { status: 400 })
    }

    if (!state) {
      return new NextResponse('Missing state parameter', { status: 400 })
    }

    // Exchange the code for tokens
    await jobAdderIntegration.oauth.handleCallback(code, state)

    // Redirect to the admin dashboard with a success message
    const redirectUrl = `/admin/collections/tenants/${state}?message=JobAdder+connected+successfully`
    return NextResponse.redirect(new URL(redirectUrl, req.url))
  } catch (error) {
    console.error('Error processing JobAdder OAuth callback:', error)

    // Redirect to the admin dashboard with an error message
    const state = new URL(req.url).searchParams.get('state')
    const redirectUrl = state
      ? `/admin/collections/tenants/${state}?error=Failed+to+connect+JobAdder`
      : '/admin/collections/tenants?error=Failed+to+connect+JobAdder'

    return NextResponse.redirect(new URL(redirectUrl, req.url))
  }
}
