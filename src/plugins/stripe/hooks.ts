import { CollectionBeforeChangeHook } from 'payload';
import Stripe from 'stripe';
import { Tenant } from '../../payload-types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

// Define a custom interface instead of extending Tenant
interface TenantData {
  id: string;
  name: string;
  email: string;
  subscription?: {
    plan?: 'core' | 'pro' | 'enterprise';
    status?: 'active' | 'past_due' | 'canceled';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  [key: string]: any; // Allow other properties
}

export const stripeHooks = (stripe: Stripe) => ({
  'tenants.beforeChange': (async ({ data, req }) => {
    const tenantData = data as TenantData;

    // Initialize subscription object if it doesn't exist
    if (!tenantData.subscription) {
      tenantData.subscription = {};
    }

    // Create or update Stripe customer
    if (!tenantData.subscription.stripeCustomerId && tenantData.email && tenantData.name) {
      const customer = await stripe.customers.create({
        email: tenantData.email,
        name: tenantData.name,
        metadata: {
          tenantId: tenantData.id,
        },
      });
      tenantData.subscription.stripeCustomerId = customer.id;
    }

    // Create or update subscription
    if (tenantData.subscription.plan && tenantData.subscription.stripeCustomerId) {
      const priceId = process.env[`STRIPE_${tenantData.subscription.plan.toUpperCase()}_PRICE_ID`];
      if (!priceId) {
        throw new Error(`No price ID found for plan: ${tenantData.subscription.plan}`);
      }

      if (!tenantData.subscription.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.create({
          customer: tenantData.subscription.stripeCustomerId,
          items: [{ price: priceId }],
          metadata: {
            tenantId: tenantData.id,
          },
        });
        
        // Map Stripe status to our status values
        let status: 'active' | 'past_due' | 'canceled';
        switch (subscription.status) {
          case 'active':
            status = 'active';
            break;
          case 'past_due':
            status = 'past_due';
            break;
          case 'canceled':
          case 'incomplete_expired':
            status = 'canceled';
            break;
          default:
            // For other statuses like 'incomplete', 'trialing', 'unpaid', etc.
            status = 'active';
            break;
        }
        
        tenantData.subscription.stripeSubscriptionId = subscription.id;
        tenantData.subscription.status = status;
      } else {
        const subscription = await stripe.subscriptions.update(tenantData.subscription.stripeSubscriptionId, {
          items: [{ price: priceId }],
        });
        
        // Map Stripe status to our status values
        let status: 'active' | 'past_due' | 'canceled';
        switch (subscription.status) {
          case 'active':
            status = 'active';
            break;
          case 'past_due':
            status = 'past_due';
            break;
          case 'canceled':
          case 'incomplete_expired':
            status = 'canceled';
            break;
          default:
            // For other statuses like 'incomplete', 'trialing', 'unpaid', etc.
            status = 'active';
            break;
        }
        
        tenantData.subscription.status = status;
      }
    }

    return tenantData;
  }) as CollectionBeforeChangeHook,
}); 