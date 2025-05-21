#!/bin/bash

# Function to update repository to use SSH
update_repo() {
    local repo=$1
    echo "Updating repository: $repo"
    
    cd "$repo"
    
    # Show current remote
    echo "Current remote:"
    git remote -v
    
    # Update to SSH URL
    git remote set-url origin "git@github.com:BLANK-2020/${repo}.git"
    
    # Show new remote
    echo "New remote:"
    git remote -v
    
    # Go back to parent directory
    cd ..
    
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

echo "All repositories have been updated to use SSH!"

# Test SSH connection
echo "Testing SSH connection to GitHub..."
ssh -T git@github.com