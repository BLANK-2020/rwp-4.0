'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import {
  DailyEventsChart,
  ConversionFunnelChart,
  ConversionRatesChart,
  TopJobsChart,
  TrafficSourcesChart,
  ABTestResultsChart,
} from './components/AnalyticsCharts'

// Define the analytics data interface
interface AnalyticsData {
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
 * Analytics Dashboard Page
 *
 * This page displays analytics data for the job board.
 */
export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<string>('30d')
  const [summary, setSummary] = useState<string | null>(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true)

        // Extract the number of days from the date range
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90

        // Fetch analytics data from the API
        const response = await fetch(`/api/analytics/data?days=${days}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch analytics data: ${response.statusText}`)
        }

        const data = await response.json()
        setAnalyticsData(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching analytics data:', err)
        setError('Failed to fetch analytics data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [dateRange])

  // Calculate conversion rates
  const viewToApplyRate = analyticsData
    ? parseFloat(
        (
          ((analyticsData.eventCounts.find((e) => e.type === 'apply_started')?.count || 0) /
            (analyticsData.eventCounts.find((e) => e.type === 'job_viewed')?.count || 1)) *
          100
        ).toFixed(2),
      )
    : 0

  const applyCompletionRate = analyticsData
    ? parseFloat(
        (
          ((analyticsData.eventCounts.find((e) => e.type === 'apply_completed')?.count || 0) /
            (analyticsData.eventCounts.find((e) => e.type === 'apply_started')?.count || 1)) *
          100
        ).toFixed(2),
      )
    : 0

  // Handle date range change
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value)
    // Clear summary when date range changes
    setSummary(null)
  }

  // Generate summary
  const generateSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true)
      setSummary(null)

      // Extract the number of days from the date range
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90

      // Call the summary API
      const response = await fetch(`/api/analytics/summary?days=${days}`)

      if (!response.ok) {
        throw new Error(`Failed to generate summary: ${response.statusText}`)
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Error generating summary:', error)
      setError('Failed to generate summary. Please try again later.')
    } finally {
      setIsSummaryLoading(false)
    }
  }, [dateRange])

  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No analytics data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
              Date Range:
            </label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={handleDateRangeChange}
              className="border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <button
            onClick={generateSummary}
            disabled={isSummaryLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isSummaryLoading ? 'Generating...' : 'Generate AI Summary'}
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">AI Summary</h2>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>') }}
          />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {analyticsData.eventCounts.map((event) => (
          <div key={event.type} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              {event.type
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
            </h2>
            <p className="text-3xl font-bold text-blue-600">{event.count}</p>
            <p className="text-sm text-gray-500 mt-2">
              Last {dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} days
            </p>
          </div>
        ))}
      </div>

      {/* Conversion Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">View to Apply Rate</h2>
          <p className="text-3xl font-bold text-green-600">{viewToApplyRate}%</p>
          <p className="text-sm text-gray-500 mt-2">
            {analyticsData.eventCounts.find((e) => e.type === 'apply_started')?.count || 0}{' '}
            applications started from{' '}
            {analyticsData.eventCounts.find((e) => e.type === 'job_viewed')?.count || 0} job views
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Apply Completion Rate</h2>
          <p className="text-3xl font-bold text-green-600">{applyCompletionRate}%</p>
          <p className="text-sm text-gray-500 mt-2">
            {analyticsData.eventCounts.find((e) => e.type === 'apply_completed')?.count || 0}{' '}
            applications completed from{' '}
            {analyticsData.eventCounts.find((e) => e.type === 'apply_started')?.count || 0} started
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <DailyEventsChart dailyEventCounts={analyticsData.dailyEventCounts} />
        <ConversionFunnelChart eventCounts={analyticsData.eventCounts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <TopJobsChart topJobs={analyticsData.topJobs} />
        <TrafficSourcesChart trafficSources={analyticsData.trafficSources} />
      </div>

      <div className="grid grid-cols-1 gap-8 mb-8">
        <ConversionRatesChart
          viewToApplyRate={viewToApplyRate}
          applyCompletionRate={applyCompletionRate}
        />
      </div>

      {/* A/B Test Results */}
      <h2 className="text-2xl font-bold mb-4">A/B Test Results</h2>
      <div className="grid grid-cols-1 gap-8 mb-8">
        {analyticsData.abTests.map((test) => (
          <ABTestResultsChart key={test.id} testName={test.name} variations={test.variations} />
        ))}
      </div>
    </div>
  )
}
