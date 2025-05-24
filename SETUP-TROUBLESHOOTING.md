# RWP 4.0 Setup Troubleshooting Guide

This document provides solutions for common setup issues encountered when working with the RWP 4.0 multi-repository architecture.

## Common Dependency Issues

### Missing React Dependencies

**Error Message:**
```
Error: Cannot find module 'react'
```

**Cause:**
This error occurs when a repository is missing the required React dependencies. Since RWP 4.0 uses Next.js and React components across multiple repositories, each repository needs its own React dependencies.

**Solution:**
1. Add React dependencies to the repository's package.json:
   ```json
   "dependencies": {
     "react": "^18",
     "react-dom": "^18",
     ...
   }
   ```
2. Add React type definitions to devDependencies:
   ```json
   "devDependencies": {
     "@types/react": "^18",
     "@types/react-dom": "^18",
     ...
   }
   ```
3. Install the dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

### Missing cross-env Dependency

**Error Message:**
```
sh: cross-env: command not found
```

**Cause:**
The npm scripts in package.json use cross-env to set environment variables in a cross-platform way, but the package is not installed.

**Solution:**
1. Add cross-env to devDependencies:
   ```json
   "devDependencies": {
     "cross-env": "^7.0.3",
     ...
   }
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Dependency Conflicts

**Error Message:**
```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Cause:**
Peer dependency conflicts between packages, especially with ESLint and TypeScript-related packages.

**Solution:**
Use the `--legacy-peer-deps` flag when installing dependencies:
```bash
npm install --legacy-peer-deps
```

## Multi-Repository Setup Issues

### Missing Next.js App Structure

**Error Message:**
```
[Error: > Couldn't find any `pages` or `app` directory. Please create one under the project root]
```

**Cause:**
Next.js requires either a `pages` or `app` directory to function properly. In the multi-repo setup, these directories might not be created automatically.

**Solution:**
1. Create the basic Next.js app structure:
   ```bash
   mkdir -p src/app
   ```
2. Create a minimal page.tsx file:
   ```tsx
   // src/app/page.tsx
   import React from 'react';
   
   export default function HomePage() {
     return (
       <div>
         <h1>RWP Repository</h1>
         <p>Welcome to the Recruitment Web Platform</p>
       </div>
     );
   }
   ```
3. Create a layout.tsx file:
   ```tsx
   // src/app/layout.tsx
   import React from 'react';
   
   export const metadata = {
     title: 'RWP Repository',
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
   ```

### Missing Collections Directory

**Error Message:**
```
Error: Cannot find module './collections/Users' or its corresponding type declarations.
```

**Cause:**
The payload.config.ts file imports collections from the './collections/' directory, but this directory might not be created automatically in the multi-repo setup.

**Solution:**
1. Create the collections directory:
   ```bash
   mkdir -p src/collections
   ```
2. Copy the collection files from the main repository:
   ```bash
   cp -r /path/to/main/repo/src/collections/*.ts src/collections/
   ```
3. If the main repository is not available, create basic collection files:
   ```tsx
   // src/collections/Users.ts
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
   ```

### Next.js Build Errors

**Error Message:**
```
[Error: ENOENT: no such file or directory, open '/path/to/.next/server/app/page.js']
```

**Cause:**
Next.js might have issues building the app due to configuration problems or missing dependencies.

**Solution:**
1. Clean the .next directory and rebuild:
   ```bash
   rm -rf .next && npm run dev
   ```
2. If that doesn't work, try using a simple Express server as a fallback:
   ```javascript
   // server.js
   const express = require('express');
   const path = require('path');
   const app = express();

   // Serve static files from the public directory
   app.use(express.static(path.join(__dirname, 'public')));

   // Serve the index.html file for the root path
   app.get('/', (req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'index.html'));
   });

   // Start the server
   const PORT = process.env.PORT || 3002;
   app.listen(PORT, () => {
     console.log(`Server is running on port ${PORT}`);
   });
   ```
3. Create a simple HTML file in the public directory:
   ```html
   <!-- public/index.html -->
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>RWP Core</title>
   </head>
   <body>
     <h1>RWP Core</h1>
     <p>Welcome to the Recruitment Web Platform Core Service</p>
   </body>
   </html>
   ```
4. Install Express and run the server:
   ```bash
   npm install express
   node server.js
   ```

## Environment Setup Issues

### Missing Environment Variables

**Error Message:**
```
Error: Missing environment variable: [VARIABLE_NAME]
```

**Cause:**
Required environment variables are not set in the .env file.

**Solution:**
1. Copy the .env.example file to .env:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required values in the .env file.

## Repository Distribution Issues

If you encounter issues with missing files or incorrect dependencies after running the distribution scripts, try the following:

1. Ensure all repositories are created:
   ```bash
   ./create-repos.sh
   ```

2. Distribute files to all repositories:
   ```bash
   ./distribute-files.sh
   ```

3. Push changes to all repositories:
   ```bash
   ./push-changes.sh
   ```

## Debugging Tips

1. Check the package.json file for missing dependencies
2. Verify that all required directories exist
3. Ensure environment variables are properly set
4. Use the `--legacy-peer-deps` flag when installing dependencies to bypass peer dependency conflicts
5. Check for console errors in the browser developer tools

## Reporting Issues

If you encounter an issue not covered in this guide, please report it by creating an issue in the main repository with:

1. A clear description of the error
2. Steps to reproduce
3. Error messages and logs
4. Your environment details (OS, Node.js version, npm version)