import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'

// Define the types for the new fields
interface MarketingConfig {
  facebookPixel?: {
    enabled: boolean
    pixelId: string
    advancedMatching: boolean
  }
  googleTagManager?: {
    enabled: boolean
    containerId: string
  }
  linkedInInsightTag?: {
    enabled: boolean
    partnerId: string
  }
  googleAnalytics?: {
    enabled: boolean
    measurementId: string
  }
}

interface TenantWithMarketingConfig {
  id: string
  name: string
  features?: {
    jobAdder?: boolean
    bullhorn?: boolean
    advancedAnalytics?: boolean
    customBranding?: boolean
    marketingPixels?: boolean
    retargeting?: boolean
  }
  marketingConfig?: MarketingConfig
}

/**
 * API endpoint to fetch tenant-specific marketing configuration
 * This is used by the MarketingPixels component to get the correct pixel IDs
 */
export async function GET(req: NextRequest) {
  try {
    // Get the hostname from the query parameters
    const { searchParams } = new URL(req.url)
    const hostname = searchParams.get('hostname')

    if (!hostname) {
      return NextResponse.json({ error: 'Hostname is required' }, { status: 400 })
    }

    // Find the tenant by hostname
    const tenants = await payload.find({
      collection: 'tenants',
      where: {
        customDomain: { equals: hostname },
      },
      limit: 1,
    })

    if (tenants.docs.length === 0) {
      // If no tenant is found with the exact hostname, try to match the base domain
      // This handles subdomains like "jobs.example.com" when the tenant has "example.com"
      const baseDomain = hostname.split('.').slice(-2).join('.')

      const baseTenantsResponse = await payload.find({
        collection: 'tenants',
        where: {
          customDomain: { like: baseDomain },
        },
        limit: 1,
      })

      if (baseTenantsResponse.docs.length === 0) {
        return NextResponse.json(
          { error: 'Tenant not found for the provided hostname' },
          { status: 404 },
        )
      }

      // Cast the tenant to our extended type
      const tenant = baseTenantsResponse.docs[0] as unknown as TenantWithMarketingConfig

      // Check if marketing pixels are enabled for this tenant
      if (!tenant.features?.marketingPixels) {
        return NextResponse.json(
          { error: 'Marketing pixels are not enabled for this tenant' },
          { status: 403 },
        )
      }

      // Return the marketing configuration
      return NextResponse.json({
        success: true,
        tenantId: tenant.id,
        tenantName: tenant.name,
        marketingConfig: tenant.marketingConfig || {},
      })
    }

    // Cast the tenant to our extended type
    const tenant = tenants.docs[0] as unknown as TenantWithMarketingConfig

    // Check if marketing pixels are enabled for this tenant
    if (!tenant.features?.marketingPixels) {
      return NextResponse.json(
        { error: 'Marketing pixels are not enabled for this tenant' },
        { status: 403 },
      )
    }

    // Return the marketing configuration
    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      tenantName: tenant.name,
      marketingConfig: tenant.marketingConfig || {},
    })
  } catch (error) {
    console.error('Error fetching tenant marketing configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
