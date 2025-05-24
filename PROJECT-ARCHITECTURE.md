# Recruitment Web Platform (RWP) 4.0 - Project Architecture

## Overview

The Recruitment Web Platform (RWP) 4.0 is a comprehensive solution designed to streamline recruitment processes, enhance candidate experiences, and provide powerful analytics for recruitment agencies. The platform is built using a microservices architecture, with each service focused on a specific domain of functionality.

## Repository Structure

The project is organized into multiple repositories, each serving a specific purpose in the overall architecture:

### Main Repository (RWP 4.0)

The main repository serves as the central hub for the entire platform. It contains:

- Common configuration files
- Deployment scripts
- Documentation
- Core libraries and utilities
- Scripts for distributing shared code to sub-repositories

### Sub-Repositories

#### 1. rwp-core

**Purpose**: Provides the core infrastructure and shared functionality used by all other services.

**Key Components**:
- Payload CMS configuration
- Database adapters
- Authentication and authorization
- Shared utilities and formatters
- Core data models and collections

#### 2. rwp-jobboard

**Purpose**: Manages the public-facing job board where candidates can search and apply for jobs.

**Key Components**:
- Job listing pages
- Job search functionality
- Job filtering by sector, location, etc.
- Application forms
- SEO optimization for job listings

#### 3. rwp-jobadder

**Purpose**: Integrates with the JobAdder ATS (Applicant Tracking System) to sync job data.

**Key Components**:
- JobAdder API integration
- OAuth authentication
- Webhook handlers for real-time updates
- Job data transformation and normalization
- Candidate data synchronization

#### 4. rwp-events

**Purpose**: Tracks user interactions and events across the platform for analytics and personalization.

**Key Components**:
- Event tracking API
- Event storage and processing
- Integration with analytics services
- Real-time event streaming

#### 5. rwp-analytics

**Purpose**: Provides analytics and reporting capabilities for recruitment metrics.

**Key Components**:
- Dashboard visualizations
- Performance metrics
- Conversion tracking
- A/B testing analysis
- Custom report generation

#### 6. rwp-ai-enrichment

**Purpose**: Uses AI to enrich candidate and job data for better matching and insights.

**Key Components**:
- Resume parsing
- Skill extraction
- Job description analysis
- Candidate-job matching algorithms
- Automated candidate scoring

#### 7. rwp-retargeting

**Purpose**: Manages retargeting campaigns to re-engage candidates who have previously interacted with job listings.

**Key Components**:
- Retargeting pixel integration
- Campaign management
- A/B testing for job descriptions and apply buttons
- Conversion tracking

#### 8. rwp-tenants

**Purpose**: Manages multi-tenant functionality for supporting multiple recruitment agencies on the platform.

**Key Components**:
- Tenant configuration
- White-labeling
- Custom domain support
- Tenant-specific settings and branding

## Technical Architecture

### Frontend

- **Framework**: Next.js (App Router)
- **UI Components**: React
- **Styling**: CSS Modules / Tailwind CSS
- **State Management**: React Context / Redux

### Backend

- **CMS**: Payload CMS
- **API**: Next.js API Routes / Express
- **Database**: PostgreSQL
- **Authentication**: JWT / OAuth

### Infrastructure

- **Deployment**: Docker / Docker Compose
- **Hosting**: Digital Ocean
- **CI/CD**: GitHub Actions
- **Monitoring**: Pino logging

## Data Flow

1. **Job Data Flow**:
   - Jobs are created in JobAdder ATS
   - rwp-jobadder syncs job data via API or webhooks
   - Jobs are stored in the central database
   - rwp-jobboard displays jobs to candidates

2. **Candidate Application Flow**:
   - Candidates apply through rwp-jobboard
   - Application data is stored and enriched by rwp-ai-enrichment
   - Application is sent to JobAdder via rwp-jobadder
   - Events are tracked by rwp-events

3. **Analytics Flow**:
   - User interactions are tracked by rwp-events
   - Event data is processed by rwp-analytics
   - Insights are displayed in dashboards
   - Retargeting campaigns are optimized based on analytics

## Shared Code Management

The project uses a custom code-sharing approach:

1. Core files are defined in the main repository
2. The `distribute-files.sh` script copies these files to all sub-repositories
3. Each sub-repository can extend or override the core functionality as needed
4. The `push-changes.sh` script helps synchronize changes across repositories

## Development Workflow

1. Clone the main repository
2. Run `create-repos.sh` to set up all sub-repositories
3. Run `distribute-files.sh` to copy core files to sub-repositories
4. Make changes in the appropriate repository
5. Use `push-changes.sh` to synchronize changes

## Deployment

The platform can be deployed in several ways:

1. **Development**: Local Docker Compose setup
2. **Staging**: Digital Ocean App Platform
3. **Production**: Digital Ocean Kubernetes or App Platform

Deployment scripts are provided in the main repository to streamline the deployment process.