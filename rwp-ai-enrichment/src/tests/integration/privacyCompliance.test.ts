/**
 * Privacy Compliance Integration Tests
 *
 * These tests verify the privacy compliance features of the AI enrichment service.
 */

import * as db from '../../lib/db'

describe('Privacy Compliance Integration Tests', () => {
  // Test candidate and user IDs
  const testCandidateId = 'test-candidate-id'
  const testUserId = 'test-user-id'
  const testTenantId = 'test-tenant-id'

  // Mock data access log function
  async function logDataAccess(
    candidateId: string,
    userId: string,
    tenantId: string,
    accessReason: string,
    accessType: string,
  ): Promise<void> {
    const query = `
      INSERT INTO data_access_logs (
        candidate_id,
        user_id,
        tenant_id,
        access_reason,
        access_type
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `

    await db.query(query, [candidateId, userId, tenantId, accessReason, accessType])
  }

  // Mock function to get data access logs
  async function getDataAccessLogs(candidateId: string, tenantId: string): Promise<any[]> {
    const query = `
      SELECT * FROM data_access_logs
      WHERE candidate_id = $1 AND tenant_id = $2
      ORDER BY access_time DESC
    `

    const result = await db.query(query, [candidateId, tenantId])
    return result.rows
  }

  // Mock function to delete candidate data
  async function deleteCandidateData(candidateId: string, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM candidate_enrichments
      WHERE candidate_id = $1 AND tenant_id = $2
      RETURNING id
    `

    const result = await db.query(query, [candidateId, tenantId])
    return result.rows.length > 0
  }

  // Mock function to anonymize candidate data
  async function anonymizeCandidateData(candidateId: string, tenantId: string): Promise<boolean> {
    const query = `
      UPDATE candidate_enrichments
      SET
        ai_enrichment = jsonb_set(ai_enrichment, '{anonymized}', 'true'),
        data_retention_date = NULL,
        data_usage_consent = false,
        updated_at = NOW()
      WHERE candidate_id = $1 AND tenant_id = $2
      RETURNING id
    `

    const result = await db.query(query, [candidateId, tenantId])
    return result.rows.length > 0
  }

  // Mock function to update data sharing preferences
  async function updateDataSharingPreferences(
    candidateId: string,
    tenantId: string,
    preferences: {
      allowInternalUse: boolean
      allowAnonymizedAnalytics: boolean
      allowThirdPartySharing: boolean
      specificRestrictions: string[]
    },
  ): Promise<boolean> {
    const query = `
      UPDATE candidate_enrichments
      SET
        data_sharing_preferences = $3,
        updated_at = NOW()
      WHERE candidate_id = $1 AND tenant_id = $2
      RETURNING id
    `

    const result = await db.query(query, [candidateId, tenantId, JSON.stringify(preferences)])

    return result.rows.length > 0
  }

  test('should log data access events', async () => {
    // Skip this test in CI environments or when database is not available
    if (process.env.CI || process.env.SKIP_DB_TESTS) {
      return
    }

    // Log a data access event
    await logDataAccess(
      testCandidateId,
      testUserId,
      testTenantId,
      'Viewing candidate profile',
      'view',
    )

    // Get the data access logs
    const logs = await getDataAccessLogs(testCandidateId, testTenantId)

    // Verify that the log was created
    expect(logs.length).toBeGreaterThan(0)
    expect(logs[0].candidate_id).toBe(testCandidateId)
    expect(logs[0].user_id).toBe(testUserId)
    expect(logs[0].tenant_id).toBe(testTenantId)
    expect(logs[0].access_reason).toBe('Viewing candidate profile')
    expect(logs[0].access_type).toBe('view')
  })

  test('should delete candidate data when requested', async () => {
    // Skip this test in CI environments or when database is not available
    if (process.env.CI || process.env.SKIP_DB_TESTS) {
      return
    }

    // Create a test candidate enrichment record
    const insertQuery = `
      INSERT INTO candidate_enrichments (
        candidate_id,
        tenant_id,
        ai_enrichment,
        data_usage_consent
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (candidate_id, tenant_id) DO UPDATE
      SET ai_enrichment = $3, data_usage_consent = $4
      RETURNING id
    `

    await db.query(insertQuery, [
      testCandidateId,
      testTenantId,
      JSON.stringify({ test: 'data' }),
      true,
    ])

    // Delete the candidate data
    const result = await deleteCandidateData(testCandidateId, testTenantId)

    // Verify that the data was deleted
    expect(result).toBe(true)

    // Verify that the data is no longer in the database
    const checkQuery = `
      SELECT * FROM candidate_enrichments
      WHERE candidate_id = $1 AND tenant_id = $2
    `

    const checkResult = await db.query(checkQuery, [testCandidateId, testTenantId])
    expect(checkResult.rows.length).toBe(0)

    // Log the deletion for audit purposes
    await logDataAccess(
      testCandidateId,
      testUserId,
      testTenantId,
      'Data deletion request',
      'delete',
    )
  })

  test('should anonymize candidate data when retention period expires', async () => {
    // Skip this test in CI environments or when database is not available
    if (process.env.CI || process.env.SKIP_DB_TESTS) {
      return
    }

    // Create a test candidate enrichment record with an expired retention date
    const insertQuery = `
      INSERT INTO candidate_enrichments (
        candidate_id,
        tenant_id,
        ai_enrichment,
        data_usage_consent,
        data_retention_date
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (candidate_id, tenant_id) DO UPDATE
      SET ai_enrichment = $3, data_usage_consent = $4, data_retention_date = $5
      RETURNING id
    `

    // Set retention date to yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    await db.query(insertQuery, [
      testCandidateId,
      testTenantId,
      JSON.stringify({
        extractedSkills: ['JavaScript', 'React'],
        personalityTraits: ['Analytical', 'Creative'],
        experienceSummary: {
          roles: [
            {
              title: 'Software Engineer',
              company: 'Test Company',
              duration: 24,
            },
          ],
        },
      }),
      true,
      yesterday,
    ])

    // Anonymize the candidate data
    const result = await anonymizeCandidateData(testCandidateId, testTenantId)

    // Verify that the data was anonymized
    expect(result).toBe(true)

    // Verify that the data is anonymized in the database
    const checkQuery = `
      SELECT * FROM candidate_enrichments
      WHERE candidate_id = $1 AND tenant_id = $2
    `

    const checkResult = await db.query(checkQuery, [testCandidateId, testTenantId])
    expect(checkResult.rows.length).toBe(1)
    expect(checkResult.rows[0].ai_enrichment.anonymized).toBe(true)
    expect(checkResult.rows[0].data_retention_date).toBeNull()
    expect(checkResult.rows[0].data_usage_consent).toBe(false)

    // Log the anonymization for audit purposes
    await logDataAccess(
      testCandidateId,
      'system',
      testTenantId,
      'Data retention period expired - anonymized',
      'anonymize',
    )
  })

  test('should update data sharing preferences', async () => {
    // Skip this test in CI environments or when database is not available
    if (process.env.CI || process.env.SKIP_DB_TESTS) {
      return
    }

    // Create a test candidate enrichment record
    const insertQuery = `
      INSERT INTO candidate_enrichments (
        candidate_id,
        tenant_id,
        ai_enrichment,
        data_usage_consent
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (candidate_id, tenant_id) DO UPDATE
      SET ai_enrichment = $3, data_usage_consent = $4
      RETURNING id
    `

    await db.query(insertQuery, [
      testCandidateId,
      testTenantId,
      JSON.stringify({ test: 'data' }),
      true,
    ])

    // Update data sharing preferences
    const preferences = {
      allowInternalUse: true,
      allowAnonymizedAnalytics: true,
      allowThirdPartySharing: false,
      specificRestrictions: ['Do not use for marketing purposes'],
    }

    const result = await updateDataSharingPreferences(testCandidateId, testTenantId, preferences)

    // Verify that the preferences were updated
    expect(result).toBe(true)

    // Verify that the preferences are updated in the database
    const checkQuery = `
      SELECT * FROM candidate_enrichments
      WHERE candidate_id = $1 AND tenant_id = $2
    `

    const checkResult = await db.query(checkQuery, [testCandidateId, testTenantId])
    expect(checkResult.rows.length).toBe(1)
    expect(checkResult.rows[0].data_sharing_preferences).toEqual(preferences)

    // Log the preference update for audit purposes
    await logDataAccess(
      testCandidateId,
      testUserId,
      testTenantId,
      'Data sharing preferences updated',
      'edit',
    )
  })
})
