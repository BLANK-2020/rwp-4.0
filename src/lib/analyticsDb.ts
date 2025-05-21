/**
 * Analytics Database Utilities
 *
 * This module provides functions for querying analytics data from the PostgreSQL database.
 * It includes functions for getting event counts, daily event counts, top jobs, and traffic sources.
 */

import { Pool } from 'pg'
import { format, subDays } from 'date-fns'

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || '',
})

// Define the event types
export const EVENT_TYPES = ['job_viewed', 'apply_started', 'apply_completed', 'retarget_triggered']

// Define the analytics data interface
export interface AnalyticsData {
  eventCounts: {
    type: string
    count: number
  }[]
  dailyEventCounts: {
    date: string
    counts: {
      type: string
      count: number
    }[]
  }[]
  topJobs: {
    title: string
    views: number
    applications: number
  }[]
  trafficSources: {
    source: string
    count: number
  }[]
  abTests: {
    id: string
    name: string
    variations: {
      name: string
      views: number
      conversions: number
    }[]
  }[]
}

/**
 * Get analytics data for a tenant
 * @param tenantId The tenant ID
 * @param days The number of days to include in the data
 * @returns The analytics data
 */
export async function getAnalyticsData(
  tenantId: string,
  days: number = 30,
): Promise<AnalyticsData> {
  try {
    // Get the start date
    const startDate = subDays(new Date(), days)
    const startDateStr = format(startDate, 'yyyy-MM-dd')

    // Get event counts
    const eventCounts = await getEventCounts(tenantId, startDateStr)

    // Get daily event counts
    const dailyEventCounts = await getDailyEventCounts(tenantId, days)

    // Get top jobs
    const topJobs = await getTopJobs(tenantId, startDateStr)

    // Get traffic sources
    const trafficSources = await getTrafficSources(tenantId, startDateStr)

    // Get A/B test results
    const abTests = await getABTestResults(tenantId, startDateStr)

    return {
      eventCounts,
      dailyEventCounts,
      topJobs,
      trafficSources,
      abTests,
    }
  } catch (error) {
    console.error('Error getting analytics data:', error)
    throw error
  }
}

/**
 * Get event counts for a tenant
 * @param tenantId The tenant ID
 * @param startDate The start date (YYYY-MM-DD)
 * @returns The event counts
 */
async function getEventCounts(
  tenantId: string,
  startDate: string,
): Promise<{ type: string; count: number }[]> {
  try {
    const query = `
      SELECT type, COUNT(*) as count
      FROM events
      WHERE tenant = $1
        AND timestamp >= $2
      GROUP BY type
      ORDER BY type
    `
    const result = await pool.query(query, [tenantId, startDate])

    // Ensure all event types are included, even if they have no events
    const eventCounts = EVENT_TYPES.map((type) => {
      const eventCount = result.rows.find((row) => row.type === type)
      return {
        type,
        count: eventCount ? parseInt(eventCount.count) : 0,
      }
    })

    return eventCounts
  } catch (error) {
    console.error('Error getting event counts:', error)
    throw error
  }
}

/**
 * Get daily event counts for a tenant
 * @param tenantId The tenant ID
 * @param days The number of days to include
 * @returns The daily event counts
 */
async function getDailyEventCounts(
  tenantId: string,
  days: number,
): Promise<
  {
    date: string
    counts: {
      type: string
      count: number
    }[]
  }[]
> {
  try {
    // Generate an array of dates
    const dates = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i)
      return format(date, 'yyyy-MM-dd')
    })

    // Query for daily event counts
    const query = `
      SELECT 
        DATE(timestamp) as date,
        type,
        COUNT(*) as count
      FROM events
      WHERE tenant = $1
        AND timestamp >= $2
      GROUP BY DATE(timestamp), type
      ORDER BY DATE(timestamp), type
    `
    const startDate = dates[0]
    const result = await pool.query(query, [tenantId, startDate])

    // Create a map of date -> event type -> count
    const dateMap: Record<string, Record<string, number>> = {}

    // Initialize the map with all dates and event types
    dates.forEach((date) => {
      dateMap[date] = {}
      EVENT_TYPES.forEach((type) => {
        dateMap[date][type] = 0
      })
    })

    // Fill in the actual counts
    result.rows.forEach((row) => {
      const date = format(new Date(row.date), 'yyyy-MM-dd')
      if (dateMap[date] && EVENT_TYPES.includes(row.type)) {
        dateMap[date][row.type] = parseInt(row.count)
      }
    })

    // Convert the map to the expected format
    const dailyEventCounts = dates.map((date) => ({
      date,
      counts: EVENT_TYPES.map((type) => ({
        type,
        count: dateMap[date][type] || 0,
      })),
    }))

    return dailyEventCounts
  } catch (error) {
    console.error('Error getting daily event counts:', error)
    throw error
  }
}

/**
 * Get top jobs for a tenant
 * @param tenantId The tenant ID
 * @param startDate The start date (YYYY-MM-DD)
 * @param limit The maximum number of jobs to return
 * @returns The top jobs
 */
