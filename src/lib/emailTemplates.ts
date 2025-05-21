/**
 * Email Templates
 *
 * This module provides email templates for various notifications.
 */

/**
 * Generate an abandoned application email template
 * @param params The template parameters
 * @returns The HTML email template
 */
export const abandonedApplicationTemplate = (params: {
  firstName?: string
  jobTitle: string
  jobLocation: string
  companyName: string
  applicationUrl: string
  logoUrl?: string
}): string => {
  const { firstName, jobTitle, jobLocation, companyName, applicationUrl, logoUrl } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Job Application</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 20px;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border-radius: 5px;
    }
    .button {
      display: inline-block;
      background-color: #3498db;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 4px;
      margin-top: 20px;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo">` : ''}
      <h1>Complete Your Job Application</h1>
    </div>
    
    <div class="content">
      <p>Hello${firstName ? ` ${firstName}` : ''},</p>
      
      <p>We noticed that you recently started an application for the <strong>${jobTitle}</strong> position in <strong>${jobLocation}</strong> but didn't complete it.</p>
      
      <p>This is a friendly reminder that your application is still in progress. The position is still open, and we'd love to consider you as a candidate.</p>
      
      <p>To complete your application, simply click the button below:</p>
      
      <div style="text-align: center;">
        <a href="${applicationUrl}" class="button">Complete Application</a>
      </div>
      
      <p>If you have any questions or need assistance with your application, please don't hesitate to contact our recruitment team.</p>
      
      <p>Best regards,<br>
      The ${companyName} Recruitment Team</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      <p>If you believe you received this email in error, please disregard it.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate a plain text version of the abandoned application email
 * @param params The template parameters
 * @returns The plain text email
 */
export const abandonedApplicationTextTemplate = (params: {
  firstName?: string
  jobTitle: string
  jobLocation: string
  companyName: string
  applicationUrl: string
}): string => {
  const { firstName, jobTitle, jobLocation, companyName, applicationUrl } = params

  return `
Complete Your Job Application

Hello${firstName ? ` ${firstName}` : ''},

We noticed that you recently started an application for the ${jobTitle} position in ${jobLocation} but didn't complete it.

This is a friendly reminder that your application is still in progress. The position is still open, and we'd love to consider you as a candidate.

To complete your application, please visit:
${applicationUrl}

If you have any questions or need assistance with your application, please don't hesitate to contact our recruitment team.

Best regards,
The ${companyName} Recruitment Team

© ${new Date().getFullYear()} ${companyName}. All rights reserved.
If you believe you received this email in error, please disregard it.
  `.trim()
}
