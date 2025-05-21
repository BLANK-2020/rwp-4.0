import { handleWebhook, registerWebhook } from '../webhook'
import axios from 'axios'
import payload from 'payload'
import { webhookLogger } from '@/lib/logger'
import { getAccessToken } from '../oauth'
import { transformJob } from '../transform'
import { JobAdderWebhookPayload } from '../types'
import crypto from 'crypto'

// Mock dependencies
jest.mock('axios')
jest.mock('payload', () => ({
  find: jest.fn(),
  findByID: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}))
jest.mock('@/lib/logger', () => ({
  webhookLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))
jest.mock('../oauth', () => ({
  getAccessToken: jest.fn(),
}))
jest.mock('../transform', () => ({
  transformJob: jest.fn(),
}))
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn().mockReturnValue('test-uuid'),
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('test-digest'),
  }),
  timingSafeEqual: jest.fn(),
}))

describe('JobAdder Webhook Handler', () => {
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock request and response
    mockReq = {
      body: {
        event: 'job.created',
        data: { id: 'job-123' },
        metadata: { tenantId: 'tenant-123' },
        timestamp: '2025-05-18T03:20:00Z',
        webhookId: 'webhook-123',
      },
      headers: {
        'x-jobadder-signature': 'test-signature',
      },
      ip: '127.0.0.1',
    }

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }

    // Setup mock responses
    ;(payload.findByID as jest.Mock).mockResolvedValue({ id: 'tenant-123' })
    ;(getAccessToken as jest.Mock).mockResolvedValue('test-access-token')
    ;(axios.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          id: 'job-123',
          title: 'Test Job',
          status: 'active',
          location: { city: 'Sydney', state: 'NSW', country: 'Australia' },
          workType: 'permanent',
          description: 'Test description',
          applicationUrl: 'https://test.com/apply',
          postedDate: '2025-05-18T00:00:00Z',
          reference: 'TEST-001',
          salary: { type: 'annual', currency: 'AUD' },
        },
      },
    })
    ;(transformJob as jest.Mock).mockResolvedValue({
      title: 'Test Job',
      status: 'published',
    })
    ;(payload.find as jest.Mock).mockResolvedValue({ docs: [] })
    ;(payload.create as jest.Mock).mockResolvedValue({ id: 'new-job-123' })
    ;(crypto.timingSafeEqual as jest.Mock).mockReturnValue(true)

    // Set environment variables
    process.env.JOBADDER_WEBHOOK_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.JOBADDER_WEBHOOK_SECRET
  })

  describe('handleWebhook', () => {
    it('should process job.created event and create a new job', async () => {
      await handleWebhook(mockReq, mockRes)

      expect(webhookLogger.info).toHaveBeenCalledWith(
        'Received JobAdder webhook',
        expect.any(Object),
      )
      expect(payload.findByID).toHaveBeenCalledWith({
        collection: 'tenants',
        id: 'tenant-123',
      })
      expect(getAccessToken).toHaveBeenCalledWith('tenant-123')
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.jobadder.com/v2/jobs/job-123',
        expect.any(Object),
      )
      expect(transformJob).toHaveBeenCalled()
      expect(payload.find).toHaveBeenCalled()
      expect(payload.create).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.send).toHaveBeenCalledWith('Webhook processed successfully')
    })

    it('should process job.updated event and update an existing job', async () => {
      mockReq.body.event = 'job.updated'
      ;(payload.find as jest.Mock).mockResolvedValue({
        docs: [{ id: 'existing-job-123' }],
      })

      await handleWebhook(mockReq, mockRes)

      expect(payload.update).toHaveBeenCalledWith({
        collection: 'jobs',
        id: 'existing-job-123',
        data: expect.any(Object),
      })
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should process job.deleted event and close the job', async () => {
      mockReq.body.event = 'job.deleted'
      ;(payload.find as jest.Mock).mockResolvedValue({
        docs: [{ id: 'existing-job-123' }],
      })

      await handleWebhook(mockReq, mockRes)

      expect(payload.update).toHaveBeenCalledWith({
        collection: 'jobs',
        id: 'existing-job-123',
        data: { status: 'closed' },
      })
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should return 400 for invalid webhook payload', async () => {
      mockReq.body = { invalid: 'payload' }

      await handleWebhook(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.send).toHaveBeenCalledWith('Invalid webhook payload')
    })

    it('should return 401 for invalid webhook signature', async () => {
      ;(crypto.timingSafeEqual as jest.Mock).mockReturnValue(false)

      await handleWebhook(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.send).toHaveBeenCalledWith('Invalid webhook signature')
    })

    it('should return 404 if tenant not found', async () => {
      ;(payload.findByID as jest.Mock).mockResolvedValue(null)

      await handleWebhook(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.send).toHaveBeenCalledWith('Tenant not found')
    })

    it('should return 401 if unable to get access token', async () => {
      ;(getAccessToken as jest.Mock).mockResolvedValue(null)

      await handleWebhook(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.send).toHaveBeenCalledWith('Unable to authenticate with JobAdder')
    })

    it('should handle errors and return 500', async () => {
      ;(axios.get as jest.Mock).mockRejectedValue(new Error('API error'))

      await handleWebhook(mockReq, mockRes)

      expect(webhookLogger.error).toHaveBeenCalledWith(
        'Error processing webhook',
        expect.any(Object),
      )
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })
  })

  describe('registerWebhook', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_API_URL = 'https://example.com'
      ;(axios.get as jest.Mock).mockResolvedValue({ data: { data: [] } })
      ;(axios.post as jest.Mock).mockResolvedValue({
        data: { data: { id: 'new-webhook-123' } },
      })
    })

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_API_URL
    })

    it('should register a new webhook if none exists', async () => {
      await registerWebhook('test-access-token', 'tenant-123')

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.jobadder.com/v2/webhooks',
        expect.any(Object),
      )
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.jobadder.com/v2/webhooks',
        {
          url: 'https://example.com/api/webhooks/jobadder',
          events: ['job.created', 'job.updated', 'job.deleted'],
          metadata: { tenantId: 'tenant-123' },
          secret: 'test-secret',
        },
        expect.any(Object),
      )
      expect(webhookLogger.info).toHaveBeenCalledWith(
        'Registered JobAdder webhook',
        expect.any(Object),
      )
    })

    it('should not register a webhook if one already exists', async () => {
      ;(axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: [
            {
              id: 'existing-webhook-123',
              url: 'https://example.com/api/webhooks/jobadder',
              events: ['job.created', 'job.updated', 'job.deleted'],
            },
          ],
        },
      })

      await registerWebhook('test-access-token', 'tenant-123')

      expect(axios.post).not.toHaveBeenCalled()
      expect(webhookLogger.info).toHaveBeenCalledWith(
        'JobAdder webhook already exists',
        expect.any(Object),
      )
    })

    it('should handle errors during webhook registration', async () => {
      ;(axios.get as jest.Mock).mockRejectedValue(new Error('API error'))

      await expect(registerWebhook('test-access-token', 'tenant-123')).rejects.toThrow()

      expect(webhookLogger.error).toHaveBeenCalledWith(
        'Error registering JobAdder webhook',
        expect.any(Object),
      )
    })
  })
})
