/**
 * Benchmark Evaluation API Endpoint
 *
 * This endpoint evaluates a candidate against a benchmark template.
 */

import { NextRequest, NextResponse } from 'next/server'
import { evaluateCandidate } from '@/services/benchmarkProcessor'
import { EvaluateBenchmarkRequest, EvaluateBenchmarkResponse } from '@/lib/types'

/**
 * Process a request to evaluate a candidate against a benchmark
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: EvaluateBenchmarkRequest = await request.json()

    // Validate the request
    if (!body.candidateId || !body.benchmarkTemplateId || !body.tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateId, benchmarkTemplateId, tenantId' },
        { status: 400 },
      )
    }

    // Evaluate the candidate against the benchmark
    const evaluation = await evaluateCandidate(
      body.candidateId,
      body.benchmarkTemplateId,
      body.tenantId,
    )

    // Prepare the response
    const response: EvaluateBenchmarkResponse = {
      candidateId: body.candidateId,
      benchmarkId: evaluation.benchmarkId,
      benchmarkName: evaluation.benchmarkName,
      overallScore: evaluation.overallScore,
      tier: evaluation.tier,
      categoryScores: evaluation.categoryScores,
      strengths: evaluation.strengths,
      developmentAreas: evaluation.developmentAreas,
      matchDetails: evaluation.matchDetails,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error evaluating candidate against benchmark:', error)

    return NextResponse.json(
      {
        error:
          error.message || 'An error occurred while evaluating the candidate against the benchmark',
      },
      { status: 500 },
    )
  }
}
