/**
 * Database Connection Module
 *
 * This module provides a connection to the PostgreSQL database for the AI enrichment service.
 */

import { Pool } from 'pg'

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || '',
})

/**
 * Execute a database query
 * @param text The SQL query text
 * @param params The query parameters
 * @returns The query result
 */
export async function query(text: string, params?: any[]) {
  try {
    const start = Date.now()
    const result = await pool.query(text, params)
    const duration = Date.now() - start

    console.log('Executed query', {
      text,
      duration,
      rows: result.rowCount,
    })

    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

/**
 * Initialize the database schema for AI enrichment
 */
export async function initializeSchema() {
  try {
    // Create the candidate_enrichments table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS candidate_enrichments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID NOT NULL,
        tenant_id UUID NOT NULL,
        ai_enrichment JSONB NOT NULL,
        benchmark_scores JSONB,
        overall_score FLOAT,
        tier VARCHAR(50),
        strengths TEXT[],
        development_areas TEXT[],
        matching_metrics JSONB,
        data_usage_consent BOOLEAN DEFAULT false,
        data_retention_date TIMESTAMP WITH TIME ZONE,
        data_sharing_preferences JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(candidate_id, tenant_id)
      )
    `)

    // Create the benchmark_templates table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS benchmark_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        skill_weights JSONB NOT NULL,
        experience_weights JSONB NOT NULL,
        scoring_rules JSONB NOT NULL,
        industry VARCHAR(255),
        job_level VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create the data_access_logs table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS data_access_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID NOT NULL,
        user_id UUID NOT NULL,
        tenant_id UUID NOT NULL,
        access_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        access_reason TEXT,
        access_type VARCHAR(50) NOT NULL
      )
    `)

    console.log('Database schema initialized successfully')
  } catch (error) {
    console.error('Error initializing database schema:', error)
    throw error
  }
}

/**
 * Close the database connection pool
 */
export async function closePool() {
  await pool.end()
}

export default {
  query,
  initializeSchema,
  closePool,
}
