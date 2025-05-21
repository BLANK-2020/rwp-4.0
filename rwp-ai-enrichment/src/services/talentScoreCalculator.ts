/**
 * TalentScore Calculator Service
 *
 * This service is responsible for calculating TalentScores for candidates
 * based on their skills, experience, and other factors.
 */

import { analyzeCandidateProfile } from '../lib/openai'
import { CandidateEnrichment } from '../lib/types'
import * as db from '../lib/db'

/**
 * Calculate a TalentScore for a candidate
 * @param candidateId The ID of the candidate
 * @param tenantId The ID of the tenant
 * @param enrichmentData The enrichment data for the candidate
 * @returns The calculated TalentScore
 */
export async function calculateTalentScore(
  candidateId: string,
  tenantId: string,
  enrichmentData: any,
): Promise<{
  overallScore: number
  categoryScores: Record<string, number>
  strengths: string[]
  developmentAreas: string[]
}> {
  try {
    // Get the candidate's AI enrichment data
    const aiEnrichment = enrichmentData.aiEnrichment || {}

    // Calculate category scores
    const technicalSkillsScore = calculateTechnicalSkillsScore(aiEnrichment)
    const domainExpertiseScore = calculateDomainExpertiseScore(aiEnrichment)
    const leadershipScore = calculateLeadershipScore(aiEnrichment)
    const communicationScore = calculateCommunicationScore(aiEnrichment)
    const teamFitScore = calculateTeamFitScore(aiEnrichment)
    const adaptabilityScore = calculateAdaptabilityScore(aiEnrichment)

    // Calculate the overall score (weighted average)
    const overallScore = Math.round(
      technicalSkillsScore * 0.25 +
        domainExpertiseScore * 0.25 +
        leadershipScore * 0.15 +
        communicationScore * 0.15 +
        teamFitScore * 0.1 +
        adaptabilityScore * 0.1,
    )

    // Determine strengths (categories with scores >= 80)
    const categoryScores = {
      technicalSkills: technicalSkillsScore,
      domainExpertise: domainExpertiseScore,
      leadership: leadershipScore,
      communication: communicationScore,
      teamFit: teamFitScore,
      adaptability: adaptabilityScore,
    }

    const strengths = Object.entries(categoryScores)
      .filter(([_, score]) => score >= 80)
      .map(([category, _]) => formatCategoryName(category))

    // Add specific strengths from AI enrichment
    if (aiEnrichment.strengths && Array.isArray(aiEnrichment.strengths)) {
      strengths.push(...aiEnrichment.strengths.slice(0, 3))
    }

    // Determine development areas (categories with scores < 60)
    const developmentAreas = Object.entries(categoryScores)
      .filter(([_, score]) => score < 60)
      .map(([category, _]) => formatCategoryName(category))

    // Add specific development areas from AI enrichment
    if (aiEnrichment.developmentAreas && Array.isArray(aiEnrichment.developmentAreas)) {
      developmentAreas.push(...aiEnrichment.developmentAreas.slice(0, 3))
    }

    return {
      overallScore,
      categoryScores,
      strengths: [...new Set(strengths)], // Remove duplicates
      developmentAreas: [...new Set(developmentAreas)], // Remove duplicates
    }
  } catch (error) {
    console.error('Error calculating TalentScore:', error)
    throw error
  }
}

/**
 * Calculate a technical skills score
 * @param aiEnrichment The AI enrichment data
 * @returns The technical skills score
 */
function calculateTechnicalSkillsScore(aiEnrichment: any): number {
  try {
    // Extract relevant data
    const extractedSkills = aiEnrichment.extractedSkills || []
    const skillCategories = aiEnrichment.skillCategories || {}
    const technicalSkills = skillCategories.technical || []

    // Calculate the score based on the number and quality of technical skills
    const baseScore = Math.min(100, technicalSkills.length * 10)

    // Adjust the score based on the total number of skills
    const skillCountAdjustment = Math.min(20, extractedSkills.length * 2)

    // Calculate the final score
    const finalScore = Math.min(100, baseScore + skillCountAdjustment)

    return finalScore
  } catch (error) {
    console.error('Error calculating technical skills score:', error)
    return 50 // Default score
  }
}

