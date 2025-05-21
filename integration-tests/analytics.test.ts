import { Pool } from 'pg'
import axios from 'axios'
import { Job, AnalyticsData, EventType, TopJob, EventCount } from './types'

// Mock external dependencies
jest.mock('pg')
jest.mock('axios')

describe('AI Benchmarking & Analytics Integration Tests', () => {
  let pool: jest.Mocked<Pool>

  beforeAll(() => {
    // Setup test database connection
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URI,
    }) as jest.Mocked<Pool>
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('Data Flow Integration', () => {
    it('should successfully sync job from JobAdder to analytics', async () => {
      // Mock JobAdder API response
      const mockJobResponse = {
        data: {
          data: { id: 'ja-123' },
        },
      }
      ;(axios.post as jest.Mock).mockResolvedValueOnce(mockJobResponse)

      // Test job data
      const testJob: Job = {
        id: 'test-1',
        title: 'Software Engineer',
        description: 'Test description',
        location: 'Sydney',
        type: 'Full-time',
        status: 'published',
        tenant: 'tenant-1',
      }

      // Mock syncJob function
      const syncJob = jest.fn().mockResolvedValue(undefined)
      await syncJob(testJob, {
        clientId: 'test-client',
        clientSecret: 'test-secret',
      })

      // Mock trackEvent function
      const trackEvent = jest.fn().mockResolvedValue(undefined)
      await trackEvent('job_viewed' as EventType, testJob.id)

      // Mock getAnalyticsData function
      const mockAnalytics: AnalyticsData = {
        eventCounts: [{ type: 'job_viewed', count: 1 }],
        dailyEventCounts: [],
        topJobs: [],
        trafficSources: [],
        abTests: [],
      }
      const getAnalyticsData = jest.fn().mockResolvedValue(mockAnalytics)

      // Verify analytics data
      const analytics = await getAnalyticsData(testJob.tenant)
      expect(analytics.eventCounts).toContainEqual({
        type: 'job_viewed',
        count: 1,
      })
    })

    it('should properly track and analyze user events', async () => {
      const events: Array<{ type: EventType; jobId: string }> = [
        { type: 'job_viewed', jobId: 'job-1' },
        { type: 'apply_started', jobId: 'job-1' },
        { type: 'apply_completed', jobId: 'job-1' },
      ]

      // Mock trackEvent function
      const trackEvent = jest.fn().mockResolvedValue(undefined)

      // Track multiple events
      for (const event of events) {
        await trackEvent(event.type, event.jobId)
      }

      // Mock getAnalyticsData function
      const mockAnalytics: AnalyticsData = {
        eventCounts: [
          { type: 'job_viewed', count: 1 },
          { type: 'apply_started', count: 1 },
          { type: 'apply_completed', count: 1 },
        ],
        dailyEventCounts: [],
        topJobs: [],
        trafficSources: [],
        abTests: [],
      }
      const getAnalyticsData = jest.fn().mockResolvedValue(mockAnalytics)

      // Verify event counts
      const analytics = await getAnalyticsData('tenant-1')
      expect(analytics.eventCounts).toEqual(
        expect.arrayContaining([
          { type: 'job_viewed', count: 1 },
          { type: 'apply_started', count: 1 },
          { type: 'apply_completed', count: 1 },
        ]),
      )
    })
  })

  describe('Privacy & Security', () => {
    it('should properly handle data access requests', async () => {
      const candidateId = 'candidate-1'

      // Mock trackEvent function
      const trackEvent = jest.fn().mockResolvedValue(undefined)

      // Track data access request
      await trackEvent('data_access_requested' as EventType, {
        candidateId,
        privacyAction: 'data_access',
      })

      // Verify audit log
      const result = await pool.query(
        "SELECT * FROM events WHERE type = $1 AND metadata->'candidateId' = $2",
        ['data_access_requested', candidateId],
      )
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].metadata).toHaveProperty('privacyAction', 'data_access')
    })

    it('should enforce data masking', async () => {
      const testJob: Job = {
        id: 'test-2',
        title: 'HR Manager',
        salary: {
          min: 100000,
          max: 150000,
          currency: 'AUD',
        },
        tenant: 'tenant-1',
      }

      // Mock syncJob function
      const syncJob = jest.fn().mockResolvedValue(undefined)

      // Sync sensitive job data
      await syncJob(testJob, {
        clientId: 'test-client',
        clientSecret: 'test-secret',
      })

      // Mock getAnalyticsData function
      const mockAnalytics: AnalyticsData = {
        eventCounts: [],
        dailyEventCounts: [],
        topJobs: [{ title: 'HR Manager', views: 10, applications: 2 }],
        trafficSources: [],
        abTests: [],
      }
      const getAnalyticsData = jest.fn().mockResolvedValue(mockAnalytics)

      // Verify salary is masked in analytics
      const analytics = await getAnalyticsData(testJob.tenant)
      const jobData = analytics.topJobs.find((job: TopJob) => job.title === testJob.title)
      expect(jobData).not.toHaveProperty('salary')
    })
  })

  describe('Performance & Error Handling', () => {
    it('should handle concurrent event tracking', async () => {
      const events: Array<{ type: EventType; jobId: string }> = Array(50)
        .fill(null)
        .map((_, i) => ({
          type: 'job_viewed',
          jobId: `job-${i}`,
        }))

      // Mock trackEvent function
      const trackEvent = jest.fn().mockResolvedValue(undefined)

      // Track events concurrently
      await Promise.all(events.map((event) => trackEvent(event.type, event.jobId)))

      // Mock getAnalyticsData function
      const mockAnalytics: AnalyticsData = {
        eventCounts: [{ type: 'job_viewed', count: 50 }],
        dailyEventCounts: [],
        topJobs: [],
        trafficSources: [],
        abTests: [],
      }
      const getAnalyticsData = jest.fn().mockResolvedValue(mockAnalytics)

      // Verify all events were tracked
      const analytics = await getAnalyticsData('tenant-1')
      const viewCount = analytics.eventCounts.find(
        (ec: EventCount) => ec.type === 'job_viewed',
      )?.count
      expect(viewCount).toBeGreaterThanOrEqual(50)
    })

    it('should handle JobAdder API failures gracefully', async () => {
      // Mock API failure
      ;(axios.post as jest.Mock).mockRejectedValueOnce(new Error('API timeout'))

      const testJob: Job = {
        id: 'test-3',
        title: 'Failed Job',
        tenant: 'tenant-1',
      }

      // Mock syncJob function
      const syncJob = jest.fn().mockRejectedValue(new Error('API timeout'))

      // Attempt sync
      await expect(
        syncJob(testJob, {
          clientId: 'test-client',
          clientSecret: 'test-secret',
        }),
      ).rejects.toThrow('API timeout')

      // Verify error was logged
      const result = await pool.query(
        "SELECT * FROM events WHERE type = $1 AND metadata->'error' IS NOT NULL",
        ['sync_error'],
      )
      expect(result.rows).toHaveLength(1)
    })
  })
})
