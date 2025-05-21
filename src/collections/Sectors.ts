import { CollectionConfig } from 'payload'

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

const Sectors: CollectionConfig = {
  slug: 'sectors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'tenant'],
  },
  access: {
    // Similar tenant-based access control as Jobs collection
    read: ({ req: { user } }) => {
      if (!user) return false

      if (user.role === 'admin') {
        return true // Admins can read all sectors
      }

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
      if (!user) return false
      return Boolean(user.tenant)
    },
    update: ({ req: { user } }) => {
      if (!user) return false

      if (user.role === 'admin') {
        return true // Admins can update all sectors
      }

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
      if (!user) return false

      if (user.role === 'admin' && user.tenant) {
        return {
          tenant: {
            equals: user.tenant,
          },
        }
      }

      return false
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'URL-friendly version of the name (auto-generated if empty)',
      },
      hooks: {
        beforeValidate: [
          (args) => {
            if (args.value) {
              return createSlug(args.value)
            }
            if (args.data && args.data.name) {
              return createSlug(args.data.name)
            }
            return args.value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
    // Uncomment the self-referential relationship now that the collection is registered
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'sectors' as any, // Use type assertion to bypass TypeScript check
      admin: {
        position: 'sidebar',
        description: 'Parent sector (for hierarchical categorization)',
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
        description: 'SEO metadata for this sector',
      },
    },
  ],
  indexes: [
    {
      fields: ['slug'],
      unique: true,
    },
    // Uncomment the parent index now that the parent field is uncommented
    {
      fields: ['parent'],
    },
    {
      fields: ['tenant'],
    },
  ],
}

export default Sectors
