export interface Job {
  id: string
  title: string
  description?: string
  location?: string
  type?: string
  salary?: {
    min?: number
    max?: number
    currency?: string
  }
  status?: string
  tenant: string
  atsData?: {
    jobAdderId?: string
  }
}

export interface EventCount {
  type: string
  count: number
}

export interface DailyEventCount {
  date: string
  counts: EventCount[]
}

export interface TopJob {
  title: string
  views: number
  applications: number
}

export interface TrafficSource {
  source: string
  count: number
}

export interface ABTestVariation {
  name: string
  views: number
  conversions: number
}

export interface ABTest {
  id: string
  name: string
  variations: ABTestVariation[]
}

export interface AnalyticsData {
  eventCounts: EventCount[]
  dailyEventCounts: DailyEventCount[]
  topJobs: TopJob[]
  trafficSources: TrafficSource[]
  abTests: ABTest[]
}

export type EventType =
  | 'job_viewed'
  | 'apply_started'
  | 'apply_completed'
  | 'retarget_triggered'
  | 'ab_test_assignment'
  | 'ab_test_conversion'
  | 'candidate_enriched'
  | 'benchmark_applied'
  | 'insight_generated'
  | 'report_created'
  | 'data_access_requested'
  | 'data_consent_updated'
  | 'data_deletion_requested'
  | 'sync_error'
