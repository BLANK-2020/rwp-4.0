/**
 * OpenAI Integration Module
 *
 * This module provides functions for interacting with the OpenAI API for AI enrichment tasks.
 */

import OpenAI from 'openai'
import { createEmbedding } from './vectorDb'

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Default model to use for completions
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'

// Default model to use for embeddings
const DEFAULT_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large'

/**
 * Generate a completion using the OpenAI API
 * @param prompt The prompt to send to the API
 * @param options Additional options for the API call
 * @returns The generated completion
 */
export async function generateCompletion(
  prompt: string,
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
  } = {},
) {
  try {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.2,
      maxTokens = 1000,
      systemPrompt = 'You are a helpful assistant that analyzes candidate resumes and provides structured insights.',
    } = options

    const response = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('Error generating completion:', error)
    throw error
  }
}

/**
 * Generate an embedding for a text using the OpenAI API
 * @param text The text to generate an embedding for
 * @param options Additional options for the API call
 * @returns The generated embedding
 */
export async function generateEmbedding(
  text: string,
  options: {
    model?: string
    storeInVectorDb?: boolean
    metadata?: Record<string, any>
    id?: string
  } = {},
) {
  try {
    const { model = DEFAULT_EMBEDDING_MODEL, storeInVectorDb = false, metadata = {}, id } = options

    const response = await openai.embeddings.create({
      model,
      input: text,
    })

    const embedding = response.data[0].embedding

    // Store the embedding in the vector database if requested
    if (storeInVectorDb && id) {
      await createEmbedding(id, embedding, text, metadata)
    }

    return embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Extract structured data from a resume using the OpenAI API
 * @param resumeText The text of the resume
 * @returns The extracted structured data
 */
export async function extractResumeData(resumeText: string) {
  try {
    const prompt = `
      Extract the following information from this resume:
      
      1. Contact Information (name, email, phone)
      2. Skills (as a list)
      3. Work Experience (for each position: title, company, duration, responsibilities, achievements)
      4. Education (for each degree: level, field, institution, year)
      5. Certifications
      
      Format the output as a JSON object with the following structure:
      {
        "contactInfo": {
          "name": "",
          "email": "",
          "phone": ""
        },
        "skills": ["skill1", "skill2", ...],
        "workExperience": [
          {
            "title": "",
            "company": "",
            "startDate": "",
            "endDate": "",
            "duration": 0, // in months
            "responsibilities": ["resp1", "resp2", ...],
            "achievements": ["achievement1", "achievement2", ...]
          }
        ],
        "education": [
          {
            "level": "",
            "field": "",
            "institution": "",
            "year": 0
          }
        ],
        "certifications": ["cert1", "cert2", ...]
      }
      
      Resume:
      ${resumeText}
    `

    const systemPrompt = `
      You are an expert resume parser. Your task is to extract structured information from resumes.
      Always return a valid JSON object with the requested structure. If information is missing, use null or empty arrays.
      Do not include any explanations or notes outside the JSON object.
    `

    const response = await generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.1,
      maxTokens: 2000,
    })

    // Parse the JSON response
    try {
      return JSON.parse(response || '{}')
    } catch (error) {
      console.error('Error parsing JSON response:', error)
      throw new Error('Failed to parse structured data from resume')
    }
  } catch (error) {
    console.error('Error extracting resume data:', error)
    throw error
  }
}

/**
 * Analyze a candidate's skills and experience
 * @param candidateData The candidate data to analyze
 * @returns The analysis results
 */
