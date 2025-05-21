/**
 * Type definitions for the AI enrichment service
 */

/**
 * AI-derived insights and enrichment data for a candidate
 */
export interface CandidateEnrichment {
  id: string // Primary Key
  candidateId: string // Reference to the candidate
  tenantId: string // Reference to the tenant

  // AI Enrichment data
  aiEnrichment: {
    extractedSkills: string[] // Skills extracted from resume and other sources
    skillCategories: string[] // Categorized skills (technical, soft, domain-specific)
    experienceSummary: {
      roles: Array<{
        title: string
        company: string
        duration: number // in months
        responsibilities: string[]
        achievements: string[]
      }>
      totalYearsExperience: number
      seniorityLevel: string
    }
    educationSummary: {
      degrees: Array<{
        level: string // e.g., "Bachelor's", "Master's", "PhD"
        field: string
        institution: string
        year: number
      }>
      certifications: string[]
      continuingEducation: string[]
    }
    personalityTraits: string[] // AI-identified personality traits
    communicationStyle: string // Assessment of communication style
    leadershipPotential: number // Score for leadership potential (0-100)
    teamFitMetrics: {
      collaboration: number
      autonomy: number
      innovation: number
      resilience: number
    }
    lastEnrichedAt: Date // Timestamp of last enrichment
    enrichmentVersion: string // Version of enrichment algorithm used
    confidenceScore: number // Confidence level of AI enrichment (0-1)
  }

  // Benchmark-related fields
  benchmarkScores?: {
    technicalSkills: number
    domainExpertise: number
    culturalFit: number
    leadershipCapability: number
    communicationSkills: number
    problemSolving: number
    adaptability: number
    lastBenchmarked: Date
    benchmarkTemplateId: string // Reference to benchmark template used
  }
  overallScore?: number // Aggregate score across all dimensions (0-100)
  tier?: string // Classification tier (e.g., "A", "B", "C", or "Premium", "Standard", "Basic")
  strengths?: string[] // Key strengths identified
  developmentAreas?: string[] // Areas for improvement
  matchingMetrics?: {
    jobFitScores: Array<{
      jobId: string
      score: number
      matchReason: string[]
    }>
    sectorAffinities: Array<{
      sector: string
      score: number
    }>
    roleTypeMatches: Array<{
      roleType: string
      score: number
    }>
  }

  // Privacy and compliance fields
  dataUsageConsent: boolean // Whether candidate has consented to data usage
  dataRetentionDate?: Date // When data should be deleted/anonymized
  dataSharingPreferences?: {
    allowInternalUse: boolean
    allowAnonymizedAnalytics: boolean
    allowThirdPartySharing: boolean
    specificRestrictions: string[]
  }

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

/**
 * Benchmark template for candidate evaluation
 */
export interface BenchmarkTemplate {
  id: string // Primary Key
  tenantId: string // Reference to the tenant
  name: string
  description?: string

  // Scoring configuration
  skillWeights: {
    skills: {
      [skill: string]: number // Weight for each skill (0-1)
    }
    categories?: {
      [category: string]: number // Weight for skill categories (0-1)
    }
  }
  experienceWeights: {
    roles?: {
      [role: string]: number // Weight for specific roles (0-1)
    }
    industries?: {
      [industry: string]: number // Weight for specific industries (0-1)
    }
    seniorityLevels?: {
      [level: string]: number // Weight for seniority levels (0-1)
    }
    yearsOfExperience?: {
      min?: number
      target?: number
      max?: number
      weight: number // Weight for years of experience (0-1)
    }
  }
  scoringRules: {
    technicalSkills: {
      weight: number
      requiredSkills: string[]
      preferredSkills: string[]
      scoringAlgorithm: string // "weighted", "count", "percentage"
    }
    domainExpertise: {
      weight: number
      targetIndustries: string[]
      targetRoles: string[]
      scoringAlgorithm: string
    }
    culturalFit: {
      weight: number
      desiredTraits: string[]
      scoringAlgorithm: string
    }
    leadershipCapability: {
      weight: number
      minimumScore: number
      scoringAlgorithm: string
    }
    communicationSkills: {
      weight: number
      minimumScore: number
      scoringAlgorithm: string
    }
    problemSolving: {
      weight: number
      minimumScore: number
      scoringAlgorithm: string
    }
    adaptability: {
      weight: number
      minimumScore: number
      scoringAlgorithm: string
    }
    tierThresholds: {
      A: number // Minimum score for tier A
      B: number // Minimum score for tier B
      C: number // Minimum score for tier C
    }
  }

  // Metadata
  industry?: string
  jobLevel?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Data access log entry
 */
export interface DataAccessLog {
  id: string
  candidateId: string
  userId: string
  tenantId: string
  accessTime: Date
  accessReason?: string
  accessType: 'view' | 'edit' | 'export' | 'delete' | 'score'
}

/**
 * Request to enrich a candidate profile
 */
export interface EnrichCandidateRequest {
  candidateId: string
  tenantId: string
  resumeUrl?: string
  resumeText?: string
  candidateData?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    skills?: string[]
    experiences?: Array<{
      title?: string
      company?: string
      startDate?: string
      endDate?: string
      description?: string
    }>
    education?: Array<{
      degree?: string
      institution?: string
      year?: number
    }>
  }
  dataUsageConsent: boolean
}

/**
 * Response from candidate enrichment
 */
export interface EnrichCandidateResponse {
  enrichmentId: string
  candidateId: string
  status: 'success' | 'partial' | 'failed'
  message?: string
  enrichmentData?: Partial<CandidateEnrichment>
}

/**
 * Request to score a candidate against benchmarks
 */
export interface ScoreCandidateRequest {
  candidateId: string
  tenantId: string
  benchmarkTemplateId?: string // If not provided, will use all active benchmarks
}

/**
 * Response from candidate scoring
 */
export interface ScoreCandidateResponse {
  candidateId: string
  overallScore: number
  tier: string
  benchmarkScores: {
    benchmarkId: string
    benchmarkName: string
    scores: {
      technicalSkills: number
      domainExpertise: number
      culturalFit: number
      leadershipCapability: number
      communicationSkills: number
      problemSolving: number
      adaptability: number
    }
    strengths: string[]
    developmentAreas: string[]
  }[]
}

/**
 * Request to evaluate a candidate against a benchmark
 */
export interface EvaluateBenchmarkRequest {
  candidateId: string
  tenantId: string
  benchmarkTemplateId: string
}

/**
 * Response from benchmark evaluation
 */
export interface EvaluateBenchmarkResponse {
  candidateId: string
  benchmarkId: string
  benchmarkName: string
  overallScore: number
  tier: string
  categoryScores: {
    technicalSkills: number
    domainExpertise: number
    culturalFit: number
    leadershipCapability: number
    communicationSkills: number
    problemSolving: number
    adaptability: number
  }
  strengths: string[]
  developmentAreas: string[]
  matchDetails: {
    skillMatches: {
      skill: string
      score: number
      importance: 'high' | 'medium' | 'low'
    }[]
    experienceMatches: {
      aspect: string
      score: number
      importance: 'high' | 'medium' | 'low'
    }[]
  }
}
