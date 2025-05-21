import { CollectionConfig } from 'payload'
// Remove slugify import and implement our own function
// Define a custom type for authenticated users with tenant and role
type AuthUser = {
  id: number
  role?: string
  tenant?: string | number
}
import { jobAdderIntegration } from '../plugins/ats/integrations/jobAdder'
import { bullhornIntegration } from '../plugins/ats/integrations/bullhorn'

// Simple slugify function to avoid dependency
const createSlug = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
}

const Jobs: CollectionConfig = {
  slug: 'jobs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'location', 'status', 'featured'],
  },
  hooks: {
    beforeValidate: [
      // Generate slug from title if not provided
      async ({ data }) => {
        if (data && !data.slug && data.title) {
          data.slug = createSlug(data.title)
        }
        return data
      },
    ],
    beforeChange: [
      // Set created_at on creation
      async ({ data, operation }) => {
        if (data && operation === 'create' && !data.created_at) {
          data.created_at = new Date()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        // Only sync published jobs
        if (doc.status !== 'published') {
          return
        }

        // Get tenant with ATS integrations
        const tenant = await req.payload.findByID({
          collection: 'tenants',
          id: doc.tenant,
        })

        if (!tenant) {
          return
        }

        // Sync with JobAdder if enabled
        if (tenant.features?.jobAdder && tenant.atsConfig?.jobAdder) {
          await jobAdderIntegration.syncJob(doc, {
            clientId: tenant.atsConfig.jobAdder.clientId || '',
            clientSecret: tenant.atsConfig.jobAdder.clientSecret || '',
          })
        }

        // Sync with Bullhorn if enabled
        if (tenant.features?.bullhorn && tenant.atsConfig?.bullhorn) {
          await bullhornIntegration.syncJob(doc, {
            apiKey: tenant.atsConfig.bullhorn.apiKey || '',
            clientId: tenant.atsConfig.bullhorn.clientId || '',
            clientSecret: tenant.atsConfig.bullhorn.clientSecret || '',
          })
        }
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      const typedUser = user as AuthUser
      console.log('Job access check:', {
        userId: user.id,
        userTenant: typedUser.tenant,
        role: typedUser.role,
      })

      // All users (including admins) can only read jobs from their tenant
      if (typedUser.tenant) {
        return {
          tenant: {
            equals: typedUser.tenant,
          },
        }
      }

      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      const typedUser = user as AuthUser

      // All users can only create jobs for their tenant
      return Boolean(typedUser.tenant)
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      const typedUser = user as AuthUser

      // All users (including admins) can only update jobs from their tenant
      if (typedUser.tenant) {
        return {
          tenant: {
            equals: typedUser.tenant,
          },
        }
      }

      return false
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      const typedUser = user as AuthUser

      // Only admins can delete jobs, but still only from their tenant
      if (typedUser.role === 'admin' && typedUser.tenant) {
        return {
          tenant: {
            equals: typedUser.tenant,
          },
        }
      }

      return false
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'URL-friendly version of the title (auto-generated if empty)',
      },
      hooks: {
        beforeValidate: [
          (args) => {
            if (args.value) {
              return createSlug(args.value)
            }
            if (args.data && args.data.title) {
              return createSlug(args.data.title)
            }
            return args.value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    // Now that the Sectors collection is registered, we can uncomment this field
    {
      name: 'sector',
      type: 'relationship',
      relationTo: 'sectors' as any, // Use type assertion to bypass TypeScript check
      admin: {
        position: 'sidebar',
        description: 'The industry sector this job belongs to',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        {
          label: 'Full-time',
          value: 'full-time',
        },
        {
          label: 'Part-time',
          value: 'part-time',
        },
        {
          label: 'Contract',
          value: 'contract',
        },
        {
          label: 'Temporary',
          value: 'temporary',
        },
      ],
      required: true,
    },
    {
      name: 'salary',
      type: 'group',
      fields: [
        {
          name: 'min',
          type: 'number',
        },
        {
          name: 'max',
          type: 'number',
        },
        {
          name: 'currency',
          type: 'text',
          defaultValue: 'AUD',
        },
        {
          name: 'period',
          type: 'select',
          options: [
            {
              label: 'Annual',
              value: 'annual',
            },
            {
              label: 'Hourly',
              value: 'hourly',
            },
          ],
          defaultValue: 'annual',
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured Job',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Display this job on the homepage',
      },
    },
    {
      name: 'apply_link',
      type: 'text',
      admin: {
        description: 'URL for job applications (used for tracking)',
      },
    },
    {
      name: 'expiry_date',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Date when this job should no longer be displayed',
        date: {
          pickerAppearance: 'dayAndTime',
          timeFormat: 'HH:mm',
        },
      },
    },
    {
      name: 'created_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'When this job was created',
        date: {
          pickerAppearance: 'dayAndTime',
          timeFormat: 'HH:mm',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
        {
          label: 'Closed',
          value: 'closed',
        },
      ],
      defaultValue: 'draft',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'atsData',
      type: 'group',
      fields: [
        {
          name: 'source',
          type: 'text',
          admin: {
            description: 'ATS source identifier (e.g., "jobadder", "bullhorn")',
            readOnly: true,
          },
        },
        {
          name: 'sourceId',
          type: 'text',
          admin: {
            description: 'ID in the source ATS system',
            readOnly: true,
          },
        },
        {
          name: 'sourceReference',
          type: 'text',
          admin: {
            description: 'Additional reference information from the ATS',
            readOnly: true,
          },
        },
        {
          name: 'lastSynced',
          type: 'date',
          admin: {
            description: 'When this job was last synced with the ATS',
            readOnly: true,
          },
        },
        // Keep existing fields for backward compatibility
        {
          name: 'jobAdderId',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'bullhornId',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
        // ATS-specific data objects
        {
          name: 'jobAdder',
          type: 'json',
          admin: {
            readOnly: true,
            description: 'JobAdder-specific data',
          },
        },
        {
          name: 'bullhorn',
          type: 'json',
          admin: {
            readOnly: true,
            description: 'Bullhorn-specific data',
          },
        },
      ],
      admin: {
        description: 'Data from the Applicant Tracking System',
      },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'keywords',
          type: 'text',
        },
      ],
      admin: {
        description: 'SEO metadata for this job',
      },
    },
    // Add AI enrichment fields
    {
      name: 'aiEnrichment',
      type: 'group',
      fields: [
        {
          name: 'insights',
          type: 'json',
          admin: {
            description: 'AI-generated insights about this job',
          },
        },
        {
          name: 'keywords',
          type: 'json',
          admin: {
            description: 'Extracted keywords and skills',
          },
        },
        {
          name: 'marketTrends',
          type: 'json',
          admin: {
            description: 'Market trends related to this job',
          },
        },
        {
          name: 'lastUpdated',
          type: 'date',
          admin: {
            description: 'When AI enrichment was last updated',
            readOnly: true,
          },
        },
      ],
      admin: {
        description: 'AI-generated insights and enrichment',
      },
    },
    // Add talent score fields
    {
      name: 'talentScore',
      type: 'group',
      fields: [
        {
          name: 'score',
          type: 'number',
          admin: {
            description: 'Overall talent score (0-100)',
          },
        },
        {
          name: 'factors',
          type: 'json',
          admin: {
            description: 'Factors contributing to the score',
          },
        },
        {
          name: 'recommendations',
          type: 'json',
          admin: {
            description: 'AI-generated recommendations',
          },
        },
        {
          name: 'lastUpdated',
          type: 'date',
          admin: {
            description: 'When talent score was last calculated',
            readOnly: true,
          },
        },
      ],
      admin: {
        description: 'Talent scoring and recommendations',
      },
    },
  ],
  // Fix index definitions - use the correct format
  indexes: [
    {
      fields: ['slug'],
    },
    {
      fields: ['featured'],
    },
    {
      fields: ['expiry_date'],
    },
    // Now that the sector field is added, we can uncomment this index
    {
      fields: ['sector'],
    },
    // Add index for AI enrichment
    {
      fields: ['aiEnrichment.lastUpdated'],
    },
    // Add index for talent score
    {
      fields: ['talentScore.score'],
    },
  ],
}

export default Jobs
