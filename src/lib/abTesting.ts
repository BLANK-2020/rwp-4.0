/**
 * A/B Testing Utilities
 *
 * This module provides functions for A/B testing job descriptions and apply buttons.
 * It allows us to test different variations of content to see which performs better.
 */

import { v4 as uuidv4 } from 'uuid'
import { trackABTestAssignment, trackABTestConversion } from './eventTracking'

// Define the test types
export enum TestType {
  JOB_DESCRIPTION = 'job_description',
  APPLY_BUTTON = 'apply_button',
}

// Define the test variation
export interface TestVariation {
  id: string
  name: string
  content: string
  weight?: number // Probability weight (default: 1)
}

// Define the test configuration
export interface TestConfig {
  id: string
  name: string
  type: TestType
  variations: TestVariation[]
  startDate: Date
  endDate?: Date
  isActive: boolean
}

// Define the test assignment
export interface TestAssignment {
  testId: string
  variationId: string
  timestamp: Date
}

// Store test assignments in session storage to ensure consistent experience
const getAssignments = (): Record<string, TestAssignment> => {
  if (typeof window === 'undefined') {
    return {}
  }

  const assignments = sessionStorage.getItem('ab_test_assignments')
  return assignments ? JSON.parse(assignments) : {}
}

// Save test assignments to session storage
const saveAssignments = (assignments: Record<string, TestAssignment>): void => {
  if (typeof window === 'undefined') {
    return
  }

  sessionStorage.setItem('ab_test_assignments', JSON.stringify(assignments))
}

/**
 * Get the assigned variation for a test
 * @param testId The test ID
 * @param testConfig The test configuration
 * @returns The assigned variation
 */
export const getAssignedVariation = (testId: string, testConfig: TestConfig): TestVariation => {
  // Check if the test is active
  if (!testConfig.isActive) {
    return testConfig.variations[0] // Return the first variation (control)
  }

  // Check if the test is within the date range
  const now = new Date()
  if (now < testConfig.startDate || (testConfig.endDate && now > testConfig.endDate)) {
    return testConfig.variations[0] // Return the first variation (control)
  }

  // Check if the user already has an assignment for this test
  const assignments = getAssignments()
  if (assignments[testId]) {
    // Find the assigned variation
    const assignedVariation = testConfig.variations.find(
      (variation) => variation.id === assignments[testId].variationId,
    )

    // If the assigned variation exists, return it
    if (assignedVariation) {
      return assignedVariation
    }
  }

  // Assign a new variation based on weights
  const totalWeight = testConfig.variations.reduce(
    (sum, variation) => sum + (variation.weight || 1),
    0,
  )

  // Generate a random number between 0 and totalWeight
  const random = Math.random() * totalWeight

  // Find the variation based on the random number
  let cumulativeWeight = 0
  for (const variation of testConfig.variations) {
    cumulativeWeight += variation.weight || 1
    if (random <= cumulativeWeight) {
      // Assign the variation
      const assignment: TestAssignment = {
        testId,
        variationId: variation.id,
        timestamp: new Date(),
      }

      // Save the assignment
      assignments[testId] = assignment
      saveAssignments(assignments)

      // Track the assignment
      trackABTestAssignment({
        testId,
        testName: testConfig.name,
        testType: testConfig.type,
        variationId: variation.id,
        variationName: variation.name,
      })

      return variation
    }
  }

  // Fallback to the first variation (control)
  return testConfig.variations[0]
}

/**
 * Track a conversion for a test
 * @param testId The test ID
 * @param conversionType The conversion type
 * @param metadata Additional metadata
 */
export const trackConversion = (
  testId: string,
  conversionType: string,
  metadata: Record<string, any> = {},
): void => {
  // Check if the user has an assignment for this test
  const assignments = getAssignments()
  if (!assignments[testId]) {
    return
  }

  // Track the conversion
  trackABTestConversion({
    testId,
    variationId: assignments[testId].variationId,
    conversionType,
    ...metadata,
  })
}

/**
 * Create a new A/B test
 * @param name The test name
 * @param type The test type
 * @param variations The test variations
 * @param startDate The test start date
 * @param endDate The test end date
 * @returns The test configuration
 */
export const createTest = (
  name: string,
  type: TestType,
  variations: Omit<TestVariation, 'id'>[],
  startDate: Date = new Date(),
  endDate?: Date,
): TestConfig => {
  // Generate IDs for the test and variations
  const testId = uuidv4()
  const variationsWithIds = variations.map((variation) => ({
    ...variation,
    id: uuidv4(),
  }))

  // Create the test configuration
  const testConfig: TestConfig = {
    id: testId,
    name,
    type,
    variations: variationsWithIds,
    startDate,
    endDate,
    isActive: true,
  }

  return testConfig
}

/**
 * Get the job description variation for a job
 * @param jobId The job ID
 * @param testConfig The test configuration
 * @param defaultDescription The default job description
 * @returns The job description variation
 */
export const getJobDescriptionVariation = (
  jobId: string,
  testConfig: TestConfig,
  defaultDescription: string,
): string => {
  // Get the assigned variation
  const variation = getAssignedVariation(`${testConfig.id}_${jobId}`, testConfig)

  // Return the variation content or the default description
  return variation.content || defaultDescription
}

/**
 * Get the apply button variation for a job
 * @param jobId The job ID
 * @param testConfig The test configuration
 * @param defaultButtonText The default button text
 * @returns The apply button variation
 */
export const getApplyButtonVariation = (
  jobId: string,
  testConfig: TestConfig,
  defaultButtonText: string,
): string => {
  // Get the assigned variation
  const variation = getAssignedVariation(`${testConfig.id}_${jobId}`, testConfig)

  // Return the variation content or the default button text
  return variation.content || defaultButtonText
}

/**
 * Track a job description view
 * @param testId The test ID
 * @param jobId The job ID
 */
export const trackJobDescriptionView = (testId: string, jobId: string): void => {
  trackConversion(`${testId}_${jobId}`, 'description_view', { jobId })
}

/**
 * Track an apply button click
 * @param testId The test ID
 * @param jobId The job ID
 */
export const trackApplyButtonClick = (testId: string, jobId: string): void => {
  trackConversion(`${testId}_${jobId}`, 'apply_click', { jobId })
}

/**
 * Track an application completion
 * @param testId The test ID
 * @param jobId The job ID
 */
export const trackApplicationCompletion = (testId: string, jobId: string): void => {
  trackConversion(`${testId}_${jobId}`, 'application_complete', { jobId })
}