/**
 * Calculate a domain expertise score
 * @param aiEnrichment The AI enrichment data
 * @returns The domain expertise score
 */
function calculateDomainExpertiseScore(aiEnrichment: any): number {
  try {
    // Extract relevant data
    const experienceSummary = aiEnrichment.experienceSummary || {}
    const totalYearsExperience = experienceSummary.totalYearsExperience || 0
    const roles = experienceSummary.roles || []

    // Calculate the score based on years of experience
    const yearsScore = Math.min(50, totalYearsExperience * 5)

    // Calculate the score based on the number and quality of roles
    const rolesScore = Math.min(50, roles.length * 10)

    // Calculate the final score
    const finalScore = Math.min(100, yearsScore + rolesScore)

    return finalScore
  } catch (error) {
    console.error('Error calculating domain expertise score:', error)
    return 50 // Default score
  }
}

/**
 * Calculate a leadership score
 * @param aiEnrichment The AI enrichment data
 * @returns The leadership score
 */
function calculateLeadershipScore(aiEnrichment: any): number {
  try {
    // Extract relevant data
    const leadershipPotential = aiEnrichment.leadershipPotential || 0

    // The leadership potential is already a score from 0-100
    return leadershipPotential
  } catch (error) {
    console.error('Error calculating leadership score:', error)
    return 50 // Default score
  }
}

/**
 * Calculate a communication score
 * @param aiEnrichment The AI enrichment data
 * @returns The communication score
 */
function calculateCommunicationScore(aiEnrichment: any): number {
  try {
    // Extract relevant data
    const communicationStyle = aiEnrichment.communicationStyle || ''

    // Map communication styles to scores
    const communicationStyleScores: Record<string, number> = {
      Direct: 85,
      Collaborative: 90,
      Analytical: 80,
      Expressive: 85,
      Strategic: 90,
      Supportive: 85,
    }

    // Get the score for the communication style, or use a default
    const styleScore = communicationStyleScores[communicationStyle] || 70

    return styleScore
  } catch (error) {
    console.error('Error calculating communication score:', error)
    return 50 // Default score
  }
}

/**
 * Calculate a team fit score
 * @param aiEnrichment The AI enrichment data
 * @returns The team fit score
 */
function calculateTeamFitScore(aiEnrichment: any): number {
  try {
    // Extract relevant data
    const teamFitMetrics = aiEnrichment.teamFitMetrics || {}
    const collaboration = teamFitMetrics.collaboration || 0
    const autonomy = teamFitMetrics.autonomy || 0
    const innovation = teamFitMetrics.innovation || 0
    const resilience = teamFitMetrics.resilience || 0

    // Calculate the average of the team fit metrics
    const teamFitScore = Math.round((collaboration + autonomy + innovation + resilience) / 4)

    return teamFitScore
  } catch (error) {
    console.error('Error calculating team fit score:', error)
    return 50 // Default score
  }
}

/**
 * Calculate an adaptability score
 * @param aiEnrichment The AI enrichment data
 * @returns The adaptability score
 */
function calculateAdaptabilityScore(aiEnrichment: any): number {
  try {
    // Extract relevant data
    const teamFitMetrics = aiEnrichment.teamFitMetrics || {}
    const resilience = teamFitMetrics.resilience || 0
    const experienceSummary = aiEnrichment.experienceSummary || {}
    const roles = experienceSummary.roles || []

    // Calculate the score based on resilience
    const resilienceScore = resilience

    // Calculate the score based on the diversity of roles
    const rolesDiversityScore = Math.min(50, roles.length * 10)

    // Calculate the final score
    const finalScore = Math.round((resilienceScore + rolesDiversityScore) / 2)

    return finalScore
  } catch (error) {
    console.error('Error calculating adaptability score:', error)
    return 50 // Default score
  }
}

