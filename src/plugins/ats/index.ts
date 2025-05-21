import { Plugin } from 'payload'
import { jobAdderIntegration } from './integrations/jobAdder'
import { bullhornIntegration } from './integrations/bullhorn'
import { Job, Tenant } from '../../payload-types'

interface JobWithTenant extends Omit<Job, 'tenant'> {
  tenant: {
    id: string
    atsConfig?: Tenant['atsConfig']
  }
}

/**
 * ATS Plugin for Payload CMS
 * Provides integration with Applicant Tracking Systems like JobAdder and Bullhorn
 */
const atsPlugin: Plugin = (config) => {
  // Set up CRON job for JobAdder synchronization
  // Run every hour at minute 0
  const cronInterval = process.env.NODE_ENV === 'development' ? '0 * * * *' : '0 * * * *'

  // Schedule the CRON job if not in test environment
  if (process.env.NODE_ENV !== 'test') {
    // Use node-cron in production, or a simple interval in development
    if (process.env.NODE_ENV === 'production') {
      try {
        // Dynamic import to avoid requiring node-cron in development
        import('node-cron')
          .then((cron) => {
            cron.schedule(cronInterval, async () => {
              console.log('Running scheduled JobAdder sync...')
              try {
                await jobAdderIntegration.scheduledJobSync()
                console.log('Scheduled JobAdder sync completed successfully')
              } catch (error) {
                console.error('Error in scheduled JobAdder sync:', error)
              }
            })
            console.log(`JobAdder sync CRON job scheduled with interval: ${cronInterval}`)
          })
          .catch((err) => {
            console.error('Failed to import node-cron:', err)
          })
      } catch (error) {
        console.error('Error setting up CRON job:', error)
      }
    } else {
      // In development, use a simple interval (every 30 minutes)
      const intervalMs = 30 * 60 * 1000 // 30 minutes
      console.log(`Setting up JobAdder sync interval in development mode: ${intervalMs}ms`)
      setInterval(async () => {
        console.log('Running scheduled JobAdder sync in development mode...')
        try {
          await jobAdderIntegration.scheduledJobSync()
          console.log('Scheduled JobAdder sync completed successfully')
        } catch (error) {
          console.error('Error in scheduled JobAdder sync:', error)
        }
      }, intervalMs)
    }
  }

  return config
}

export default atsPlugin
