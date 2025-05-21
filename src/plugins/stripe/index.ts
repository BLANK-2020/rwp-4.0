import { Plugin, PayloadRequest } from 'payload';
import { Response } from 'express';
import Stripe from 'stripe';
import { stripeWebhookHandler } from './webhookHandler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

const stripePlugin: Plugin = (config) => {
  config.endpoints = config.endpoints || [];
  config.endpoints.push({
    path: '/webhook',
    method: 'post',
    handler: async (...args: any[]) => {
      const [req, res] = args;
      await stripeWebhookHandler(req, res);
      return res;
    },
  });
  return config;
};

export default stripePlugin; 