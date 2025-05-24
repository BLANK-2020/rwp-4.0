#!/bin/bash

# This script replaces potential secrets with placeholders in the specified files

# Function to replace secrets in a file
replace_secrets() {
  local file="$1"
  
  if [ -f "$file" ]; then
    # Replace database connection strings
    sed -i.bak 's/postgresql:\/\/[^@]*@/postgresql:\/\/YOUR_USERNAME:YOUR_PASSWORD@/g' "$file"
    
    # Replace DigitalOcean API tokens
    sed -i.bak 's/DO_API_TOKEN="[^"]*"/DO_API_TOKEN="YOUR_DIGITALOCEAN_API_TOKEN"/g' "$file"
    
    # Remove backup files
    rm -f "$file.bak"
  fi
}

# List of files to clean
files=(
  ".env.example"
  "DIGITALOCEAN-DEPLOYMENT-GUIDE.md"
  "test-db-connection.js"
  "deploy-to-digitalocean-direct.sh"
  "deploy-to-digitalocean.sh"
  "setup-digitalocean-app.sh"
)

# Process each file
for file in "${files[@]}"; do
  replace_secrets "$file"
done
