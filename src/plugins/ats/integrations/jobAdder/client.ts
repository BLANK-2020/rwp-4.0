import axios from 'axios'
import { jobAdderLogger as logger } from '@/lib/logger'
import {
  JobAdderJob,
  JobAdderConfig,
  JobAdderTokenResponse,
  isJobAdderTokenResponse,
  JobAdderCandidate,
  JobAdderCandidateResume,
  JobAdderCandidateExperience,
  JobAdderCandidateEducation,
  JobAdderCandidatePlacement,
} from './types'
import axiosRetry from 'axios-retry'

export class JobAdderClient {
  private client: ReturnType<typeof axios.create>
  private config: JobAdderConfig
  private requestId: string
  private requestTimes: Map<string, number>

  constructor(config: JobAdderConfig) {
    this.config = config
    this.requestId = Math.random().toString(36).substring(7)
    this.requestTimes = new Map()

    logger.debug('Initializing JobAdder client', {
      requestId: this.requestId,
      baseURL: 'https://api.jobadder.com/v2',
    })

    this.client = axios.create({
      baseURL: 'https://api.jobadder.com/v2',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'X-Request-ID': this.requestId,
      },
    })

    // Configure retry logic
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: any) => {
        const shouldRetry =
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ?? 0) >= 500

        if (shouldRetry) {
          logger.warn('Request failed, will retry', {
            requestId: this.requestId,
            error: error.message,
            status: error.response?.status,
            attempt: (error.config?.['axios-retry']?.retryCount ?? 0) + 1,
          })
        }

        return shouldRetry
      },
      onRetry: (retryCount: number, error: any) => {
        logger.warn('Retrying failed request', {
          requestId: this.requestId,
          retryCount,
          error: error.message,
          status: error.response?.status,
          endpoint: error.config?.url,
        })
      },
    })

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        const startTime = this.requestTimes.get(response.config.url || '') || Date.now()
        logger.debug('API request successful', {
          requestId: this.requestId,
          method: response.config.method,
          url: response.config.url,
          status: response.status,
          duration: Date.now() - startTime,
        })
        this.requestTimes.delete(response.config.url || '')
        return response
      },
      (error) => {
        const startTime = this.requestTimes.get(error.config?.url || '') || Date.now()
        logger.error('API request failed', {
          requestId: this.requestId,
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          error: error.message,
          duration: Date.now() - startTime,
        })
        this.requestTimes.delete(error.config?.url || '')
        throw error
      },
    )

    // Add request interceptor for timing
    this.client.interceptors.request.use(
      (config) => {
        this.requestTimes.set(config.url || '', Date.now())
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )
  }

  // ============================================================================
  // Job-related methods
  // ============================================================================

  async getJobs(): Promise<JobAdderJob[]> {
    try {
      logger.debug('Fetching jobs', { requestId: this.requestId })
      const response = await this.client.get<JobAdderJob[]>('/jobs', {
        params: {
          status: 'active',
          limit: 100,
        },
      })

      logger.info('Successfully fetched jobs', {
        requestId: this.requestId,
        count: response.data.length,
      })
      return response.data
    } catch (error) {
      logger.error('Failed to fetch jobs', {
        requestId: this.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        config: {
          ...this.config,
          accessToken: '[REDACTED]',
        },
      })
      throw error
    }
  }

  async getJob(jobId: string): Promise<JobAdderJob> {
    try {
      logger.debug('Fetching job details', {
        requestId: this.requestId,
        jobId,
      })

      const response = await this.client.get<JobAdderJob>(`/jobs/${jobId}`)

      logger.debug('Successfully fetched job details', {
        requestId: this.requestId,
        jobId,
      })
      return response.data
    } catch (error) {
      logger.error('Failed to fetch job details', {
        requestId: this.requestId,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  // ============================================================================
  // Candidate-related methods
  // ============================================================================

  async getCandidates(
    params: {
      status?: 'active' | 'inactive' | 'placed'
      updatedSince?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<JobAdderCandidate[]> {
    try {
      const { status = 'active', updatedSince, limit = 100, offset = 0 } = params

      logger.debug('Fetching candidates', {
        requestId: this.requestId,
        params: { status, updatedSince, limit, offset },
      })

      const response = await this.client.get<JobAdderCandidate[]>('/candidates', {
        params: {
          status,
          updatedSince,
          limit,
          offset,
        },
      })

      logger.info('Successfully fetched candidates', {
        requestId: this.requestId,
        count: response.data.length,
      })

      return response.data
    } catch (error) {
      logger.error('Failed to fetch candidates', {
        requestId: this.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  async getCandidate(candidateId: string): Promise<JobAdderCandidate> {
    try {
      logger.debug('Fetching candidate details', {
        requestId: this.requestId,
        candidateId,
      })

      const response = await this.client.get<JobAdderCandidate>(`/candidates/${candidateId}`)

      logger.debug('Successfully fetched candidate details', {
        requestId: this.requestId,
        candidateId,
      })

      return response.data
    } catch (error) {
      logger.error('Failed to fetch candidate details', {
        requestId: this.requestId,
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  async getCandidateResume(candidateId: string): Promise<JobAdderCandidateResume> {
    try {
      logger.debug('Fetching candidate resume', {
        requestId: this.requestId,
        candidateId,
      })

      // First get the resume metadata
      const response = await this.client.get<JobAdderCandidateResume[]>(
        `/candidates/${candidateId}/attachments`,
        {
          params: {
            type: 'resume',
          },
        },
      )

      if (!response.data.length) {
        throw new Error(`No resume found for candidate ${candidateId}`)
      }

      const resumeMetadata = response.data[0]

      // Then fetch the actual resume content
      const contentResponse = await this.client.get<{ content: string }>(
        `/candidates/${candidateId}/attachments/${resumeMetadata.id}/content`,
      )

      logger.debug('Successfully fetched candidate resume', {
        requestId: this.requestId,
        candidateId,
        resumeId: resumeMetadata.id,
      })

      return {
        ...resumeMetadata,
        content: contentResponse.data.content,
      }
    } catch (error) {
      logger.error('Failed to fetch candidate resume', {
        requestId: this.requestId,
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  async getCandidateExperiences(candidateId: string): Promise<JobAdderCandidateExperience[]> {
    try {
      logger.debug('Fetching candidate experiences', {
        requestId: this.requestId,
        candidateId,
      })

      const response = await this.client.get<JobAdderCandidateExperience[]>(
        `/candidates/${candidateId}/experiences`,
      )

      logger.debug('Successfully fetched candidate experiences', {
        requestId: this.requestId,
        candidateId,
        count: response.data.length,
      })

      return response.data
    } catch (error) {
      logger.error('Failed to fetch candidate experiences', {
        requestId: this.requestId,
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  async getCandidateEducation(candidateId: string): Promise<JobAdderCandidateEducation[]> {
    try {
      logger.debug('Fetching candidate education', {
        requestId: this.requestId,
        candidateId,
      })

      const response = await this.client.get<JobAdderCandidateEducation[]>(
        `/candidates/${candidateId}/education`,
      )

      logger.debug('Successfully fetched candidate education', {
        requestId: this.requestId,
        candidateId,
        count: response.data.length,
      })

      return response.data
    } catch (error) {
      logger.error('Failed to fetch candidate education', {
        requestId: this.requestId,
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  async getCandidatePlacements(candidateId: string): Promise<JobAdderCandidatePlacement[]> {
    try {
      logger.debug('Fetching candidate placements', {
        requestId: this.requestId,
        candidateId,
      })

      const response = await this.client.get<JobAdderCandidatePlacement[]>(
        `/candidates/${candidateId}/placements`,
      )

      logger.debug('Successfully fetched candidate placements', {
        requestId: this.requestId,
        candidateId,
        count: response.data.length,
      })

      return response.data
    } catch (error) {
      logger.error('Failed to fetch candidate placements', {
        requestId: this.requestId,
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  // ============================================================================
  // Authentication methods
  // ============================================================================

  async refreshToken(): Promise<void> {
    try {
      logger.debug('Refreshing access token', {
        requestId: this.requestId,
      })

      const response = await axios.post<JobAdderTokenResponse>(
        'https://api.jobadder.com/v2/oauth/token',
        {
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        },
      )

      if (!isJobAdderTokenResponse(response.data)) {
        throw new Error('Invalid token response')
      }

      this.config.accessToken = response.data.access_token
      this.config.refreshToken = response.data.refresh_token

      // Update client headers with new token
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.config.accessToken}`

      logger.info('Successfully refreshed access token', {
        requestId: this.requestId,
        expiresIn: response.data.expires_in,
      })
    } catch (error) {
      logger.error('Failed to refresh access token', {
        requestId: this.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId: this.config.clientId,
      })
      throw error
    }
  }

  // Helper method to check if a response indicates token expiry
  private isTokenExpired(error: any): boolean {
    return error.response?.status === 401 && error.response?.data?.error === 'invalid_token'
  }

  // Helper method to handle automatic token refresh
  private async handleTokenRefresh(): Promise<void> {
    try {
      await this.refreshToken()
    } catch (error) {
      logger.error('Token refresh failed', {
        requestId: this.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }
}
