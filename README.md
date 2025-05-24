# Recruitment Web Platform (RWP) 4.0

A comprehensive platform for recruitment agencies to manage job listings, candidate applications, and recruitment analytics.

## Overview

The Recruitment Web Platform (RWP) 4.0 is a modern, microservices-based solution designed to streamline recruitment processes, enhance candidate experiences, and provide powerful analytics for recruitment agencies. The platform integrates with Applicant Tracking Systems (ATS) like JobAdder to synchronize job data and candidate applications.

## Key Features

- **Job Board**: Public-facing job listings with search and filtering
- **ATS Integration**: Seamless integration with JobAdder and other ATS systems
- **Analytics**: Comprehensive recruitment metrics and reporting
- **AI Enrichment**: Intelligent candidate and job data analysis
- **Event Tracking**: Detailed tracking of user interactions
- **Retargeting**: Re-engage candidates through targeted campaigns
- **Multi-tenancy**: Support for multiple recruitment agencies

## Repository Structure

This project uses a multi-repository architecture:

- **Main Repository (RWP 4.0)**: Core configuration, documentation, and shared code
- **Sub-repositories**:
  - `rwp-core`: Core infrastructure and shared functionality
  - `rwp-jobboard`: Public-facing job board
  - `rwp-jobadder`: JobAdder ATS integration
  - `rwp-events`: Event tracking system
  - `rwp-analytics`: Analytics and reporting
  - `rwp-ai-enrichment`: AI-powered data enrichment
  - `rwp-retargeting`: Candidate retargeting
  - `rwp-tenants`: Multi-tenant management

The project uses npm workspaces to manage dependencies between packages, allowing for:
- Shared dependencies across packages
- Local package references without publishing to npm
- Running commands across all packages or specific packages
- Simplified development workflow

## Documentation

- [Project Architecture](./PROJECT-ARCHITECTURE.md): Overview of the system architecture and repository structure
- [Technical Implementation](./TECHNICAL-IMPLEMENTATION.md): Detailed technical documentation
- [Setup Troubleshooting](./SETUP-TROUBLESHOOTING.md): Common issues and solutions
- [Deployment Guide](./DEPLOYMENT.md): Deployment instructions
- [Digital Ocean Deployment](./DIGITALOCEAN-DEPLOYMENT-GUIDE.md): Specific guide for Digital Ocean

## Technology Stack

- **Frontend**: Next.js, React
- **Backend**: Payload CMS, Express
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Digital Ocean

## Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL 14.x or later
- Docker and Docker Compose (optional)

### Installation

1. Clone the main repository:
   ```bash
   git clone https://github.com/your-org/rwp-4.0.git
   cd rwp-4.0
   ```

2. Create the sub-repositories:
   ```bash
   ./create-repos.sh
   ```

3. Distribute core files to sub-repositories:
   ```bash
   ./distribute-files.sh
   ```

4. Set up npm workspaces and install dependencies:
   ```bash
   ./setup-workspace.sh
   ```

5. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Development Workflow

1. Make changes in the appropriate repository
2. Test changes locally using npm workspaces:
   ```bash
   # Run a command in a specific package
   npm run dev -w rwp-core
   
   # Run a command in all packages
   npm run test --workspaces
   
   # Add a dependency to a specific package
   npm install express -w rwp-core
   ```
3. Use `push-changes.sh` to synchronize changes across repositories
4. Deploy using the deployment scripts

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
