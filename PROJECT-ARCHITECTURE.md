# Recruitment Web Platform (RWP) 4.0 - Project Architecture

## Overview

The Recruitment Web Platform (RWP) 4.0 is a comprehensive solution for recruitment agencies, designed to streamline the recruitment process, enhance candidate experience, and provide valuable analytics. The platform is built using a microservices architecture with a monorepo structure, allowing for modular development and deployment.

## Repository Structure

The project is organized as a monorepo with multiple packages, each responsible for a specific domain of functionality:

```
RWP 4.0/
├── rwp-core/            # Core infrastructure and shared functionality
├── rwp-jobboard/        # Public-facing job board
├── rwp-jobadder/        # JobAdder ATS integration
├── rwp-events/          # Event tracking system
├── rwp-analytics/       # Analytics and reporting
├── rwp-ai-enrichment/   # AI-powered data enrichment
├── rwp-retargeting/     # Candidate retargeting
└── rwp-tenants/         # Multi-tenant management
```

## Package Descriptions

### rwp-core

**Purpose**: Provides the core infrastructure and shared functionality for the entire platform.

**Key Features**:
- Payload CMS integration for content management
- Database models and schemas
- Authentication and authorization
- Shared utilities and components
- API endpoints for core functionality

**Technologies**:
- Next.js
- Payload CMS
- PostgreSQL
- TypeScript

### rwp-jobboard

**Purpose**: Delivers a public-facing job board for candidates to search and apply for jobs.

**Key Features**:
- Job search and filtering
- Job detail pages
- Application forms
- Sector/category browsing
- Mobile-responsive design

**Technologies**:
- Next.js
- React
- TypeScript
- CSS Modules

### rwp-jobadder

**Purpose**: Integrates with the JobAdder Applicant Tracking System (ATS) to sync jobs and candidates.

**Key Features**:
- OAuth authentication with JobAdder
- Job synchronization
- Candidate data synchronization
- Webhook handling for real-time updates
- Error handling and retry mechanisms

**Technologies**:
- Node.js
- Axios for API calls
- TypeScript
- JWT for authentication

### rwp-events

**Purpose**: Tracks user events and interactions across the platform for analytics and personalization.

**Key Features**:
- Event tracking API
- Event storage and processing
- Real-time event streaming
- Privacy-compliant data collection

**Technologies**:
- Node.js
- TypeScript
- PostgreSQL for event storage
- Redis for event streaming

### rwp-analytics

**Purpose**: Provides analytics and reporting on platform usage, job performance, and candidate behavior.

**Key Features**:
- Dashboard for recruitment metrics
- Job performance analytics
- Candidate source tracking
- A/B testing results
- Custom report generation

**Technologies**:
- React for dashboards
- Chart.js for visualizations
- TypeScript
- PostgreSQL for data storage

### rwp-ai-enrichment

**Purpose**: Uses AI to enrich candidate data, improve job matching, and provide insights.

**Key Features**:
- CV parsing and analysis
- Skill extraction and categorization
- Job-candidate matching algorithms
- Sentiment analysis of candidate communications
- Automated candidate scoring

**Technologies**:
- OpenAI API
- LangChain
- Vector databases (Pinecone)
- Node.js
- TypeScript

### rwp-retargeting

**Purpose**: Manages candidate retargeting campaigns and A/B testing for job listings.

**Key Features**:
- A/B testing framework for job descriptions
- Pixel tracking for retargeting
- Campaign management
- Conversion tracking
- Integration with marketing platforms

**Technologies**:
- React
- TypeScript
- A/B testing libraries
- Pixel tracking implementation

### rwp-tenants

**Purpose**: Manages multi-tenant functionality, allowing the platform to serve multiple recruitment agencies.

**Key Features**:
- Tenant configuration and management
- Tenant-specific branding and customization
- Tenant isolation and security
- Tenant billing and subscription management

**Technologies**:
- Next.js
- React
- TypeScript
- PostgreSQL for tenant data

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   rwp-jobboard  │◄────┤    rwp-core     │────►│  rwp-analytics  │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         │                       │                       │
┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐
│                 │     │                 │     │                 │
│   rwp-events    │◄────┤   rwp-tenants   │────►│rwp-ai-enrichment│
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         │                       │                       │
┌────────▼────────┐     ┌────────▼────────┐
│                 │     │                 │
│ rwp-retargeting │     │  rwp-jobadder   │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

## Data Flow

1. **Job Synchronization**:
   - JobAdder API → rwp-jobadder → rwp-core → rwp-jobboard

2. **Candidate Application**:
   - rwp-jobboard → rwp-core → rwp-jobadder → JobAdder API

3. **Event Tracking**:
   - User Interaction → rwp-events → rwp-analytics

4. **Candidate Enrichment**:
   - Candidate Data → rwp-ai-enrichment → rwp-core

5. **Retargeting**:
   - User Behavior → rwp-events → rwp-retargeting → Marketing Platforms

## Development Workflow

The project uses npm workspaces to manage dependencies between packages. This allows for:

1. Shared dependencies across packages
2. Local package references without publishing to npm
3. Running commands across all packages or specific packages
4. Simplified development workflow

To set up the development environment, run:

```bash
./setup-workspace.sh
```

This will install all dependencies and build all packages.

## Deployment

The platform can be deployed in several ways:

1. **Monolithic Deployment**: All packages deployed together
2. **Microservices Deployment**: Each package deployed separately
3. **Hybrid Deployment**: Core packages deployed together, specialized packages deployed separately

Deployment scripts are provided in the root directory:

- `deploy.sh`: General deployment script
- `deploy-to-digitalocean.sh`: DigitalOcean-specific deployment
- `deploy-to-digitalocean-direct.sh`: Direct deployment to DigitalOcean

## Conclusion

The RWP 4.0 architecture provides a flexible, scalable, and maintainable platform for recruitment agencies. By separating concerns into distinct packages, the platform can evolve and scale independently in different areas while maintaining a cohesive user experience.