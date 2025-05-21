# JobAdder Candidate Enrichment Integration

This document provides information about the JobAdder candidate enrichment integration, which extends the existing JobAdder ATS integration to support candidate data enrichment as outlined in Phase 1 of the development roadmap.

## Overview

The JobAdder candidate enrichment integration allows for:

1. Fetching detailed candidate data from JobAdder
2. Transforming and enriching candidate profiles with AI-powered insights
3. Storing candidate data in a privacy-compliant manner
4. Integrating with the analytics database for advanced reporting

## Setup

### Database Setup

Before using the candidate enrichment features, you need to set up the required database tables:

```bash
# Run the database setup script
npm run setup:candidate-db
```

This will create the following tables in the analytics database:

- `candidate_enrichment` - Stores enriched candidate data
- `candidate_enrichment_queue` - Manages the queue for candidate enrichment processing
- `candidate_data_access_log` - Logs all access to candidate data for compliance
- `benchmark_templates` - Stores benchmark templates for candidate evaluation

### Configuration

Ensure the following environment variables are set:

```
# Database connection
DATABASE_URI=postgresql://username:password@localhost:5432/database
ANALYTICS_DATABASE_URI=postgresql://username:password@localhost:5432/analytics

# JobAdder API credentials
JOBADDER_CLIENT_ID=your_client_id
JOBADDER_CLIENT_SECRET=your_client_secret
JOBADDER_WEBHOOK_SECRET=your_webhook_secret
```

## Features

### Candidate Data Retrieval

The integration extends the JobAdder client with new methods for fetching detailed candidate data:

- `getCandidates()` - Fetch a list of candidates
- `getCandidate(id)` - Fetch a specific candidate's details
- `getCandidateResume(id)` - Fetch a candidate's resume
- `getCandidateExperiences(id)` - Fetch a candidate's work experiences
- `getCandidateEducation(id)` - Fetch a candidate's education history
- `getCandidatePlacements(id)` - Fetch a candidate's placement history

### Data Transformation

The integration includes transformation logic to convert JobAdder candidate data into a format suitable for AI enrichment:

- Skills extraction from resume text
- Experience structuring and categorization
- Education formatting and validation
- Privacy-compliant data handling

### Synchronization

The integration provides both manual and automated synchronization options:

- `syncCandidates()` - Manually sync candidates from JobAdder
- `initialCandidateSync()` - Initial sync after OAuth connection
- `scheduledCandidateSync()` - Periodic sync via cron job

### Webhook Integration

The integration supports real-time updates via webhooks:

- Candidate created events
- Candidate updated events
- Candidate deleted events

### Privacy Compliance

The integration includes privacy-compliant data handling:

- Consent management
- Data access logging
- Data retention policies
- Data masking for sensitive information

## Usage Examples

### Manually Sync Candidates

```javascript
import { jobAdderIntegration } from '@/plugins/ats/integrations/jobAdder';

// Create a JobAdder client
const client = new JobAdderClient({
  clientId: process.env.JOBADDER_CLIENT_ID,
  clientSecret: process.env.JOBADDER_CLIENT_SECRET,
  accessToken: 'your_access_token',
  refreshToken: 'your_refresh_token',
});

// Sync candidates for a tenant
const stats = await jobAdderIntegration.syncCandidates(client, tenantId, {
  updatedSince: '2025-01-01T00:00:00Z', // Optional filter
  enrichmentEnabled: true, // Enable AI enrichment
});

console.log(`Synced ${stats.total} candidates`);
```

### Access Candidate Data

```javascript
import payload from 'payload';

// Find candidates
const candidates = await payload.find({
  collection: 'candidates',
  where: {
    'skills': {
      contains: 'JavaScript',
    },
  },
});

// Get a specific candidate
const candidate = await payload.findByID({
  collection: 'candidates',
  id: 'candidate_id',
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure the `DATABASE_URI` and `ANALYTICS_DATABASE_URI` environment variables are correctly set
   - Verify that the PostgreSQL server is running and accessible

2. **API Rate Limiting**
   - The JobAdder API has rate limits. The client includes retry logic with exponential backoff
   - For large syncs, consider using the `limit` parameter to process candidates in batches

3. **Webhook Issues**
   - Verify that the webhook URL is publicly accessible
   - Check that the `JOBADDER_WEBHOOK_SECRET` is correctly set
   - Review webhook logs for any errors

## Architecture

The candidate enrichment integration follows a modular architecture:

- `client.ts` - API client for JobAdder
- `transform.ts` - Data transformation logic
- `sync.ts` - Synchronization operations
- `webhook.ts` - Webhook handling
- `cron.ts` - Scheduled tasks
- `types.ts` - TypeScript type definitions

## Future Enhancements

Planned enhancements for future phases:

1. Advanced AI enrichment with machine learning models
2. Candidate matching algorithms
3. Predictive analytics for hiring outcomes
4. Integration with additional data sources