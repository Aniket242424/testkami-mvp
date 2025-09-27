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
    const { id, testCase, testDescription, platform, status, result, duration, timestamp, steps, summary, screenshots, logs, error, metadata } = report;

    // Format duration
    const formatDuration = (ms) => {
      if (!ms) return 'N/A';
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      }
      return `${seconds}s`;
    };

    // Fix screenshot paths to use web URLs
    const getScreenshotUrl = (screenshotPath) => {
      if (!screenshotPath) return '';
      
      // Handle both Windows and Unix paths
      const filename = screenshotPath.split(/[\\\/]/).pop(); // Get filename from path
      const url = `/reports/screenshots/${filename}`;
      console.log(`🔍 Screenshot URL: ${screenshotPath} -> ${url}`);
      return url;
    };

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
            padding: 40px 20px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 1.1rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .status-pass {
            background: #28a745;
            color: white;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }
        
        .status-fail {
            background: #dc3545;
            color: white;
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.2s ease;
        }
        
        .summary-card:hover {
            transform: translateY(-2px);
        }
        
        .summary-card h3 {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .summary-card .value {
            font-size: 1.8rem;
            font-weight: bold;
            color: #333;
        }
        
        .section-header {
            background: white;
            padding: 20px;
            border-radius: 12px 12px 0 0;
            border-bottom: 2px solid #f8f9fa;
        }
        
        .section-header h2 {
            color: #333;
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .steps-section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            overflow: hidden;
        }
        
        .step-item {
            display: flex;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #f8f9fa;
            transition: background-color 0.2s ease;
        }
        
        .step-item:hover {
            background-color: #f8f9fa;
        }
        
        .step-item:last-child {
            border-bottom: none;
        }
        
        .step-number {
            background: #667eea;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1rem;
            margin-right: 20px;
        }
        
        .step-content {
            flex: 1;
        }
        
        .step-action {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
            font-size: 1.1rem;
        }
        
        .step-details {
            color: #666;
            font-size: 0.9rem;
        }
        
        .step-status {
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            overflow: hidden;
        }
        
        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, 350px);
            gap: 25px;
            padding: 25px;
            justify-content: center;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .screenshot-item {
            text-align: center;
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            transition: transform 0.2s ease;
        }
        
        .screenshot-item:hover {
            transform: scale(1.02);
        }
        
        .screenshot-item img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border: 2px solid #e9ecef;
        }
        
        .screenshot-name {
            margin-top: 15px;
            font-weight: 600;
            color: #333;
            font-size: 1rem;
        }
        
        .screenshot-timestamp {
            margin-top: 5px;
            color: #666;
            font-size: 0.9rem;
        }
        
        .logs-section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            overflow: hidden;
        }
        
        .log-content {
            padding: 25px;
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
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            overflow: hidden;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            padding: 25px;
        }
        
        .metadata-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 15px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .metadata-item:last-child {
            border-bottom: none;
        }
        
        .metadata-item.full-width {
            grid-column: 1 / -1;
            flex-direction: column;
            align-items: flex-start;
        }
        
        .metadata-item.full-width .metadata-value {
            margin-top: 5px;
            word-break: break-all;
            font-family: monospace;
            font-size: 0.9em;
            color: #666;
            background-color: #f8f9fa;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
        }
        
        .metadata-label {
            font-weight: 600;
            color: #666;
        }
        
        .metadata-value {
            color: #333;
            font-weight: 500;
        }
        
        .footer {
            text-align: center;
            padding: 40px;
            color: #666;
            font-size: 0.9rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .footer p {
            margin-bottom: 10px;
        }
        
        .footer strong {
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Execution Report</h1>
            <p>Test ID: ${id}</p>
            <div class="status-badge ${status === 'PASS' ? 'status-pass' : 'status-fail'}">
                ${status}
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>Test Case</h3>
                <div class="value">${testCase || 'N/A'}</div>
            </div>
            <div class="summary-card">
                <h3>Platform</h3>
                <div class="value">${platform || 'N/A'}</div>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <div class="value">${formatDuration(duration)}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="value">${summary?.successRate || 'N/A'}</div>
            </div>
            <div class="summary-card">
                <h3>Total Steps</h3>
                <div class="value">${summary?.totalSteps || 0}</div>
            </div>
            <div class="summary-card">
                <h3>Screenshots</h3>
                <div class="value">${screenshots?.length || 0}</div>
            </div>
        </div>

        <div class="steps-section">
            <div class="section-header">
                <h2>Test Steps</h2>
            </div>
            ${steps && steps.length > 0 ? steps.map((step, index) => `
                <div class="step-item">
                    <div class="step-number">${index + 1}</div>
                    <div class="step-content">
                        <div class="step-action">${step.name || 'Unknown Step'}</div>
                        <div class="step-details">Duration: ${formatDuration(step.duration)} | Time: ${new Date(step.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div class="step-status ${step.status === 'passed' ? 'step-pass' : 'step-fail'}">
                        ${step.status?.toUpperCase() || 'UNKNOWN'}
                    </div>
                </div>
            `).join('') : '<div style="padding: 20px; text-align: center; color: #666;">No steps recorded</div>'}
        </div>

        ${screenshots && screenshots.length > 0 ? `
        <div class="screenshots-section">
            <div class="section-header">
                <h2>Screenshots (${screenshots.length})</h2>
            </div>
                <div class="screenshot-grid">
                ${screenshots.map(screenshot => `
                    <div class="screenshot-item">
                        <img src="${getScreenshotUrl(screenshot.path)}" alt="${screenshot.name}" onerror="this.style.display='none'; this.nextElementSibling.innerHTML='Screenshot not available';" />
                        <div class="screenshot-name">${screenshot.name}</div>
                        <div class="screenshot-timestamp">${new Date(screenshot.timestamp).toLocaleTimeString()}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="metadata-section">
            <div class="section-header">
                <h2>Test Details</h2>
            </div>
            <div class="metadata-grid">
                <div class="metadata-item full-width">
                    <span class="metadata-label">Execution ID:</span>
                    <span class="metadata-value">${report.executionId || 'N/A'}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Start Time:</span>
                    <span class="metadata-value">${new Date(report.startTime || timestamp).toLocaleString()}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">End Time:</span>
                    <span class="metadata-value">${new Date(report.endTime || timestamp).toLocaleString()}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Total Duration:</span>
                    <span class="metadata-value">${formatDuration(duration)}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Passed Steps:</span>
                    <span class="metadata-value">${summary?.passedSteps || 0}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Failed Steps:</span>
                    <span class="metadata-value">${summary?.failedSteps || 0}</span>
                </div>
            </div>
        </div>

        ${logs && logs.length > 0 ? `
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
            <p><strong>© 2024 Testkami</strong> - AI-Powered Test Automation Platform</p>
            <p>Report generated on ${new Date().toLocaleString()}</p>
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
            <p><strong>Test Description:</strong> ${testDescription || 'N/A'}</p>
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
