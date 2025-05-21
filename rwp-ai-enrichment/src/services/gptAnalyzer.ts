/**
 * GPT Analyzer Service
 *
 * This service provides advanced analysis capabilities using OpenAI's GPT models.
 */

import { generateCompletion, generateEmbedding } from '../lib/openai'
import { querySimilarEmbeddings } from '../lib/vectorDb'
import * as db from '../lib/db'

/**
 * Analyze a candidate's resume and provide insights
 * @param resumeText The text of the resume
 * @returns The analysis results
 */
export async function analyzeResume(resumeText: string): Promise<any> {
  try {
    const prompt = `
      Analyze the following resume and provide insights:
      
      1. Key strengths and unique selling points
      2. Potential red flags or areas of concern
      3. Career progression assessment
      4. Cultural fit considerations
      5. Suggested interview questions
      
      Resume:
      ${resumeText}
    `

    const systemPrompt = `
      You are an expert talent acquisition specialist with years of experience reviewing resumes.
      Provide a balanced, insightful analysis that highlights both strengths and potential concerns.
      Be specific and reference concrete details from the resume to support your observations.
      Format your response in clear sections with bullet points for easy readability.
    `

    const response = await generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
    })

    return {
      analysis: response,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error analyzing resume:', error)
    throw error
  }
}

/**
 * Compare a candidate to a job description
 * @param candidateData The candidate data
 * @param jobDescription The job description
 * @returns The comparison results
 */
export async function compareToJobDescription(
  candidateData: any,
  jobDescription: string,
): Promise<any> {
  try {
    const prompt = `
      Compare the following candidate profile to the job description and provide a detailed assessment:
      
      1. Overall match score (0-100)
      2. Key matching qualifications and skills
      3. Missing or misaligned qualifications and skills
      4. Suggested areas to explore in an interview
      5. Potential for success in the role
      
      Candidate Profile:
      ${JSON.stringify(candidateData, null, 2)}
      
      Job Description:
      ${jobDescription}
    `

    const systemPrompt = `
      You are an expert recruiter specializing in matching candidates to job opportunities.
      Provide a balanced, data-driven assessment of how well the candidate matches the job requirements.
      Be specific about both strengths and gaps, and provide actionable insights for the hiring team.
      Format your response in clear sections with bullet points for easy readability.
    `

    const response = await generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
    })

    return {
      comparison: response,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error comparing to job description:', error)
    throw error
  }
}

/**
 * Generate interview questions for a candidate
 * @param candidateData The candidate data
 * @param jobDescription The job description
 * @returns The generated interview questions
 */
export async function generateInterviewQuestions(
  candidateData: any,
  jobDescription: string,
): Promise<any> {
  try {
    const prompt = `
      Generate tailored interview questions for the following candidate based on their profile and the job description:
      
      1. 3 technical/skills-based questions
      2. 3 experience-based questions
      3. 2 behavioral questions
      4. 2 cultural fit questions
      5. 1 question to address potential concerns or gaps
      
      For each question, provide:
      - The question itself
      - Why you're asking it (what you're trying to assess)
      - What to look for in a good answer
      
      Candidate Profile:
      ${JSON.stringify(candidateData, null, 2)}
      
      Job Description:
      ${jobDescription}
    `

    const systemPrompt = `
      You are an expert interviewer with deep experience in technical recruiting.
      Create thoughtful, probing questions that will reveal the candidate's true capabilities and fit.
      Avoid generic questions - each question should be specifically tailored to this candidate and role.
      Format your response as a numbered list with clear sections for each question type.
    `

    const response = await generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.4,
      maxTokens: 2500,
    })

    return {
      questions: response,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error generating interview questions:', error)
    throw error
  }
}

/**
 * Find similar candidates based on a candidate profile
 * @param candidateId The ID of the candidate
 * @param tenantId The ID of the tenant
 * @param limit The maximum number of similar candidates to return
 * @returns The similar candidates
 */
