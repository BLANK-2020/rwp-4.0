#!/bin/bash
set -e

# Configuration
APP_NAME="rwp-platform"
REGION="syd1"  # Sydney region
DO_API_TOKEN="YOUR_DIGITALOCEAN_API_TOKEN"
GITHUB_REPO="BLANK-2020/rwp-4.0"
BRANCH="main"

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "DigitalOcean CLI (doctl) is not installed. Please install it first:"
    echo "  brew install doctl"
    exit 1
fi

# Configure doctl with API token
echo "Configuring doctl with API token..."
doctl auth init -t $DO_API_TOKEN

# Load environment variables
source .env

# Create app specification file
echo "Creating app specification file..."
cat > app.yaml << EOL
name: $APP_NAME
region: $REGION
services:
- name: web
  github:
    repo: $GITHUB_REPO
    branch: $BRANCH
    deploy_on_push: true
  build_command: npm install && npm run build
  run_command: npm start
  http_port: 3000
  instance_size_slug: basic-xs
  instance_count: 1
  routes:
  - path: /
  envs:
  - key: DATABASE_URI
    value: $DATABASE_URI
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: PAYLOAD_SECRET
    value: $PAYLOAD_SECRET
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: NEXT_PUBLIC_API_URL
    scope: RUN_AND_BUILD_TIME
    value: \${APP_URL}
  - key: JOBADDER_CLIENT_ID
    value: $JOBADDER_CLIENT_ID
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: JOBADDER_CLIENT_SECRET
    value: $JOBADDER_CLIENT_SECRET
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: JOBADDER_WEBHOOK_SECRET
    value: $JOBADDER_WEBHOOK_SECRET
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: LOG_LEVEL
    value: $LOG_LEVEL
    scope: RUN_AND_BUILD_TIME
  - key: DEBUG
    value: $DEBUG
    scope: RUN_AND_BUILD_TIME
databases:
- name: db
  engine: PG
  production: true
  cluster_name: rwp-db
  db_name: defaultdb
  db_user: doadmin
EOL

# Create the app
echo "Creating DigitalOcean App..."
doctl apps create --spec app.yaml

# Get the app URL
echo "Getting app URL..."
APP_ID=$(doctl apps list --format ID --no-header | head -n 1)
APP_URL=$(doctl apps get $APP_ID --format DefaultIngress --no-header)

echo "App created successfully!"
echo "App URL: $APP_URL"

# Update the .env file with the app URL
echo "Updating .env file with app URL..."
sed -i '' "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$APP_URL|g" .env

echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Wait for the app to be deployed (check status with: doctl apps get $APP_ID)"
echo "2. Initialize the database schema by running the setup script in the app console"
echo "3. Configure JobAdder integration with the new app URL"
echo "4. Test the application"