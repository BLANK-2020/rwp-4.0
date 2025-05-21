import { Request, Response } from 'express';
import Stripe from 'stripe';
import payload from 'payload';
import { Tenant } from '../../payload-types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).send('No signature found');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata.tenantId;

        if (tenantId) {
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
          
          await payload.update({
            collection: 'tenants',
            id: tenantId,
            data: {
              subscription: {
                stripeSubscriptionId: subscription.id,
                status,
              },
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata.tenantId;

        if (tenantId) {
          await payload.update({
            collection: 'tenants',
            id: tenantId,
            data: {
              subscription: {
                status: 'canceled',
              },
            },
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err: unknown) {
    console.error('Webhook error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
}; 