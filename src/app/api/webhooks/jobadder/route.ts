import { NextRequest, NextResponse } from 'next/server'
import { jobAdderIntegration } from '../../../../plugins/ats/integrations/jobAdder'
import { apiLogger as logger } from '@/lib/logger'
import { isJobAdderWebhookPayload } from '../../../../plugins/ats/integrations/jobAdder/types'
import crypto from 'crypto'

/**
 * API route to handle JobAdder webhooks
 * This endpoint receives webhook events from JobAdder when jobs are created, updated, or deleted
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    // Get client IP from headers or connection info
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    logger.info('Received JobAdder webhook request', {
      requestId,
      method: req.method,
      url: req.url,
      clientIp,
    })

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (error) {
      logger.warn('Failed to parse webhook request body', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return new NextResponse('Invalid JSON payload', { status: 400 })
    }

    // Validate webhook payload
    if (!isJobAdderWebhookPayload(body)) {
      logger.warn('Invalid webhook payload format', {
        requestId,
        body,
      })
      return new NextResponse('Invalid webhook payload format', { status: 400 })
    }

    // Create Express-compatible request and response objects
    const expressReq = {
      body,
      headers: Object.fromEntries(req.headers.entries()),
      ip: clientIp,
    }

    let statusCode = 200
    let responseText = 'Webhook processed successfully'

    const expressRes = {
      status: (code: number) => {
        statusCode = code
        return expressRes
      },
      send: (text: string) => {
        responseText = text
        return expressRes
      },
    }

    // Process the webhook using the JobAdder integration
    await jobAdderIntegration.handleWebhook(expressReq as any, expressRes as any)

    const duration = Date.now() - startTime
    logger.info('Webhook processed successfully', {
      requestId,
      duration,
      statusCode,
      event: body.event,
    })

    // Return the response
    return new NextResponse(responseText, { status: statusCode })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Error processing JobAdder webhook', {
      requestId,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Don't expose internal errors to the client
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-JobAdder-Signature',
      'Access-Control-Max-Age': '86400',
    },
  })
}
