import pino from 'pino'

// Create a custom logger instance with additional context
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  base: {
    env: process.env.NODE_ENV,
  },
  // Add request ID to help with tracing
  mixin() {
    return {
      requestId: process.env.AWS_LAMBDA_REQUEST_ID || 'local',
    }
  },
  // Redact sensitive information
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    '*.password',
    '*.token',
    '*.accessToken',
    '*.refreshToken',
    '*.clientSecret',
  ],
  // Customize the log format
  formatters: {
    level(label) {
      return { level: label }
    },
    bindings(bindings) {
      return {
        pid: bindings.pid,
        host: bindings.hostname,
      }
    },
  },
  // Add timestamps
  timestamp: pino.stdTimeFunctions.isoTime,
})

// Create namespaced loggers for different components
export const jobAdderLogger = logger.child({ component: 'JobAdder' })
export const syncLogger = logger.child({ component: 'Sync' })
export const webhookLogger = logger.child({ component: 'Webhook' })
export const oauthLogger = logger.child({ component: 'OAuth' })
export const dbLogger = logger.child({ component: 'Database' })
export const apiLogger = logger.child({ component: 'API' })

// Add debug helpers
export const debugLog = (namespace: string) => {
  return (...args: any[]) => {
    if (process.env.DEBUG?.includes(namespace)) {
      logger.debug({ namespace, args })
    }
  }
}

// Export type for TypeScript support
export type Logger = typeof logger
