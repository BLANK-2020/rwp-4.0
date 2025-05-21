# Recruitment Platform 4.1

A modular, multi-tenant SaaS platform designed for recruitment agencies. This platform provides custom domain routing, hybrid job board functionality, JobAdder integration, and retargeting infrastructure.

## Features

- **Multi-tenant Architecture**: Isolate data between different recruitment agencies
- **Custom Domain Routing**: Allow agencies to use their own domains
- **Hybrid Job Board**: Advanced job board with sectors, search, and filtering
- **JobAdder Integration**: Sync jobs from JobAdder ATS
- **Stripe Billing**: Subscription management for tenants
- **Marketing Pixels**: Tenant-specific marketing pixel integration
- **Retargeting Infrastructure**: Track user interactions and trigger retargeting campaigns
- **Analytics Dashboard**: Visualize job board performance metrics

## Quick Start

To spin up this project locally, follow these steps:

### Prerequisites

- Node.js 18+
- PostgreSQL database
- JobAdder API credentials (for JobAdder integration)
- Stripe API credentials (for billing)
- Marketing pixel IDs (for retargeting)

### Development

1. Clone the repository
2. Copy the environment variables: `cp .env.example .env`
3. Update the `.env` file with your credentials:
   - `DATABASE_URI`: PostgreSQL connection string
   - `JOBADDER_CLIENT_ID` and `JOBADDER_CLIENT_SECRET`: JobAdder OAuth credentials
   - `STRIPE_SECRET_KEY` and other Stripe variables (if using Stripe)
4. Install dependencies: `npm install`
5. Start the development server: `npm run dev`
6. Open `http://localhost:3000` in your browser

### Docker (Optional)

If you prefer to use Docker for local development, you can use the provided docker-compose.yml file:

```bash
docker-compose up
```

## Multi-tenant Architecture

The platform is designed to support multiple recruitment agencies (tenants) with complete data isolation:

- Each tenant has their own branding, jobs, and users
- Custom domain routing allows tenants to use their own domains
- JWT authentication includes tenant scoping for security
- Tenant-specific marketing pixel configuration

## Hybrid Job Board

The platform includes a comprehensive job board with advanced features:

### Features

- **Job Listings**: Display jobs with filtering and pagination
- **Sector Browsing**: Browse jobs by industry sector
- **Advanced Search**: Search jobs by keyword, location, and more
- **Featured Jobs**: Highlight premium job listings
- **SEO Optimization**: SEO-friendly URLs and metadata
- **Responsive Design**: Mobile-friendly job board

### Components

- **Job Card**: Display job summary information
- **Job Detail Page**: Show comprehensive job information
- **Sector Pages**: Browse jobs by industry sector
- **Search Page**: Advanced job search functionality

## Retargeting Infrastructure

The platform includes a comprehensive retargeting infrastructure:

### Features

- **Event Tracking**: Track job views, apply starts, and apply completions
- **Marketing Pixels**: Integration with Facebook Pixel, LinkedIn Insight Tag, and Google Tag Manager
- **Consent Management**: GDPR-compliant consent banner for tracking
- **Abandoned Application Detection**: Identify and retarget users who abandon applications
- **Analytics Dashboard**: Visualize tracking data and conversion metrics

### Components

- **Consent Banner**: Allow users to manage tracking preferences
- **Event Tracking API**: Record user interactions with jobs
- **Marketing Pixels**: Conditionally load marketing pixels based on consent
- **Abandoned Application Detection**: Scheduled task to detect abandoned applications

## JobAdder Integration

The platform includes a complete JobAdder integration for syncing jobs:

### Setup

1. Register an application in the JobAdder Developer Portal
2. Add the OAuth credentials to your `.env` file
3. Enable the JobAdder feature for a tenant in the admin panel

### Features

- **OAuth Authentication**: Secure connection to JobAdder
- **Webhook Integration**: Real-time job updates
- **Scheduled Sync**: Periodic job synchronization
- **Manual Sync**: Trigger job sync manually

### API Endpoints

- `GET /api/oauth/jobadder/authorize`: Initiate OAuth flow
- `GET /api/oauth/jobadder/callback`: Handle OAuth callback
- `POST /api/webhooks/jobadder`: Receive webhook events
- `POST /api/jobs/sync`: Manually trigger job sync

## Custom Domain Setup

To set up a custom domain for a tenant:

1. Add the domain in the tenant settings in the admin panel
2. Configure DNS settings to point to your application
3. (Optional) Set up SSL certificates for the domain

## Marketing Pixel Setup

To set up marketing pixels for a tenant:

1. Enable the Marketing Pixels feature for the tenant in the admin panel
2. Configure the pixel IDs in the tenant's marketing configuration
3. The pixels will be automatically loaded on the tenant's job board based on user consent

## Environment Variables

See `.env.example` for all required environment variables.

## API Documentation

The API documentation is available at `/api/docs` when running in development mode.

## Regenerating Types

If you make changes to the collection schemas, you'll need to regenerate the TypeScript types:

```bash
npm run generate:types
```

This will update the `src/payload-types.ts` file with the latest types based on your collection schemas.

## Questions

If you have any issues or questions, please reach out to the development team.
