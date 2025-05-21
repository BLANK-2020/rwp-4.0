/**
 * TalentScore Calculator Integration Tests
 *
 * These tests verify the functionality of the TalentScore calculator service.
 */

import { calculateTalentScore } from '../../services/talentScoreCalculator'

describe('TalentScore Calculator Integration Tests', () => {
  // Sample enrichment data for testing
  const sampleEnrichmentData = {
    aiEnrichment: {
      extractedSkills: [
        'JavaScript',
        'TypeScript',
        'React',
        'Node.js',
        'Express',
        'PostgreSQL',
        'AWS',
        'Docker',
        'CI/CD',
        'Git',
      ],
      skillCategories: {
        technical: [
          'JavaScript',
          'TypeScript',
          'React',
          'Node.js',
          'Express',
          'PostgreSQL',
          'AWS',
          'Docker',
        ],
        soft: ['Communication', 'Teamwork', 'Leadership'],
        domainSpecific: ['Microservices', 'Cloud Architecture'],
      },
      experienceSummary: {
        roles: [
          {
            title: 'Senior Software Engineer',
            company: 'ABC Tech, Inc.',
            duration: 36, // 3 years in months
            responsibilities: [
              'Led the development of a microservices architecture',
              'Implemented CI/CD pipelines',
              'Mentored junior developers',
            ],
            achievements: ['Reduced API response times by 40%', 'Improved test coverage by 30%'],
          },
          {
            title: 'Software Engineer',
            company: 'XYZ Solutions',
            duration: 30, // 2.5 years in months
            responsibilities: [
              'Developed React-based web applications',
              'Collaborated with UX designers',
              'Integrated third-party APIs',
            ],
            achievements: [
              'Delivered projects on time and within budget',
              'Received positive client feedback',
            ],
          },
        ],
        totalYearsExperience: 5.5,
        seniorityLevel: 'Senior',
      },
      educationSummary: {
        degrees: [
          {
            level: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'University of Technology',
            year: 2017,
          },
        ],
        certifications: ['AWS Certified Developer - Associate', 'Certified Scrum Master'],
        continuingEducation: [
          'Advanced React Patterns Workshop',
          'Microservices Architecture Conference',
        ],
      },
      personalityTraits: ['Analytical', 'Detail-oriented', 'Proactive', 'Collaborative'],
      communicationStyle: 'Direct',
      leadershipPotential: 85,
      teamFitMetrics: {
        collaboration: 90,
        autonomy: 85,
        innovation: 80,
        resilience: 75,
      },
      lastEnrichedAt: new Date(),
      enrichmentVersion: '1.0',
      confidenceScore: 0.92,
    },
  }

  test('should calculate TalentScore based on enrichment data', async () => {
    // Calculate the TalentScore
    const result = await calculateTalentScore(
      'test-candidate-id',
      'test-tenant-id',
      sampleEnrichmentData,
    )

    // Verify the structure of the result
    expect(result).toBeDefined()
    expect(result.overallScore).toBeDefined()
    expect(result.categoryScores).toBeDefined()
    expect(result.strengths).toBeInstanceOf(Array)
    expect(result.developmentAreas).toBeInstanceOf(Array)

    // Verify the category scores
    expect(result.categoryScores.technicalSkills).toBeGreaterThanOrEqual(0)
    expect(result.categoryScores.technicalSkills).toBeLessThanOrEqual(100)
    expect(result.categoryScores.domainExpertise).toBeGreaterThanOrEqual(0)
    expect(result.categoryScores.domainExpertise).toBeLessThanOrEqual(100)
    expect(result.categoryScores.leadership).toBeGreaterThanOrEqual(0)
    expect(result.categoryScores.leadership).toBeLessThanOrEqual(100)

    // Verify the overall score
    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)

    // Verify that strengths and development areas are populated
    expect(result.strengths.length).toBeGreaterThan(0)

    // Verify that the leadership score matches the leadership potential
    expect(result.categoryScores.leadership).toBe(
      sampleEnrichmentData.aiEnrichment.leadershipPotential,
    )
  })

  test('should handle missing or incomplete data gracefully', async () => {
    // Create a minimal enrichment data object
    const minimalEnrichmentData = {
      aiEnrichment: {
        extractedSkills: ['JavaScript', 'React'],
        experienceSummary: {
          totalYearsExperience: 2,
          roles: [],
        },
      },
    }

    // Calculate the TalentScore
    const result = await calculateTalentScore(
      'test-candidate-id',
      'test-tenant-id',
      minimalEnrichmentData,
    )

    // Verify that the function doesn't crash and returns reasonable defaults
    expect(result).toBeDefined()
    expect(result.overallScore).toBeDefined()
    expect(result.categoryScores).toBeDefined()
    expect(result.strengths).toBeInstanceOf(Array)
    expect(result.developmentAreas).toBeInstanceOf(Array)

    // Verify that the overall score is calculated
    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)
  })
})
