import { CollectionConfig } from 'payload'

const Analytics: CollectionConfig = {
  slug: 'analytics',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'tenant', 'period', 'createdAt'],
    description: 'Job analytics and insights',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false

      // Admin users can read all analytics
      if (user.role === 'admin') return true

      // Other users can only read analytics for their tenant
      if (user.tenant) {
        return {
          tenant: {
            equals: user.tenant,
          },
        }
      }

      return false
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false

      // Admin users can update all analytics
      if (user.role === 'admin') return true

      // Other users can only update analytics for their tenant
      if (user.tenant) {
        return {
          tenant: {
            equals: user.tenant,
          },
        }
      }

      return false
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of this analytics report',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Tenant this analytics belongs to',
      },
    },
    {
      name: 'period',
      type: 'select',
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Annual', value: 'annual' },
        { label: 'Custom', value: 'custom' },
      ],
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Time period for this analytics report',
      },
    },
    {
      name: 'dateRange',
      type: 'group',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
              timeFormat: 'HH:mm',
            },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
              timeFormat: 'HH:mm',
            },
          },
        },
      ],
      admin: {
        description: 'Date range for this analytics report',
      },
    },
    {
      name: 'metrics',
      type: 'json',
      required: true,
      admin: {
        description: 'Analytics metrics data',
      },
    },
    {
      name: 'insights',
      type: 'json',
      admin: {
        description: 'AI-generated insights',
      },
    },
    {
      name: 'jobMetrics',
      type: 'group',
      fields: [
        {
          name: 'totalJobs',
          type: 'number',
          admin: {
            description: 'Total number of jobs',
          },
        },
        {
          name: 'activeJobs',
          type: 'number',
          admin: {
            description: 'Number of active jobs',
          },
        },
        {
          name: 'averageScore',
          type: 'number',
          admin: {
            description: 'Average talent score',
          },
        },
        {
          name: 'topSkills',
          type: 'json',
          admin: {
            description: 'Most requested skills',
          },
        },
        {
          name: 'jobsByType',
          type: 'json',
          admin: {
            description: 'Jobs broken down by type',
          },
        },
        {
          name: 'jobsBySector',
          type: 'json',
          admin: {
            description: 'Jobs broken down by sector',
          },
        },
      ],
      admin: {
        description: 'Job-related metrics',
      },
    },
    {
      name: 'performanceMetrics',
      type: 'group',
      fields: [
        {
          name: 'viewCount',
          type: 'number',
          admin: {
            description: 'Total job views',
          },
        },
        {
          name: 'applicationCount',
          type: 'number',
          admin: {
            description: 'Total job applications',
          },
        },
        {
          name: 'conversionRate',
          type: 'number',
          admin: {
            description: 'View to application conversion rate',
          },
        },
        {
          name: 'timeToFill',
          type: 'number',
          admin: {
            description: 'Average time to fill (days)',
          },
        },
        {
          name: 'performanceByJob',
          type: 'json',
          admin: {
            description: 'Performance metrics by job',
          },
        },
      ],
      admin: {
        description: 'Performance metrics',
      },
    },
    {
      name: 'marketInsights',
      type: 'group',
      fields: [
        {
          name: 'marketTrends',
          type: 'json',
          admin: {
            description: 'Market trends',
          },
        },
        {
          name: 'competitorAnalysis',
          type: 'json',
          admin: {
            description: 'Competitor analysis',
          },
        },
        {
          name: 'salaryBenchmarks',
          type: 'json',
          admin: {
            description: 'Salary benchmarks',
          },
        },
      ],
      admin: {
        description: 'Market insights',
      },
    },
    {
      name: 'reportConfig',
      type: 'json',
      admin: {
        description: 'Configuration for report generation',
      },
    },
    {
      name: 'generatedReport',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Generated report file',
      },
    },
  ],
  timestamps: true,
  indexes: [
    {
      fields: ['tenant'],
    },
    {
      fields: ['period'],
    },
    {
      fields: ['dateRange.startDate'],
    },
    {
      fields: ['dateRange.endDate'],
    },
  ],
}

export default Analytics
