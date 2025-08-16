const { v4: uuidv4 } = require('uuid');
const testService = require('../services/testService');
const llmService = require('../services/llmService');
const appiumService = require('../services/appiumService');
const reportService = require('../services/reportService');
const emailService = require('../services/emailService');

// In-memory storage for test status (in production, use a database)
const testStatus = new Map();
const testHistory = [];

class TestController {
  // Execute a complete test from natural language
  async executeTest(req, res) {
    try {
      const { testCase, appPath, platform, deviceConfig } = req.body;
      const testId = uuidv4();
      
      console.log(`🚀 Starting test execution: ${testId}`);
      
      // Initialize test status
      testStatus.set(testId, {
        status: 'initializing',
        progress: 0,
        message: 'Initializing test execution...',
        timestamp: new Date().toISOString()
      });

      // Step 1: Generate test script from natural language
      testStatus.set(testId, {
        status: 'generating_script',
        progress: 20,
        message: 'Converting natural language to test script...',
        timestamp: new Date().toISOString()
      });

      const testScript = await llmService.generateTestScript(testCase, platform);
      
      // Step 2: Validate and prepare test script
      testStatus.set(testId, {
        status: 'preparing',
        progress: 40,
        message: 'Preparing test environment...',
        timestamp: new Date().toISOString()
      });

      const preparedScript = await testService.prepareTestScript(testScript, appPath, deviceConfig);
      
      // Step 3: Execute test via Appium
      testStatus.set(testId, {
        status: 'executing',
        progress: 60,
        message: 'Executing test on device...',
        timestamp: new Date().toISOString()
      });

      const testResults = await appiumService.executeTest(preparedScript, platform);
      
      // Step 4: Generate report
      testStatus.set(testId, {
        status: 'generating_report',
        progress: 80,
        message: 'Generating test report...',
        timestamp: new Date().toISOString()
      });

      const report = await reportService.generateReport(testId, testCase, testResults);
      
      // Step 5: Send email notification
      testStatus.set(testId, {
        status: 'sending_email',
        progress: 90,
        message: 'Sending email notification...',
        timestamp: new Date().toISOString()
      });

      await emailService.sendTestReport(report);
      
      // Final status
      testStatus.set(testId, {
        status: 'completed',
        progress: 100,
        message: 'Test execution completed successfully',
        timestamp: new Date().toISOString(),
        results: testResults,
        report: report
      });

      // Store in history
      testHistory.push({
        testId,
        testCase,
        platform,
        status: 'completed',
        timestamp: new Date().toISOString(),
        results: testResults
      });

      res.status(200).json({
        success: true,
        testId,
        message: 'Test execution completed successfully',
        report: report
      });

    } catch (error) {
      console.error('Test execution error:', error);
      
      const testId = req.body.testId || uuidv4();
      testStatus.set(testId, {
        status: 'failed',
        progress: 0,
        message: error.message,
        timestamp: new Date().toISOString(),
        error: error.stack
      });

      res.status(500).json({
        success: false,
        testId,
        error: error.message,
        message: 'Test execution failed'
      });
    }
  }

