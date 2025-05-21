'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import JobSearchBar from './components/JobSearchBar'

export default function HomePage() {
  // Handle search from the home page
  const handleSearch = (query: string, location: string, jobType: string) => {
    // The search is handled by the JobSearchBar component
    // which updates the URL parameters and navigates to the jobs page
  }

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Find Your Dream Job Today</h1>
            <p className="text-xl mb-8">
              Discover thousands of job opportunities with top employers. Your next career move is
              just a search away.
            </p>

            {/* Search bar */}
            <div className="mt-8">
              <JobSearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>
      </section>

      {/* Featured job categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Job Categories</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Technology', icon: '💻', count: 1250 },
              { title: 'Finance', icon: '💰', count: 870 },
              { title: 'Healthcare', icon: '🏥', count: 930 },
              { title: 'Marketing', icon: '📊', count: 650 },
              { title: 'Education', icon: '🎓', count: 540 },
              { title: 'Design', icon: '🎨', count: 320 },
              { title: 'Engineering', icon: '⚙️', count: 760 },
              { title: 'Customer Service', icon: '🤝', count: 480 },
            ].map((category, index) => (
              <Link
                key={index}
                href={`/jobs?category=${category.title.toLowerCase()}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                <p className="text-blue-600">{category.count} jobs</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/jobs"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
            >
              Browse all categories
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured employers */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Employers</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {['Acme Inc.', 'TechCorp', 'DesignHub', 'DataWorks', 'CloudTech', 'MediHealth'].map(
              (employer, index) => (
                <div key={index} className="flex items-center justify-center">
                  <div className="h-20 w-40 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="font-semibold text-gray-700">{employer}</span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Find Your Next Opportunity?</h2>
            <p className="text-xl text-gray-700 mb-8">
              Browse thousands of jobs from top employers and find the perfect match for your skills
              and experience.
            </p>
            <Link
              href="/jobs"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-md transition-colors"
            >
              Search Jobs Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
