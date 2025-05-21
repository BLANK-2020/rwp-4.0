#!/bin/bash
set -e

# Master deployment script for RWP 4.0
echo "Starting deployment process for RWP 4.0..."

# Step 1: Set up GitHub repository
echo "Step 1: Setting up GitHub repository..."
./setup-github-repo.sh

# Step 2: Set up DigitalOcean App Platform
echo "Step 2: Setting up DigitalOcean App Platform..."
./setup-digitalocean-app.sh

# Step 3: Wait for initial deployment to complete
echo "Step 3: Waiting for initial deployment to complete..."
echo "This may take several minutes. Please check the DigitalOcean dashboard for status."
echo "Press Enter when the deployment is complete to continue..."
read -p ""

# Step 4: Get the app ID and URL
APP_ID=$(doctl apps list --format ID --no-header | head -n 1)
APP_URL=$(doctl apps get $APP_ID --format DefaultIngress --no-header)

# Step 5: Run database setup script in the app console
echo "Step 5: Running database setup script in the app console..."
echo "Opening console for app $APP_ID..."
echo "Please run the following command in the console:"
echo "  node scripts/setup-database.js"
echo "Press Enter when the database setup is complete to continue..."
read -p ""

# Step 6: Configure JobAdder integration
echo "Step 6: Configuring JobAdder integration..."
echo "Please update your JobAdder developer portal with the following URLs:"
echo "  OAuth Callback URL: https://$APP_URL/api/oauth/jobadder/callback"
echo "  Webhook URL: https://$APP_URL/api/webhooks/jobadder"
echo "Press Enter when the JobAdder configuration is complete to continue..."
read -p ""

# Step 7: Verify deployment
echo "Step 7: Verifying deployment..."
echo "Opening app URL: https://$APP_URL"
echo "Please verify that the application is working correctly."
echo "Press Enter when verification is complete to continue..."
read -p ""

echo "Deployment process completed successfully!"
echo ""
echo "App URL: https://$APP_URL"
echo "DigitalOcean App ID: $APP_ID"
echo ""
echo "Next steps:"
echo "1. Set up a custom domain (if needed)"
echo "2. Configure monitoring and alerts"
echo "3. Set up regular backups"
echo "4. Document the deployment for future reference"