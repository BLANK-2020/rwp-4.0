import { JobAdderClient } from '../client'
import { jobAdderLogger } from '@/lib/logger'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import type { JobAdderJob, JobAdderConfig } from '../types'

// Mock types
type MockLogger = {
  debug: jest.Mock
  info: jest.Mock
  warn: jest.Mock
  error: jest.Mock
}

// Mock the logger
jest.mock('@/lib/logger', () => ({
  jobAdderLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('JobAdderClient', () => {
  let client: JobAdderClient
  let mock: MockAdapter
  let mockLogger: MockLogger

  const mockConfig: JobAdderConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    mock = new MockAdapter(axios)
    client = new JobAdderClient(mockConfig)
    mockLogger = jobAdderLogger as unknown as MockLogger
  })

  afterEach(() => {
    mock.reset()
  })

  describe('getJobs', () => {
    const mockJobs: JobAdderJob[] = [
      {
        id: '1',
        title: 'Test Job 1',
        status: 'active',
        location: { city: 'Sydney', state: 'NSW', country: 'Australia' },
        workType: 'permanent',
        description: 'Test description',
        applicationUrl: 'https://test.com/apply',
        postedDate: '2025-05-18T00:00:00Z',
        reference: 'TEST-001',
        salary: {
          type: 'annual',
          currency: 'AUD',
        },
      },
      {
        id: '2',
        title: 'Test Job 2',
        status: 'active',
        location: { city: 'Melbourne', state: 'VIC', country: 'Australia' },
        workType: 'contract',
        description: 'Test description 2',
        applicationUrl: 'https://test.com/apply2',
        postedDate: '2025-05-18T00:00:00Z',
        reference: 'TEST-002',
        salary: {
          type: 'annual',
          currency: 'AUD',
        },
      },
    ]

    it('should fetch jobs successfully', async () => {
      mock.onGet('/jobs').reply(200, mockJobs)

      const jobs = await client.getJobs()

      expect(jobs).toEqual(mockJobs)
      expect(mockLogger.debug).toHaveBeenCalledWith('Fetching jobs', expect.any(Object))
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully fetched jobs',
        expect.objectContaining({ count: 2 }),
      )
    })

    it('should handle network errors', async () => {
      mock.onGet('/jobs').networkError()

      await expect(client.getJobs()).rejects.toThrow()
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch jobs', expect.any(Object))
    })

    it('should retry on 5xx errors', async () => {
      mock
        .onGet('/jobs')
        .replyOnce(500)
        .onGet('/jobs')
        .replyOnce(503)
        .onGet('/jobs')
        .reply(200, mockJobs)

      const jobs = await client.getJobs()

      expect(jobs).toEqual(mockJobs)
      expect(mockLogger.warn).toHaveBeenCalledTimes(2)
    })
  })

  describe('refreshToken', () => {
    const mockTokenResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer' as const,
    }

    it('should refresh token successfully', async () => {
      mock.onPost('/oauth/token').reply(200, mockTokenResponse)

      await client.refreshToken()

      expect(mockLogger.debug).toHaveBeenCalledWith('Refreshing access token', expect.any(Object))
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully refreshed access token',
        expect.objectContaining({ expiresIn: 3600 }),
      )
    })

    it('should handle invalid token responses', async () => {
      mock.onPost('/oauth/token').reply(200, { invalid: 'response' })

      await expect(client.refreshToken()).rejects.toThrow('Invalid token response')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to refresh access token',
        expect.any(Object),
      )
    })

    it('should handle network errors during token refresh', async () => {
      mock.onPost('/oauth/token').networkError()

      await expect(client.refreshToken()).rejects.toThrow()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to refresh access token',
        expect.any(Object),
      )
    })
  })

  describe('getJob', () => {
    const mockJob: JobAdderJob = {
      id: '1',
      title: 'Test Job',
      status: 'active',
      location: { city: 'Sydney', state: 'NSW', country: 'Australia' },
      workType: 'permanent',
      description: 'Test description',
      applicationUrl: 'https://test.com/apply',
      postedDate: '2025-05-18T00:00:00Z',
      reference: 'TEST-001',
      salary: {
        type: 'annual',
        currency: 'AUD',
      },
    }

    it('should fetch a single job successfully', async () => {
      mock.onGet('/jobs/1').reply(200, mockJob)

      const job = await client.getJob('1')

      expect(job).toEqual(mockJob)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Fetching job details',
        expect.objectContaining({ jobId: '1' }),
      )
    })

    it('should handle job not found', async () => {
      mock.onGet('/jobs/999').reply(404)

      await expect(client.getJob('999')).rejects.toThrow()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch job details',
        expect.objectContaining({ jobId: '999' }),
      )
    })
  })
})
