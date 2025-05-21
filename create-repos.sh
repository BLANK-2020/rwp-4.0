#!/bin/bash

# Function to create a repository with README and .gitignore
create_repo() {
    local repo=$1
    local description=$2
    
    echo "Creating repository: $repo"
    gh repo create "$repo" --public --description "$description" --clone
    
    # Navigate into the repository directory
    cd "$repo"
    
    # Create README.md with initial content
    cat > README.md << EOL
# $repo

$description

## Overview

This repository is part of the RWP (Recruitment Web Platform) ecosystem.

## Features

- [Feature list coming soon]

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

1. Copy .env.example to .env
2. Update environment variables

## Development

\`\`\`bash
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Dependencies

- Node.js >= 18.20.2
- PostgreSQL
- [Other dependencies]

## Related Repositories

- [Links to related repos coming soon]

## License

MIT
EOL

    # Create .gitignore
    cat > .gitignore << EOL
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/
.next/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOL

    # Initialize repository
    git add README.md .gitignore
    git commit -m "Initial commit: Add README and .gitignore"
    git push -u origin main
    
    # Go back to parent directory
    cd ..
    
    echo "Created repository: $repo"
    echo "-----------------------------------"
}

# Create each repository
create_repo "rwp-core" "Core infrastructure for the RWP platform including base configuration, database adapters, and authentication"
create_repo "rwp-tenants" "Multi-tenant management system for RWP platform with custom domain routing and tenant configuration"
create_repo "rwp-jobboard" "Job board frontend with job listings, search, filtering, and application system"
create_repo "rwp-analytics" "Analytics dashboard for RWP platform with data visualization and reporting"
create_repo "rwp-retargeting" "Retargeting system with A/B testing, marketing pixel integration, and campaign management"
create_repo "rwp-jobadder" "JobAdder ATS integration with OAuth, job synchronization, and webhook handlers"
create_repo "rwp-events" "Event tracking infrastructure for collecting and processing platform events"

echo "All repositories have been created successfully!"