/**
 * Format a category name for display
 * @param category The category name
 * @returns The formatted category name
 */
function formatCategoryName(category: string): string {
  // Convert camelCase to Title Case with spaces
  return category.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
}

/**
 * Save a TalentScore for a candidate
 * @param candidateId The ID of the candidate
 * @param tenantId The ID of the tenant
 * @param talentScore The TalentScore data
 * @returns The saved TalentScore
 */
export async function saveTalentScore(
  candidateId: string,
  tenantId: string,
  talentScore: {
    overallScore: number
    categoryScores: Record<string, number>
    strengths: string[]
    developmentAreas: string[]
  },
): Promise<any> {
  try {
    // Get the existing enrichment data for the candidate
    const query = `
      SELECT * FROM candidate_enrichments
      WHERE candidate_id = $1 AND tenant_id = $2
    `
    const result = await db.query(query, [candidateId, tenantId])

    if (result.rows.length === 0) {
      // Create a new enrichment record
      const insertQuery = `
        INSERT INTO candidate_enrichments (
          candidate_id,
          tenant_id,
          overall_score,
          benchmark_scores,
          tier,
          strengths,
          development_areas,
          data_usage_consent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `

      // Determine the tier based on the overall score
      const tier = determineTier(talentScore.overallScore)

      // Convert the category scores to the benchmark scores format
      const benchmarkScores = {
        technicalSkills: talentScore.categoryScores.technicalSkills,
        domainExpertise: talentScore.categoryScores.domainExpertise,
        culturalFit: talentScore.categoryScores.teamFit,
        leadershipCapability: talentScore.categoryScores.leadership,
        communicationSkills: talentScore.categoryScores.communication,
        problemSolving: 70, // Default value
        adaptability: talentScore.categoryScores.adaptability,
        lastBenchmarked: new Date(),
      }

      const insertResult = await db.query(insertQuery, [
        candidateId,
        tenantId,
        talentScore.overallScore,
        JSON.stringify(benchmarkScores),
        tier,
        talentScore.strengths,
        talentScore.developmentAreas,
        true, // Default to true for data_usage_consent
      ])

      return insertResult.rows[0]
    } else {
      // Update the existing enrichment record
      const updateQuery = `
        UPDATE candidate_enrichments
        SET
          overall_score = $3,
          benchmark_scores = $4,
          tier = $5,
          strengths = $6,
          development_areas = $7,
          updated_at = NOW()
        WHERE candidate_id = $1 AND tenant_id = $2
        RETURNING *
      `

      // Determine the tier based on the overall score
      const tier = determineTier(talentScore.overallScore)

      // Convert the category scores to the benchmark scores format
      const benchmarkScores = {
        technicalSkills: talentScore.categoryScores.technicalSkills,
        domainExpertise: talentScore.categoryScores.domainExpertise,
        culturalFit: talentScore.categoryScores.teamFit,
        leadershipCapability: talentScore.categoryScores.leadership,
        communicationSkills: talentScore.categoryScores.communication,
        problemSolving: 70, // Default value
        adaptability: talentScore.categoryScores.adaptability,
        lastBenchmarked: new Date(),
      }

      const updateResult = await db.query(updateQuery, [
        candidateId,
        tenantId,
        talentScore.overallScore,
        JSON.stringify(benchmarkScores),
        tier,
        talentScore.strengths,
        talentScore.developmentAreas,
      ])

      return updateResult.rows[0]
    }
  } catch (error) {
    console.error('Error saving TalentScore:', error)
    throw error
  }
}

/**
 * Determine the tier based on the overall score
 * @param overallScore The overall score
 * @returns The tier
 */
function determineTier(overallScore: number): string {
  if (overallScore >= 85) {
    return 'A'
  } else if (overallScore >= 70) {
    return 'B'
  } else {
    return 'C'
  }
}

export default {
  calculateTalentScore,
  saveTalentScore,
}
