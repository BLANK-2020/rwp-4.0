import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * Middleware for the RWP AI Enrichment microservice
 *
 * This middleware handles:
 * 1. Request logging
 * 2. API key validation
 * 3. Tenant validation
 * 4. Request ID generation
 * 5. CORS headers
 */
export async function middleware(request: NextRequest) {
  // Generate a request ID
  const requestId = uuidv4()

  // Get the start time for performance measurement
  const startTime = Date.now()

  // Clone the request headers for modification
  const requestHeaders = new Headers(request.headers)

  // Add the request ID to the headers
  requestHeaders.set('x-request-id', requestId)

  // Log the incoming request
  console.log(`[${requestId}] ${request.method} ${request.nextUrl.pathname}`, {
    query: Object.fromEntries(request.nextUrl.searchParams.entries()),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  })

  // Skip API key validation for non-API routes and health checks
  if (!request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname === '/api/health') {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Validate API key for API routes
  const apiKey = request.headers.get('x-api-key')

  // In production, we would validate the API key against a database or environment variable
  // For now, we'll use a simple check
  const validApiKey = process.env.API_KEY || 'test-api-key'

  if (!apiKey || apiKey !== validApiKey) {
    console.log(`[${requestId}] Invalid API key`)

    return new NextResponse(
      JSON.stringify({
        error: 'Invalid API key',
        requestId,
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId,
        },
      },
    )
  }

  // Validate tenant ID for API routes
  let tenantId = ''

  // Check for tenant ID in query parameters
  if (request.nextUrl.searchParams.has('tenantId')) {
    tenantId = request.nextUrl.searchParams.get('tenantId') || ''
  }

  // Check for tenant ID in request body for POST/PUT requests
  if (!tenantId && (request.method === 'POST' || request.method === 'PUT')) {
    try {
      const body = await request.clone().json()
      tenantId = body.tenantId || ''
    } catch (error) {
      // Ignore JSON parsing errors
    }
  }

  // Check for tenant ID in headers
  if (!tenantId) {
    tenantId = request.headers.get('x-tenant-id') || ''
  }

  // In production, we would validate the tenant ID against a database
  // For now, we'll just check that it's not empty
  if (!tenantId) {
    console.log(`[${requestId}] Missing tenant ID`)

    return new NextResponse(
      JSON.stringify({
        error: 'Missing tenant ID',
        requestId,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId,
        },
      },
    )
  }

  // Add the tenant ID to the headers
  requestHeaders.set('x-tenant-id', tenantId)

  // Process the request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-api-key, x-tenant-id',
  )

  // Add the request ID to the response headers
  response.headers.set('x-request-id', requestId)

  // Log the response time
  const endTime = Date.now()
  const responseTime = endTime - startTime

  console.log(`[${requestId}] Response time: ${responseTime}ms`)

  return response
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
