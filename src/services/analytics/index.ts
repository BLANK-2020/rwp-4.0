import payload from 'payload'
import { aiService } from '../ai'
import { OpenAI } from 'openai'

/**
 * Analytics service for processing job metrics and generating insights
 */
export class AnalyticsService {
  /**
   * Process job metrics for a tenant
   */
  async processJobMetrics(tenantId: string | number): Promise<void> {
    try {
      console.log(`Processing job metrics for tenant: ${tenantId}`)

      // Get all jobs for the tenant
      const jobs = await payload.find({
        collection: 'jobs' as any,
        where: {
          tenant: {
            equals: tenantId,
          },
        },
        limit: 1000, // Adjust as needed
      })

      if (!jobs.docs || jobs.docs.length === 0) {
        console.log(`No jobs found for tenant: ${tenantId}`)
        return
      }

      // Calculate basic metrics
      const metrics = this.calculateBasicMetrics(jobs.docs)

      // Generate insights using AI
      const insights = await this.generateInsights(jobs.docs, metrics)

      // Create or update analytics record
      await this.saveAnalytics(tenantId, metrics, insights)

      console.log(`Successfully processed job metrics for tenant: ${tenantId}`)
    } catch (error: any) {
      console.error('Error processing job metrics:', error)
      throw new Error(`Failed to process job metrics: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Calculate basic metrics from jobs
   */
  private calculateBasicMetrics(jobs: any[]): any {
    // Count jobs by status
    const jobsByStatus = jobs.reduce((acc: any, job: any) => {
      const status = job.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // Count jobs by type
    const jobsByType = jobs.reduce((acc: any, job: any) => {
      const type = job.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    // Count jobs by sector
    const jobsBySector = jobs.reduce((acc: any, job: any) => {
      const sector = job.sector
        ? typeof job.sector === 'object'
          ? job.sector.id
          : job.sector
        : 'unknown'
      acc[sector] = (acc[sector] || 0) + 1
      return acc
    }, {})

    // Calculate average talent score
    let totalScore = 0
    let scoredJobs = 0

    jobs.forEach((job: any) => {
      if (job.talentScore && typeof job.talentScore.score === 'number') {
        totalScore += job.talentScore.score
        scoredJobs++
      }
    })

    const averageScore = scoredJobs > 0 ? totalScore / scoredJobs : 0

    // Extract top skills from job enrichment
    const skillsMap: Record<string, number> = {}

    jobs.forEach((job: any) => {
      if (job.aiEnrichment && Array.isArray(job.aiEnrichment.keywords)) {
        job.aiEnrichment.keywords.forEach((keyword: string) => {
          skillsMap[keyword] = (skillsMap[keyword] || 0) + 1
        })
      }
    })

    // Sort skills by frequency
    const topSkills = Object.entries(skillsMap)
      .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
      .slice(0, 10)
      .map(([skill]) => skill)

    return {
      totalJobs: jobs.length,
      activeJobs: jobsByStatus.published || 0,
      closedJobs: jobsByStatus.closed || 0,
      draftJobs: jobsByStatus.draft || 0,
      jobsByType,
      jobsBySector,
      averageScore,
      topSkills,
      timestamp: new Date(),
    }
  }

  /**
   * Generate insights using AI
   */
  private async generateInsights(jobs: any[], metrics: any): Promise<any> {
    try {
      // Prepare data for AI analysis
      const jobSummaries = jobs.slice(0, 20).map((job: any) => ({
        title: job.title,
        type: job.type,
        location: job.location,
        status: job.status,
        talentScore: job.talentScore?.score,
      }))

      const metricsJson = JSON.stringify(metrics, null, 2)
      const jobsJson = JSON.stringify(jobSummaries, null, 2)

      // Create a new OpenAI instance
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              "You are an expert job market analyst. Generate insights based on job data and metrics. Return a JSON object with 'summary', 'trends', and 'recommendations' properties.",
          },
          {
            role: 'user',
            content: `Job Metrics:\n${metricsJson}\n\nJob Samples:\n${jobsJson}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })

      const insights = JSON.parse(completion.choices[0].message.content || '{}')

      return {
        summary: insights.summary || '',
        trends: insights.trends || [],
        recommendations: insights.recommendations || [],
        generatedAt: new Date(),
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      return {
        summary: 'Failed to generate insights',
        trends: [],
        recommendations: [],
        generatedAt: new Date(),
      }
    }
  }

  /**
   * Save analytics to database
   */
  private async saveAnalytics(
    tenantId: string | number,
    metrics: any,
    insights: any,
  ): Promise<void> {
    // Ensure tenantId is a number
    const numericTenantId = typeof tenantId === 'string' ? parseInt(tenantId, 10) : tenantId

    // Check if analytics record exists for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingAnalytics = await payload.find({
      collection: 'analytics' as any,
      where: {
        and: [
          {
            tenant: {
              equals: numericTenantId,
            },
          },
          {
            'dateRange.startDate': {
              greater_than_equal: today.toISOString(),
            },
          },
          {
            'dateRange.startDate': {
              less_than: tomorrow.toISOString(),
            },
          },
        ],
      },
    })

    const jobMetrics = {
      totalJobs: metrics.totalJobs,
      activeJobs: metrics.activeJobs,
      averageScore: metrics.averageScore,
      topSkills: metrics.topSkills,
      jobsByType: metrics.jobsByType,
      jobsBySector: metrics.jobsBySector,
    }

    if (existingAnalytics.docs && existingAnalytics.docs.length > 0) {
      // Update existing record
      await payload.update({
        collection: 'analytics' as any,
        id: existingAnalytics.docs[0].id,
        data: {
          metrics: metrics as any,
          insights: insights as any,
          jobMetrics: jobMetrics as any,
        },
      })
    } else {
      // Create new record
      await payload.create({
        collection: 'analytics' as any,
        data: {
          name: `Job Analytics - ${new Date().toISOString().split('T')[0]}`,
          tenant: numericTenantId,
          period: 'daily',
          dateRange: {
            startDate: today,
            endDate: tomorrow,
          },
          metrics: metrics as any,
          insights: insights as any,
          jobMetrics: jobMetrics as any,
        },
      })
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()
