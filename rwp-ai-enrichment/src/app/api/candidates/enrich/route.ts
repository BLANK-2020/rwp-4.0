/**
 * Candidate Enrichment API Endpoint
 *
 * This endpoint processes and enriches candidate data with AI-derived insights.
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseCvFromUrl, parseCvText } from '@/services/cvParser'
import { analyzeCandidateProfile } from '@/lib/openai'
import * as db from '@/lib/db'
import { EnrichCandidateRequest, EnrichCandidateResponse } from '@/lib/types'

/**
 * Process a request to enrich a candidate profile
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: EnrichCandidateRequest = await request.json()

    // Validate the request
    if (!body.candidateId || !body.tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateId, tenantId' },
        { status: 400 },
      )
    }

    // Check if data usage consent is provided
    if (body.dataUsageConsent !== true) {
      return NextResponse.json(
        { error: 'Data usage consent is required for AI enrichment' },
        { status: 400 },
      )
    }

    // Extract resume data
    let resumeData
    if (body.resumeUrl) {
      // Parse the resume from the URL
      resumeData = await parseCvFromUrl(body.resumeUrl)
    } else if (body.resumeText) {
      // Parse the resume text
      resumeData = await parseCvText(body.resumeText)
    } else if (body.candidateData) {
      // Use the provided candidate data
      resumeData = body.candidateData
    } else {
      return NextResponse.json(
        {
          error:
            'No candidate data provided. Please provide resumeUrl, resumeText, or candidateData',
        },
        { status: 400 },
      )
    }

    // Analyze the candidate profile
    const aiEnrichment = await analyzeCandidateProfile(resumeData)

    // Save the enrichment data to the database
    const enrichmentId = await saveEnrichmentData(
      body.candidateId,
      body.tenantId,
      aiEnrichment,
      body.dataUsageConsent,
    )

    // Prepare the response
    const response: EnrichCandidateResponse = {
      enrichmentId,
      candidateId: body.candidateId,
      status: 'success',
      enrichmentData: {
        aiEnrichment,
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error enriching candidate:', error)

    return NextResponse.json(
      {
        status: 'failed',
        error: error.message || 'An error occurred while enriching the candidate',
      },
      { status: 500 },
    )
  }
}

/**
 * Save enrichment data to the database
 * @param candidateId The ID of the candidate
 * @param tenantId The ID of the tenant
 * @param aiEnrichment The AI enrichment data
 * @param dataUsageConsent Whether the candidate has consented to data usage
 * @returns The ID of the created or updated enrichment record
 */
async function saveEnrichmentData(
  candidateId: string,
  tenantId: string,
  aiEnrichment: any,
  dataUsageConsent: boolean,
): Promise<string> {
  try {
    // Check if an enrichment record already exists for this candidate
    const checkQuery = `
      SELECT id FROM candidate_enrichments
      WHERE candidate_id = $1 AND tenant_id = $2
    `
    const checkResult = await db.query(checkQuery, [candidateId, tenantId])

    if (checkResult.rows.length > 0) {
      // Update the existing record
      const updateQuery = `
        UPDATE candidate_enrichments
        SET
          ai_enrichment = $3,
          data_usage_consent = $4,
          updated_at = NOW()
        WHERE candidate_id = $1 AND tenant_id = $2
        RETURNING id
      `

      const updateResult = await db.query(updateQuery, [
        candidateId,
        tenantId,
        JSON.stringify(aiEnrichment),
        dataUsageConsent,
      ])

      return updateResult.rows[0].id
    } else {
      // Create a new record
      const insertQuery = `
        INSERT INTO candidate_enrichments (
          candidate_id,
          tenant_id,
          ai_enrichment,
          data_usage_consent,
          data_retention_date
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `

      // Set data retention date to 1 year from now
      const dataRetentionDate = new Date()
      dataRetentionDate.setFullYear(dataRetentionDate.getFullYear() + 1)

      const insertResult = await db.query(insertQuery, [
        candidateId,
        tenantId,
        JSON.stringify(aiEnrichment),
        dataUsageConsent,
        dataRetentionDate,
      ])

      return insertResult.rows[0].id
    }
  } catch (error) {
    console.error('Error saving enrichment data:', error)
    throw error
  }
}
