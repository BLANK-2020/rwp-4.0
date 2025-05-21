# Deployment Checklist for RWP 4.0

This checklist outlines the steps required to deploy the RWP 4.0 application to DigitalOcean.

## Prerequisites

- [ ] DigitalOcean account with API access
- [ ] DigitalOcean API token with write access
- [ ] PostgreSQL database cluster created in DigitalOcean
- [ ] JobAdder developer account with OAuth credentials
- [ ] Domain name configured to point to DigitalOcean

## Environment Setup

- [ ] Configure `.env` file with all required variables:
  - [ ] `DATABASE_URI` - PostgreSQL connection string
  - [ ] `PAYLOAD_SECRET` - Secret for Payload CMS
  - [ ] `NEXT_PUBLIC_API_URL` - Public URL for the API
  - [ ] `JOBADDER_CLIENT_ID` - JobAdder OAuth client ID
  - [ ] `JOBADDER_CLIENT_SECRET` - JobAdder OAuth client secret
  - [ ] `JOBADDER_WEBHOOK_SECRET` - Secret for JobAdder webhooks

## Database Setup

- [ ] Configure database access in DigitalOcean:
  - [ ] Add your IP address to the allowed list
  - [ ] Create necessary database users
  - [ ] Set up proper permissions

- [ ] Run database migration script:
  ```bash
  node scripts/setup-database.js
  ```

## Deployment Steps

1. **Build and Deploy the Application**

   ```bash
   # Make the deployment script executable
   chmod +x deploy-to-digitalocean.sh
   
   # Run the deployment script
   ./deploy-to-digitalocean.sh
   ```

2. **Configure SSL Certificate**

   - [ ] Install Certbot on the DigitalOcean droplet
   - [ ] Generate SSL certificate for your domain
   - [ ] Configure Nginx to use the SSL certificate

3. **Set Up JobAdder Integration**

   - [ ] Register the OAuth callback URL in JobAdder developer portal:
     `https://your-domain.com/api/oauth/jobadder/callback`
   
   - [ ] Register webhooks using the setup script:
     ```bash
     node scripts/setup-jobadder-webhooks.js <tenant-id>
     ```

## Post-Deployment Verification

- [ ] Verify the application is running:
  ```bash
  curl https://your-domain.com/api/health
  ```

- [ ] Test JobAdder OAuth flow:
  1. Navigate to `https://your-domain.com/admin/collections/tenants/<tenant-id>`
  2. Click "Connect JobAdder"
  3. Authorize the application
  4. Verify the OAuth tokens are stored in the tenant record

- [ ] Test job synchronization:
  ```bash
  curl -X POST https://your-domain.com/api/jobs/sync
  ```

- [ ] Verify webhooks are working:
  1. Create a new job in JobAdder
  2. Check the application logs for webhook events
  3. Verify the job appears in the application

## Troubleshooting

- **Database Connection Issues**
  - Check network access rules in DigitalOcean
  - Verify database credentials
  - Check SSL configuration

- **OAuth Issues**
  - Verify redirect URI is correctly registered in JobAdder
  - Check OAuth credentials in `.env` file
  - Inspect network requests for error responses

- **Webhook Issues**
  - Verify webhook endpoints are registered in JobAdder
  - Check webhook secret in `.env` file
  - Inspect application logs for webhook events

## Maintenance

- **Monitoring**
  - Set up monitoring for the application
  - Configure alerts for critical errors
  - Monitor database performance

- **Backups**
  - Set up regular database backups
  - Configure backup retention policy
  - Test backup restoration process

- **Updates**
  - Establish a process for deploying updates
  - Set up a staging environment for testing
  - Document rollback procedures