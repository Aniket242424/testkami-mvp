const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // For development, use a mock transporter
      if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
        this.transporter = {
          sendMail: async (options) => {
            console.log('📧 Mock Email Sent:', {
              to: options.to,
              subject: options.subject,
              text: options.text?.substring(0, 100) + '...'
            });
            return { messageId: 'mock-message-id' };
          }
        };
        console.log('✅ Mock email service initialized');
      } else {
        // Production email configuration
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        console.log('✅ Email service initialized with SMTP');
      }
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      // Fallback to mock service
      this.transporter = {
        sendMail: async (options) => {
          console.log('📧 Fallback Email Sent:', {
            to: options.to,
            subject: options.subject
          });
          return { messageId: 'fallback-message-id' };
        }
      };
    }
  }

  async sendTestReport(report, recipientEmail = 'amahangade24@gmail.com') {
    try {
      console.log(`📧 Sending test report to: ${recipientEmail}`);

      const emailContent = this.generateEmailContent(report);
      const attachments = await this.prepareAttachments(report);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'testkami@example.com',
        to: recipientEmail,
        subject: `Test Execution Report - ${report.status.toUpperCase()} - ${report.platform}`,
        html: emailContent.html,
        text: emailContent.text,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Test report email sent successfully');
      return {
        success: true,
        messageId: result.messageId,
        recipient: recipientEmail
      };

    } catch (error) {
      console.error('❌ Failed to send test report email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateEmailContent(report) {
    const statusColor = report.status === 'passed' ? '#10B981' : '#EF4444';
    const statusIcon = report.status === 'passed' ? '✅' : '❌';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Execution Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status { display: inline-block; padding: 8px 16px; border-radius: 4px; color: white; font-weight: bold; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .steps { margin-bottom: 20px; }
        .step { padding: 10px; margin: 5px 0; border-left: 4px solid #ddd; }
        .step.passed { border-left-color: #10B981; background: #f0fdf4; }
        .step.failed { border-left-color: #EF4444; background: #fef2f2; }
        .screenshots { margin-top: 20px; }
        .screenshot { margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Execution Report</h1>
            <p><strong>Test ID:</strong> ${report.testId}</p>
            <p><strong>Platform:</strong> ${report.platform}</p>
            <p><strong>Test Case:</strong> ${report.naturalLanguageTest}</p>
            <p><strong>Status:</strong> <span class="status" style="background-color: ${statusColor};">${statusIcon} ${report.status.toUpperCase()}</span></p>
        </div>

        <div class="summary">
            <h2>📊 Execution Summary</h2>
            <p><strong>Start Time:</strong> ${new Date(report.startTime).toLocaleString()}</p>
            <p><strong>End Time:</strong> ${new Date(report.endTime).toLocaleString()}</p>
            <p><strong>Duration:</strong> ${(report.duration / 1000).toFixed(2)} seconds</p>
            <p><strong>Total Steps:</strong> ${report.summary.totalSteps}</p>
            <p><strong>Passed Steps:</strong> ${report.summary.passedSteps}</p>
            <p><strong>Failed Steps:</strong> ${report.summary.failedSteps}</p>
        </div>

        <div class="steps">
            <h2>📝 Test Steps</h2>
            ${report.steps.map(step => `
                <div class="step ${step.status}">
                    <strong>${step.name}</strong><br>
                    Status: ${step.status.toUpperCase()}<br>
                    Duration: ${step.duration}ms<br>
                    Time: ${new Date(step.timestamp).toLocaleString()}
                    ${step.error ? `<br><em>Error: ${step.error}</em>` : ''}
                </div>
            `).join('')}
        </div>

        ${report.screenshots.length > 0 ? `
        <div class="screenshots">
            <h2>📸 Screenshots</h2>
            ${report.screenshots.map(screenshot => `
                <div class="screenshot">
                    <strong>${screenshot.name}</strong><br>
                    Time: ${new Date(screenshot.timestamp).toLocaleString()}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${report.error ? `
        <div class="error">
            <h2>❌ Error Details</h2>
            <p><strong>Error:</strong> ${report.error}</p>
        </div>
        ` : ''}

        <div class="footer">
            <p>This report was generated by Testkami - AI-powered test automation platform</p>
            <p>Generated at: ${new Date(report.generatedAt).toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Test Execution Report
====================

Test ID: ${report.testId}
Platform: ${report.platform}
Test Case: ${report.naturalLanguageTest}
Status: ${report.status.toUpperCase()}

Execution Summary:
- Start Time: ${new Date(report.startTime).toLocaleString()}
- End Time: ${new Date(report.endTime).toLocaleString()}
- Duration: ${(report.duration / 1000).toFixed(2)} seconds
- Total Steps: ${report.summary.totalSteps}
- Passed Steps: ${report.summary.passedSteps}
- Failed Steps: ${report.summary.failedSteps}

Test Steps:
${report.steps.map(step => `
${step.name}
Status: ${step.status.toUpperCase()}
Duration: ${step.duration}ms
Time: ${new Date(step.timestamp).toLocaleString()}
${step.error ? `Error: ${step.error}` : ''}
`).join('')}

${report.error ? `
Error Details:
${report.error}
` : ''}

Generated by Testkami - AI-powered test automation platform
Generated at: ${new Date(report.generatedAt).toLocaleString()}
    `;

    return { html, text };
  }

  async prepareAttachments(report) {
    const attachments = [];

    try {
      // Add screenshots as attachments
      for (const screenshot of report.screenshots) {
        if (await fs.pathExists(screenshot.path)) {
          attachments.push({
            filename: path.basename(screenshot.path),
            path: screenshot.path,
            cid: screenshot.name.replace(/\s+/g, '_')
          });
        }
      }

      // Add report JSON as attachment
      const reportPath = path.join(__dirname, '../../reports', `${report.id}.json`);
      if (await fs.pathExists(reportPath)) {
        attachments.push({
          filename: `report_${report.id}.json`,
          path: reportPath
        });
      }

    } catch (error) {
      console.error('Error preparing attachments:', error);
    }

    return attachments;
  }

  async sendNotification(recipientEmail, subject, message) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'testkami@example.com',
        to: recipientEmail,
        subject: subject,
        text: message,
        html: `<p>${message}</p>`
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Notification email sent successfully');
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Failed to send notification email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();
