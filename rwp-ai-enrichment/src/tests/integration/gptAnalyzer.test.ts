/**
 * GPT Analyzer Integration Tests
 *
 * These tests verify the functionality of the GPT analyzer service.
 */

import {
  analyzeResume,
  compareToJobDescription,
  generateInterviewQuestions,
} from '../../services/gptAnalyzer'

describe('GPT Analyzer Integration Tests', () => {
  // Sample resume text for testing
  const sampleResumeText = `
    John Doe
    Software Engineer
    john.doe@example.com
    (123) 456-7890
    
    SKILLS
    JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, AWS, Docker
    
    EXPERIENCE
    
    Senior Software Engineer
    ABC Tech, Inc.
    January 2020 - Present
    
    - Led the development of a microservices architecture using Node.js and TypeScript
    - Implemented CI/CD pipelines using GitHub Actions and AWS
    - Mentored junior developers and conducted code reviews
    - Reduced API response times by 40% through optimization and caching strategies
    
    Software Engineer
    XYZ Solutions
    June 2017 - December 2019
    
    - Developed and maintained React-based web applications
    - Collaborated with UX designers to implement responsive UI components
    - Integrated third-party APIs and services
    - Participated in agile development processes
    
    EDUCATION
    
    Bachelor of Science in Computer Science
    University of Technology
    2013 - 2017
    
    CERTIFICATIONS
    
    AWS Certified Developer - Associate
    Certified Scrum Master
  `

  // Sample job description for testing
  const sampleJobDescription = `
    Senior Full Stack Developer
    
    We are looking for a Senior Full Stack Developer to join our growing team. The ideal candidate will have strong experience with JavaScript, TypeScript, React, and Node.js, and be comfortable working in a fast-paced, agile environment.
    
    Responsibilities:
    - Design, develop, and maintain web applications using React and Node.js
    - Collaborate with cross-functional teams to define, design, and ship new features
    - Ensure the performance, quality, and responsiveness of applications
    - Identify and correct bottlenecks and fix bugs
    - Help maintain code quality, organization, and automatization
    
    Requirements:
    - 5+ years of experience in full stack development
    - Strong proficiency in JavaScript, TypeScript, HTML, CSS
    - Experience with React and Node.js
    - Familiarity with RESTful APIs and microservices architecture
    - Experience with database technologies (PostgreSQL, MongoDB)
    - Knowledge of AWS services
    - Experience with CI/CD pipelines
    - Bachelor's degree in Computer Science or related field
    
    Nice to have:
    - Experience with Docker and Kubernetes
    - Knowledge of GraphQL
    - Experience with serverless architecture
    - Agile development experience
  `

  // Sample candidate data for testing
  const sampleCandidateData = {
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
      },
    },
  }

  test('should analyze a resume and provide insights', async () => {
    // This test is marked as skipped because it requires OpenAI API access
    // Remove the .skip to run the test with valid API credentials

    // Analyze the resume
    const result = await analyzeResume(sampleResumeText)

    // Verify the structure of the result
    expect(result).toBeDefined()
    expect(result.analysis).toBeDefined()
    expect(result.timestamp).toBeDefined()

    // Verify that the analysis contains meaningful content
    expect(typeof result.analysis).toBe('string')
    expect(result.analysis.length).toBeGreaterThan(100)

    // Verify that the analysis contains key sections
    expect(result.analysis).toContain('strength')
    expect(result.analysis).toContain('experience')
    expect(result.analysis).toContain('interview')
  }, 30000) // Increase timeout for API calls

  test('should compare a candidate to a job description', async () => {
    // This test is marked as skipped because it requires OpenAI API access
    // Remove the .skip to run the test with valid API credentials

    // Compare the candidate to the job description
    const result = await compareToJobDescription(sampleCandidateData, sampleJobDescription)

    // Verify the structure of the result
    expect(result).toBeDefined()
    expect(result.comparison).toBeDefined()
    expect(result.timestamp).toBeDefined()

    // Verify that the comparison contains meaningful content
    expect(typeof result.comparison).toBe('string')
    expect(result.comparison.length).toBeGreaterThan(100)

    // Verify that the comparison contains key sections
    expect(result.comparison).toContain('match')
    expect(result.comparison).toContain('skill')
    expect(result.comparison).toContain('interview')
  }, 30000) // Increase timeout for API calls

  test('should generate interview questions for a candidate', async () => {
    // This test is marked as skipped because it requires OpenAI API access
    // Remove the .skip to run the test with valid API credentials

    // Generate interview questions
    const result = await generateInterviewQuestions(sampleCandidateData, sampleJobDescription)

    // Verify the structure of the result
    expect(result).toBeDefined()
    expect(result.questions).toBeDefined()
    expect(result.timestamp).toBeDefined()

    // Verify that the questions contain meaningful content
    expect(typeof result.questions).toBe('string')
    expect(result.questions.length).toBeGreaterThan(100)

    // Verify that the questions contain different types
    expect(result.questions).toContain('technical')
    expect(result.questions).toContain('experience')
    expect(result.questions).toContain('behavioral')
  }, 30000) // Increase timeout for API calls
})
