const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const reportService = require('../services/reportService');
const emailService = require('../services/emailService');

// In-memory storage for reports (in production, use a database)
const reports = new Map();

class ReportController {
  // Get test report
  async getReport(req, res) {
    try {
      const { testId } = req.params;
      const report = reports.get(testId);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
          message: `No report found for test ID: ${testId}`
        });
      }

      res.status(200).json({
        success: true,
        testId,
        report
      });

    } catch (error) {
      console.error('Report retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve report'
      });
    }
  }

  // Generate test report
  async generateReport(req, res) {
    try {
      const { testId } = req.params;
      
      // Mock report generation
      const report = {
        id: testId,
        testCase: 'Login with valid credentials and verify dashboard loads',
        platform: 'android',
        status: 'completed',
        result: 'PASS',
        duration: '45.2s',
        timestamp: new Date().toISOString(),
        screenshots: [
          {
            id: 'screenshot-1',
            name: 'Login Screen',
            path: `/reports/${testId}/screenshots/login.png`,
            timestamp: new Date().toISOString()
          },
          {
            id: 'screenshot-2',
            name: 'Dashboard Screen',
            path: `/reports/${testId}/screenshots/dashboard.png`,
            timestamp: new Date().toISOString()
          }
        ],
        steps: [
          {
            step: 1,
            action: 'Launch app',
            status: 'PASS',
            duration: '2.1s',
            timestamp: new Date().toISOString()
          },
          {
            step: 2,
            action: 'Enter username',
            status: 'PASS',
            duration: '1.5s',
            timestamp: new Date().toISOString()
          },
          {
            step: 3,
            action: 'Enter password',
            status: 'PASS',
            duration: '1.2s',
            timestamp: new Date().toISOString()
          },
          {
            step: 4,
            action: 'Click login button',
            status: 'PASS',
            duration: '0.8s',
            timestamp: new Date().toISOString()
          },
          {
            step: 5,
            action: 'Verify dashboard loads',
            status: 'PASS',
            duration: '3.2s',
            timestamp: new Date().toISOString()
          }
        ],
        summary: {
          totalSteps: 5,
          passedSteps: 5,
          failedSteps: 0,
          skippedSteps: 0,
          successRate: '100%'
        },
        metadata: {
          device: 'Pixel 6',
          osVersion: 'Android 13',
          appVersion: '1.0.0',
          testEnvironment: 'QA'
        }
      };

      reports.set(testId, report);

      // Create report directory and files
      const reportDir = path.join(__dirname, '../reports', testId);
      await fs.ensureDir(reportDir);
      await fs.ensureDir(path.join(reportDir, 'screenshots'));

      // Save report as JSON
      await fs.writeJson(path.join(reportDir, 'report.json'), report, { spaces: 2 });

      console.log(`📊 Report generated: ${testId}`);

      res.status(200).json({
        success: true,
        testId,
        report,
        message: 'Report generated successfully'
      });

    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to generate report'
      });
    }
  }

  // Download test report
  async downloadReport(req, res) {
    try {
      const { testId } = req.params;
      const report = reports.get(testId);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      const reportDir = path.join(__dirname, '../reports', testId);
      const reportPath = path.join(reportDir, 'report.json');
      
      if (!await fs.pathExists(reportPath)) {
        return res.status(404).json({
          success: false,
          error: 'Report file not found'
        });
      }

      res.download(reportPath, `test-report-${testId}.json`);

    } catch (error) {
      console.error('Report download error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to download report'
      });
    }
  }

  // Send email report
  async sendEmailReport(req, res) {
    try {
      const { testId } = req.params;
      const { email = process.env.TO_EMAIL } = req.body;
      
      const report = reports.get(testId);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
          message: `No report found for test ID: ${testId}`
        });
      }

      // Generate email content
      const emailContent = await reportService.generateEmailContent(report);
      
      // Send email
      await emailService.sendTestReport(report, email);

      console.log(`📧 Email report sent: ${testId} to ${email}`);

      res.status(200).json({
        success: true,
        testId,
        email,
        message: 'Email report sent successfully'
      });

    } catch (error) {
      console.error('Email report error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to send email report'
      });
    }
  }

  // Send batch email reports
  async sendBatchEmailReports(req, res) {
    try {
      const { testIds, email = process.env.TO_EMAIL } = req.body;
      
      if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid test IDs',
          message: 'Please provide an array of test IDs'
        });
      }

      const results = [];
      
      for (const testId of testIds) {
        try {
          const report = reports.get(testId);
          if (report) {
            await emailService.sendTestReport(report, email);
            results.push({ testId, status: 'sent' });
          } else {
            results.push({ testId, status: 'not_found' });
          }
        } catch (error) {
          results.push({ testId, status: 'failed', error: error.message });
        }
      }

      const successCount = results.filter(r => r.status === 'sent').length;
      const failureCount = results.filter(r => r.status === 'failed').length;

      console.log(`📧 Batch email reports sent: ${successCount} successful, ${failureCount} failed`);

      res.status(200).json({
        success: true,
        results,
        summary: {
          total: testIds.length,
          sent: successCount,
          failed: failureCount,
          notFound: results.filter(r => r.status === 'not_found').length
        },
        message: `Batch email reports processed: ${successCount} sent successfully`
      });

    } catch (error) {
      console.error('Batch email reports error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to send batch email reports'
      });
    }
  }

  // List all reports
  async listReports(req, res) {
    try {
      const { status, platform, limit = 20, offset = 0 } = req.query;
      
      let reportList = Array.from(reports.values());
      
      // Filter by status
      if (status) {
        reportList = reportList.filter(report => report.status === status);
      }
      
      // Filter by platform
      if (platform) {
        reportList = reportList.filter(report => report.platform === platform);
      }

      // Sort by timestamp (newest first)
      reportList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      const paginatedReports = reportList
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
        .map(report => ({
          id: report.id,
          testCase: report.testCase,
          platform: report.platform,
          status: report.status,
          result: report.result,
          duration: report.duration,
          timestamp: report.timestamp,
          summary: report.summary
        }));

      res.status(200).json({
        success: true,
        reports: paginatedReports,
        total: reportList.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      console.error('Report list error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve reports list'
      });
    }
  }

  // Delete report
  async deleteReport(req, res) {
    try {
      const { testId } = req.params;
      const report = reports.get(testId);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
          message: `No report found for test ID: ${testId}`
        });
      }

      // Remove report directory
      const reportDir = path.join(__dirname, '../reports', testId);
      try {
        await fs.remove(reportDir);
      } catch (fsError) {
        console.warn('Report directory cleanup failed:', fsError.message);
      }

      // Remove from memory
      reports.delete(testId);

      console.log(`🗑️ Report deleted: ${testId}`);

      res.status(200).json({
        success: true,
        testId,
        message: 'Report deleted successfully'
      });

    } catch (error) {
      console.error('Report deletion error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to delete report'
      });
    }
  }

  // Archive report
  async archiveReport(req, res) {
    try {
      const { testId } = req.params;
      const report = reports.get(testId);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      // Update report status to archived
      report.status = 'archived';
      report.archivedAt = new Date().toISOString();
      reports.set(testId, report);

      console.log(`📦 Report archived: ${testId}`);

      res.status(200).json({
        success: true,
        testId,
        message: 'Report archived successfully'
      });

    } catch (error) {
      console.error('Report archive error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to archive report'
      });
    }
  }
}

module.exports = new ReportController();
