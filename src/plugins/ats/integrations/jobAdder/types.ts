export interface JobAdderConfig {
  clientId: string
  clientSecret: string
  accessToken: string
  refreshToken: string
}

export interface JobAdderJob {
  id: string
  reference: string
  title: string
  status: 'active' | 'filled' | 'cancelled'
  location: {
    city: string
    state: string
    country: string
  }
  salary: {
    minimum?: number
    maximum?: number
    type: 'annual' | 'hourly'
    currency: string
  }
  workType: 'permanent' | 'contract' | 'temporary'
  description: string
  applicationUrl: string
  postedDate: string
  expiryDate?: string
  company?: {
    id: string
    name: string
  }
}

export interface JobAdderCandidate {
  id: string
  reference: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: 'active' | 'inactive' | 'placed'
  createdAt: string
  updatedAt: string
  skills?: string[]
  tags?: string[]
  source?: string
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  workRights?: string
  availability?: string
  currentJobTitle?: string
  currentEmployer?: string
  salaryExpectation?: {
    minimum?: number
    maximum?: number
    currency?: string
    period?: 'annual' | 'hourly'
  }
  workTypes?: ('permanent' | 'contract' | 'temporary')[]
  locations?: string[]
  customFields?: Record<string, any>
}

export interface JobAdderCandidateResume {
  id: string
  candidateId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  url: string
  content?: string
}

export interface JobAdderCandidateExperience {
  id: string
  candidateId: string
  jobTitle: string
  employer: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  description?: string
  responsibilities?: string[]
  achievements?: string[]
}

export interface JobAdderCandidateEducation {
  id: string
  candidateId: string
  institution: string
  qualification: string
  field: string
  startDate?: string
  endDate?: string
  isCompleted: boolean
  description?: string
}

export interface JobAdderCandidatePlacement {
  id: string
  candidateId: string
  jobId: string
  jobTitle: string
  employer: string
  startDate: string
  endDate?: string
  status: 'active' | 'completed' | 'cancelled'
  salary?: {
    amount: number
    currency: string
    period: 'annual' | 'hourly'
  }
  feedback?: string
  rating?: number
}

export interface CandidateSyncStats extends SyncStats {
  enriched: number
  skipped: number
  privacyFiltered: number
}

export interface SyncStats {
  total: number
  created: number
  updated: number
  deleted: number
  errors: number
}

export interface JobAdderErrorResponse {
  error: string
  error_description: string
}

export interface JobAdderTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: 'Bearer'
}

export interface JobAdderWebhookPayload {
  event:
    | 'job.created'
    | 'job.updated'
    | 'job.deleted'
    | 'candidate.created'
    | 'candidate.updated'
    | 'candidate.deleted'
  data: {
    id: string
    [key: string]: any
  }
  metadata: {
    tenantId: string
    [key: string]: any
  }
  timestamp: string
  webhookId: string
}

// Type guard for token responses
export function isJobAdderTokenResponse(data: unknown): data is JobAdderTokenResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'access_token' in data &&
    'refresh_token' in data &&
    'expires_in' in data &&
    'token_type' in data
  )
}

// Type guard for webhook payloads
export function isJobAdderWebhookPayload(data: unknown): data is JobAdderWebhookPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    'event' in data &&
    'data' in data &&
    'metadata' in data &&
    typeof (data as any).event === 'string' &&
    typeof (data as any).data === 'object' &&
    typeof (data as any).metadata === 'object' &&
    'id' in (data as any).data &&
    'tenantId' in (data as any).metadata
  )
}
