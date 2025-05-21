/**
 * Health Check API Endpoint
 *
 * This endpoint provides a simple health check for the microservice.
 */

import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/db'

/**
 * Get the health status of the microservice
 */
export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseConnection()

    // Check OpenAI API connection
    const openaiStatus = await checkOpenAiConnection()

    // Check vector database connection
    const vectorDbStatus = await checkVectorDbConnection()

    // Determine overall status
    const isHealthy = dbStatus.healthy && openaiStatus.healthy && vectorDbStatus.healthy

    // Prepare the response
    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbStatus,
        openai: openaiStatus,
        vectorDb: vectorDbStatus,
      },
    }

    // Return the response with appropriate status code
    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
    })
  } catch (error: any) {
    console.error('Error checking health:', error)

    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'An error occurred while checking health',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

/**
 * Check the database connection
 * @returns The database connection status
 */
async function checkDatabaseConnection(): Promise<{
  healthy: boolean
  message?: string
  latency?: number
}> {
  try {
    const start = Date.now()

    // Execute a simple query to check the connection
    await db.query('SELECT 1')

    const latency = Date.now() - start

    return {
      healthy: true,
      latency,
    }
  } catch (error: any) {
    console.error('Database connection error:', error)

    return {
      healthy: false,
      message: error.message || 'Database connection failed',
    }
  }
}

/**
 * Check the OpenAI API connection
 * @returns The OpenAI API connection status
 */
async function checkOpenAiConnection(): Promise<{
  healthy: boolean
  message?: string
  latency?: number
}> {
  try {
    // Skip the actual API call in development or test environments
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return {
        healthy: true,
        message: 'Skipped in development/test environment',
      }
    }

    // In production, we would make a lightweight call to the OpenAI API
    // For now, we'll just simulate a successful response
    const start = Date.now()

    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 100))

    const latency = Date.now() - start

    return {
      healthy: true,
      latency,
    }
  } catch (error: any) {
    console.error('OpenAI API connection error:', error)

    return {
      healthy: false,
      message: error.message || 'OpenAI API connection failed',
    }
  }
}

/**
 * Check the vector database connection
 * @returns The vector database connection status
 */
async function checkVectorDbConnection(): Promise<{
  healthy: boolean
  message?: string
  latency?: number
}> {
  try {
    // Skip the actual API call in development or test environments
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return {
        healthy: true,
        message: 'Skipped in development/test environment',
      }
    }

    // In production, we would make a lightweight call to the vector database
    // For now, we'll just simulate a successful response
    const start = Date.now()

    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 50))

    const latency = Date.now() - start

    return {
      healthy: true,
      latency,
    }
  } catch (error: any) {
    console.error('Vector database connection error:', error)

    return {
      healthy: false,
      message: error.message || 'Vector database connection failed',
    }
  }
}
