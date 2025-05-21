#!/bin/bash
set -e

# Configuration
APP_NAME="rwp-platform"
REGION="syd1"  # Sydney region
DO_API_TOKEN="YOUR_DIGITALOCEAN_API_TOKEN"

# Step 1: Configure doctl with API token
echo "Configuring doctl with API token..."
doctl auth init -t $DO_API_TOKEN

# Step 2: Create app specification file
echo "Creating app specification file..."
cat > app.yaml << EOL
name: $APP_NAME
region: $REGION
services:
- name: web
  github:
    repo: your-github-username/rwp-4.0
    branch: main
  build_command: npm install && npm run build
  run_command: npm start
  http_port: 3000
  instance_size_slug: basic-xs
  instance_count: 1
  routes:
  - path: /
  envs:
  - key: DATABASE_URI
    value: ${DATABASE_URI}
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: PAYLOAD_SECRET
    value: ${PAYLOAD_SECRET}
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: NEXT_PUBLIC_API_URL
    value: ${NEXT_PUBLIC_API_URL}
    scope: RUN_AND_BUILD_TIME
  - key: JOBADDER_CLIENT_ID
    value: ${JOBADDER_CLIENT_ID}
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: JOBADDER_CLIENT_SECRET
    value: ${JOBADDER_CLIENT_SECRET}
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: JOBADDER_WEBHOOK_SECRET
    value: ${JOBADDER_WEBHOOK_SECRET}
    scope: RUN_AND_BUILD_TIME
    type: SECRET
databases:
- name: db
  engine: PG
  production: true
  cluster_name: rwp-db
  db_name: defaultdb
  db_user: doadmin
EOL

# Step 3: Create the app
echo "Creating DigitalOcean App..."
doctl apps create --spec app.yaml

# Step 4: Get the app URL
echo "Getting app URL..."
APP_ID=$(doctl apps list --format ID --no-header | head -n 1)
APP_URL=$(doctl apps get $APP_ID --format DefaultIngress --no-header)

echo "App deployed successfully!"
echo "App URL: $APP_URL"

# Step 5: Update the .env file with the app URL
echo "Updating .env file with app URL..."
sed -i '' "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$APP_URL|g" .env

echo "Deployment completed successfully!"