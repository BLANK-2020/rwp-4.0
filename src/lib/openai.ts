/**
 * OpenAI Integration
 *
 * This module provides functions for generating AI summaries using the OpenAI API.
 */

import OpenAI from 'openai'
import { AnalyticsData } from './analyticsDb'

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate an analytics summary using OpenAI
 * @param analyticsData The analytics data to summarize
 * @param tenantName The name of the tenant
 * @returns The generated summary
 */
export async function generateAnalyticsSummary(
  analyticsData: AnalyticsData,
  tenantName: string,
): Promise<string> {
  try {
    // Prepare the analytics data for the prompt
    const eventCounts = analyticsData.eventCounts
      .map((event) => `${event.type}: ${event.count}`)
      .join('\n')

    const topJobs = analyticsData.topJobs
      .map((job) => `${job.title}: ${job.views} views, ${job.applications} applications`)
      .join('\n')

    const trafficSources = analyticsData.trafficSources
      .map((source) => `${source.source}: ${source.count}`)
      .join('\n')

    // Calculate conversion rates
    const viewToApplyRate = parseFloat(
      (
        ((analyticsData.eventCounts.find((e) => e.type === 'apply_started')?.count || 0) /
          (analyticsData.eventCounts.find((e) => e.type === 'job_viewed')?.count || 1)) *
        100
      ).toFixed(2),
    )

    const applyCompletionRate = parseFloat(
      (
        ((analyticsData.eventCounts.find((e) => e.type === 'apply_completed')?.count || 0) /
          (analyticsData.eventCounts.find((e) => e.type === 'apply_started')?.count || 1)) *
        100
      ).toFixed(2),
    )

    // Create the prompt
    const prompt = `
      Generate a concise, professional summary of the following job board analytics data for ${tenantName}.
      
      Event Counts:
      ${eventCounts}
      
      Conversion Rates:
      - View to Apply Rate: ${viewToApplyRate}%
      - Apply Completion Rate: ${applyCompletionRate}%
      
      Top Jobs:
      ${topJobs}
      
      Traffic Sources:
      ${trafficSources}
      
      Please include:
      1. A brief overview of overall performance
      2. Key insights about the conversion funnel
      3. Observations about top-performing jobs
      4. Recommendations for improving performance
      5. Notable traffic source patterns
      
      Format the summary in markdown with clear headings and bullet points.
    `

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an analytics expert who provides concise, insightful summaries of job board performance data.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Return the generated summary
    return response.choices[0].message.content || 'No summary generated.'
  } catch (error) {
    console.error('Error generating analytics summary:', error)
    throw error
  }
}

/**
 * Generate an email-friendly analytics summary
 * @param analyticsData The analytics data to summarize
 * @param tenantName The name of the tenant
 * @returns The generated summary in HTML format
 */
export async function generateEmailSummary(
  analyticsData: AnalyticsData,
  tenantName: string,
): Promise<string> {
  try {
    // Generate the markdown summary
    const markdownSummary = await generateAnalyticsSummary(analyticsData, tenantName)

    // Convert markdown to HTML (simple conversion)
    let htmlSummary = markdownSummary
      // Convert headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      // Convert bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert lists
      .replace(/^\s*\- (.*$)/gm, '<li>$1</li>')
      // Wrap lists
      .replace(/(<li>.*<\/li>\n)+/g, (match) => `<ul>${match}</ul>`)
      // Convert paragraphs
      .replace(/^(?!<[uh]|<li|<ul)(.+)$/gm, '<p>$1</p>')

    // Wrap in a styled container
    htmlSummary = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <h1 style="color: #2563eb; margin-top: 0;">${tenantName} Analytics Summary</h1>
          ${htmlSummary}
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            This summary was automatically generated based on your job board analytics data.
            For more detailed insights, please visit your analytics dashboard.
          </p>
        </div>
      </div>
    `

    return htmlSummary
  } catch (error) {
    console.error('Error generating email summary:', error)
    throw error
  }
}

/**
 * Generate insights for an analytics report
 * @param metrics The metrics data to analyze
 * @param reportType The type of report
 * @returns An array of insights with titles, descriptions, and importance scores
 */
export async function generateReportInsights(
  metrics: Record<string, any>,
  reportType: string,
): Promise<
  Array<{
    title: string
    description: string
    importance: number
    actionable: boolean
    suggestedActions: string[]
  }>
> {
  try {
    // Convert metrics to a string representation
    const metricsString = Object.entries(metrics)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n')

    // Create the prompt based on report type
    let prompt = `
      Generate 3-5 key insights based on the following ${reportType} metrics:
      
      ${metricsString}
      
      For each insight, provide:
      1. A concise title
      2. A detailed description explaining the insight
      3. An importance score (0-100)
      4. Whether it's actionable (true/false)
      5. 2-3 suggested actions if it's actionable
      
      Format the response as a JSON array of objects with the following structure:
      [
        {
          "title": "Insight title",
          "description": "Detailed explanation of the insight",
          "importance": 85,
          "actionable": true,
          "suggestedActions": ["Action 1", "Action 2"]
        }
      ]
    `

    // Add specific guidance based on report type
    switch (reportType.toLowerCase()) {
      case 'hiring funnel':
        prompt += `
          Focus on:
          - Conversion rates between funnel stages
          - Drop-off points and potential causes
          - Comparison to industry benchmarks
          - Opportunities to optimize the recruitment process
        `
        break
      case 'talent insights':
        prompt += `
          Focus on:
          - Candidate quality and fit patterns
          - Skill gaps and opportunities
          - Demographic insights
          - Candidate source effectiveness
        `
        break
      case 'brand metrics':
        prompt += `
          Focus on:
          - Employer brand visibility trends
          - Engagement patterns across channels
          - Content performance insights
          - Competitive positioning
        `
        break
      case 'competitor data':
        prompt += `
          Focus on:
          - Market share analysis
          - Salary benchmarking insights
          - Candidate attraction effectiveness
          - Competitive advantages and disadvantages
        `
        break
    }

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an analytics expert who provides insightful analysis of recruitment and hiring data.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    // Parse the response
    const content = response.choices[0].message.content || '{"insights": []}'
    const parsedResponse = JSON.parse(content)

    // Return the insights array or an empty array if not found
    return Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.insights || []
  } catch (error) {
    console.error('Error generating report insights:', error)
    // Return some default insights in case of error
    return [
      {
        title: 'Data Analysis Summary',
        description: 'An overview of the key metrics and trends observed in the data.',
        importance: 80,
        actionable: false,
        suggestedActions: [],
      },
      {
        title: 'Potential Improvement Area',
        description: 'Based on the available data, there may be opportunities for optimization.',
        importance: 75,
        actionable: true,
        suggestedActions: [
          'Review current processes',
          'Identify bottlenecks',
          'Implement targeted improvements',
        ],
      },
    ]
  }
}