export async function findSimilarCandidates(
  candidateId: string,
  tenantId: string,
  limit: number = 5,
): Promise<any[]> {
  try {
    // Get the candidate data
    const candidateQuery = `
      SELECT * FROM candidate_enrichments
      WHERE candidate_id = $1 AND tenant_id = $2
    `
    const candidateResult = await db.query(candidateQuery, [candidateId, tenantId])

    if (candidateResult.rows.length === 0) {
      throw new Error(`Candidate enrichment data not found for candidate ${candidateId}`)
    }

    const candidateData = candidateResult.rows[0]

    // Generate an embedding for the candidate
    const candidateText = generateCandidateText(candidateData)
    const embedding = await generateEmbedding(candidateText)

    // Query for similar candidates
    const similarCandidates = await querySimilarEmbeddings(embedding, {
      topK: limit,
      filter: { tenantId },
      includeMetadata: true,
    })

    // Exclude the original candidate
    return similarCandidates
      .filter((match) => match.id !== candidateId)
      .map((match) => ({
        candidateId: match.id,
        similarity: match.score,
        metadata: match.metadata,
      }))
  } catch (error) {
    console.error('Error finding similar candidates:', error)
    throw error
  }
}

/**
 * Generate a text representation of a candidate for embedding
 * @param candidateData The candidate data
 * @returns The text representation
 */
function generateCandidateText(candidateData: any): string {
  try {
    const aiEnrichment = candidateData.ai_enrichment || {}
    const skills = aiEnrichment.extractedSkills || []
    const experienceSummary = aiEnrichment.experienceSummary || {}
    const roles = experienceSummary.roles || []

    // Create a text representation of the candidate
    let text = ''

    // Add skills
    text += 'Skills: ' + skills.join(', ') + '\n\n'

    // Add experience
    text += 'Experience:\n'
    roles.forEach((role: any) => {
      text += `${role.title} at ${role.company} (${role.duration} months)\n`
      text += 'Responsibilities: ' + (role.responsibilities || []).join(', ') + '\n'
      text += 'Achievements: ' + (role.achievements || []).join(', ') + '\n\n'
    })

    // Add education
    const educationSummary = aiEnrichment.educationSummary || {}
    const degrees = educationSummary.degrees || []

    text += 'Education:\n'
    degrees.forEach((degree: any) => {
      text += `${degree.level} in ${degree.field} from ${degree.institution} (${degree.year})\n`
    })

    return text
  } catch (error) {
    console.error('Error generating candidate text:', error)
    return ''
  }
}

/**
 * Generate a career development plan for a candidate
 * @param candidateData The candidate data
 * @param targetRole The target role
 * @returns The career development plan
 */
export async function generateCareerDevelopmentPlan(
  candidateData: any,
  targetRole: string,
): Promise<any> {
  try {
    const prompt = `
      Generate a personalized career development plan for the following candidate to help them progress toward the target role:
      
      1. Skills gap analysis
      2. Recommended learning resources and certifications
      3. Experience building opportunities
      4. Networking and visibility strategies
      5. Timeline with milestones (6 months, 1 year, 2 years)
      
      Candidate Profile:
      ${JSON.stringify(candidateData, null, 2)}
      
      Target Role:
      ${targetRole}
    `

    const systemPrompt = `
      You are an expert career coach with deep experience in professional development planning.
      Create a practical, actionable development plan that addresses the specific gaps between the candidate's current profile and the target role.
      Be specific about resources, timelines, and measurable outcomes.
      Format your response in clear sections with bullet points and a timeline for easy implementation.
    `

    const response = await generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2500,
    })

    return {
      developmentPlan: response,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error generating career development plan:', error)
    throw error
  }
}

export default {
  analyzeResume,
  compareToJobDescription,
  generateInterviewQuestions,
  findSimilarCandidates,
  generateCareerDevelopmentPlan,
}
