# JobAdder Webhook Integration

This document explains how to set up and use the JobAdder webhook integration for real-time job synchronization.

## Overview

The JobAdder webhook integration allows for real-time updates when jobs are created, updated, or deleted in JobAdder. This ensures that your job board always displays the most up-to-date information without relying solely on periodic synchronization.

## Features

- **Real-time updates**: Jobs appear on your site immediately after being created in JobAdder
- **Secure webhook handling**: Includes signature verification to ensure webhooks are from JobAdder
- **Automatic registration**: Webhooks are automatically registered when a tenant connects to JobAdder
- **Comprehensive logging**: All webhook events are logged for debugging and auditing
- **Error handling**: Robust error handling with appropriate HTTP responses

## Setup Instructions

### 1. Environment Configuration

Add the following variables to your `.env` file:

```
# JobAdder Integration
JOBADDER_CLIENT_ID=your_jobadder_client_id
JOBADDER_CLIENT_SECRET=your_jobadder_client_secret
JOBADDER_WEBHOOK_SECRET=your_jobadder_webhook_secret

# Frontend URL (must be publicly accessible for webhooks)
NEXT_PUBLIC_API_URL=https://your-domain.com

# Logging
LOG_LEVEL=info
DEBUG=jobadder:*,webhook:*,oauth:*
```

### 2. Webhook Endpoint

The webhook endpoint is available at:

```
POST /api/webhooks/jobadder
```

This endpoint is automatically configured in the Next.js API routes.

### 3. Webhook Registration

Webhooks are automatically registered when:

1. A tenant connects their JobAdder account
2. The OAuth flow completes successfully

You can also manually register webhooks for a tenant using the JobAdder integration:

```typescript
import { jobAdderIntegration } from '@/plugins/ats/integrations/jobAdder';

// Register webhook for a tenant
await jobAdderIntegration.registerWebhook(accessToken, tenantId);
```

### 4. Security

The webhook implementation includes several security measures:

1. **Signature Verification**: Each webhook request is verified using HMAC-SHA256 signatures
2. **Tenant Validation**: Ensures the tenant exists before processing the webhook
3. **Authentication**: Verifies the tenant has valid JobAdder credentials
4. **Error Handling**: Prevents exposure of internal errors to external parties

## Webhook Events

The integration handles the following webhook events:

| Event | Description | Action |
|-------|-------------|--------|
| `job.created` | A new job was created in JobAdder | Creates a new job in the platform |
| `job.updated` | An existing job was updated in JobAdder | Updates the corresponding job in the platform |
| `job.deleted` | A job was deleted in JobAdder | Marks the job as closed in the platform |

## Testing

You can test the webhook integration using the included test suite:

```bash
npm test -- --testPathPattern=src/app/api/webhooks/jobadder/__tests__/route.test.ts
```

Or manually using a tool like Postman or curl:

```bash
curl -X POST https://your-domain.com/api/webhooks/jobadder \
  -H "Content-Type: application/json" \
  -H "X-JobAdder-Signature: <signature>" \
  -d '{
    "event": "job.created",
    "data": { "id": "job-123" },
    "metadata": { "tenantId": "tenant-123" },
    "timestamp": "2025-05-18T03:20:00Z",
    "webhookId": "webhook-123"
  }'
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Ensure your `NEXT_PUBLIC_API_URL` is publicly accessible
   - Check that the webhook is registered in JobAdder
   - Verify the tenant has valid JobAdder credentials

2. **Invalid signature errors**
   - Ensure `JOBADDER_WEBHOOK_SECRET` matches the secret used when registering the webhook
   - Check that the webhook payload hasn't been modified in transit

3. **Job not updating**
   - Verify the tenant ID in the webhook matches a valid tenant
   - Check that the job ID exists in JobAdder
   - Ensure the tenant has permission to access the job

### Logging

Enable detailed logging by setting:

```
LOG_LEVEL=debug
DEBUG=jobadder:*,webhook:*
```

Logs include:
- Webhook receipt confirmation
- Signature verification results
- Job processing steps
- Error details

## Implementation Details

The webhook implementation consists of:

1. **Route Handler** (`src/app/api/webhooks/jobadder/route.ts`): Receives and validates webhook requests
2. **Webhook Handler** (`src/plugins/ats/integrations/jobAdder/webhook.ts`): Processes webhook events
3. **Job Transformer** (`src/plugins/ats/integrations/jobAdder/transform.ts`): Maps JobAdder jobs to platform format

The implementation follows best practices for webhook handling:
- Responds quickly to webhook requests (async processing)
- Verifies webhook authenticity
- Handles idempotency (same job updated multiple times)
- Provides appropriate HTTP status codes
- Logs all events for debugging