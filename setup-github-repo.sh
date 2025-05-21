#!/bin/bash
set -e

# Configuration
REPO_NAME="rwp-4.0"
DESCRIPTION="Recruitment Web Platform 4.0 with JobAdder integration and analytics"
ORGANIZATION="BLANK-2020"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first:"
    echo "  brew install gh"
    exit 1
fi

# Check if user is authenticated with GitHub
if ! gh auth status &> /dev/null; then
    echo "You are not authenticated with GitHub. Please run:"
    echo "  gh auth login"
    exit 1
fi

# Create the repository in the organization
echo "Creating repository: $ORGANIZATION/$REPO_NAME"
gh repo create "$ORGANIZATION/$REPO_NAME" --public --description "$DESCRIPTION"

# Initialize git repository locally if not already initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git branch -M main
fi

# Add remote
echo "Adding remote origin..."
git remote add origin "https://github.com/$ORGANIZATION/$REPO_NAME.git"

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore..."
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
out/

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
fi

# Update README.md
echo "Creating README.md..."
cat > README.md << EOL
# Recruitment Web Platform 4.0

$DESCRIPTION

## Overview

RWP 4.0 is a comprehensive recruitment platform built with:
- Next.js
- Payload CMS
- PostgreSQL
- JobAdder integration

## Features

- Job board with search and filtering
- JobAdder ATS integration
- Multi-tenant architecture
- Analytics dashboard
- A/B testing and retargeting

## Deployment

This application is deployed on DigitalOcean App Platform. See [DIGITALOCEAN-DEPLOYMENT-GUIDE.md](DIGITALOCEAN-DEPLOYMENT-GUIDE.md) for deployment instructions.

## Development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## Environment Variables

See \`.env.example\` for required environment variables.

## License

MIT
EOL

# Commit and push
echo "Committing files..."
git add .gitignore README.md DIGITALOCEAN-DEPLOYMENT-GUIDE.md
git commit -m "Initial commit: Add README, .gitignore, and deployment guide"

echo "Pushing to GitHub..."
git push -u origin main

echo "Repository setup complete!"
echo "GitHub repository: https://github.com/$ORGANIZATION/$REPO_NAME"
echo "Next steps:"
echo "1. Complete the remaining steps in DIGITALOCEAN-DEPLOYMENT-GUIDE.md"
echo "2. Set up the DigitalOcean App Platform"