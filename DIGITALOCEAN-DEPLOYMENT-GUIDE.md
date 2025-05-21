# DigitalOcean App Platform Deployment Guide

This guide outlines the steps to deploy the RWP 4.0 application to DigitalOcean App Platform without requiring any local tools or management.

## Prerequisites

- GitHub account
- DigitalOcean account with billing set up
- JobAdder developer account with OAuth credentials

## Step 1: Push Code to GitHub

1. Create a new repository on GitHub
2. Initialize Git in your local project (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Add your GitHub repository as a remote:
   ```bash
   git remote add origin https://github.com/your-username/rwp-4.0.git
   ```
4. Push your code to GitHub:
   ```bash
   git push -u origin main
   ```

## Step 2: Set Up DigitalOcean App Platform

1. Log in to your DigitalOcean account
2. Navigate to "Apps" in the left sidebar
3. Click "Create App"
4. Select "GitHub" as the source
5. Connect your GitHub account if not already connected
6. Select the repository you created in Step 1
7. Configure the app settings:
   - Select the branch to deploy (usually `main`)
   - Configure the build command: `npm install && npm run build`
   - Configure the run command: `npm start`
   - Set the HTTP port to 3000

## Step 3: Configure Environment Variables

Add the following environment variables in the App Platform setup:

| Variable | Value | Encrypted |
|----------|-------|-----------|
| `DATABASE_URI` | `postgresql://YOUR_USERNAME:YOUR_PASSWORD@host:port/database?sslmode=require` | Yes |
| `PAYLOAD_SECRET` | `your_payload_secret_here` | Yes |
| `NEXT_PUBLIC_API_URL` | Will be automatically set by DigitalOcean | No |
| `JOBADDER_CLIENT_ID` | Your JobAdder OAuth client ID | Yes |
| `JOBADDER_CLIENT_SECRET` | Your JobAdder OAuth client secret | Yes |
| `JOBADDER_WEBHOOK_SECRET` | Your JobAdder webhook secret | Yes |
| `LOG_LEVEL` | `info` | No |
| `DEBUG` | `jobadder:*,webhook:*,oauth:*` | No |

## Step 4: Configure Database

1. In the App Platform setup, click "Add Component"
2. Select "Database"
3. Choose "PostgreSQL" as the database type
4. Select the appropriate plan (Dev or Production)
5. Click "Add"

DigitalOcean will automatically connect the database to your app and set up the necessary environment variables.

## Step 5: Deploy the App

1. Review your app configuration
2. Click "Create Resources" to deploy your app
3. DigitalOcean will build and deploy your application
4. You'll get a URL for your deployed app (e.g., `https://rwp-4-0-abcd1234.ondigitalocean.app`)

## Step 6: Set Up Custom Domain (Optional)

1. In the app settings, go to "Domains"
2. Click "Add Domain"
3. Enter your custom domain (e.g., `rwp.blankrecruitmentmarketing.com.au`)
4. Configure DNS settings as instructed by DigitalOcean
5. Wait for DNS propagation and SSL certificate issuance

## Step 7: Initialize Database Schema

1. Go to the "Console" tab in your app's settings
2. Open a console session
3. Run the database setup script:
   ```bash
   node scripts/setup-database.js
   ```

## Step 8: Configure JobAdder Integration

1. Register your OAuth callback URL in JobAdder developer portal:
   `https://your-app-url/api/oauth/jobadder/callback`
2. Set up webhooks in JobAdder to point to:
   `https://your-app-url/api/webhooks/jobadder`

## Step 9: Verify Deployment

1. Navigate to your app URL
2. Log in to the admin dashboard
3. Connect JobAdder by clicking "Connect JobAdder" in the tenant settings
4. Verify that jobs are syncing correctly

## Continuous Deployment

DigitalOcean App Platform automatically deploys new changes when you push to your GitHub repository. To update your application:

1. Make changes to your code locally
2. Commit the changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
3. Push to GitHub:
   ```bash
   git push origin main
   ```
4. DigitalOcean will automatically detect the changes and deploy a new version

## Monitoring and Logs

1. In the DigitalOcean dashboard, go to your app
2. Click on the "Insights" tab to view metrics
3. Click on the "Logs" tab to view application logs
4. Set up alerts in the "Alerts" tab for important metrics

## Troubleshooting

- **Deployment Failures**: Check the build logs for errors
- **Database Connection Issues**: Verify environment variables and network settings
- **JobAdder Integration Issues**: Check OAuth credentials and webhook configuration
- **Application Errors**: Check application logs in the DigitalOcean dashboard