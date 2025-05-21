/**
 * Email Service
 *
 * This module provides functions for sending emails.
 * It supports different email providers through a common interface.
 */

import nodemailer from 'nodemailer'
import mailgunTransport from 'nodemailer-mailgun-transport'

// Define the email provider types
export enum EmailProvider {
  SMTP = 'smtp',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
}

// Define the email options
export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

// Define the email service configuration
export interface EmailServiceConfig {
  provider: EmailProvider
  defaultFrom: string
  defaultReplyTo?: string
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  sendgrid?: {
    apiKey: string
  }
  mailgun?: {
    apiKey: string
    domain: string
  }
}

// Create a singleton instance of the email service
class EmailService {
  private static instance: EmailService
  private config: EmailServiceConfig
  private transporter: any

  private constructor(config: EmailServiceConfig) {
    this.config = config
    this.initializeTransporter()
  }

  /**
   * Get the email service instance
   * @param config The email service configuration
   * @returns The email service instance
   */
  public static getInstance(config?: EmailServiceConfig): EmailService {
    if (!EmailService.instance && config) {
      EmailService.instance = new EmailService(config)
    }

    if (!EmailService.instance) {
      throw new Error('Email service not initialized')
    }

    return EmailService.instance
  }

  /**
   * Initialize the email transporter based on the provider
   */
  private initializeTransporter(): void {
    switch (this.config.provider) {
      case EmailProvider.SMTP:
        if (!this.config.smtp) {
          throw new Error('SMTP configuration is required for SMTP provider')
        }

        this.transporter = nodemailer.createTransport({
          host: this.config.smtp.host,
          port: this.config.smtp.port,
          secure: this.config.smtp.secure,
          auth: {
            user: this.config.smtp.auth.user,
            pass: this.config.smtp.auth.pass,
          },
        })
        break

      case EmailProvider.SENDGRID:
        if (!this.config.sendgrid?.apiKey) {
          throw new Error('SendGrid API key is required for SendGrid provider')
        }

        // For SendGrid, we use nodemailer with the SendGrid transport
        this.transporter = nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: this.config.sendgrid.apiKey,
          },
        })
        break

      case EmailProvider.MAILGUN:
        if (!this.config.mailgun?.apiKey || !this.config.mailgun?.domain) {
          throw new Error('Mailgun API key and domain are required for Mailgun provider')
        }

        // For Mailgun, we use nodemailer with the Mailgun transport
        this.transporter = nodemailer.createTransport(
          mailgunTransport({
            auth: {
              api_key: this.config.mailgun.apiKey,
              domain: this.config.mailgun.domain,
            },
          }),
        )
        break

      default:
        throw new Error(`Unsupported email provider: ${this.config.provider}`)
    }
  }

  /**
   * Send an email
   * @param options The email options
   * @returns A promise that resolves when the email is sent
   */
  public async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // Set default from and replyTo if not provided
      const from = options.from || this.config.defaultFrom
      const replyTo = options.replyTo || this.config.defaultReplyTo || from

      // Send the email
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        replyTo,
        attachments: options.attachments,
      })
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  /**
   * Strip HTML tags from a string
   * @param html The HTML string
   * @returns The plain text string
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  }
}

// Initialize the email service with environment variables
export const initializeEmailService = (): EmailService => {
  const provider = (process.env.EMAIL_PROVIDER as EmailProvider) || EmailProvider.SMTP
  const defaultFrom = process.env.EMAIL_DEFAULT_FROM || 'noreply@example.com'
  const defaultReplyTo = process.env.EMAIL_DEFAULT_REPLY_TO

  const config: EmailServiceConfig = {
    provider,
    defaultFrom,
    defaultReplyTo,
  }

  // Add provider-specific configuration
  switch (provider) {
    case EmailProvider.SMTP:
      config.smtp = {
        host: process.env.EMAIL_SMTP_HOST || 'localhost',
        port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
        secure: process.env.EMAIL_SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_SMTP_USER || '',
          pass: process.env.EMAIL_SMTP_PASS || '',
        },
      }
      break

    case EmailProvider.SENDGRID:
      config.sendgrid = {
        apiKey: process.env.EMAIL_SENDGRID_API_KEY || '',
      }
      break

    case EmailProvider.MAILGUN:
      config.mailgun = {
        apiKey: process.env.EMAIL_MAILGUN_API_KEY || '',
        domain: process.env.EMAIL_MAILGUN_DOMAIN || '',
      }
      break
  }

  return EmailService.getInstance(config)
}

// Export the email service
export const emailService = initializeEmailService()
