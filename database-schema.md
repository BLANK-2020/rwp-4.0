# Database Schema for AI Analytics Platform

## Core Tables (Existing)

### jobs
```sql
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    type VARCHAR(50),
    status VARCHAR(50),
    tenant_id INTEGER REFERENCES tenants(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    ats_data JSONB
);
```

### tenants
```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    settings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## AI Enrichment Tables

### candidate_profiles
```sql
CREATE TABLE candidate_profiles (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255),
    tenant_id INTEGER REFERENCES tenants(id),
    raw_data JSONB,
    enriched_data JSONB,
    embeddings VECTOR(1536),
    talent_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_enriched_at TIMESTAMP,
    UNIQUE(tenant_id, external_id)
);
```

### job_profiles
```sql
CREATE TABLE job_profiles (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    enriched_data JSONB,
    embeddings VECTOR(1536),
    benchmark_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_enriched_at TIMESTAMP
);
```

### benchmark_templates
```sql
CREATE TABLE benchmark_templates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rules JSONB,
    weights JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### talent_scores
```sql
CREATE TABLE talent_scores (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidate_profiles(id),
    job_id INTEGER REFERENCES jobs(id),
    template_id INTEGER REFERENCES benchmark_templates(id),
    score FLOAT,
    breakdown JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Analytics Tables

### events
```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    data JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);
```

### metrics
```sql
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    metric_type VARCHAR(50) NOT NULL,
    dimension VARCHAR(50),
    value FLOAT,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### metric_aggregations
```sql
CREATE TABLE metric_aggregations (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    metric_type VARCHAR(50) NOT NULL,
    dimension VARCHAR(50),
    period VARCHAR(20),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    value FLOAT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Reporting Tables

### report_templates
```sql
CREATE TABLE report_templates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### report_schedules
```sql
CREATE TABLE report_schedules (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    template_id INTEGER REFERENCES report_templates(id),
    frequency VARCHAR(50),
    config JSONB,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### generated_reports
```sql
CREATE TABLE generated_reports (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    template_id INTEGER REFERENCES report_templates(id),
    schedule_id INTEGER REFERENCES report_schedules(id),
    status VARCHAR(50),
    data JSONB,
    metadata JSONB,
    file_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_jobs_tenant ON jobs(tenant_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_candidate_profiles_tenant ON candidate_profiles(tenant_id);
CREATE INDEX idx_events_tenant_type ON events(tenant_id, event_type);
CREATE INDEX idx_metrics_tenant_type ON metrics(tenant_id, metric_type);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp);

-- Full text search
CREATE INDEX idx_jobs_search ON jobs USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_candidate_profiles_search ON candidate_profiles USING gin((raw_data || enriched_data));

-- Vector similarity search
CREATE INDEX idx_candidate_embeddings ON candidate_profiles USING ivfflat (embeddings vector_cosine_ops);
CREATE INDEX idx_job_embeddings ON job_profiles USING ivfflat (embeddings vector_cosine_ops);
```

## Views

### analytics_summary
```sql
CREATE VIEW analytics_summary AS
SELECT 
    tenant_id,
    metric_type,
    dimension,
    date_trunc('day', timestamp) as day,
    COUNT(*) as count,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value
FROM metrics
GROUP BY tenant_id, metric_type, dimension, date_trunc('day', timestamp);
```

### talent_pool_summary
```sql
CREATE VIEW talent_pool_summary AS
SELECT 
    cp.tenant_id,
    COUNT(*) as total_candidates,
    AVG(cp.talent_score) as avg_talent_score,
    COUNT(DISTINCT ts.job_id) as matched_jobs
FROM candidate_profiles cp
LEFT JOIN talent_scores ts ON cp.id = ts.candidate_id
GROUP BY cp.tenant_id;
```

## Functions

### update_embeddings
```sql
CREATE OR REPLACE FUNCTION update_embeddings()
RETURNS void AS $$
BEGIN
    -- Update job embeddings
    UPDATE job_profiles
    SET 
        embeddings = compute_embeddings(enriched_data),
        updated_at = NOW()
    WHERE updated_at < last_enriched_at;

    -- Update candidate embeddings
    UPDATE candidate_profiles
    SET 
        embeddings = compute_embeddings(enriched_data),
        updated_at = NOW()
    WHERE updated_at < last_enriched_at;
END;
$$ LANGUAGE plpgsql;
```

### aggregate_metrics
```sql
CREATE OR REPLACE FUNCTION aggregate_metrics(
    p_tenant_id INTEGER,
    p_period VARCHAR,
    p_start_time TIMESTAMP,
    p_end_time TIMESTAMP
)
RETURNS TABLE (
    metric_type VARCHAR,
    dimension VARCHAR,
    value FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.metric_type,
        m.dimension,
        AVG(m.value) as value
    FROM metrics m
    WHERE 
        m.tenant_id = p_tenant_id
        AND m.timestamp BETWEEN p_start_time AND p_end_time
    GROUP BY m.metric_type, m.dimension;
END;
$$ LANGUAGE plpgsql;
```

## Extensions

```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
```

## Notes

1. **Vector Storage**
   - Using pgvector for embedding storage
   - 1536-dimensional vectors for GPT-4 compatibility
   - IVFFlat index for efficient similarity search

2. **JSON Storage**
   - Using JSONB for flexible data storage
   - Indexed for performance
   - Structured for easy querying

3. **Partitioning**
   - Consider partitioning events and metrics tables by tenant_id
   - Implement time-based partitioning for large tables
   - Use declarative partitioning

4. **Maintenance**
   - Regular VACUUM ANALYZE for statistics
   - Monitor index usage
   - Implement data retention policies

5. **Security**
   - Row-level security for multi-tenant data
   - Encrypted sensitive data
   - Audit logging