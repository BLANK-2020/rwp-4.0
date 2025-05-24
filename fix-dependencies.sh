#!/bin/bash

# This script adds missing React dependencies to all repositories in the RWP 4.0 ecosystem

# Function to add React dependencies to a repository
add_react_dependencies() {
    local repo=$1
    echo "Adding React dependencies to $repo..."
    
    # Check if the repository exists
    if [ ! -d "$repo" ]; then
        echo "Repository $repo does not exist. Skipping..."
        return
    fi
    
    # Navigate to the repository
    cd "$repo"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "package.json not found in $repo. Skipping..."
        cd ..
        return
    fi
    
    # Add React dependencies if they don't exist
    if ! grep -q '"react":' package.json; then
        echo "Adding react dependency to $repo..."
        # Use temporary files for the transformation
        sed -i.bak '/"dependencies": {/a \
    "react": "^18",\
    "react-dom": "^18",' package.json
    else
        echo "React dependencies already exist in $repo. Skipping..."
    fi
    
    # Add React type definitions if they don't exist
    if ! grep -q '"@types/react":' package.json; then
        echo "Adding React type definitions to $repo..."
        # Use temporary files for the transformation
        sed -i.bak '/"devDependencies": {/a \
    "@types/react": "^18",\
    "@types/react-dom": "^18",' package.json
    else
        echo "React type definitions already exist in $repo. Skipping..."
    fi
    
    # Add cross-env if it doesn't exist
    if ! grep -q '"cross-env":' package.json; then
        echo "Adding cross-env dependency to $repo..."
        # Use temporary files for the transformation
        sed -i.bak '/"devDependencies": {/a \
    "cross-env": "^7.0.3",' package.json
    else
        echo "cross-env dependency already exists in $repo. Skipping..."
    fi
    
    # Clean up backup files
    rm -f package.json.bak
    
    # Create basic Next.js app structure if it doesn't exist
    if [ ! -d "src/app" ]; then
        echo "Creating basic Next.js app structure in $repo..."
        mkdir -p src/app
        
        # Create page.tsx
        cat > src/app/page.tsx << EOL
import React from 'react';

export default function HomePage() {
  return (
    <div>
      <h1>${repo}</h1>
      <p>Welcome to the Recruitment Web Platform</p>
    </div>
  );
}
EOL
        
        # Create layout.tsx
        cat > src/app/layout.tsx << EOL
import React from 'react';

export const metadata = {
  title: '${repo}',
  description: 'Recruitment Web Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOL
    else
        echo "Next.js app structure already exists in $repo. Skipping..."
    fi
    
    # Create collections directory if it doesn't exist
    if [ ! -d "src/collections" ]; then
        echo "Creating collections directory in $repo..."
        mkdir -p src/collections
        
        # Copy collections from main repository if they exist
        if [ -d "../src/collections" ]; then
            echo "Copying collections from main repository..."
            cp -r ../src/collections/*.ts src/collections/
        else
            echo "Main repository collections not found. Creating empty collections..."
            # Create basic collection files
            cat > src/collections/Users.ts << EOL
import { CollectionConfig } from 'payload/types';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: ['user'],
      required: true,
    },
  ],
};
EOL
        fi
    else
        echo "Collections directory already exists in $repo. Skipping..."
    fi
    
    # Return to the parent directory
    cd ..
    
    echo "Completed adding dependencies to $repo"
    echo "-----------------------------------"
}

# List of repositories to update
repositories=(
    "rwp-core"
    "rwp-tenants"
    "rwp-jobboard"
    "rwp-analytics"
    "rwp-retargeting"
    "rwp-jobadder"
    "rwp-events"
)

# Add React dependencies to each repository
for repo in "${repositories[@]}"; do
    add_react_dependencies "$repo"
done

echo "All repositories have been updated with React dependencies!"
echo "To install the dependencies, run 'npm install --legacy-peer-deps' in each repository."