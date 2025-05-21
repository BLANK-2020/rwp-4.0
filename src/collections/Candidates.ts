import { CollectionConfig } from 'payload'

// Define a custom type for authenticated users with tenant and role
type AuthUser = {
  id: number
  role?: string
  tenant?: string | number
}

const Candidates: CollectionConfig = {
  slug: 'candidates',
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: ['firstName', 'lastName', 'email', 'status'],
  },
  hooks: {
    beforeChange: [
      // Set created_at on creation
      async ({ data, operation }) => {
        if (data && operation === 'create' && !data.createdAt) {
          data.createdAt = new Date()
        }
        return data
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      const typedUser = user as AuthUser

      // All users (including admins) can only read candidates from their tenant
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

      // All users can only create candidates for their tenant
      return Boolean(typedUser.tenant)
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      const typedUser = user as AuthUser

      // All users (including admins) can only update candidates from their tenant
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

      // Only admins can delete candidates, but still only from their tenant
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
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Inactive',
          value: 'inactive',
        },
        {
          label: 'Placed',
          value: 'placed',
        },
      ],
      defaultValue: 'active',
      required: true,
    },
    {
      name: 'resume',
      type: 'richText',
    },
    {
      name: 'skills',
      type: 'array',
      fields: [
        {
          name: 'skill',
          type: 'text',
        },
      ],
    },
    {
      name: 'experiences',
      type: 'array',
      fields: [
        {
          name: 'jobTitle',
          type: 'text',
          required: true,
        },
        {
          name: 'employer',
          type: 'text',
          required: true,
        },
        {
          name: 'startDate',
          type: 'date',
          required: true,
        },
        {
          name: 'endDate',
          type: 'date',
        },
        {
          name: 'isCurrent',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'responsibilities',
          type: 'array',
          fields: [
            {
              name: 'responsibility',
              type: 'text',
            },
          ],
        },
        {
          name: 'achievements',
          type: 'array',
          fields: [
            {
              name: 'achievement',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'education',
      type: 'array',
      fields: [
        {
          name: 'institution',
          type: 'text',
          required: true,
        },
        {
          name: 'qualification',
          type: 'text',
          required: true,
        },
        {
          name: 'field',
          type: 'text',
          required: true,
        },
        {
          name: 'startDate',
          type: 'date',
        },
        {
          name: 'endDate',
          type: 'date',
        },
        {
          name: 'isCompleted',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'placements',
      type: 'array',
      fields: [
        {
          name: 'jobTitle',
          type: 'text',
          required: true,
        },
        {
          name: 'employer',
          type: 'text',
          required: true,
        },
        {
          name: 'startDate',
          type: 'date',
          required: true,
        },
        {
          name: 'endDate',
          type: 'date',
        },
        {
          name: 'status',
          type: 'select',
          options: [
            {
              label: 'Active',
              value: 'active',
            },
            {
              label: 'Completed',
              value: 'completed',
            },
            {
              label: 'Cancelled',
              value: 'cancelled',
            },
          ],
          defaultValue: 'active',
        },
        {
          name: 'feedback',
          type: 'textarea',
        },
        {
          name: 'rating',
          type: 'number',
          min: 1,
          max: 5,
        },
      ],
    },
    {
      name: 'currentJobTitle',
      type: 'text',
    },
    {
      name: 'currentEmployer',
      type: 'text',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'workRights',
      type: 'text',
    },
    {
      name: 'availability',
      type: 'text',
    },
    {
      name: 'salaryExpectation',
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
      name: 'workTypes',
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
      hasMany: true,
    },
    {
      name: 'preferredLocations',
      type: 'array',
      fields: [
        {
          name: 'location',
          type: 'text',
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'source',
      type: 'text',
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'When this candidate was created',
        date: {
          pickerAppearance: 'dayAndTime',
          timeFormat: 'HH:mm',
        },
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'When this candidate was last updated',
        date: {
          pickerAppearance: 'dayAndTime',
          timeFormat: 'HH:mm',
        },
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
            description: 'When this candidate was last synced with the ATS',
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
    // Privacy and compliance fields
    {
      name: 'dataUsageConsent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether candidate has consented to data usage',
      },
    },
    {
      name: 'dataRetentionDate',
      type: 'date',
      admin: {
        description: 'When data should be deleted/anonymized',
      },
    },
    {
      name: 'dataSharingPreferences',
      type: 'group',
      fields: [
        {
          name: 'allowInternalUse',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'allowAnonymizedAnalytics',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'allowThirdPartySharing',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'specificRestrictions',
          type: 'array',
          fields: [
            {
              name: 'restriction',
              type: 'text',
            },
          ],
        },
      ],
    },
    // AI Enrichment fields
    {
      name: 'aiEnrichment',
      type: 'group',
      fields: [
        {
          name: 'status',
          type: 'select',
          options: [
            {
              label: 'Pending',
              value: 'pending',
            },
            {
              label: 'Completed',
              value: 'completed',
            },
            {
              label: 'Failed',
              value: 'failed',
            },
          ],
          defaultValue: 'pending',
        },
        {
          name: 'lastProcessed',
          type: 'date',
        },
        {
          name: 'extractedSkills',
          type: 'array',
          fields: [
            {
              name: 'skill',
              type: 'text',
            },
          ],
        },
        {
          name: 'skillCategories',
          type: 'array',
          fields: [
            {
              name: 'category',
              type: 'text',
            },
          ],
        },
        {
          name: 'experienceSummary',
          type: 'json',
        },
        {
          name: 'educationSummary',
          type: 'json',
        },
        {
          name: 'personalityTraits',
          type: 'array',
          fields: [
            {
              name: 'trait',
              type: 'text',
            },
          ],
        },
        {
          name: 'communicationStyle',
          type: 'text',
        },
        {
          name: 'leadershipPotential',
          type: 'number',
          min: 0,
          max: 100,
        },
        {
          name: 'teamFitMetrics',
          type: 'json',
        },
        {
          name: 'enrichmentVersion',
          type: 'text',
        },
        {
          name: 'confidenceScore',
          type: 'number',
          min: 0,
          max: 1,
        },
      ],
    },
    // Benchmark-related fields
    {
      name: 'benchmarkScores',
      type: 'group',
      fields: [
        {
          name: 'technicalSkills',
          type: 'number',
          min: 0,
          max: 100,
        },
        {
          name: 'domainExpertise',
          type: 'number',
          min: 0,
          max: 100,
        },
        {
          name: 'culturalFit',
          type: 'number',
          min: 0,
          max: 100,
        },
        {
          name: 'leadershipCapability',
          type: 'number',
          min: 0,
          max: 100,
        },
        {
          name: 'communicationSkills',
          type: 'number',
          min: 0,
          max: 100,
        },
        {
          name: 'problemSolving',
          type: 'number',
          min: 0,
          max: 100,
        },
        {
          name: 'adaptability',
          type: 'number',
          min: 0,
          max: 100,
        },
        {
          name: 'lastBenchmarked',
          type: 'date',
        },
        {
          name: 'benchmarkTemplateId',
          type: 'text',
        },
      ],
    },
    {
      name: 'overallScore',
      type: 'number',
      min: 0,
      max: 100,
    },
    {
      name: 'tier',
      type: 'select',
      options: [
        {
          label: 'A',
          value: 'A',
        },
        {
          label: 'B',
          value: 'B',
        },
        {
          label: 'C',
          value: 'C',
        },
        {
          label: 'Premium',
          value: 'Premium',
        },
        {
          label: 'Standard',
          value: 'Standard',
        },
        {
          label: 'Basic',
          value: 'Basic',
        },
      ],
    },
    {
      name: 'strengths',
      type: 'array',
      fields: [
        {
          name: 'strength',
          type: 'text',
        },
      ],
    },
    {
      name: 'developmentAreas',
      type: 'array',
      fields: [
        {
          name: 'area',
          type: 'text',
        },
      ],
    },
    {
      name: 'matchingMetrics',
      type: 'group',
      fields: [
        {
          name: 'jobFitScores',
          type: 'array',
          fields: [
            {
              name: 'jobId',
              type: 'text',
            },
            {
              name: 'score',
              type: 'number',
              min: 0,
              max: 100,
            },
            {
              name: 'matchReasons',
              type: 'array',
              fields: [
                {
                  name: 'reason',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          name: 'sectorAffinities',
          type: 'array',
          fields: [
            {
              name: 'sector',
              type: 'text',
            },
            {
              name: 'score',
              type: 'number',
              min: 0,
              max: 100,
            },
          ],
        },
        {
          name: 'roleTypeMatches',
          type: 'array',
          fields: [
            {
              name: 'roleType',
              type: 'text',
            },
            {
              name: 'score',
              type: 'number',
              min: 0,
              max: 100,
            },
          ],
        },
      ],
    },
  ],
  indexes: [
    {
      fields: ['email'],
    },
    {
      fields: ['atsData.sourceId'],
    },
    {
      fields: ['tenant'],
    },
  ],
}

export default Candidates