export async function analyzeCandidateProfile(candidateData: any) {
  try {
    const prompt = `
      Analyze the following candidate profile and provide insights:
      
      1. Categorize skills into technical, soft, and domain-specific
      2. Assess seniority level based on experience
      3. Identify key strengths
      4. Identify potential development areas
      5. Assess leadership potential (score 0-100)
      6. Assess team fit metrics (collaboration, autonomy, innovation, resilience - scores 0-100)
      7. Assess communication style
      
      Format the output as a JSON object with the following structure:
      {
        "skillCategories": {
          "technical": ["skill1", "skill2", ...],
          "soft": ["skill1", "skill2", ...],
          "domainSpecific": ["skill1", "skill2", ...]
        },
        "seniorityLevel": "", // e.g., "Junior", "Mid-level", "Senior", "Executive"
        "strengths": ["strength1", "strength2", ...],
        "developmentAreas": ["area1", "area2", ...],
        "leadershipPotential": 0, // 0-100
        "teamFitMetrics": {
          "collaboration": 0, // 0-100
          "autonomy": 0, // 0-100
          "innovation": 0, // 0-100
          "resilience": 0 // 0-100
        },
        "communicationStyle": "" // e.g., "Direct", "Collaborative", "Analytical", "Expressive"
      }
      
      Candidate Profile:
      ${JSON.stringify(candidateData, null, 2)}
    `

    const systemPrompt = `
      You are an expert talent analyst. Your task is to analyze candidate profiles and provide structured insights.
      Always return a valid JSON object with the requested structure. Base your analysis on the candidate's skills, experience, and education.
      Provide thoughtful, balanced assessments that highlight both strengths and areas for development.
    `

    const response = await generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
    })

    // Parse the JSON response
    try {
      return JSON.parse(response || '{}')
    } catch (error) {
      console.error('Error parsing JSON response:', error)
      throw new Error('Failed to parse candidate analysis')
    }
  } catch (error) {
    console.error('Error analyzing candidate profile:', error)
    throw error
  }
}

/**
 * Compare a candidate to a benchmark template
 * @param candidateData The candidate data to compare
 * @param benchmarkTemplate The benchmark template to compare against
 * @returns The comparison results
 */
export async function compareToBenchmark(candidateData: any, benchmarkTemplate: any) {
  try {
    const prompt = `
      Compare the following candidate profile to the benchmark template and provide a detailed assessment:
      
      1. Calculate an overall match score (0-100)
      2. Calculate category scores (technical skills, domain expertise, cultural fit, leadership, communication, problem-solving, adaptability)
      3. Identify key strengths relative to the benchmark
      4. Identify development areas relative to the benchmark
      5. Determine the appropriate tier (A, B, or C) based on the benchmark's tier thresholds
      6. Provide detailed match information for skills and experience
      
      Format the output as a JSON object with the following structure:
      {
        "overallScore": 0, // 0-100
        "categoryScores": {
          "technicalSkills": 0, // 0-100
          "domainExpertise": 0, // 0-100
          "culturalFit": 0, // 0-100
          "leadershipCapability": 0, // 0-100
          "communicationSkills": 0, // 0-100
          "problemSolving": 0, // 0-100
          "adaptability": 0 // 0-100
        },
        "tier": "", // "A", "B", or "C"
        "strengths": ["strength1", "strength2", ...],
        "developmentAreas": ["area1", "area2", ...],
        "matchDetails": {
          "skillMatches": [
            {
              "skill": "",
              "score": 0, // 0-100
              "importance": "" // "high", "medium", or "low"
            }
          ],
          "experienceMatches": [
            {
              "aspect": "",
              "score": 0, // 0-100
              "importance": "" // "high", "medium", or "low"
            }
          ]
        }
      }
      
      Candidate Profile:
      ${JSON.stringify(candidateData, null, 2)}
      
      Benchmark Template:
      ${JSON.stringify(benchmarkTemplate, null, 2)}
    `

    const systemPrompt = `
      You are an expert talent evaluator. Your task is to compare candidate profiles to benchmark templates and provide structured assessments.
      Always return a valid JSON object with the requested structure. Base your assessment on the candidate's match to the benchmark's requirements.
      Be objective and follow the scoring rules defined in the benchmark template.
    `

    const response = await generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.2,
      maxTokens: 3000,
    })

    // Parse the JSON response
    try {
      return JSON.parse(response || '{}')
    } catch (error) {
      console.error('Error parsing JSON response:', error)
      throw new Error('Failed to parse benchmark comparison')
    }
  } catch (error) {
    console.error('Error comparing to benchmark:', error)
    throw error
  }
}

export default {
  generateCompletion,
  generateEmbedding,
  extractResumeData,
  analyzeCandidateProfile,
  compareToBenchmark,
}
