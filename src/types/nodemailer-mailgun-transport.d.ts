declare module 'nodemailer-mailgun-transport' {
  interface MailgunTransportOptions {
    auth: {
      api_key: string
      domain: string
    }
    host?: string
    proxy?: string
  }

  function mailgunTransport(options: MailgunTransportOptions): any
  export = mailgunTransport
}