async function getTopJobs(
  tenantId: string,
  startDate: string,
  limit: number = 5,
): Promise<{ title: string; views: number; applications: number }[]> {
  try {
    const query = `
      WITH job_views AS (
        SELECT job, COUNT(*) as views
        FROM events
        WHERE tenant = $1
          AND timestamp >= $2
          AND type = 'job_viewed'
        GROUP BY job
      ),
      job_applications AS (
        SELECT job, COUNT(*) as applications
        FROM events
        WHERE tenant = $1
          AND timestamp >= $2
          AND type = 'apply_started'
        GROUP BY job
      ),
      job_titles AS (
        SELECT id, title
        FROM jobs
        WHERE tenant = $1
      )
      SELECT 
        jt.title,
        COALESCE(jv.views, 0) as views,
        COALESCE(ja.applications, 0) as applications
      FROM job_titles jt
      LEFT JOIN job_views jv ON jt.id = jv.job
      LEFT JOIN job_applications ja ON jt.id = ja.job
      WHERE COALESCE(jv.views, 0) > 0 OR COALESCE(ja.applications, 0) > 0
      ORDER BY views DESC, applications DESC
      LIMIT $3
    `
    const result = await pool.query(query, [tenantId, startDate, limit])

    return result.rows.map((row) => ({
      title: row.title,
      views: parseInt(row.views),
      applications: parseInt(row.applications),
    }))
  } catch (error) {
    console.error('Error getting top jobs:', error)
    throw error
  }
}

/**
 * Get traffic sources for a tenant
 * @param tenantId The tenant ID
 * @param startDate The start date (YYYY-MM-DD)
 * @param limit The maximum number of sources to return
 * @returns The traffic sources
 */
async function getTrafficSources(
  tenantId: string,
  startDate: string,
  limit: number = 5,
): Promise<{ source: string; count: number }[]> {
  try {
    const query = `
      SELECT 
        COALESCE(source, 'Direct') as source,
        COUNT(*) as count
      FROM events
      WHERE tenant = $1
        AND timestamp >= $2
      GROUP BY source
      ORDER BY count DESC
      LIMIT $3
    `
    const result = await pool.query(query, [tenantId, startDate, limit])

    return result.rows.map((row) => ({
      source: row.source,
      count: parseInt(row.count),
    }))
  } catch (error) {
    console.error('Error getting traffic sources:', error)
    throw error
  }
}

/**
 * Get A/B test results for a tenant
 * @param tenantId The tenant ID
 * @param startDate The start date (YYYY-MM-DD)
 * @returns The A/B test results
 */
async function getABTestResults(
  tenantId: string,
  startDate: string,
): Promise<
  {
    id: string
    name: string
    variations: {
      name: string
      views: number
      conversions: number
    }[]
  }[]
> {
  try {
    // Query for A/B test assignments
    const assignmentsQuery = `
      SELECT 
        metadata->>'testId' as test_id,
        metadata->>'testName' as test_name,
        metadata->>'variationName' as variation_name,
        COUNT(*) as views
      FROM events
      WHERE tenant = $1
        AND timestamp >= $2
        AND type = 'ab_test_assignment'
        AND metadata->>'testId' IS NOT NULL
      GROUP BY metadata->>'testId', metadata->>'testName', metadata->>'variationName'
      ORDER BY metadata->>'testId', metadata->>'variationName'
    `
    const assignmentsResult = await pool.query(assignmentsQuery, [tenantId, startDate])

    // Query for A/B test conversions
    const conversionsQuery = `
      SELECT 
        metadata->>'testId' as test_id,
        metadata->>'variationName' as variation_name,
        COUNT(*) as conversions
      FROM events
      WHERE tenant = $1
        AND timestamp >= $2
        AND type = 'ab_test_conversion'
        AND metadata->>'testId' IS NOT NULL
      GROUP BY metadata->>'testId', metadata->>'variationName'
      ORDER BY metadata->>'testId', metadata->>'variationName'
    `
    const conversionsResult = await pool.query(conversionsQuery, [tenantId, startDate])

    // Create a map of test ID -> test name -> variation name -> { views, conversions }
    const testMap: Record<
      string,
      { name: string; variations: Record<string, { views: number; conversions: number }> }
    > = {}

    // Fill in the views
    assignmentsResult.rows.forEach((row) => {
      const testId = row.test_id
      const testName = row.test_name
      const variationName = row.variation_name
      const views = parseInt(row.views)

      if (!testMap[testId]) {
        testMap[testId] = { name: testName, variations: {} }
      }

      testMap[testId].variations[variationName] = { views, conversions: 0 }
    })

    // Fill in the conversions
    conversionsResult.rows.forEach((row) => {
      const testId = row.test_id
      const variationName = row.variation_name
      const conversions = parseInt(row.conversions)

      if (testMap[testId] && testMap[testId].variations[variationName]) {
        testMap[testId].variations[variationName].conversions = conversions
      }
    })

    // Convert the map to the expected format
    const abTests = Object.entries(testMap).map(([id, test]) => ({
      id,
      name: test.name,
      variations: Object.entries(test.variations).map(([name, data]) => ({
        name,
        views: data.views,
        conversions: data.conversions,
      })),
    }))

    return abTests
  } catch (error) {
    console.error('Error getting A/B test results:', error)
    throw error
  }
}
