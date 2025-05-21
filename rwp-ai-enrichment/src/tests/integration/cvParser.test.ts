/**
 * CV Parser Integration Tests
 *
 * These tests verify the functionality of the CV parser service.
 */

import { parseCvText } from '../../services/cvParser'

describe('CV Parser Integration Tests', () => {
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

  test('should parse resume text and extract structured data', async () => {
    // This test is marked as skipped because it requires OpenAI API access
    // Remove the .skip to run the test with valid API credentials

    // Parse the resume text
    const result = await parseCvText(sampleResumeText)

    // Verify the structure of the result
    expect(result).toBeDefined()
    expect(result.contactInfo).toBeDefined()
    expect(result.skills).toBeInstanceOf(Array)
    expect(result.workExperience).toBeInstanceOf(Array)
    expect(result.education).toBeInstanceOf(Array)

    // Verify the content of the result
    expect(result.contactInfo.name).toContain('John Doe')
    expect(result.contactInfo.email).toContain('john.doe@example.com')
    expect(result.skills).toContain('JavaScript')
    expect(result.skills).toContain('React')

    // Verify work experience
    expect(result.workExperience.length).toBeGreaterThanOrEqual(2)
    expect(result.workExperience[0].title).toContain('Senior Software Engineer')
    expect(result.workExperience[0].company).toContain('ABC Tech')

    // Verify education
    expect(result.education.length).toBeGreaterThanOrEqual(1)
    expect(result.education[0].level).toContain('Bachelor')
    expect(result.education[0].field).toContain('Computer Science')

    // Verify certifications
    expect(result.certifications).toContain('AWS Certified Developer')
  }, 30000) // Increase timeout for API calls
})
