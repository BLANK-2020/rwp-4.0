#!/bin/bash
set -e

# This script sets up the npm workspace environment for the RWP 4.0 project

echo "Setting up RWP 4.0 workspace..."

# Install dependencies for all packages
echo "Installing dependencies for all packages..."
npm install

# Build all packages
echo "Building all packages..."
npm run build --workspaces

echo "Workspace setup complete!"
echo ""
echo "You can now run commands across all packages using the workspace feature:"
echo "  npm run dev --workspaces        # Run dev server for all packages"
echo "  npm run build --workspaces      # Build all packages"
echo "  npm run test --workspaces       # Run tests for all packages"
echo ""
echo "Or run commands for a specific package:"
echo "  npm run dev -w rwp-core         # Run dev server for rwp-core only"
echo "  npm run build -w rwp-jobboard   # Build rwp-jobboard only"
echo "  npm run test -w rwp-analytics   # Run tests for rwp-analytics only"
echo ""
echo "To add a dependency to a specific package:"
echo "  npm install express -w rwp-core # Add express to rwp-core"
echo ""
echo "To add a dependency to all packages:"
echo "  npm install lodash -ws          # Add lodash to all packages"