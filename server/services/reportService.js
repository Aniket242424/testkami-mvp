const path = require('path');
const fs = require('fs-extra');

class ReportService {
  async generateReport(testId, testCase, testResults) {
    try {
      console.log(`📊 Generating test report for: ${testId}`);
      
      const report = {
        id: testId,
        testCase: testCase,
        platform: testResults.platform,
        status: testResults.status,
        result: testResults.status === 'PASS' ? 'PASS' : 'FAIL',
        duration: testResults.duration,
        timestamp: new Date().toISOString(),
        screenshots: testResults.screenshots || [],
        steps: testResults.steps || [],
        summary: this.generateSummary(testResults),
        logs: testResults.logs || [],
        error: testResults.error || null,
        metadata: testResults.metadata || {}
      };

      // Create report directory
      const reportDir = path.join(__dirname, '../reports', testId);
      await fs.ensureDir(reportDir);
      
      // Save report as JSON
      const reportPath = path.join(reportDir, 'report.json');
      await fs.writeJson(reportPath, report, { spaces: 2 });

      // Create screenshots directory
      const screenshotsDir = path.join(reportDir, 'screenshots');
      await fs.ensureDir(screenshotsDir);

      // Generate HTML report
      const htmlReport = await this.generateHTMLReport(report);
      const htmlPath = path.join(reportDir, 'report.html');
      await fs.writeFile(htmlPath, htmlReport, 'utf8');

      console.log(`✅ Test report generated: ${testId}`);
      
      return report;

    } catch (error) {
      console.error('Report generation error:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  generateSummary(testResults) {
    const { steps, screenshots, logs, error } = testResults;
    
    const totalSteps = steps ? steps.length : 0;
    const passedSteps = steps ? steps.filter(step => step.status === 'PASS').length : 0;
    const failedSteps = steps ? steps.filter(step => step.status === 'FAIL').length : 0;
    const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(1) : '0.0';
    
    return {
      totalSteps,
      passedSteps,
      failedSteps,
      skippedSteps: 0,
      successRate: `${successRate}%`,
      totalScreenshots: screenshots ? screenshots.length : 0,
      totalLogs: logs ? logs.length : 0,
      hasErrors: !!error
    };
  }

  async generateHTMLReport(report) {
    const { id, testCase, platform, status, result, duration, timestamp, steps, summary, screenshots, logs, error, metadata } = report;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-pass {
            background-color: #28a745;
            color: white;
        }
        
        .status-fail {
            background-color: #dc3545;
            color: white;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .summary-card h3 {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        
        .summary-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
        }
        
        .steps-section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            overflow: hidden;
        }
        
        .section-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .section-header h2 {
            color: #333;
            font-size: 1.5rem;
        }
        
        .step-item {
            padding: 15px 20px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .step-item:last-child {
            border-bottom: none;
        }
        
        .step-number {
            background: #007bff;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.9rem;
        }
        
        .step-content {
            flex: 1;
        }
        
        .step-action {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }
        
        .step-details {
            color: #666;
            font-size: 0.9rem;
        }
        
        .step-status {
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .step-pass {
            background: #d4edda;
            color: #155724;
        }
        
        .step-fail {
            background: #f8d7da;
            color: #721c24;
        }
        
        .screenshots-section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        
        .screenshot-item {
            text-align: center;
        }
        
        .screenshot-item img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .screenshot-name {
            margin-top: 10px;
            font-weight: 600;
            color: #333;
        }
        
        .logs-section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .log-content {
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9rem;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 20px;
        }
        
        .log-line {
            margin-bottom: 5px;
            padding: 2px 0;
        }
        
        .log-success {
            color: #28a745;
        }
        
        .log-error {
            color: #dc3545;
        }
        
        .log-info {
            color: #007bff;
        }
        
        .metadata-section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            padding: 20px;
        }
        
        .metadata-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .metadata-item:last-child {
            border-bottom: none;
        }
        
        .metadata-label {
            font-weight: 600;
            color: #666;
        }
        
        .metadata-value {
            color: #333;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #666;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Execution Report</h1>
            <p>Test ID: ${id}</p>
            <div class="status-badge ${result === 'PASS' ? 'status-pass' : 'status-fail'}">
                ${result}
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>Test Case</h3>
                <div class="value">${testCase}</div>
            </div>
            <div class="summary-card">
                <h3>Platform</h3>
                <div class="value">${platform}</div>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <div class="value">${duration}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="value">${summary.successRate}</div>
            </div>
            <div class="summary-card">
                <h3>Total Steps</h3>
                <div class="value">${summary.totalSteps}</div>
            </div>
            <div class="summary-card">
                <h3>Screenshots</h3>
                <div class="value">${summary.totalScreenshots}</div>
            </div>
        </div>

        <div class="steps-section">
            <div class="section-header">
                <h2>Test Steps</h2>
            </div>
            ${steps.map(step => `
                <div class="step-item">
                    <div class="step-number">${step.step}</div>
                    <div class="step-content">
                        <div class="step-action">${step.action}</div>
                        <div class="step-details">Duration: ${step.duration} | Time: ${new Date(step.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div class="step-status ${step.status === 'PASS' ? 'step-pass' : 'step-fail'}">
                        ${step.status}
                    </div>
                </div>
            `).join('')}
        </div>

        ${screenshots.length > 0 ? `
        <div class="screenshots-section">
            <div class="section-header">
                <h2>Screenshots</h2>
            </div>
            <div class="screenshot-grid">
                ${screenshots.map(screenshot => `
                    <div class="screenshot-item">
                        <img src="${screenshot.path}" alt="${screenshot.name}" />
                        <div class="screenshot-name">${screenshot.name}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="metadata-section">
            <div class="section-header">
                <h2>Test Metadata</h2>
            </div>
            <div class="metadata-grid">
                <div class="metadata-item">
                    <span class="metadata-label">Device:</span>
                    <span class="metadata-value">${metadata.device || 'Unknown'}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Appium Version:</span>
                    <span class="metadata-value">${metadata.appiumVersion || 'Unknown'}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Test Environment:</span>
                    <span class="metadata-value">${metadata.testEnvironment || 'QA'}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Execution Time:</span>
                    <span class="metadata-value">${new Date(timestamp).toLocaleString()}</span>
                </div>
            </div>
        </div>

        ${logs.length > 0 ? `
        <div class="logs-section">
            <div class="section-header">
                <h2>Execution Logs</h2>
            </div>
            <div class="log-content">
                ${logs.map(log => `
                    <div class="log-line ${this.getLogClass(log)}">${log}</div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${error ? `
        <div class="logs-section">
            <div class="section-header">
                <h2>Error Details</h2>
            </div>
            <div class="log-content">
                <div class="log-line log-error">${error}</div>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>Report generated by Autosana Test Automation Platform</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `;

    return html;
  }

  getLogClass(log) {
    if (log.includes('✅') || log.includes('PASS')) return 'log-success';
    if (log.includes('❌') || log.includes('FAIL') || log.includes('Error')) return 'log-error';
    if (log.includes('🚀') || log.includes('📱') || log.includes('📸')) return 'log-info';
    return '';
  }

  async generateEmailContent(report) {
    const { id, testCase, platform, result, duration, summary, error } = report;
    
    const emailSubject = `Test Report - ${result} - ${testCase}`;
    
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
        .status-pass { background: #28a745; color: white; }
        .status-fail { background: #dc3545; color: white; }
        .summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .summary-item { text-align: center; }
        .summary-label { font-size: 0.9rem; color: #666; margin-bottom: 5px; }
        .summary-value { font-size: 1.5rem; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Test Execution Report</h2>
            <p><strong>Test ID:</strong> ${id}</p>
            <p><strong>Test Case:</strong> ${testCase}</p>
            <p><strong>Platform:</strong> ${platform}</p>
            <div class="status-badge ${result === 'PASS' ? 'status-pass' : 'status-fail'}">
                ${result}
            </div>
        </div>

        <div class="summary">
            <h3>Test Summary</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Duration</div>
                    <div class="summary-value">${duration}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Success Rate</div>
                    <div class="summary-value">${summary.successRate}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Steps</div>
                    <div class="summary-value">${summary.totalSteps}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Screenshots</div>
                    <div class="summary-value">${summary.totalScreenshots}</div>
                </div>
            </div>
        </div>

        ${error ? `
        <div class="summary">
            <h3>Error Details</h3>
            <p style="color: #dc3545; background: #f8d7da; padding: 15px; border-radius: 5px;">
                ${error}
            </p>
        </div>
        ` : ''}

        <div class="footer">
            <p>This report was automatically generated by Autosana Test Automation Platform</p>
            <p>For detailed information, please check the full report in the dashboard</p>
        </div>
    </div>
</body>
</html>
    `;

    return {
      subject: emailSubject,
      html: emailBody,
      text: this.generateTextEmail(report)
    };
  }

  generateTextEmail(report) {
    const { id, testCase, platform, result, duration, summary, error } = report;
    
    return `
Test Execution Report
====================

Test ID: ${id}
Test Case: ${testCase}
Platform: ${platform}
Result: ${result}
Duration: ${duration}

Summary:
- Success Rate: ${summary.successRate}
- Total Steps: ${summary.totalSteps}
- Passed Steps: ${summary.passedSteps}
- Failed Steps: ${summary.failedSteps}
- Screenshots: ${summary.totalScreenshots}

${error ? `Error: ${error}` : ''}

This report was automatically generated by Autosana Test Automation Platform.
    `;
  }
}

module.exports = new ReportService();
