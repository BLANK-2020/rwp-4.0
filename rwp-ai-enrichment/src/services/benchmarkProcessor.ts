/**
 * Benchmark Processor Service
 *
 * This service is responsible for managing benchmark templates and
 * evaluating candidates against benchmarks.
 */

import { compareToBenchmark } from '../lib/openai'
import { BenchmarkTemplate, EvaluateBenchmarkResponse } from '../lib/types'
import * as db from '../lib/db'

/**
 * Get all benchmark templates for a tenant
 * @param tenantId The ID of the tenant
 * @returns The benchmark templates
 */
export async function getBenchmarkTemplates(tenantId: string): Promise<BenchmarkTemplate[]> {
  try {
    const query = `
      SELECT * FROM benchmark_templates
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY name
    `
    const result = await db.query(query, [tenantId])

    return result.rows.map(mapRowToBenchmarkTemplate)
  } catch (error) {
    console.error('Error getting benchmark templates:', error)
    throw error
  }
}

/**
 * Get a benchmark template by ID
 * @param id The ID of the benchmark template
 * @param tenantId The ID of the tenant
 * @returns The benchmark template
 */
export async function getBenchmarkTemplate(
  id: string,
  tenantId: string,
): Promise<BenchmarkTemplate | null> {
  try {
    const query = `
      SELECT * FROM benchmark_templates
      WHERE id = $1 AND tenant_id = $2
    `
    const result = await db.query(query, [id, tenantId])

    if (result.rows.length === 0) {
      return null
    }

    return mapRowToBenchmarkTemplate(result.rows[0])
  } catch (error) {
    console.error('Error getting benchmark template:', error)
    throw error
  }
}

/**
 * Create a benchmark template
 * @param template The benchmark template to create
 * @returns The created benchmark template
 */
export async function createBenchmarkTemplate(
  template: Partial<BenchmarkTemplate>,
): Promise<BenchmarkTemplate> {
  try {
    const query = `
      INSERT INTO benchmark_templates (
        tenant_id,
        name,
        description,
        skill_weights,
        experience_weights,
        scoring_rules,
        industry,
        job_level,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `

    const result = await db.query(query, [
      template.tenantId,
      template.name,
      template.description || null,
      JSON.stringify(template.skillWeights || {}),
      JSON.stringify(template.experienceWeights || {}),
      JSON.stringify(template.scoringRules || {}),
      template.industry || null,
      template.jobLevel || null,
      template.isActive !== undefined ? template.isActive : true,
    ])

    return mapRowToBenchmarkTemplate(result.rows[0])
  } catch (error) {
    console.error('Error creating benchmark template:', error)
    throw error
  }
}

/**
 * Update a benchmark template
 * @param id The ID of the benchmark template
 * @param template The benchmark template updates
 * @returns The updated benchmark template
 */
export async function updateBenchmarkTemplate(
  id: string,
  tenantId: string,
  template: Partial<BenchmarkTemplate>,
): Promise<BenchmarkTemplate | null> {
  try {
    // Check if the template exists
    const existingTemplate = await getBenchmarkTemplate(id, tenantId)

    if (!existingTemplate) {
      return null
    }

    const query = `
      UPDATE benchmark_templates
      SET
        name = $3,
        description = $4,
        skill_weights = $5,
        experience_weights = $6,
        scoring_rules = $7,
        industry = $8,
        job_level = $9,
        is_active = $10,
        updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `

    const result = await db.query(query, [
      id,
      tenantId,
      template.name || existingTemplate.name,
      template.description !== undefined ? template.description : existingTemplate.description,
      JSON.stringify(template.skillWeights || existingTemplate.skillWeights),
      JSON.stringify(template.experienceWeights || existingTemplate.experienceWeights),
      JSON.stringify(template.scoringRules || existingTemplate.scoringRules),
      template.industry !== undefined ? template.industry : existingTemplate.industry,
      template.jobLevel !== undefined ? template.jobLevel : existingTemplate.jobLevel,
      template.isActive !== undefined ? template.isActive : existingTemplate.isActive,
    ])

    return mapRowToBenchmarkTemplate(result.rows[0])
  } catch (error) {
    console.error('Error updating benchmark template:', error)
    throw error
  }
}

/**
 * Delete a benchmark template
 * @param id The ID of the benchmark template
 * @param tenantId The ID of the tenant
 * @returns Whether the deletion was successful
 */
export async function deleteBenchmarkTemplate(id: string, tenantId: string): Promise<boolean> {
  try {
    const query = `
      DELETE FROM benchmark_templates
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `

    const result = await db.query(query, [id, tenantId])

    return result.rows.length > 0
  } catch (error) {
    console.error('Error deleting benchmark template:', error)
    throw error
  }
}

