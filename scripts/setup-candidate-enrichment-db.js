/**
 * Setup Candidate Enrichment Database Tables
 *
 * This script creates the necessary database tables for candidate enrichment
 * in the analytics database. It should be run once before using the candidate
 * enrichment features.
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.ANALYTICS_DATABASE_URI || process.env.DATABASE_URI || '',
  ssl: {
    rejectUnauthorized: false,
  },
})

async function createTables() {
  const client = await pool.connect()

  try {
    console.log('Creating candidate enrichment tables...')

    // Start a transaction
    await client.query('BEGIN')

    // Create candidate_enrichment table
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidate_enrichment (
        id SERIAL PRIMARY KEY,
        candidate_id VARCHAR(255) NOT NULL UNIQUE,
        source_id VARCHAR(255) NOT NULL,
        tenant_id INTEGER NOT NULL,
        
        -- AI Enrichment data
        extracted_skills JSONB,
        skill_categories JSONB,
        experience_summary JSONB,
        education_summary JSONB,
        personality_traits JSONB,
        communication_style VARCHAR(255),
        leadership_potential FLOAT,
        team_fit_metrics JSONB,
        last_enriched_at TIMESTAMP,
        enrichment_version VARCHAR(255),
        confidence_score FLOAT,
        
        -- Benchmark-related fields
        benchmark_scores JSONB,
        overall_score FLOAT,
        tier VARCHAR(50),
        strengths JSONB,
        development_areas JSONB,
        matching_metrics JSONB,
        
        -- Privacy and compliance fields
        data_usage_consent BOOLEAN DEFAULT false,
        data_retention_date TIMESTAMP,
        data_sharing_preferences JSONB,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_candidate_enrichment_tenant_id ON candidate_enrichment(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_candidate_enrichment_source_id ON candidate_enrichment(source_id);
    `)

    console.log('Created candidate_enrichment table')

    // Create candidate_enrichment_queue table
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidate_enrichment_queue (
        id SERIAL PRIMARY KEY,
        candidate_id VARCHAR(255) NOT NULL UNIQUE,
        source_id VARCHAR(255) NOT NULL,
        tenant_id INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        priority INTEGER DEFAULT 0,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT unique_candidate_in_queue UNIQUE (candidate_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_candidate_queue_status ON candidate_enrichment_queue(status);
      CREATE INDEX IF NOT EXISTS idx_candidate_queue_priority ON candidate_enrichment_queue(priority);
    `)

    console.log('Created candidate_enrichment_queue table')

    // Create candidate_data_access_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidate_data_access_log (
        id SERIAL PRIMARY KEY,
        candidate_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        access_type VARCHAR(50) NOT NULL,
        access_time TIMESTAMP DEFAULT NOW(),
        ip_address VARCHAR(50),
        access_reason TEXT,
        
        -- Metadata
        tenant_id INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_candidate_access_log_candidate_id ON candidate_data_access_log(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_candidate_access_log_tenant_id ON candidate_data_access_log(tenant_id);
    `)

    console.log('Created candidate_data_access_log table')

    // Create benchmark_templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS benchmark_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        
        -- Weighting configurations
        skill_weights JSONB,
        experience_weights JSONB,
        
        -- Scoring configuration
        scoring_rules JSONB,
        
        -- Metadata
        industry VARCHAR(255),
        job_level VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        
        -- Privacy and compliance fields
        created_by VARCHAR(255),
        tenant_id INTEGER NOT NULL,
        is_public BOOLEAN DEFAULT false,
        version_history JSONB
      );
      
      CREATE INDEX IF NOT EXISTS idx_benchmark_templates_tenant_id ON benchmark_templates(tenant_id);
    `)

    console.log('Created benchmark_templates table')

    // Commit the transaction
    await client.query('COMMIT')

    console.log('Successfully created all candidate enrichment tables')
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK')
    console.error('Error creating candidate enrichment tables:', error)
    throw error
  } finally {
    // Release the client back to the pool
    client.release()
  }
}

// Run the function
createTables()
  .then(() => {
    console.log('Database setup completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Database setup failed:', error)
    process.exit(1)
  })
