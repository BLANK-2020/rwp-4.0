import { OpenAI } from 'openai'

// Define our own Job interface to avoid import issues
export interface Job {
  id: string | number
  title: string
  type: string
  location: string
  description?: any
  sector?: any
  salary?: {
    min?: number
    max?: number
    currency?: string
    period?: string
  }
  [key: string]: any
}

// Define types for AI enrichment
export interface JobEnrichment {
  insights: string
  keywords: string[]
  marketTrends: MarketTrend[]
  timestamp: Date
}

export interface MarketTrend {
  trend: string
  impact: 'high' | 'medium' | 'low'
  description: string
}

// Define types for talent scoring
export interface TalentScore {
  score: number
  factors: ScoringFactor[]
  recommendations: string[]
  lastUpdated: Date
}

export interface ScoringFactor {
  name: string
  score: number
  weight: number
  description: string
}

// Define types for rich text
interface RichTextNode {
  type: string
  children?: RichTextChild[]
  [key: string]: any
}

interface RichTextChild {
  text?: string
  [key: string]: any
}

/**
 * AI Service for job enrichment and talent scoring
 */
export class AIService {
  private openai: OpenAI

  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Enrich a job with AI-generated insights
   */
  async enrichJob(job: Job): Promise<JobEnrichment> {
    try {
      console.log(`Enriching job: ${job.id} - ${job.title}`)

      // Extract job content for analysis
      const jobContent = this.extractJobContent(job)

      // Generate insights using OpenAI
      const insights = await this.generateInsights(jobContent)

      // Extract keywords from job description
      const keywords = await this.extractKeywords(jobContent)

      // Analyze market trends
      const marketTrends = await this.analyzeMarketTrends(jobContent)

      return {
        insights,
        keywords,
        marketTrends,
        timestamp: new Date(),
      }
    } catch (error: any) {
      console.error('Error enriching job:', error)
      throw new Error(`Failed to enrich job: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Calculate talent score for a job
   */
  async calculateTalentScore(job: Job): Promise<TalentScore> {
    try {
      console.log(`Calculating talent score for job: ${job.id} - ${job.title}`)

      // Extract job content for analysis
      const jobContent = this.extractJobContent(job)

      // Calculate base score factors
      const factors = await this.calculateScoreFactors(jobContent)

      // Calculate overall score (weighted average)
      const score = this.calculateOverallScore(factors)

      // Generate recommendations
      const recommendations = await this.generateRecommendations(jobContent, factors)

      return {
        score,
        factors,
        recommendations,
        lastUpdated: new Date(),
      }
    } catch (error: any) {
      console.error('Error calculating talent score:', error)
      throw new Error(`Failed to calculate talent score: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Extract job content for analysis
   */
  private extractJobContent(job: Job): string {
    // Combine relevant job fields for analysis
    let content = `Job Title: ${job.title}\n`
    content += `Job Type: ${job.type}\n`
    content += `Location: ${job.location}\n`

    // Add salary information if available
    if (job.salary?.min && job.salary?.max) {
      content += `Salary Range: ${job.salary.min} - ${job.salary.max} ${job.salary.currency} (${job.salary.period})\n`
    }

    // Add sector if available
    if (job.sector) {
      content += `Sector: ${job.sector}\n`
    }

    // Add description (handle rich text)
    if (job.description) {
      // Extract text from rich text format
      const descriptionText = this.extractTextFromRichText(job.description)
      content += `Description: ${descriptionText}\n`
    }

    return content
  }

  /**
   * Extract plain text from rich text format
   */
  private extractTextFromRichText(richText: any): string {
    // Simple extraction for now - can be enhanced for more complex rich text
    if (!richText || !Array.isArray(richText)) return ''

    return richText
      .map((node: RichTextNode) => {
        if (node.type === 'paragraph' && node.children) {
          return node.children.map((child: RichTextChild) => child.text || '').join('')
        }
        return ''
      })
      .join('\n')
  }

  /**
   * Generate insights using OpenAI
   */
  private async generateInsights(jobContent: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert job analyst. Analyze the job posting and provide key insights about the role, required skills, and potential fit for candidates.',
        },
        {
          role: 'user',
          content: jobContent,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return completion.choices[0].message.content || ''
  }

  /**
   * Extract keywords from job content
   */
  private async extractKeywords(jobContent: string): Promise<string[]> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Extract the top 10 most important skills and keywords from this job posting. Return only a JSON array of strings.',
        },
        {
          role: 'user',
          content: jobContent,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    try {
      const response = JSON.parse(completion.choices[0].message.content || '{}')
      return Array.isArray(response.keywords) ? response.keywords : []
    } catch (error) {
      console.error('Error parsing keywords:', error)
      return []
    }
  }

  /**
   * Analyze market trends related to the job
   */
  private async analyzeMarketTrends(jobContent: string): Promise<MarketTrend[]> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            "Analyze this job posting and identify 3-5 current market trends related to this role. Return a JSON array with objects containing 'trend', 'impact' (high/medium/low), and 'description'.",
        },
        {
          role: 'user',
          content: jobContent,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    try {
      const response = JSON.parse(completion.choices[0].message.content || '{}')
      return Array.isArray(response.trends) ? response.trends : []
    } catch (error) {
      console.error('Error parsing market trends:', error)
      return []
    }
  }

  /**
   * Calculate score factors for talent scoring
   */
  private async calculateScoreFactors(jobContent: string): Promise<ScoringFactor[]> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            "Analyze this job posting and calculate scoring factors for talent matching. Return a JSON array with objects containing 'name', 'score' (0-100), 'weight' (0-1, sum should be 1), and 'description'.",
        },
        {
          role: 'user',
          content: jobContent,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    try {
      const response = JSON.parse(completion.choices[0].message.content || '{}')
      return Array.isArray(response.factors) ? response.factors : []
    } catch (error) {
      console.error('Error parsing score factors:', error)
      return []
    }
  }

  /**
   * Calculate overall score from factors
   */
  private calculateOverallScore(factors: ScoringFactor[]): number {
    if (!factors.length) return 0

    // Calculate weighted average
    const weightedSum = factors.reduce((sum, factor) => {
      return sum + factor.score * factor.weight
    }, 0)

    // Round to nearest integer
    return Math.round(weightedSum)
  }

  /**
   * Generate recommendations based on job content and scoring factors
   */
  private async generateRecommendations(
    jobContent: string,
    factors: ScoringFactor[],
  ): Promise<string[]> {
    const factorsJson = JSON.stringify(factors)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Based on this job posting and scoring factors, generate 3-5 recommendations for improving the job posting or finding better candidates. Return a JSON array of strings.',
        },
        {
          role: 'user',
          content: `Job Content:\n${jobContent}\n\nScoring Factors:\n${factorsJson}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    try {
      const response = JSON.parse(completion.choices[0].message.content || '{}')
      return Array.isArray(response.recommendations) ? response.recommendations : []
    } catch (error) {
      console.error('Error parsing recommendations:', error)
      return []
    }
  }
}

// Export singleton instance
export const aiService = new AIService()
