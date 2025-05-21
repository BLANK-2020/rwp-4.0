import {
  JobAdderJob,
  JobAdderCandidate,
  JobAdderCandidateResume,
  JobAdderCandidateExperience,
  JobAdderCandidateEducation,
  JobAdderCandidatePlacement,
} from './types'
import { logger } from '@/lib/logger'
import slugify from 'slugify'

// ============================================================================
// Common interfaces
// ============================================================================

interface PayloadRichTextChild {
  [key: string]: unknown
  type: string
  version: number
  children: {
    text: string
  }[]
}

interface PayloadRichText {
  root: {
    type: 'root'
    children: PayloadRichTextChild[]
    direction: 'ltr'
    format: 'left'
    indent: 0
    version: 1
  }
}

// ============================================================================
// Job-related interfaces and functions
// ============================================================================

interface PayloadJob {
  title: string
  slug: string
  description: PayloadRichText
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'temporary'
  salary: {
    min?: number
    max?: number
    currency: string
    period: 'annual' | 'hourly'
  }
  apply_link: string
  expiry_date?: string
  created_at: string
  status: 'draft' | 'published' | 'closed'
  tenant: number
  atsData: {
    source: string
    sourceId: string
    sourceReference?: string
    lastSynced: string
    jobAdder: {
      id: string
      reference: string
    }
  }
}

function mapJobType(workType: JobAdderJob['workType']): PayloadJob['type'] {
  switch (workType) {
    case 'permanent':
      return 'full-time'
    case 'contract':
      return 'contract'
    case 'temporary':
      return 'temporary'
    default:
      return 'full-time'
  }
}

function convertToRichText(text: string): PayloadRichText {
  const paragraphs = text.split('\n\n').filter(Boolean)

  const children: PayloadRichTextChild[] = paragraphs.map((paragraph) => ({
    type: 'paragraph',
    version: 1,
    children: [
      {
        text: paragraph,
      },
    ],
    format: 'left' as const,
  }))

  const richText: PayloadRichText = {
    root: {
      type: 'root' as const,
      children,
      direction: 'ltr' as const,
      format: 'left' as const,
      indent: 0 as const,
      version: 1 as const,
    },
  }

  return richText
}