  // Generate test script only (without execution)
  async generateTestScript(req, res) {
    try {
      const { testCase, platform } = req.body;
      
      const testScript = await llmService.generateTestScript(testCase, platform);
      
      res.status(200).json({
        success: true,
        testScript,
        message: 'Test script generated successfully'
      });

    } catch (error) {
      console.error('Script generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to generate test script'
      });
    }
  }

  // Get test execution status
  async getTestStatus(req, res) {
    try {
      const { testId } = req.params;
      const status = testStatus.get(testId);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Test not found',
          message: `No test found with ID: ${testId}`
        });
      }

      res.status(200).json({
        success: true,
        testId,
        status
      });

    } catch (error) {
      console.error('Status retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve test status'
      });
    }
  }

  // Get test execution history
  async getTestHistory(req, res) {
    try {
      const { limit = 10, offset = 0 } = req.query;
      
      const history = testHistory
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
        .map(test => ({
          testId: test.testId,
          testCase: test.testCase,
          platform: test.platform,
          status: test.status,
          timestamp: test.timestamp,
          duration: test.results?.duration
        }));

      res.status(200).json({
        success: true,
        history,
        total: testHistory.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      console.error('History retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve test history'
      });
    }
  }

  // Get test templates
  async getTestTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'login-test',
          name: 'Login Test',
          description: 'Test user login functionality',
          template: 'Login with valid credentials and verify dashboard loads',
          platform: 'mobile'
        },
        {
          id: 'navigation-test',
          name: 'Navigation Test',
          description: 'Test app navigation',
          template: 'Navigate to settings page and change theme to dark mode',
          platform: 'mobile'
        },
        {
          id: 'ecommerce-test',
          name: 'E-commerce Test',
          description: 'Test shopping cart functionality',
          template: 'Add item to cart and proceed to checkout',
          platform: 'mobile'
        },
        {
          id: 'search-test',
          name: 'Search Test',
          description: 'Test search functionality',
          template: 'Search for products and filter by price range',
          platform: 'web'
        }
      ];

      res.status(200).json({
        success: true,
        templates
      });

    } catch (error) {
      console.error('Template retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve test templates'
      });
    }
  }

  // Create test template
  async createTestTemplate(req, res) {
    try {
      const { name, description, template, platform } = req.body;
      
      const newTemplate = {
        id: uuidv4(),
        name,
        description,
        template,
        platform,
        createdAt: new Date().toISOString()
      };

      // In a real app, save to database
      console.log('New template created:', newTemplate);

      res.status(201).json({
        success: true,
        template: newTemplate,
        message: 'Test template created successfully'
      });

    } catch (error) {
      console.error('Template creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to create test template'
      });
    }
  }

  // Update test template
  async updateTestTemplate(req, res) {
    try {
      const { id } = req.params;
      const { name, description, template, platform } = req.body;
      
      // In a real app, update in database
      console.log('Template updated:', { id, name, description, template, platform });

      res.status(200).json({
        success: true,
        message: 'Test template updated successfully'
      });

    } catch (error) {
      console.error('Template update error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to update test template'
      });
    }
  }

  // Delete test template
  async deleteTestTemplate(req, res) {
    try {
      const { id } = req.params;
      
      // In a real app, delete from database
      console.log('Template deleted:', id);

      res.status(200).json({
        success: true,
        message: 'Test template deleted successfully'
      });

    } catch (error) {
      console.error('Template deletion error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to delete test template'
      });
    }
  }

  // Get test results
  async getTestResults(req, res) {
    try {
      const { testId } = req.params;
      const status = testStatus.get(testId);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Test not found'
        });
      }

      res.status(200).json({
        success: true,
        testId,
        results: status.results || null
      });

    } catch (error) {
      console.error('Results retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve test results'
      });
    }
  }

  // Get test screenshots
  async getTestScreenshots(req, res) {
    try {
      const { testId } = req.params;
      
      // In a real app, retrieve screenshots from file system
      const screenshots = [
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
      ];

      res.status(200).json({
        success: true,
        testId,
        screenshots
      });

    } catch (error) {
      console.error('Screenshots retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve test screenshots'
      });
    }
  }

  // Retry failed test
  async retryTest(req, res) {
    try {
      const { testId } = req.params;
      const originalTest = testHistory.find(test => test.testId === testId);
      
      if (!originalTest) {
        return res.status(404).json({
          success: false,
          error: 'Original test not found'
        });
      }

      // Create new test execution with same parameters
      const newTestId = uuidv4();
      const retryRequest = {
        testCase: originalTest.testCase,
        appPath: originalTest.appPath,
        platform: originalTest.platform,
        deviceConfig: originalTest.deviceConfig
      };

      // Execute the retry
      await this.executeTest({ body: retryRequest }, res);

    } catch (error) {
      console.error('Test retry error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retry test'
      });
    }
  }
}

module.exports = new TestController();
