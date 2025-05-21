import { syncJobs, syncCandidates } from './sync'
import { handleWebhook, registerWebhook } from './webhook'
import {
  scheduledJobSync,
  initialJobSync,
  scheduledCandidateSync,
  initialCandidateSync,
} from './cron'
import { jobAdderOAuth, getAccessToken } from './oauth'

export const jobAdderIntegration = {
  // Sync functions
  syncJobs,
  syncCandidates,

  // Webhook handlers
  handleWebhook,
  registerWebhook,

  // Job sync scheduling
  scheduledJobSync,
  initialJobSync,

  // Candidate sync scheduling
  scheduledCandidateSync,
  initialCandidateSync,

  // Authentication
  oauth: jobAdderOAuth,
  getAccessToken,
}
