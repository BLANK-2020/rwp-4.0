import { CollectionConfig } from 'payload'
import slugify from 'slugify'
// Define a custom type for authenticated users with tenant and role
type AuthUser = {
  id: number
  role?: string
  tenant?: string | number
}
import { jobAdderIntegration } from '../plugins/ats/integrations/jobAdder'
import { bullhornIntegration } from '../plugins/ats/integrations/bullhorn'

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
        if (!data.slug && data.title) {
          data.slug = slugify(data.title, { lower: true, strict: true })
        }
        return data
      },
    ],
    beforeChange: [
      // Set created_at on creation
      async ({ data, operation }) => {
        if (operation === 'create' && !data.created_at) {
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
            clientId: tenant.atsConfig.jobAdder.clientId,
            clientSecret: tenant.atsConfig.jobAdder.clientSecret,
          })
        }

        // Sync with Bullhorn if enabled
        if (tenant.features?.bullhorn && tenant.atsConfig?.bullhorn) {
          await bullhornIntegration.syncJob(doc, {
            apiKey: tenant.atsConfig.bullhorn.apiKey,
            clientId: tenant.atsConfig.bullhorn.clientId,
            clientSecret: tenant.atsConfig.bullhorn.clientSecret,
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
              return slugify(args.value, { lower: true, strict: true })
            }
            if (args.data.title) {
              return slugify(args.data.title, { lower: true, strict: true })
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
    {
      name: 'sector',
      type: 'relationship',
      relationTo: 'sectors',
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
  ],
  indexes: [
    {
      name: 'slug_index',
      fields: ['slug'],
    },
    {
      name: 'featured_index',
      fields: ['featured'],
    },
    {
      name: 'expiry_date_index',
      fields: ['expiry_date'],
    },
    {
      name: 'sector_index',
      fields: ['sector'],
    },
  ],
}

export default Jobs
