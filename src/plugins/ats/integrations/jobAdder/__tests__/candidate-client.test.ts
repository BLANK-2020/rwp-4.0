import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { JobAdderClient } from '../client'
import {
  JobAdderCandidate,
  JobAdderCandidateResume,
  JobAdderCandidateExperience,
  JobAdderCandidateEducation,
  JobAdderCandidatePlacement,
} from '../types'

describe('JobAdderClient - Candidate Methods', () => {
  let client: JobAdderClient
  let mockAxios: MockAdapter

  const mockConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  }

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
      'John Doe\nSenior Developer\n\nExperience:\n- Tech Co: Senior Developer (2020-Present)\n- Dev Inc: Developer (2018-2020)\n\nSkills:\n- JavaScript\n- React\n- Node.js',
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

  beforeEach(() => {
    client = new JobAdderClient(mockConfig)
    mockAxios = new MockAdapter(axios)
  })

  afterEach(() => {
    mockAxios.reset()
  })

  describe('getCandidates', () => {
    it('should fetch candidates with default parameters', async () => {
      mockAxios.onGet('https://api.jobadder.com/v2/candidates').reply(200, {
        data: [mockCandidate],
      })

      const candidates = await client.getCandidates()

      expect(candidates).toHaveLength(1)
      expect(candidates[0].id).toBe('candidate-123')
      expect(candidates[0].firstName).toBe('John')
      expect(candidates[0].lastName).toBe('Doe')
    })

    it('should fetch candidates with custom parameters', async () => {
      mockAxios
        .onGet('https://api.jobadder.com/v2/candidates', {
          params: {
            status: 'active',
            updatedSince: '2025-01-01T00:00:00Z',
            limit: 50,
            offset: 10,
          },
        })
        .reply(200, {
          data: [mockCandidate],
        })

      const candidates = await client.getCandidates({
        status: 'active',
        updatedSince: '2025-01-01T00:00:00Z',
        limit: 50,
        offset: 10,
      })

      expect(candidates).toHaveLength(1)
      expect(candidates[0].id).toBe('candidate-123')
    })

    it('should handle errors when fetching candidates', async () => {
      mockAxios.onGet('https://api.jobadder.com/v2/candidates').reply(500)

      await expect(client.getCandidates()).rejects.toThrow()
    })
  })

  describe('getCandidate', () => {
    it('should fetch a specific candidate', async () => {
      mockAxios.onGet('https://api.jobadder.com/v2/candidates/candidate-123').reply(200, {
        data: mockCandidate,
      })

      const candidate = await client.getCandidate('candidate-123')

      expect(candidate.id).toBe('candidate-123')
      expect(candidate.firstName).toBe('John')
      expect(candidate.lastName).toBe('Doe')
    })

    it('should handle errors when fetching a candidate', async () => {
      mockAxios.onGet('https://api.jobadder.com/v2/candidates/candidate-123').reply(404)

      await expect(client.getCandidate('candidate-123')).rejects.toThrow()
    })
  })

  describe('getCandidateResume', () => {
    it('should fetch a candidate resume', async () => {
      // Mock the attachments endpoint
      mockAxios
        .onGet('https://api.jobadder.com/v2/candidates/candidate-123/attachments', {
          params: { type: 'resume' },
        })
        .reply(200, {
          data: [{ ...mockResume, content: undefined }],
        })

      // Mock the content endpoint
      mockAxios
        .onGet(
          'https://api.jobadder.com/v2/candidates/candidate-123/attachments/resume-123/content',
        )
        .reply(200, {
          content: mockResume.content,
        })

      const resume = await client.getCandidateResume('candidate-123')

      expect(resume.id).toBe('resume-123')
      expect(resume.candidateId).toBe('candidate-123')
      expect(resume.content).toBe(mockResume.content)
    })

    it('should throw an error when no resume is found', async () => {
      mockAxios
        .onGet('https://api.jobadder.com/v2/candidates/candidate-123/attachments', {
          params: { type: 'resume' },
        })
        .reply(200, {
          data: [],
        })

      await expect(client.getCandidateResume('candidate-123')).rejects.toThrow('No resume found')
    })
  })

  describe('getCandidateExperiences', () => {
    it('should fetch candidate experiences', async () => {
      mockAxios
        .onGet('https://api.jobadder.com/v2/candidates/candidate-123/experiences')
        .reply(200, {
          data: mockExperiences,
        })

      const experiences = await client.getCandidateExperiences('candidate-123')

      expect(experiences).toHaveLength(2)
      expect(experiences[0].jobTitle).toBe('Senior Developer')
      expect(experiences[1].jobTitle).toBe('Developer')
    })
  })

  describe('getCandidateEducation', () => {
    it('should fetch candidate education', async () => {
      mockAxios.onGet('https://api.jobadder.com/v2/candidates/candidate-123/education').reply(200, {
        data: mockEducation,
      })

      const education = await client.getCandidateEducation('candidate-123')

      expect(education).toHaveLength(1)
      expect(education[0].institution).toBe('University of Sydney')
      expect(education[0].qualification).toBe('Bachelor of Computer Science')
    })
  })

  describe('getCandidatePlacements', () => {
    it('should fetch candidate placements', async () => {
      mockAxios
        .onGet('https://api.jobadder.com/v2/candidates/candidate-123/placements')
        .reply(200, {
          data: mockPlacements,
        })

      const placements = await client.getCandidatePlacements('candidate-123')

      expect(placements).toHaveLength(1)
      expect(placements[0].jobTitle).toBe('Frontend Developer')
      expect(placements[0].employer).toBe('Web Co')
    })
  })
})
