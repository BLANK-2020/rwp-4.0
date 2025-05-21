/**
 * Benchmark Templates API Endpoint
 *
 * This endpoint provides access to benchmark templates for candidate evaluation.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getBenchmarkTemplates,
  getBenchmarkTemplate,
  createBenchmarkTemplate,
  updateBenchmarkTemplate,
  deleteBenchmarkTemplate,
} from '@/services/benchmarkProcessor'

/**
 * Get all benchmark templates for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Get the tenant ID from the query parameters
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    const id = searchParams.get('id')

    // Validate the tenant ID
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing required parameter: tenantId' }, { status: 400 })
    }

    // If an ID is provided, get a specific benchmark template
    if (id) {
      const template = await getBenchmarkTemplate(id, tenantId)

      if (!template) {
        return NextResponse.json({ error: 'Benchmark template not found' }, { status: 404 })
      }

      return NextResponse.json(template)
    }

    // Otherwise, get all benchmark templates for the tenant
    const templates = await getBenchmarkTemplates(tenantId)

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Error getting benchmark templates:', error)

    return NextResponse.json(
      {
        error: error.message || 'An error occurred while getting benchmark templates',
      },
      { status: 500 },
    )
  }
}

/**
 * Create a new benchmark template
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()

    // Validate the request
    if (!body.tenantId || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, name' },
        { status: 400 },
      )
    }

    // Create the benchmark template
    const template = await createBenchmarkTemplate(body)

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Error creating benchmark template:', error)

    return NextResponse.json(
      {
        error: error.message || 'An error occurred while creating the benchmark template',
      },
      { status: 500 },
    )
  }
}

/**
 * Update a benchmark template
 */
export async function PUT(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()

    // Validate the request
    if (!body.id || !body.tenantId) {
      return NextResponse.json({ error: 'Missing required fields: id, tenantId' }, { status: 400 })
    }

    // Update the benchmark template
    const template = await updateBenchmarkTemplate(body.id, body.tenantId, body)

    if (!template) {
      return NextResponse.json({ error: 'Benchmark template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error: any) {
    console.error('Error updating benchmark template:', error)

    return NextResponse.json(
      {
        error: error.message || 'An error occurred while updating the benchmark template',
      },
      { status: 500 },
    )
  }
}

/**
 * Delete a benchmark template
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the ID and tenant ID from the query parameters
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const tenantId = searchParams.get('tenantId')

    // Validate the parameters
    if (!id || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameters: id, tenantId' },
        { status: 400 },
      )
    }

    // Delete the benchmark template
    const success = await deleteBenchmarkTemplate(id, tenantId)

    if (!success) {
      return NextResponse.json({ error: 'Benchmark template not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting benchmark template:', error)

    return NextResponse.json(
      {
        error: error.message || 'An error occurred while deleting the benchmark template',
      },
      { status: 500 },
    )
  }
}
