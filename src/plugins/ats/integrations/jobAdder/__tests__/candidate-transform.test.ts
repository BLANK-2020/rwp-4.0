import { transformCandidate } from '../transform'
import {
  JobAdderCandidate,
  JobAdderCandidateResume,
  JobAdderCandidateExperience,
  JobAdderCandidateEducation,
  JobAdderCandidatePlacement,
} from '../types'

describe('transformCandidate', () => {
  // Mock tenant ID
  const tenantId = 123

  // Mock candidate data
  const mockCandidate: JobAdderCandidate = {
    id: 'candidate-123',
    reference: 'REF-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+61412345678',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
    skills: ['JavaScript', 'React', 'Node.js'],
    tags: ['Developer', 'Frontend'],
    source: 'Website',
    address: {
      street: '123 Main St',
      city: 'Sydney',
      state: 'NSW',
      postalCode: '2000',
      country: 'Australia',
    },
    workRights: 'Citizen',
    availability: 'Immediate',
    currentJobTitle: 'Senior Developer',
    currentEmployer: 'Tech Co',
    salaryExpectation: {
      minimum: 120000,
      maximum: 150000,
      currency: 'AUD',
      period: 'annual',
    },
    workTypes: ['permanent', 'contract'],
    locations: ['Sydney', 'Remote'],
  }

  // Mock resume data
  const mockResume: JobAdderCandidateResume = {
    id: 'resume-123',
    candidateId: 'candidate-123',
    fileName: 'john_doe_resume.pdf',
    fileType: 'application/pdf',
    fileSize: 12345,
    uploadedAt: '2025-01-01T00:00:00Z',
    url: 'https://example.com/resume.pdf',
    content:
      'John Doe\nSenior Developer\n\nExperience:\n- Tech Co: Senior Developer (2020-Present)\n- Dev Inc: Developer (2018-2020)\n\nSkills:\n- JavaScript\n- React\n- Node.js\n- TypeScript\n- AWS',
  }

  // Mock experience data
  const mockExperiences: JobAdderCandidateExperience[] = [
    {
      id: 'exp-1',
      candidateId: 'candidate-123',
      jobTitle: 'Senior Developer',
      employer: 'Tech Co',
      startDate: '2020-01-01',
      isCurrent: true,
      description:
        'Leading frontend development team\n\nResponsibilities:\n• Architecting React applications\n• Mentoring junior developers\n\nAchievements:\n• Reduced build time by 50%\n• Implemented CI/CD pipeline',
    },
    {
      id: 'exp-2',
      candidateId: 'candidate-123',
      jobTitle: 'Developer',
      employer: 'Dev Inc',
      startDate: '2018-01-01',
      endDate: '2019-12-31',
      isCurrent: false,
      description:
        'Full-stack development\n\nResponsibilities:\n• Building React components\n• Developing Node.js APIs\n\nAchievements:\n• Launched 3 major features\n• Improved test coverage to 80%',
    },
  ]

  // Mock education data
  const mockEducation: JobAdderCandidateEducation[] = [
    {
      id: 'edu-1',
      candidateId: 'candidate-123',
      institution: 'University of Sydney',
      qualification: 'Bachelor of Computer Science',
      field: 'Computer Science',
      startDate: '2014-01-01',
      endDate: '2017-12-31',
      isCompleted: true,
      description: 'Major in Software Engineering',
    },
  ]

  // Mock placement data
  const mockPlacements: JobAdderCandidatePlacement[] = [
    {
      id: 'placement-1',
      candidateId: 'candidate-123',
      jobId: 'job-456',
      jobTitle: 'Frontend Developer',
      employer: 'Web Co',
      startDate: '2019-01-01',
      endDate: '2019-12-31',
      status: 'completed',
      salary: {
        amount: 100000,
        currency: 'AUD',
        period: 'annual',
      },
      feedback: 'Excellent performance',
      rating: 5,
    },
  ]

  it('should transform a candidate with all data', async () => {
    const transformedCandidate = await transformCandidate(
      mockCandidate,
      tenantId,
      mockResume,
      mockExperiences,
      mockEducation,
      mockPlacements,
    )

    // Check basic candidate info
    expect(transformedCandidate.firstName).toBe('John')
    expect(transformedCandidate.lastName).toBe('Doe')
    expect(transformedCandidate.email).toBe('john.doe@example.com')
    expect(transformedCandidate.phone).toBe('+61412345678')
    expect(transformedCandidate.status).toBe('active')

    // Check location
    expect(transformedCandidate.location).toBe('Sydney, NSW')

    // Check work types
    expect(transformedCandidate.workTypes).toContain('full-time')
    expect(transformedCandidate.workTypes).toContain('contract')

    // Check skills (should include both original skills and extracted skills)
    expect(transformedCandidate.skills).toContain('JavaScript')
    expect(transformedCandidate.skills).toContain('React')
    expect(transformedCandidate.skills).toContain('Node.js')
    expect(transformedCandidate.skills).toContain('TypeScript')
    expect(transformedCandidate.skills).toContain('AWS')

    // Check experiences
    expect(transformedCandidate.experiences).toHaveLength(2)
    expect(transformedCandidate.experiences[0].jobTitle).toBe('Senior Developer')
    expect(transformedCandidate.experiences[0].employer).toBe('Tech Co')
    expect(transformedCandidate.experiences[0].isCurrent).toBe(true)
    expect(transformedCandidate.experiences[0].responsibilities).toContain(
      'Architecting React applications',
    )
    expect(transformedCandidate.experiences[0].achievements).toContain('Reduced build time by 50%')

    // Check education
    expect(transformedCandidate.education).toHaveLength(1)
    expect(transformedCandidate.education[0].institution).toBe('University of Sydney')
    expect(transformedCandidate.education[0].qualification).toBe('Bachelor of Computer Science')

    // Check placements
    expect(transformedCandidate.placements).toHaveLength(1)
    expect(transformedCandidate.placements[0].jobTitle).toBe('Frontend Developer')
    expect(transformedCandidate.placements[0].employer).toBe('Web Co')

    // Check ATS data
    expect(transformedCandidate.atsData.source).toBe('jobadder')
    expect(transformedCandidate.atsData.sourceId).toBe('candidate-123')
    expect(transformedCandidate.atsData.jobAdder.id).toBe('candidate-123')

    // Check tenant
    expect(transformedCandidate.tenant).toBe(tenantId)

    // Check privacy fields
    expect(transformedCandidate.dataUsageConsent).toBe(true)
    expect(transformedCandidate.dataSharingPreferences.allowInternalUse).toBe(true)
    expect(transformedCandidate.dataSharingPreferences.allowAnonymizedAnalytics).toBe(true)
    expect(transformedCandidate.dataSharingPreferences.allowThirdPartySharing).toBe(false)

    // Check AI enrichment placeholder
    expect(transformedCandidate.aiEnrichment?.status).toBe('pending')
  })

  it('should transform a candidate with minimal data', async () => {
    // Create a minimal candidate with only required fields
    const minimalCandidate: JobAdderCandidate = {
      id: 'candidate-456',
      reference: 'REF-456',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-05-01T00:00:00Z',
    }

    const transformedCandidate = await transformCandidate(minimalCandidate, tenantId)

    // Check basic candidate info
    expect(transformedCandidate.firstName).toBe('Jane')
    expect(transformedCandidate.lastName).toBe('Smith')
    expect(transformedCandidate.email).toBe('jane.smith@example.com')
    expect(transformedCandidate.status).toBe('active')

    // Check default values
    expect(transformedCandidate.skills).toEqual([])
    expect(transformedCandidate.experiences).toEqual([])
    expect(transformedCandidate.education).toEqual([])
    expect(transformedCandidate.placements).toEqual([])
    expect(transformedCandidate.workTypes).toEqual(['full-time'])

    // Check ATS data
    expect(transformedCandidate.atsData.source).toBe('jobadder')
    expect(transformedCandidate.atsData.sourceId).toBe('candidate-456')

    // Check tenant
    expect(transformedCandidate.tenant).toBe(tenantId)

    // Check AI enrichment placeholder
    expect(transformedCandidate.aiEnrichment?.status).toBe('pending')
  })

  it('should extract responsibilities and achievements from experience descriptions', async () => {
    // Create a candidate with an experience that has a description but no explicit responsibilities/achievements
    const candidateWithDescription: JobAdderCandidate = {
      ...mockCandidate,
      id: 'candidate-789',
    }

    const experienceWithDescription: JobAdderCandidateExperience[] = [
      {
        id: 'exp-3',
        candidateId: 'candidate-789',
        jobTitle: 'Product Manager',
        employer: 'Product Co',
        startDate: '2020-01-01',
        isCurrent: true,
        description:
          'Product management role\n\nResponsibilities:\n• Defining product roadmap\n• Working with stakeholders\n\nAchievements:\n• Launched new product\n• Increased revenue by 30%',
      },
    ]

    const transformedCandidate = await transformCandidate(
      candidateWithDescription,
      tenantId,
      undefined,
      experienceWithDescription,
    )

    // Check that responsibilities and achievements were extracted
    expect(transformedCandidate.experiences).toHaveLength(1)
    expect(transformedCandidate.experiences[0].responsibilities).toContain(
      'Defining product roadmap',
    )
    expect(transformedCandidate.experiences[0].responsibilities).toContain(
      'Working with stakeholders',
    )
    expect(transformedCandidate.experiences[0].achievements).toContain('Launched new product')
    expect(transformedCandidate.experiences[0].achievements).toContain('Increased revenue by 30%')
  })
})
