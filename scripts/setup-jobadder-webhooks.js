import axios from 'axios'
import dotenv from 'dotenv'
import { getAccessToken } from '../src/plugins/ats/integrations/jobAdder/oauth.js'

// Load environment variables
dotenv.config()

/**
 * Register webhooks with JobAdder
 * @param {string} tenantId - The tenant ID
 */
async function registerWebhooks(tenantId) {
  try {
    console.log(`Registering JobAdder webhooks for tenant ${tenantId}...`)

    // Get access token
    const accessToken = await getAccessToken(tenantId)

    if (!accessToken) {
      throw new Error('Failed to get access token')
    }

    // API URL for JobAdder webhooks
    const webhooksUrl = 'https://api.jobadder.com/v2/webhooks'

    // Our webhook endpoint
    const webhookEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/jobadder`

    // Webhook configurations to register
    const webhooks = [
      {
        name: 'Job Created',
        eventType: 'job.created',
        url: webhookEndpoint,
        active: true,
        secret: process.env.JOBADDER_WEBHOOK_SECRET,
      },
      {
        name: 'Job Updated',
        eventType: 'job.updated',
        url: webhookEndpoint,
        active: true,
        secret: process.env.JOBADDER_WEBHOOK_SECRET,
      },
      {
        name: 'Job Deleted',
        eventType: 'job.deleted',
        url: webhookEndpoint,
        active: true,
        secret: process.env.JOBADDER_WEBHOOK_SECRET,
      },
      {
        name: 'Candidate Created',
        eventType: 'candidate.created',
        url: webhookEndpoint,
        active: true,
        secret: process.env.JOBADDER_WEBHOOK_SECRET,
      },
      {
        name: 'Candidate Updated',
        eventType: 'candidate.updated',
        url: webhookEndpoint,
        active: true,
        secret: process.env.JOBADDER_WEBHOOK_SECRET,
      },
      {
        name: 'Application Created',
        eventType: 'application.created',
        url: webhookEndpoint,
        active: true,
        secret: process.env.JOBADDER_WEBHOOK_SECRET,
      },
      {
        name: 'Application Updated',
        eventType: 'application.updated',
        url: webhookEndpoint,
        active: true,
        secret: process.env.JOBADDER_WEBHOOK_SECRET,
      },
    ]

    // Register each webhook
    for (const webhook of webhooks) {
      try {
        console.log(`Registering webhook: ${webhook.name}`)

        const response = await axios.post(webhooksUrl, webhook, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        console.log(`Successfully registered webhook: ${webhook.name}`)
        console.log(`Webhook ID: ${response.data.id}`)
      } catch (error) {
        console.error(
          `Error registering webhook ${webhook.name}:`,
          error.response?.data || error.message,
        )
      }
    }

    console.log('Webhook registration process completed')
  } catch (error) {
    console.error('Error in webhook registration process:', error)
  }
}

// Check if tenant ID is provided as command line argument
const tenantId = process.argv[2]

if (!tenantId) {
  console.error('Please provide a tenant ID as a command line argument')
  process.exit(1)
}

// Run the webhook registration
registerWebhooks(tenantId)
