#!/bin/bash
set -e

# Configuration
IMAGE_NAME="rec-platform"
IMAGE_TAG=$(date +%Y%m%d%H%M%S)
FULL_IMAGE_NAME="$IMAGE_NAME:$IMAGE_TAG"

# DigitalOcean API Token
DO_API_TOKEN="YOUR_DIGITALOCEAN_API_TOKEN"

# Step 1: Build the Docker image
echo "Building Docker image: $FULL_IMAGE_NAME"
docker build -t $FULL_IMAGE_NAME .

# Step 2: Tag the image for DigitalOcean Container Registry
# Set the registry name for your DigitalOcean Container Registry
REGISTRY="registry.digitalocean.com/rwp-registry"
REGISTRY_IMAGE="$REGISTRY/$FULL_IMAGE_NAME"
echo "Tagging image for DigitalOcean Container Registry: $REGISTRY_IMAGE"
docker tag $FULL_IMAGE_NAME $REGISTRY_IMAGE

# Step 3: Push the image to DigitalOcean Container Registry
echo "Pushing image to DigitalOcean Container Registry"
docker push $REGISTRY_IMAGE

# Step 4: Deploy to DigitalOcean Droplet
# Configure doctl with our API token
echo "Configuring doctl with API token"
doctl auth init -t $DO_API_TOKEN

echo "Deploying to DigitalOcean Droplet"
# Set the droplet ID or name for deployment
DROPLET_ID="rwp-app-droplet"

# Load environment variables from .env file
source .env

# Create a deployment command with all necessary environment variables
DEPLOY_COMMAND="docker pull $REGISTRY_IMAGE && docker stop $IMAGE_NAME || true && docker rm $IMAGE_NAME || true && docker run -d --name $IMAGE_NAME -p 80:3000 -p 443:443 \
  -e DATABASE_URI='$DATABASE_URI' \
  -e PAYLOAD_SECRET='$PAYLOAD_SECRET' \
  -e JOBADDER_CLIENT_ID='$JOBADDER_CLIENT_ID' \
  -e JOBADDER_CLIENT_SECRET='$JOBADDER_CLIENT_SECRET' \
  -e JOBADDER_WEBHOOK_SECRET='$JOBADDER_WEBHOOK_SECRET' \
  -e NEXT_PUBLIC_API_URL='$NEXT_PUBLIC_API_URL' \
  -e LOG_LEVEL='$LOG_LEVEL' \
  -e DEBUG='$DEBUG' \
  -e STRIPE_SECRET_KEY='$STRIPE_SECRET_KEY' \
  -e STRIPE_WEBHOOK_SECRET='$STRIPE_WEBHOOK_SECRET' \
  -e STRIPE_CORE_PRICE_ID='$STRIPE_CORE_PRICE_ID' \
  -e STRIPE_PRO_PRICE_ID='$STRIPE_PRO_PRICE_ID' \
  -e STRIPE_ENTERPRISE_PRICE_ID='$STRIPE_ENTERPRISE_PRICE_ID' \
  $REGISTRY_IMAGE"

# Execute the deployment command on the droplet
doctl compute ssh $DROPLET_ID --ssh-command "$DEPLOY_COMMAND"

echo "Deployment completed successfully!"