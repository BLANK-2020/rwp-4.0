'use client'

import React from 'react'
import { ChartData } from 'chart.js'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  EVENT_TYPES,
  CHART_COLORS,
  CHART_BORDER_COLORS,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_BORDER_COLORS,
  createLineChartOptions,
  createBarChartOptions,
  createDoughnutChartOptions,
  createPieChartOptions,
  createDualAxisChartOptions,
} from './chartConfig'

// Define the daily events chart props
interface DailyEventsChartProps {
  dailyEventCounts: {
    date: string
    counts: {
      type: string
      count: number
    }[]
  }[]
}

/**
 * Daily Events Chart Component
 *
 * This component displays a line chart of daily event counts.
 */
export const DailyEventsChart: React.FC<DailyEventsChartProps> = ({ dailyEventCounts }) => {
  // Prepare the chart data
  const chartData: ChartData<'line'> = {
    labels: dailyEventCounts.map((day) => day.date),
    datasets: EVENT_TYPES.map((eventType) => ({
      label: eventType
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      data: dailyEventCounts.map((day) => {
        const eventCount = day.counts.find((count) => count.type === eventType)
        return eventCount ? eventCount.count : 0
      }),
      backgroundColor: EVENT_TYPE_COLORS[eventType] || CHART_COLORS.grey,
      borderColor: EVENT_TYPE_BORDER_COLORS[eventType] || CHART_BORDER_COLORS.grey,
      borderWidth: 2,
      tension: 0.3,
    })),
  }

  // Get chart options
  const chartOptions = createLineChartOptions('Daily Events (Last 7 Days)')

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

// Define the conversion funnel chart props
interface ConversionFunnelChartProps {
  eventCounts: {
    type: string
    count: number
  }[]
}

/**
 * Conversion Funnel Chart Component
 *
 * This component displays a bar chart of the conversion funnel.
 */
export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({ eventCounts }) => {
  // Prepare the chart data
  const chartData: ChartData<'bar'> = {
    labels: EVENT_TYPES.map((eventType) =>
      eventType
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    ),
    datasets: [
      {
        label: 'Event Count',
        data: EVENT_TYPES.map((eventType) => {
          const eventCount = eventCounts.find((count) => count.type === eventType)
          return eventCount ? eventCount.count : 0
        }),
        backgroundColor: Object.values(EVENT_TYPE_COLORS).slice(0, EVENT_TYPES.length),
        borderColor: Object.values(EVENT_TYPE_BORDER_COLORS).slice(0, EVENT_TYPES.length),
        borderWidth: 1,
      },
    ],
  }

  // Get chart options
  const chartOptions = createBarChartOptions('Conversion Funnel')

  // Hide the legend for this chart
  if (chartOptions.plugins && chartOptions.plugins.legend) {
    chartOptions.plugins.legend.display = false
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-80">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

// Define the conversion rates chart props
interface ConversionRatesChartProps {
  viewToApplyRate: number
  applyCompletionRate: number
}

/**
 * Conversion Rates Chart Component
 *
 * This component displays a doughnut chart of conversion rates.
 */
export const ConversionRatesChart: React.FC<ConversionRatesChartProps> = ({
  viewToApplyRate,
  applyCompletionRate,
}) => {
  // Prepare the chart data
  const chartData: ChartData<'doughnut'> = {
    labels: ['View to Apply Rate', 'Apply Completion Rate'],
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: [viewToApplyRate, applyCompletionRate],
        backgroundColor: [CHART_COLORS.blue, CHART_COLORS.green],
        borderColor: [CHART_BORDER_COLORS.blue, CHART_BORDER_COLORS.green],
        borderWidth: 1,
      },
    ],
  }

  // Get chart options
  const chartOptions = createDoughnutChartOptions('Conversion Rates')

  // Add tooltip callback for percentage
  if (chartOptions.plugins && chartOptions.plugins.tooltip) {
    chartOptions.plugins.tooltip.callbacks = {
      label: function (context) {
        return `${context.label}: ${context.raw}%`
      },
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-80">
        <Doughnut data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

// Define the top jobs chart props
interface TopJobsChartProps {
  topJobs: {
    title: string
    views: number
    applications: number
  }[]
}

/**
 * Top Jobs Chart Component
 *
 * This component displays a bar chart of top jobs by views and applications.
 */
export const TopJobsChart: React.FC<TopJobsChartProps> = ({ topJobs }) => {
  // Prepare the chart data
  const chartData: ChartData<'bar'> = {
    labels: topJobs.map((job) => job.title),
    datasets: [
      {
        label: 'Views',
        data: topJobs.map((job) => job.views),
        backgroundColor: CHART_COLORS.blue,
        borderColor: CHART_BORDER_COLORS.blue,
        borderWidth: 1,
      },
      {
        label: 'Applications',
        data: topJobs.map((job) => job.applications),
        backgroundColor: CHART_COLORS.green,
        borderColor: CHART_BORDER_COLORS.green,
        borderWidth: 1,
      },
    ],
  }

  // Get chart options
  const chartOptions = createBarChartOptions('Top Jobs by Views and Applications')

  // Update x-axis label
  if (chartOptions.scales && chartOptions.scales.x) {
    chartOptions.scales.x.title = {
      display: true,
      text: 'Job Title',
    }

    // Add rotation for long titles
    chartOptions.scales.x.ticks = {
      maxRotation: 45,
      minRotation: 45,
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-80">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

// Define the traffic sources chart props
interface TrafficSourcesChartProps {
  trafficSources: {
    source: string
    count: number
  }[]
}

/**
 * Traffic Sources Chart Component
 *
 * This component displays a pie chart of traffic sources.
 */
export const TrafficSourcesChart: React.FC<TrafficSourcesChartProps> = ({ trafficSources }) => {
  // Prepare the chart data
  const chartData: ChartData<'pie'> = {
    labels: trafficSources.map((source) => source.source),
    datasets: [
      {
        label: 'Traffic Count',
        data: trafficSources.map((source) => source.count),
        backgroundColor: Object.values(CHART_COLORS).slice(0, trafficSources.length),
        borderColor: Object.values(CHART_BORDER_COLORS).slice(0, trafficSources.length),
        borderWidth: 1,
      },
    ],
  }

  // Get chart options
  const chartOptions = createPieChartOptions('Traffic Sources')

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-80">
        <Pie data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

// Define the A/B test results chart props
interface ABTestResultsChartProps {
  testName: string
  variations: {
    name: string
    views: number
    conversions: number
  }[]
}

/**
 * A/B Test Results Chart Component
 *
 * This component displays a bar chart for views and conversions,
 * and a separate line chart for conversion rates.
 */
export const ABTestResultsChart: React.FC<ABTestResultsChartProps> = ({ testName, variations }) => {
  // Calculate conversion rates
  const conversionRates = variations.map((variation) => {
    const rate = variation.views > 0 ? (variation.conversions / variation.views) * 100 : 0
    return parseFloat(rate.toFixed(2))
  })

  // Prepare the bar chart data for views and conversions
  const barChartData: ChartData<'bar'> = {
    labels: variations.map((variation) => variation.name),
    datasets: [
      {
        label: 'Views',
        data: variations.map((variation) => variation.views),
        backgroundColor: CHART_COLORS.blue,
        borderColor: CHART_BORDER_COLORS.blue,
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Conversions',
        data: variations.map((variation) => variation.conversions),
        backgroundColor: CHART_COLORS.green,
        borderColor: CHART_BORDER_COLORS.green,
        borderWidth: 1,
        yAxisID: 'y',
      },
    ],
  }

  // Prepare the line chart data for conversion rates
  const lineChartData: ChartData<'line'> = {
    labels: variations.map((variation) => variation.name),
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: conversionRates,
        backgroundColor: CHART_COLORS.red,
        borderColor: CHART_BORDER_COLORS.red,
        borderWidth: 2,
        tension: 0.3,
        yAxisID: 'y',
      },
    ],
  }

  // Get chart options for bar chart
  const barChartOptions = createDualAxisChartOptions(`A/B Test Results: ${testName}`)

  // Get chart options for line chart
  const lineChartOptions = createLineChartOptions(`Conversion Rates: ${testName}`)

  // Update y-axis label for line chart
  if (lineChartOptions.scales && lineChartOptions.scales.y) {
    lineChartOptions.scales.y.title = {
      display: true,
      text: 'Conversion Rate (%)',
    }

    // Set max to 100%
    lineChartOptions.scales.y.max = 100
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">{testName}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
        <div className="h-80">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>
      <div className="mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variation
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Views
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conversions
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conversion Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {variations.map((variation, index) => (
              <tr key={variation.name}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {variation.name}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {variation.views}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {variation.conversions}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {conversionRates[index]}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
