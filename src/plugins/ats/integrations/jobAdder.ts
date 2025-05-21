import { jobAdderIntegration } from './jobAdder/index'

// Re-export the integration for direct use in API routes
export { jobAdderIntegration }

// Export the integration definition for the ATS plugin
export const jobAdder = {
  slug: 'jobadder',
  name: 'JobAdder',
  description: 'JobAdder ATS Integration',
  icon: '/assets/jobadder-icon.svg',
  integration: jobAdderIntegration,
}
