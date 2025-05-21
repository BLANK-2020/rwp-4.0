import { CollectionConfig } from 'payload'

const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'job', 'timestamp', 'tenant'],
  },
  access: {
    // Only allow admins to access events directly
    // Events will be created via API endpoints
    read: ({ req: { user } }) => {
      if (!user) return false

      if (user.role === 'admin') {
        if (user.tenant) {
          return {
            tenant: {
              equals: user.tenant,
            },
          }
        }
        return true
      }

      return false
    },
    create: ({ req: { user } }) => {
      // Allow creation via API endpoints
      return true
    },
    update: ({ req: { user } }) => {
      if (!user) return false

      if (user.role === 'admin') {
        if (user.tenant) {
          return {
            tenant: {
              equals: user.tenant,
            },
          }
        }
        return true
      }

      return false
    },
    delete: ({ req: { user } }) => {
      if (!user) return false

      if (user.role === 'admin') {
        if (user.tenant) {
          return {
            tenant: {
              equals: user.tenant,
            },
          }
        }
        return true
      }

      return false
    },
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      options: [
        {
          label: 'Job Viewed',
          value: 'job_viewed',
        },
        {
          label: 'Apply Started',
          value: 'apply_started',
        },
        {
          label: 'Apply Completed',
          value: 'apply_completed',
        },
        {
          label: 'Retarget Triggered',
          value: 'retarget_triggered',
        },
      ],
      required: true,
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
    {
      name: 'job',
      type: 'relationship',
      relationTo: 'jobs',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      // Not required as events can be from anonymous users
    },
    {
      name: 'sessionId',
      type: 'text',
      required: true,
    },
    {
      name: 'source',
      type: 'text',
      // UTM source
    },
    {
      name: 'medium',
      type: 'text',
      // UTM medium
    },
    {
      name: 'campaign',
      type: 'text',
      // UTM campaign
    },
    {
      name: 'referrer',
      type: 'text',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional event-specific data',
      },
    },
  ],
  indexes: [
    {
      fields: ['type'],
    },
    {
      fields: ['job'],
    },
    {
      fields: ['sessionId'],
    },
    {
      fields: ['timestamp'],
    },
    {
      fields: ['tenant'],
    },
  ],
}

export default Events
