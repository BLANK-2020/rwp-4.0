#!/bin/bash

# Function to copy files to a repository
copy_to_repo() {
    local repo=$1
    shift
    local files=("$@")
    
    echo "Copying files to $repo..."
    
    # Create necessary directories
    for file in "${files[@]}"; do
        # Create the directory structure if it doesn't exist
        mkdir -p "$repo/$(dirname "$file")"
        # Copy the file
        cp -r "$file" "$repo/$(dirname "$file")/"
    done
}

# Core files
core_files=(
    "src/payload.config.ts"
    "src/lib/formatters.ts"
    "src/lib/caching.ts"
    "middleware.ts"
    ".env.example"
    "tsconfig.json"
    "next.config.mjs"
)

# Tenant files
tenant_files=(
    "src/collections/Tenants.ts"
    "src/lib/tenants.ts"
    "src/app/(payload)/admin/[[...segments]]"
)

# Job board files
jobboard_files=(
    "src/app/(frontend)"
    "src/collections/Jobs.ts"
    "src/collections/Sectors.ts"
)

# Analytics files
analytics_files=(
    "src/app/(payload)/admin/analytics"
    "src/app/api/analytics"
    "src/lib/analyticsDb.ts"
)

# Retargeting files
retargeting_files=(
    "src/app/(frontend)/components/ABTest*.tsx"
    "src/lib/abTesting.ts"
    "src/lib/pixelTracking.ts"
)

# JobAdder files
jobadder_files=(
    "src/plugins/ats/integrations/jobAdder"
    "src/app/api/oauth/jobadder"
    "src/app/api/webhooks/jobadder"
)

# Events files
events_files=(
    "src/collections/Events.ts"
    "src/lib/eventTracking.ts"
    "src/app/api/events"
)

# Copy files to each repository
copy_to_repo "rwp-core" "${core_files[@]}"
copy_to_repo "rwp-tenants" "${tenant_files[@]}"
copy_to_repo "rwp-jobboard" "${jobboard_files[@]}"
copy_to_repo "rwp-analytics" "${analytics_files[@]}"
copy_to_repo "rwp-retargeting" "${retargeting_files[@]}"
copy_to_repo "rwp-jobadder" "${jobadder_files[@]}"
copy_to_repo "rwp-events" "${events_files[@]}"

echo "All files have been distributed to their respective repositories."

# Now create package.json files for each repository
create_package_json() {
    local repo=$1
    local description=$2
    local dependencies=$3
    
    cat > "$repo/package.json" << EOL
{
  "name": "$repo",
  "version": "1.0.0",
  "description": "$description",
  "license": "MIT",
  "type": "module",
  "scripts": {
    "build": "cross-env NODE_OPTIONS=--no-deprecation next build",
    "dev": "cross-env NODE_OPTIONS=--no-deprecation next dev",
    "test": "jest",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": $dependencies,
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^22.5.4",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^9.16.0",
    "jest": "^29.7.0",
    "typescript": "5.7.3"
  },
  "engines": {
    "node": "^18.20.2 || >=20.9.0"
  }
}
EOL
}

# Create package.json for each repository with specific dependencies
create_package_json "rwp-core" "Core infrastructure for the RWP platform" '{
    "@payloadcms/db-postgres": "3.33.0",
    "@payloadcms/next": "3.33.0",
    "next": "15.3.0",
    "payload": "3.33.0"
}'

create_package_json "rwp-tenants" "Multi-tenant management system" '{
    "rwp-core": "1.0.0",
    "next": "15.3.0"
}'

create_package_json "rwp-jobboard" "Job board frontend" '{
    "rwp-core": "1.0.0",
    "rwp-events": "1.0.0",
    "next": "15.3.0"
}'

create_package_json "rwp-analytics" "Analytics dashboard" '{
    "rwp-core": "1.0.0",
    "rwp-events": "1.0.0",
    "chart.js": "^4.4.9",
    "react-chartjs-2": "^5.3.0"
}'

create_package_json "rwp-retargeting" "Retargeting system" '{
    "rwp-core": "1.0.0",
    "rwp-events": "1.0.0"
}'

create_package_json "rwp-jobadder" "JobAdder ATS integration" '{
    "rwp-core": "1.0.0",
    "rwp-jobboard": "1.0.0",
    "axios": "^1.9.0"
}'

create_package_json "rwp-events" "Event tracking infrastructure" '{
    "rwp-core": "1.0.0"
}'

echo "Package.json files have been created for all repositories."