import axios from 'axios'
import payload from 'payload'

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

/**
 * Handles OAuth functionality for JobAdder integration
 */
export const jobAdderOAuth = {
  /**
   * Generate authorization URL for JobAdder OAuth
   * @param tenantId Tenant ID
   * @returns Authorization URL
   */
  getAuthorizationUrl(tenantId: string): string {
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/oauth/jobadder/callback`
    const clientId = process.env.JOBADDER_CLIENT_ID

    if (!clientId) {
      throw new Error('JOBADDER_CLIENT_ID environment variable is not set')
    }

    return `https://id.jobadder.com/connect/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid profile email jobs:read jobs:write&state=${tenantId}`
  },

  /**
   * Handle OAuth callback and exchange code for tokens
   * @param code Authorization code
   * @param tenantId Tenant ID
   */
  async handleCallback(code: string, tenantId: string): Promise<void> {
    try {
      const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/oauth/jobadder/callback`
      const clientId = process.env.JOBADDER_CLIENT_ID
      const clientSecret = process.env.JOBADDER_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        throw new Error('JobAdder OAuth credentials not configured')
      }

      // Exchange code for tokens
      const tokenResponse = await axios.post<TokenResponse>(
        'https://id.jobadder.com/connect/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )

      const { access_token, refresh_token, expires_in } = tokenResponse.data

      // Store tokens securely in tenant record
      await payload.update({
        collection: 'tenants',
        id: tenantId,
        data: {
          atsConfig: {
            jobAdder: {
              accessToken: access_token,
              refreshToken: refresh_token,
              tokenExpiry: new Date(Date.now() + expires_in * 1000).toISOString(),
            },
          },
        },
      })

      // Register webhook for this tenant
      const { registerWebhook } = await import('./webhook')
      await registerWebhook(access_token, tenantId)

      // Trigger initial job sync
      const { initialJobSync } = await import('./cron')
      await initialJobSync(tenantId)
    } catch (error) {
      console.error('JobAdder OAuth error:', error)
      throw error
    }
  },

  /**
   * Refresh access token when expired
   * @param tenantId Tenant ID
   * @returns New access token
   */
  async refreshAccessToken(tenantId: string): Promise<string> {
    try {
      const tenant = await payload.findByID({
        collection: 'tenants',
        id: tenantId,
      })

      if (!tenant?.atsConfig?.jobAdder?.refreshToken) {
        throw new Error('No refresh token available')
      }

      const clientId = process.env.JOBADDER_CLIENT_ID
      const clientSecret = process.env.JOBADDER_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        throw new Error('JobAdder OAuth credentials not configured')
      }

      const tokenResponse = await axios.post<TokenResponse>(
        'https://id.jobadder.com/connect/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tenant.atsConfig.jobAdder.refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )

      const { access_token, refresh_token, expires_in } = tokenResponse.data

      // Update stored tokens
      await payload.update({
        collection: 'tenants',
        id: tenantId,
        data: {
          atsConfig: {
            jobAdder: {
              accessToken: access_token,
              refreshToken: refresh_token,
              tokenExpiry: new Date(Date.now() + expires_in * 1000).toISOString(),
            },
          },
        },
      })

      return access_token
    } catch (error) {
      console.error('Error refreshing JobAdder access token:', error)
      throw error
    }
  },
}

/**
 * Get a valid access token for a tenant
 * @param tenantId Tenant ID
 * @returns Access token
 */
export async function getAccessToken(tenantId: string): Promise<string | null> {
  try {
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
    })

    if (!tenant?.atsConfig?.jobAdder?.accessToken) {
      return null
    }

    // Check if token is expired
    const tokenExpiry = new Date(tenant.atsConfig.jobAdder.tokenExpiry || 0)
    if (tokenExpiry <= new Date()) {
      // Token is expired, refresh it
      return await jobAdderOAuth.refreshAccessToken(tenantId)
    }

    return tenant.atsConfig.jobAdder.accessToken
  } catch (error) {
    console.error('Error getting JobAdder access token:', error)
    return null
  }
}
