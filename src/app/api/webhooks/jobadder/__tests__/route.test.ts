import { NextRequest } from 'next/server'
import { POST, OPTIONS } from '../route'
import { jobAdderIntegration } from '../../../../../plugins/ats/integrations/jobAdder'
import { apiLogger } from '@/lib/logger'
import * as jobAdderTypes from '../../../../../plugins/ats/integrations/jobAdder/types'
import crypto from 'crypto'

// Mock dependencies
jest.mock('../../../../../plugins/ats/integrations/jobAdder', () => ({
  jobAdderIntegration: {
    handleWebhook: jest.fn(),
  },
}))

jest.mock('@/lib/logger', () => ({
  apiLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('../../../../../plugins/ats/integrations/jobAdder/types', () => ({
  isJobAdderWebhookPayload: jest.fn(),
}))

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn().mockReturnValue('test-uuid'),
}))

describe('JobAdder Webhook Route', () => {
  let mockRequest: NextRequest
  const mockIsJobAdderWebhookPayload =
    jobAdderTypes.isJobAdderWebhookPayload as jest.MockedFunction<
      typeof jobAdderTypes.isJobAdderWebhookPayload
    >

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock request
    mockRequest = {
      method: 'POST',
      url: 'https://example.com/api/webhooks/jobadder',
      headers: new Headers({
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        'x-jobadder-signature': 'test-signature',
      }),
      json: jest.fn().mockResolvedValue({
        event: 'job.created',
        data: { id: 'job-123' },
        metadata: { tenantId: 'tenant-123' },
        timestamp: '2025-05-18T03:20:00Z',
        webhookId: 'webhook-123',
      }),
    } as unknown as NextRequest

    // Setup mock responses
    mockIsJobAdderWebhookPayload.mockReturnValue(true)
    ;(jobAdderIntegration.handleWebhook as jest.Mock).mockImplementation((req, res) => {
      res.status(200).send('Webhook processed successfully')
    })
  })

  describe('POST handler', () => {
    it('should process valid webhook requests', async () => {
      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(await response.text()).toBe('Webhook processed successfully')
      expect(apiLogger.info).toHaveBeenCalledWith(
        'Received JobAdder webhook request',
        expect.any(Object),
      )
      expect(mockIsJobAdderWebhookPayload).toHaveBeenCalled()
      expect(jobAdderIntegration.handleWebhook).toHaveBeenCalled()
    })

    it('should return 400 for invalid JSON', async () => {
      mockRequest.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'))

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Invalid JSON payload')
      expect(apiLogger.warn).toHaveBeenCalledWith(
        'Failed to parse webhook request body',
        expect.any(Object),
      )
    })

    it('should return 400 for invalid webhook payload', async () => {
      mockIsJobAdderWebhookPayload.mockReturnValue(false)

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Invalid webhook payload format')
      expect(apiLogger.warn).toHaveBeenCalledWith(
        'Invalid webhook payload format',
        expect.any(Object),
      )
    })

    it('should return 500 for internal errors', async () => {
      ;(jobAdderIntegration.handleWebhook as jest.Mock).mockImplementation(() => {
        throw new Error('Internal error')
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(500)
      expect(await response.text()).toBe('Internal Server Error')
      expect(apiLogger.error).toHaveBeenCalledWith(
        'Error processing JobAdder webhook',
        expect.any(Object),
      )
    })

    it('should handle custom status codes from webhook handler', async () => {
      ;(jobAdderIntegration.handleWebhook as jest.Mock).mockImplementation((req, res) => {
        res.status(401).send('Unauthorized')
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(401)
      expect(await response.text()).toBe('Unauthorized')
    })
  })

  describe('OPTIONS handler', () => {
    it('should return CORS headers for preflight requests', async () => {
      const response = await OPTIONS()

      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type, Authorization, X-JobAdder-Signature',
      )
    })
  })
})