export async function transformJob(job: JobAdderJob, tenantId: number): Promise<PayloadJob> {
  try {
    logger.debug(`[JobAdder] Transforming job ${job.id}`)

    const transformedJob: PayloadJob = {
      title: job.title,
      slug: slugify(job.title, { lower: true, strict: true }),
      description: convertToRichText(job.description),
      location: formatLocation(job.location),
      type: mapJobType(job.workType),
      salary: {
        min: job.salary?.minimum,
        max: job.salary?.maximum,
        currency: job.salary?.currency || 'AUD',
        period: job.salary?.type || 'annual',
      },
      apply_link: job.applicationUrl,
      expiry_date: job.expiryDate,
      created_at: job.postedDate,
      status: job.status === 'active' ? 'published' : 'closed',
      tenant: tenantId,
      atsData: {
        source: 'jobadder',
        sourceId: job.id,
        sourceReference: job.reference,
        lastSynced: new Date().toISOString(),
        jobAdder: {
          id: job.id,
          reference: job.reference,
        },
      },
    }

    logger.debug(`[JobAdder] Successfully transformed job ${job.id}`, {
      original: job,
      transformed: transformedJob,
    })

    return transformedJob
  } catch (error) {
    logger.error(`[JobAdder] Error transforming job ${job.id}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      job,
    })
    throw error
  }
}

function formatLocation(location: JobAdderJob['location']): string {
  const parts = [
    location.city,
    location.state,
    location.country !== 'Australia' ? location.country : null,
  ].filter(Boolean)

  return parts.join(', ')
}

// ============================================================================
// Candidate-related interfaces and functions
// ============================================================================

interface PayloadCandidate {
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: 'active' | 'inactive' | 'placed'
  resume?: PayloadRichText
  skills: string[]
  experiences: Array<{
    jobTitle: string
    employer: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    description?: string
    responsibilities: string[]
    achievements: string[]
  }>
  education: Array<{
    institution: string
    qualification: string
    field: string
    startDate?: string
    endDate?: string
    isCompleted: boolean
    description?: string
  }>
  placements: Array<{
    jobTitle: string
    employer: string
    startDate: string
    endDate?: string
    status: string
    feedback?: string
    rating?: number
  }>
  currentJobTitle?: string
  currentEmployer?: string
  location?: string
  workRights?: string
  availability?: string
  salaryExpectation?: {
    min?: number
    max?: number
    currency: string
    period: 'annual' | 'hourly'
  }
  workTypes: ('full-time' | 'part-time' | 'contract' | 'temporary')[]
  preferredLocations: string[]
  tags: string[]
  source?: string
  createdAt: string
  updatedAt: string
  tenant: number
  atsData: {
    source: string
    sourceId: string
    sourceReference?: string
    lastSynced: string
    jobAdder: {
      id: string
      reference: string
    }
  }
  // Privacy and compliance fields
  dataUsageConsent: boolean
  dataRetentionDate: string
  dataSharingPreferences: {
    allowInternalUse: boolean
    allowAnonymizedAnalytics: boolean
    allowThirdPartySharing: boolean
    specificRestrictions: string[]
  }
  // AI Enrichment placeholder - will be populated by the AI enrichment service
  aiEnrichment?: {
    status: 'pending' | 'completed' | 'failed'
    lastProcessed?: string
  }
}

function mapCandidateWorkTypes(
  workTypes?: ('permanent' | 'contract' | 'temporary')[],
): ('full-time' | 'part-time' | 'contract' | 'temporary')[] {
  if (!workTypes || workTypes.length === 0) {
    return ['full-time']
  }

  return workTypes.map((workType) => {
    switch (workType) {
      case 'permanent':
        return 'full-time'
      case 'contract':
        return 'contract'
      case 'temporary':
        return 'temporary'
      default:
        return 'full-time'
    }
  })
}

function extractSkillsFromResume(resumeContent?: string): string[] {
  if (!resumeContent) {
    return []
  }

  // Basic skill extraction logic - in a real implementation, this would be more sophisticated
  // and potentially use NLP or AI services
  const commonSkills = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'Java',
    'C#',
    '.NET',
    'AWS',
    'Azure',
    'GCP',
    'Docker',
    'Kubernetes',
    'SQL',
    'NoSQL',
    'MongoDB',
    'Project Management',
    'Agile',
    'Scrum',
    'Leadership',
    'Communication',
    'Marketing',
    'Sales',
    'Customer Service',
    'Data Analysis',
    'Machine Learning',
  ]

  return commonSkills.filter((skill) => resumeContent.toLowerCase().includes(skill.toLowerCase()))
}

function formatCandidateExperiences(
  experiences: JobAdderCandidateExperience[],
): PayloadCandidate['experiences'] {
  return experiences.map((exp) => ({
    jobTitle: exp.jobTitle,
    employer: exp.employer,
    startDate: exp.startDate,
    endDate: exp.endDate,
    isCurrent: exp.isCurrent,
    description: exp.description,
    // Parse responsibilities and achievements from description if they're not provided directly
    responsibilities:
      exp.responsibilities ||
      (exp.description ? extractResponsibilitiesFromDescription(exp.description) : []),
    achievements:
      exp.achievements ||
      (exp.description ? extractAchievementsFromDescription(exp.description) : []),
  }))
}

function extractResponsibilitiesFromDescription(description: string): string[] {
  // Basic extraction logic - in a real implementation, this would be more sophisticated
  const lines = description.split('\n')
  const responsibilities: string[] = []

  let inResponsibilitiesSection = false
  for (const line of lines) {
    const trimmedLine = line.trim()

    if (
      trimmedLine.toLowerCase().includes('responsibilities') ||
      trimmedLine.toLowerCase().includes('duties')
    ) {
      inResponsibilitiesSection = true
      continue
    }

    if (
      inResponsibilitiesSection &&
      (trimmedLine.toLowerCase().includes('achievements') ||
        trimmedLine.toLowerCase().includes('accomplishments') ||
        trimmedLine === '')
    ) {
      inResponsibilitiesSection = false
      continue
    }

    if (inResponsibilitiesSection && trimmedLine.startsWith('•')) {
      responsibilities.push(trimmedLine.substring(1).trim())
    }
  }

  return responsibilities
}

function extractAchievementsFromDescription(description: string): string[] {
  // Basic extraction logic - in a real implementation, this would be more sophisticated
  const lines = description.split('\n')
  const achievements: string[] = []

  let inAchievementsSection = false
  for (const line of lines) {
    const trimmedLine = line.trim()

    if (
      trimmedLine.toLowerCase().includes('achievements') ||
      trimmedLine.toLowerCase().includes('accomplishments')
    ) {
      inAchievementsSection = true
      continue
    }

    if (inAchievementsSection && trimmedLine === '') {
      inAchievementsSection = false
      continue
    }

    if (inAchievementsSection && trimmedLine.startsWith('•')) {
      achievements.push(trimmedLine.substring(1).trim())
    }
  }

  return achievements
}

export async function transformCandidate(
  candidate: JobAdderCandidate,
  tenantId: number,
  resume?: JobAdderCandidateResume,
  experiences: JobAdderCandidateExperience[] = [],
  education: JobAdderCandidateEducation[] = [],
  placements: JobAdderCandidatePlacement[] = [],
): Promise<PayloadCandidate> {
  try {
    logger.debug(`[JobAdder] Transforming candidate ${candidate.id}`)

    // Extract skills from resume if available
    const extractedSkills = resume?.content ? extractSkillsFromResume(resume.content) : []

    // Combine extracted skills with any skills provided directly by JobAdder
    const allSkills = [...new Set([...(candidate.skills || []), ...extractedSkills])]

    // Format experiences with responsibilities and achievements
    const formattedExperiences = formatCandidateExperiences(experiences)

    // Determine current job from experiences
    const currentExperience = experiences.find((exp) => exp.isCurrent)
    const currentJobTitle = candidate.currentJobTitle || currentExperience?.jobTitle
    const currentEmployer = candidate.currentEmployer || currentExperience?.employer

    // Format education
    const formattedEducation = education.map((edu) => ({
      institution: edu.institution,
      qualification: edu.qualification,
      field: edu.field,
      startDate: edu.startDate,
      endDate: edu.endDate,
      isCompleted: edu.isCompleted,
      description: edu.description,
    }))

    // Format placements
    const formattedPlacements = placements.map((placement) => ({
      jobTitle: placement.jobTitle,
      employer: placement.employer,
      startDate: placement.startDate,
      endDate: placement.endDate,
      status: placement.status,
      feedback: placement.feedback,
      rating: placement.rating,
    }))

    // Format location
    const location = candidate.address ? formatCandidateLocation(candidate.address) : undefined

    // Create the transformed candidate
    const transformedCandidate: PayloadCandidate = {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      status: candidate.status,
      resume: resume?.content ? convertToRichText(resume.content) : undefined,
      skills: allSkills,
      experiences: formattedExperiences,
      education: formattedEducation,
      placements: formattedPlacements,
      currentJobTitle,
      currentEmployer,
      location,
      workRights: candidate.workRights,
      availability: candidate.availability,
      salaryExpectation: candidate.salaryExpectation
        ? {
            min: candidate.salaryExpectation.minimum,
            max: candidate.salaryExpectation.maximum,
            currency: candidate.salaryExpectation.currency || 'AUD',
            period: candidate.salaryExpectation.period || 'annual',
          }
        : undefined,
      workTypes: mapCandidateWorkTypes(candidate.workTypes),
      preferredLocations: candidate.locations || [],
      tags: candidate.tags || [],
      source: candidate.source,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
      tenant: tenantId,
      atsData: {
        source: 'jobadder',
        sourceId: candidate.id,
        sourceReference: candidate.reference,
        lastSynced: new Date().toISOString(),
        jobAdder: {
          id: candidate.id,
          reference: candidate.reference,
        },
      },
      // Default privacy settings - these would be updated based on actual candidate preferences
      dataUsageConsent: true, // Default to true, but should be based on actual consent
      dataRetentionDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years from now
      dataSharingPreferences: {
        allowInternalUse: true,
        allowAnonymizedAnalytics: true,
        allowThirdPartySharing: false,
        specificRestrictions: [],
      },
      // AI Enrichment placeholder - will be populated by the AI enrichment service
      aiEnrichment: {
        status: 'pending',
      },
    }

    logger.debug(`[JobAdder] Successfully transformed candidate ${candidate.id}`, {
      candidateId: candidate.id,
    })

    return transformedCandidate
  } catch (error) {
    logger.error(`[JobAdder] Error transforming candidate ${candidate.id}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      candidateId: candidate.id,
    })
    throw error
  }
}

function formatCandidateLocation(address: JobAdderCandidate['address']): string {
  if (!address) return ''

  const parts = [
    address.city,
    address.state,
    address.country !== 'Australia' ? address.country : null,
  ].filter(Boolean)

  return parts.join(', ')
}
