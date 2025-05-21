#!/bin/bash

# Function to commit and push changes for a repository
update_repo() {
    local repo=$1
    echo "Updating repository: $repo"
    
    cd "$repo"
    
    # Add all files
    git add .
    
    # Commit changes
    git commit -m "Add initial codebase structure and dependencies"
    
    # Push to main branch
    git push origin main
    
    # Go back to parent directory
    cd ..
    
    echo "Updated repository: $repo"
    echo "-----------------------------------"
}

# Update each repository
repos=(
    "rwp-core"
    "rwp-tenants"
    "rwp-jobboard"
    "rwp-analytics"
    "rwp-retargeting"
    "rwp-jobadder"
    "rwp-events"
)

for repo in "${repos[@]}"; do
    update_repo "$repo"
done

echo "All repositories have been updated successfully!"