/**
 * Evaluate a candidate against a benchmark
 * @param candidateId The ID of the candidate
 * @param benchmarkId The ID of the benchmark
 * @param tenantId The ID of the tenant
 * @returns The evaluation results
 */
export async function evaluateCandidate(
  candidateId: string,
  benchmarkId: string,
  tenantId: string,
): Promise<EvaluateBenchmarkResponse> {
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

    // Get the benchmark template
    const benchmark = await getBenchmarkTemplate(benchmarkId, tenantId)

    if (!benchmark) {
      throw new Error(`Benchmark template not found with ID ${benchmarkId}`)
    }

    // Use OpenAI to compare the candidate to the benchmark
    const comparisonResult = await compareToBenchmark(candidateData, benchmark)

    // Save the evaluation results
    await saveEvaluationResults(candidateId, benchmarkId, tenantId, comparisonResult)

    return {
      candidateId,
      benchmarkId,
      benchmarkName: benchmark.name,
      overallScore: comparisonResult.overallScore,
      tier: comparisonResult.tier,
      categoryScores: comparisonResult.categoryScores,
      strengths: comparisonResult.strengths,
      developmentAreas: comparisonResult.developmentAreas,
      matchDetails: comparisonResult.matchDetails,
    }
  } catch (error) {
    console.error('Error evaluating candidate:', error)
    throw error
  }
}

/**
 * Save evaluation results
 * @param candidateId The ID of the candidate
 * @param benchmarkId The ID of the benchmark
 * @param tenantId The ID of the tenant
 * @param results The evaluation results
 */
async function saveEvaluationResults(
  candidateId: string,
  benchmarkId: string,
  tenantId: string,
  results: any,
): Promise<void> {
  try {
    // Update the candidate enrichment record with the benchmark results
    const query = `
      UPDATE candidate_enrichments
      SET
        benchmark_scores = $4,
        overall_score = $5,
        tier = $6,
        strengths = $7,
        development_areas = $8,
        updated_at = NOW()
      WHERE candidate_id = $1 AND tenant_id = $2
    `

    // Format the benchmark scores
    const benchmarkScores = {
      technicalSkills: results.categoryScores.technicalSkills,
      domainExpertise: results.categoryScores.domainExpertise,
      culturalFit: results.categoryScores.culturalFit,
      leadershipCapability: results.categoryScores.leadershipCapability,
      communicationSkills: results.categoryScores.communicationSkills,
      problemSolving: results.categoryScores.problemSolving,
      adaptability: results.categoryScores.adaptability,
      lastBenchmarked: new Date(),
      benchmarkTemplateId: benchmarkId,
    }

    await db.query(query, [
      candidateId,
      tenantId,
      benchmarkId,
      JSON.stringify(benchmarkScores),
      results.overallScore,
      results.tier,
      results.strengths,
      results.developmentAreas,
    ])

    // Log the data access
    await logBenchmarkEvaluation(candidateId, benchmarkId, tenantId)
  } catch (error) {
    console.error('Error saving evaluation results:', error)
    throw error
  }
}

/**
 * Log a benchmark evaluation
 * @param candidateId The ID of the candidate
 * @param benchmarkId The ID of the benchmark
 * @param tenantId The ID of the tenant
 */
async function logBenchmarkEvaluation(
  candidateId: string,
  benchmarkId: string,
  tenantId: string,
): Promise<void> {
  try {
    const query = `
      INSERT INTO data_access_logs (
        candidate_id,
        user_id,
        tenant_id,
        access_reason,
        access_type
      )
      VALUES ($1, $2, $3, $4, $5)
    `

    // Use a system user ID for automated evaluations
    const systemUserId = '00000000-0000-0000-0000-000000000000'

    await db.query(query, [
      candidateId,
      systemUserId,
      tenantId,
      `Benchmark evaluation against template ${benchmarkId}`,
      'score',
    ])
  } catch (error) {
    console.error('Error logging benchmark evaluation:', error)
    // Don't throw the error, as this is a non-critical operation
  }
}

/**
 * Map a database row to a BenchmarkTemplate object
 * @param row The database row
 * @returns The BenchmarkTemplate object
 */
function mapRowToBenchmarkTemplate(row: any): BenchmarkTemplate {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    skillWeights: row.skill_weights,
    experienceWeights: row.experience_weights,
    scoringRules: row.scoring_rules,
    industry: row.industry,
    jobLevel: row.job_level,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default {
  getBenchmarkTemplates,
  getBenchmarkTemplate,
  createBenchmarkTemplate,
  updateBenchmarkTemplate,
  deleteBenchmarkTemplate,
  evaluateCandidate,
}
