/**
 * Candidate Scoring API Endpoint
 *
 * This endpoint generates a TalentScore for a candidate based on their enriched profile.
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateTalentScore, saveTalentScore } from '@/services/talentScoreCalculator'
import * as db from '@/lib/db'
import { ScoreCandidateRequest, ScoreCandidateResponse } from '@/lib/types'

/**
 * Process a request to score a candidate
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: ScoreCandidateRequest = await request.json()

    // Validate the request
    if (!body.candidateId || !body.tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateId, tenantId' },
        { status: 400 },
      )
    }

    // Get the candidate's enrichment data
    const enrichmentData = await getCandidateEnrichment(body.candidateId, body.tenantId)

    if (!enrichmentData) {
      return NextResponse.json(
        {
          error: 'Candidate enrichment data not found. Please enrich the candidate profile first.',
        },
        { status: 404 },
      )
    }

    // Calculate the TalentScore
    const talentScore = await calculateTalentScore(body.candidateId, body.tenantId, enrichmentData)

    // Save the TalentScore
    await saveTalentScore(body.candidateId, body.tenantId, talentScore)

    // If a benchmark template ID is provided, evaluate against that benchmark
    let benchmarkScores = []
    if (body.benchmarkTemplateId) {
      benchmarkScores = await evaluateAgainstBenchmark(
        body.candidateId,
        body.tenantId,
        body.benchmarkTemplateId,
      )
    } else {
      // Otherwise, use the general TalentScore
      benchmarkScores = [
        {
          benchmarkId: 'general',
          benchmarkName: 'General Assessment',
          scores: {
            technicalSkills: talentScore.categoryScores.technicalSkills,
            domainExpertise: talentScore.categoryScores.domainExpertise,
            culturalFit: talentScore.categoryScores.teamFit,
            leadershipCapability: talentScore.categoryScores.leadership,
            communicationSkills: talentScore.categoryScores.communication,
            problemSolving: 70, // Default value
            adaptability: talentScore.categoryScores.adaptability,
          },
          strengths: talentScore.strengths,
          developmentAreas: talentScore.developmentAreas,
        },
      ]
    }

    // Prepare the response
    const response: ScoreCandidateResponse = {
      candidateId: body.candidateId,
      overallScore: talentScore.overallScore,
      tier: determineTier(talentScore.overallScore),
      benchmarkScores,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error scoring candidate:', error)

    return NextResponse.json(
      {
        error: error.message || 'An error occurred while scoring the candidate',
      },
      { status: 500 },
    )
  }
}

/**
 * Get a candidate's enrichment data
 * @param candidateId The ID of the candidate
 * @param tenantId The ID of the tenant
 * @returns The candidate's enrichment data
 */
async function getCandidateEnrichment(candidateId: string, tenantId: string): Promise<any> {
  try {
    const query = `
      SELECT * FROM candidate_enrichments
      WHERE candidate_id = $1 AND tenant_id = $2
    `

    const result = await db.query(query, [candidateId, tenantId])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error('Error getting candidate enrichment:', error)
    throw error
  }
}

/**
 * Evaluate a candidate against a benchmark template
 * @param candidateId The ID of the candidate
 * @param tenantId The ID of the tenant
 * @param benchmarkTemplateId The ID of the benchmark template
 * @returns The benchmark scores
 */
async function evaluateAgainstBenchmark(
  candidateId: string,
  tenantId: string,
  benchmarkTemplateId: string,
): Promise<any[]> {
  try {
    // Import the benchmark processor dynamically to avoid circular dependencies
    const { evaluateCandidate } = await import('@/services/benchmarkProcessor')

    // Evaluate the candidate against the benchmark
    const evaluation = await evaluateCandidate(candidateId, benchmarkTemplateId, tenantId)

    return [
      {
        benchmarkId: evaluation.benchmarkId,
        benchmarkName: evaluation.benchmarkName,
        scores: evaluation.categoryScores,
        strengths: evaluation.strengths,
        developmentAreas: evaluation.developmentAreas,
      },
    ]
  } catch (error) {
    console.error('Error evaluating against benchmark:', error)
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
