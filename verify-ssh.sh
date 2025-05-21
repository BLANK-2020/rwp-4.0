#!/bin/bash

# Function to verify repository SSH configuration
verify_repo() {
    local repo=$1
    echo "Verifying repository: $repo"
    
    cd "$repo"
    
    # Check remote URL
    echo "Remote URL:"
    git remote -v
    
    # Test SSH access by doing a fetch
    echo "Testing SSH access:"
    git fetch origin
    
    # Go back to parent directory
    cd ..
    
    echo "-----------------------------------"
}

# Verify each repository
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
    verify_repo "$repo"
done

echo "Verification complete!"