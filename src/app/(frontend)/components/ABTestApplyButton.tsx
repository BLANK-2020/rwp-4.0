'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  TestConfig,
  TestType,
  createTest,
  getApplyButtonVariation,
  trackApplyButtonClick,
} from '../../../lib/abTesting'

interface ABTestApplyButtonProps {
  jobId: string
  jobTitle: string
  href: string
  className?: string
  testId?: string
}

/**
 * A/B Test Apply Button Component
 *
 * This component displays an apply button with A/B testing.
 * It tests different button text variations to see which performs better.
 */
export const ABTestApplyButton: React.FC<ABTestApplyButtonProps> = ({
  jobId,
  jobTitle,
  href,
  className = 'inline-block bg-blue-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors',
  testId,
}) => {
  const [buttonText, setButtonText] = useState<string>('Apply Now')
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null)

  // Create or get the test configuration
  useEffect(() => {
    // If a test ID is provided, use it
    if (testId) {
      // In a real application, you would fetch the test configuration from an API
      // For now, we'll just create a new test
      const newTestConfig = createTest(`Apply Button Test for ${jobTitle}`, TestType.APPLY_BUTTON, [
        {
          name: 'Control',
          content: 'Apply Now',
          weight: 1,
        },
        {
          name: 'Variation 1',
          content: 'Submit Application',
          weight: 1,
        },
        {
          name: 'Variation 2',
          content: `Apply for ${jobTitle}`,
          weight: 1,
        },
        {
          name: 'Variation 3',
          content: 'Start Application',
          weight: 1,
        },
      ])

      setTestConfig(newTestConfig)

      // Get the button text variation
      const variation = getApplyButtonVariation(jobId, newTestConfig, 'Apply Now')
      setButtonText(variation)
    }
  }, [jobId, jobTitle, testId])

  // Handle the apply button click
  const handleClick = () => {
    if (testConfig) {
      // Track the apply button click
      trackApplyButtonClick(testConfig.id, jobId)
    }
  }

  return (
    <Link href={href} className={className} onClick={handleClick} data-testid="apply-button">
      {buttonText}
    </Link>
  )
}

/**
 * A/B Test Apply Button with Custom Styles
 *
 * This component tests different button styles in addition to text variations.
 */
export const ABTestStyledApplyButton: React.FC<ABTestApplyButtonProps> = ({
  jobId,
  jobTitle,
  href,
  testId,
}) => {
  const [buttonStyle, setButtonStyle] = useState<string>(
    'inline-block bg-blue-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors',
  )
  const [buttonText, setButtonText] = useState<string>('Apply Now')
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null)

  // Create or get the test configuration
  useEffect(() => {
    // If a test ID is provided, use it
    if (testId) {
      // In a real application, you would fetch the test configuration from an API
      // For now, we'll just create a new test
      const newTestConfig = createTest(
        `Apply Button Style Test for ${jobTitle}`,
        TestType.APPLY_BUTTON,
        [
          {
            name: 'Blue Button',
            content: JSON.stringify({
              text: 'Apply Now',
              style:
                'inline-block bg-blue-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors',
            }),
            weight: 1,
          },
          {
            name: 'Green Button',
            content: JSON.stringify({
              text: 'Apply Now',
              style:
                'inline-block bg-green-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-600 transition-colors',
            }),
            weight: 1,
          },
          {
            name: 'Red Button',
            content: JSON.stringify({
              text: 'Apply Today',
              style:
                'inline-block bg-red-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-600 transition-colors',
            }),
            weight: 1,
          },
          {
            name: 'Outlined Button',
            content: JSON.stringify({
              text: 'Submit Application',
              style:
                'inline-block border-2 border-blue-500 text-blue-500 px-6 py-3 rounded-md font-semibold hover:bg-blue-50 transition-colors',
            }),
            weight: 1,
          },
        ],
      )

      setTestConfig(newTestConfig)

      // Get the button variation
      const variation = getApplyButtonVariation(
        jobId,
        newTestConfig,
        JSON.stringify({
          text: 'Apply Now',
          style:
            'inline-block bg-blue-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors',
        }),
      )

      try {
        const parsedVariation = JSON.parse(variation)
        setButtonText(parsedVariation.text)
        setButtonStyle(parsedVariation.style)
      } catch (error) {
        console.error('Error parsing button variation:', error)
      }
    }
  }, [jobId, jobTitle, testId])

  // Handle the apply button click
  const handleClick = () => {
    if (testConfig) {
      // Track the apply button click
      trackApplyButtonClick(testConfig.id, jobId)
    }
  }

  return (
    <Link
      href={href}
      className={buttonStyle}
      onClick={handleClick}
      data-testid="styled-apply-button"
    >
      {buttonText}
    </Link>
  )
}
