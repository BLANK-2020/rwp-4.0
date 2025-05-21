# Simple Deployment Steps for RWP 4.0

Follow these step-by-step instructions to deploy the RWP 4.0 application to DigitalOcean.

## Prerequisites

1. GitHub account
2. DigitalOcean account with billing set up
3. JobAdder developer account

## Step 1: Create GitHub Repository

1. Go to GitHub.com and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Set repository name to "rwp-4.0"
4. Set organization to "BLANK-2020"
5. Add a description: "Recruitment Web Platform 4.0"
6. Make it Public
7. Click "Create repository"

## Step 2: Push Code to GitHub

1. Open terminal in your project directory
2. Initialize git repository:
   ```
   git init
   ```
3. Add all files:
   ```
   git add .
   ```
4. Commit files:
   ```
   git commit -m "Initial commit"
   ```
5. Add remote:
   ```
   git remote add origin https://github.com/BLANK-2020/rwp-4.0.git
   ```
6. Push to GitHub:
   ```
   git push -u origin main
   ```

## Step 3: Create DigitalOcean App

1. Log in to DigitalOcean.com
2. Click "Apps" in the left sidebar
3. Click "Create App"
4. Select "GitHub" as the source
5. Connect your GitHub account if not already connected
6. Select the "BLANK-2020/rwp-4.0" repository
7. Select the "main" branch
8. Click "Next"

## Step 4: Configure App Settings

1. Set build command: `npm install && npm run build`
2. Set run command: `npm start`
3. Set HTTP port: `3000`
4. Click "Next"

## Step 5: Add Environment Variables

Add these environment variables:
1. `DATABASE_URI`: Your PostgreSQL connection string
2. `PAYLOAD_SECRET`: Your Payload CMS secret
3. `JOBADDER_CLIENT_ID`: Your JobAdder OAuth client ID
4. `JOBADDER_CLIENT_SECRET`: Your JobAdder OAuth client secret
5. `JOBADDER_WEBHOOK_SECRET`: Your JobAdder webhook secret
6. `LOG_LEVEL`: "info"

Mark sensitive variables as "Encrypted"

## Step 6: Add Database

1. Click "Add Resource"
2. Select "Database"
3. Choose "PostgreSQL"
4. Select the appropriate plan
5. Click "Add"

## Step 7: Review and Deploy

1. Review your app configuration
2. Click "Create Resources"
3. Wait for the app to be deployed (this may take several minutes)

## Step 8: Initialize Database

1. Go to your app in the DigitalOcean dashboard
2. Click on the "Console" tab
3. Open a console session
4. Run the database setup script:
   ```
   node scripts/setup-database.js
   ```

## Step 9: Configure JobAdder Integration

1. Go to JobAdder developer portal
2. Update your OAuth callback URL:
   ```
   https://your-app-url/api/oauth/jobadder/callback
   ```
3. Set up webhooks to point to:
   ```
   https://your-app-url/api/webhooks/jobadder
   ```

## Step 10: Verify Deployment

1. Go to your app URL
2. Log in to the admin dashboard
3. Connect JobAdder by clicking "Connect JobAdder" in the tenant settings
4. Verify that jobs are syncing correctly

## Troubleshooting

- **Deployment Failures**: Check build logs in DigitalOcean dashboard
- **Database Connection Issues**: Verify environment variables
- **JobAdder Integration Issues**: Check OAuth credentials and webhook configuration