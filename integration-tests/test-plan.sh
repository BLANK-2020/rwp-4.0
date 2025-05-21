#!/bin/bash

# Test Database Connection
echo "Testing database connection..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URI
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Database connection successful');
  pool.end();
});
"

# Test JobAdder Integration
echo "Testing JobAdder OAuth flow..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/oauth/jobadder/authorize

# Test Event Tracking
echo "Testing event tracking..."
curl -X POST http://localhost:3000/api/events/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "job_viewed",
    "jobId": "test-job-1",
    "sessionId": "test-session",
    "utmParams": {
      "source": "test"
    }
  }'

# Test Analytics API
echo "Testing analytics endpoints..."
curl -s http://localhost:3000/api/analytics/data

# Test Privacy Controls
echo "Testing privacy endpoints..."
curl -X POST http://localhost:3000/api/events/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "data_access_requested",
    "metadata": {
      "candidateId": "test-candidate",
      "privacyAction": "data_access"
    }
  }'
