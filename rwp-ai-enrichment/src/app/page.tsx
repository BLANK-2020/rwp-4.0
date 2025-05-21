'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading')

  // Check API status on component mount
  useState(() => {
    const checkApiStatus = async () => {
      try {
        // Simple health check to see if the API is running
        const response = await fetch('/api/health')
        if (response.ok) {
          setApiStatus('online')
        } else {
          setApiStatus('offline')
        }
      } catch (error) {
        setApiStatus('offline')
      }
    }

    checkApiStatus()
  })

  return (
    <main className="container">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold mb-4">RWP AI Enrichment Service</h1>
        <p className="text-lg mb-4">AI-powered data enrichment and analysis for RWP 4.0</p>
        <div className="flex justify-between items-center mt-4">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">API Status</h2>
            <div className="flex items-center">
              <div
                className={`w-4 h-4 rounded-full mr-2 ${
                  apiStatus === 'online'
                    ? 'bg-green-500'
                    : apiStatus === 'loading'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              ></div>
              <span>
                {apiStatus === 'online'
                  ? 'API is online'
                  : apiStatus === 'loading'
                    ? 'Checking API status...'
                    : 'API is offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">CV Parsing</h2>
          <p className="mb-4">
            Extract structured data from resumes and CVs using advanced AI techniques.
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>Skills extraction</li>
            <li>Experience analysis</li>
            <li>Education verification</li>
            <li>Contact information extraction</li>
          </ul>
          <div className="text-primary">POST /api/candidates/enrich</div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">TalentScore</h2>
          <p className="mb-4">Generate comprehensive talent scores based on candidate profiles.</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Technical skills assessment</li>
            <li>Domain expertise evaluation</li>
            <li>Leadership potential</li>
            <li>Communication skills</li>
          </ul>
          <div className="text-primary">POST /api/candidates/score</div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Benchmark Templates</h2>
          <p className="mb-4">Create and manage benchmark templates for candidate evaluation.</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Customizable scoring rules</li>
            <li>Industry-specific templates</li>
            <li>Role-based evaluation criteria</li>
            <li>Skill and experience weighting</li>
          </ul>
          <div className="text-primary">GET/POST /api/benchmarks</div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Benchmark Evaluation</h2>
          <p className="mb-4">
            Compare candidates against benchmark templates for objective evaluation.
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>Detailed match analysis</li>
            <li>Strength and gap identification</li>
            <li>Tier classification</li>
            <li>Development recommendations</li>
          </ul>
          <div className="text-primary">POST /api/benchmarks/evaluate</div>
        </div>
      </div>

      <div className="card mt-4">
        <h2 className="text-xl font-bold mb-4">Privacy & Compliance</h2>
        <p className="mb-4">
          The RWP AI Enrichment Service is designed with privacy and compliance in mind:
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li>Data minimization and purpose limitation</li>
          <li>Explicit consent management</li>
          <li>Comprehensive access logging</li>
          <li>Automated data retention policies</li>
          <li>Data subject rights support (access, deletion, portability)</li>
        </ul>
      </div>

      <footer className="mt-4 text-center text-gray-500">
        <p>© {new Date().getFullYear()} RWP 4.0 Platform</p>
      </footer>
    </main>
  )
}
