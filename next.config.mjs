import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  output: 'standalone',

  // Add transpilation for chart.js and react-chartjs-2
  transpilePackages: ['chart.js', 'react-chartjs-2'],

  // Ensure we can use client components
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
