import { CollectionConfig } from 'payload'
import { User } from '../payload-types'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' })
  : undefined

const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Create or update Stripe customer
        if (stripe && !data.subscription?.stripeCustomerId && data.email && data.name) {
          const customer = await stripe.customers.create({
            email: data.email,
            name: data.name,
            metadata: {
              tenantId: data.id || '',
            },
          })
          data.subscription = {
            ...data.subscription,
            stripeCustomerId: customer.id,
          }
        }

        // Create or update subscription
        if (stripe && data.subscription?.plan && data.subscription?.stripeCustomerId) {
          const priceId = process.env[`STRIPE_${data.subscription.plan.toUpperCase()}_PRICE_ID`]
          if (!priceId) {
            throw new Error(`No price ID found for plan: ${data.subscription.plan}`)
          }

          if (!data.subscription.stripeSubscriptionId) {
            const subscription = await stripe.subscriptions.create({
              customer: data.subscription.stripeCustomerId,
              items: [{ price: priceId }],
              metadata: {
                tenantId: data.id || '',
              },
            })
            data.subscription = {
              ...data.subscription,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
            }
          } else {
            const subscription = await stripe.subscriptions.update(
              data.subscription.stripeSubscriptionId,
              {
                items: [{ price: priceId }],
              },
            )
            data.subscription = {
              ...data.subscription,
              status: subscription.status,
            }
          }
        }

        return data
      },
    ],
  },
  // Access control: enforce tenant isolation
  // - Only admins can create or delete tenants
  // - Only admins or users belonging to the tenant can read or update their own tenant
  // - No cross-tenant access allowed
  access: {
    read: ({ req: { user }, id }) => {
      if (!user) return false
      const typedUser = user as User
      return typedUser.role === 'admin' || typedUser.tenant === id
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      const typedUser = user as User
      return typedUser.role === 'admin'
    },
    update: ({ req: { user }, id }) => {
      if (!user) return false
      const typedUser = user as User
      return typedUser.role === 'admin' || typedUser.tenant === id
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      const typedUser = user as User
      return typedUser.role === 'admin'
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
      required: true,
      unique: true,
    },
    // Custom domain for tenant-specific routing
    {
      name: 'customDomain',
      type: 'text',
      unique: true,
      admin: {
        description: 'The custom domain for this tenant (e.g., www.clientname.com.au)',
      },
    },
    // Branding configuration for tenant websites
    {
      name: 'brandingConfig',
      type: 'group',
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media', // assumes a Media collection exists
        },
        {
          name: 'primaryColor',
          type: 'text',
        },
        {
          name: 'secondaryColor',
          type: 'text',
        },
      ],
    },
    {
      name: 'subscription',
      type: 'group',
      fields: [
        {
          name: 'plan',
          type: 'select',
          required: true,
          options: [
            {
              label: 'Core',
              value: 'core',
            },
            {
              label: 'Pro',
              value: 'pro',
            },
            {
              label: 'Enterprise',
              value: 'enterprise',
            },
          ],
          defaultValue: 'core',
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: [
            {
              label: 'Active',
              value: 'active',
            },
            {
              label: 'Past Due',
              value: 'past_due',
            },
            {
              label: 'Canceled',
              value: 'canceled',
            },
          ],
          defaultValue: 'active',
        },
        {
          name: 'stripeCustomerId',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'stripeSubscriptionId',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'features',
      type: 'group',
      fields: [
        {
          name: 'jobAdder',
          type: 'checkbox',
          label: 'JobAdder Integration',
          defaultValue: false,
        },
        {
          name: 'bullhorn',
          type: 'checkbox',
          label: 'Bullhorn Integration',
          defaultValue: false,
        },
        {
          name: 'advancedAnalytics',
          type: 'checkbox',
          label: 'Advanced Analytics',
          defaultValue: false,
        },
        {
          name: 'customBranding',
          type: 'checkbox',
          label: 'Custom Branding',
          defaultValue: false,
        },
        {
          name: 'marketingPixels',
          type: 'checkbox',
          label: 'Marketing Pixels',
          defaultValue: false,
        },
        {
          name: 'retargeting',
          type: 'checkbox',
          label: 'Retargeting Campaigns',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'atsConfig',
      type: 'group',
      fields: [
        {
          name: 'jobAdder',
          type: 'group',
          admin: {
            condition: (data: { features?: { jobAdder?: boolean } }) =>
              Boolean(data?.features?.jobAdder),
          },
          fields: [
            {
              name: 'clientId',
              type: 'text',
            },
            {
              name: 'clientSecret',
              type: 'text',
            },
            {
              name: 'accessToken',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'OAuth access token (managed automatically)',
              },
            },
            {
              name: 'refreshToken',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'OAuth refresh token (managed automatically)',
              },
            },
            {
              name: 'tokenExpiry',
              type: 'date',
              admin: {
                readOnly: true,
                description: 'OAuth token expiry date (managed automatically)',
              },
            },
          ],
        },
        {
          name: 'bullhorn',
          type: 'group',
          admin: {
            condition: (data: { features?: { bullhorn?: boolean } }) =>
              Boolean(data?.features?.bullhorn),
          },
          fields: [
            {
              name: 'apiKey',
              type: 'text',
            },
            {
              name: 'clientId',
              type: 'text',
            },
            {
              name: 'clientSecret',
              type: 'text',
            },
          ],
        },
      ],
    },
    // Marketing Pixel Configuration
    {
      name: 'marketingConfig',
      type: 'group',
      admin: {
        condition: (data: { features?: { marketingPixels?: boolean } }) =>
          Boolean(data?.features?.marketingPixels),
        description: 'Configure marketing pixels and tracking for this tenant',
      },
      fields: [
        {
          name: 'facebookPixel',
          type: 'group',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Enable Facebook Pixel',
              defaultValue: false,
            },
            {
              name: 'pixelId',
              type: 'text',
              admin: {
                condition: (data) => Boolean(data?.enabled),
                description: 'Facebook Pixel ID (e.g., 123456789012345)',
              },
            },
            {
              name: 'advancedMatching',
              type: 'checkbox',
              label: 'Enable Advanced Matching',
              defaultValue: false,
              admin: {
                condition: (data) => Boolean(data?.enabled),
              },
            },
          ],
        },
        {
          name: 'googleTagManager',
          type: 'group',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Enable Google Tag Manager',
              defaultValue: false,
            },
            {
              name: 'containerId',
              type: 'text',
              admin: {
                condition: (data) => Boolean(data?.enabled),
                description: 'GTM Container ID (e.g., GTM-XXXXXXX)',
              },
            },
          ],
        },
        {
          name: 'linkedInInsightTag',
          type: 'group',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Enable LinkedIn Insight Tag',
              defaultValue: false,
            },
            {
              name: 'partnerId',
              type: 'text',
              admin: {
                condition: (data) => Boolean(data?.enabled),
                description: 'LinkedIn Partner ID (e.g., 123456)',
              },
            },
          ],
        },
        {
          name: 'googleAnalytics',
          type: 'group',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Enable Google Analytics',
              defaultValue: false,
            },
            {
              name: 'measurementId',
              type: 'text',
              admin: {
                condition: (data) => Boolean(data?.enabled),
                description: 'GA4 Measurement ID (e.g., G-XXXXXXXXXX)',
              },
            },
          ],
        },
      ],
    },
    // Retargeting Configuration
    {
      name: 'retargetingConfig',
      type: 'group',
      admin: {
        condition: (data: { features?: { retargeting?: boolean } }) =>
          Boolean(data?.features?.retargeting),
        description: 'Configure retargeting campaigns for this tenant',
      },
      fields: [
        {
          name: 'abandonedApplicationWindow',
          type: 'number',
          label: 'Abandoned Application Window (minutes)',
          defaultValue: 60,
          admin: {
            description: 'Time window to consider an application abandoned (in minutes)',
          },
        },
        {
          name: 'retargetingDelay',
          type: 'number',
          label: 'Retargeting Delay (hours)',
          defaultValue: 24,
          admin: {
            description: 'Delay before sending retargeting emails (in hours)',
          },
        },
        {
          name: 'maxRetargetingAttempts',
          type: 'number',
          label: 'Max Retargeting Attempts',
          defaultValue: 3,
          admin: {
            description: 'Maximum number of retargeting attempts per user',
          },
        },
        {
          name: 'emailTemplate',
          type: 'textarea',
          admin: {
            description: 'Email template for retargeting (supports variables like {{jobTitle}})',
          },
        },
      ],
    },
  ],
}

export default Tenants
