const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const testExecutionService = require('../services/testExecutionService');
const automatedTestService = require('../services/automatedTestService');
const emailService = require('../services/emailService');
const uploadController = require('../controllers/uploadController');
const inputValidationService = require('../services/inputValidationService');
const logger = require('../utils/logger');

// Generate test script from natural language
router.post('/generate-script', async (req, res) => {
  try {
    const { naturalLanguageTest, platform, appId } = req.body;

    if (!naturalLanguageTest) {
      return res.status(400).json({
        success: false,
        error: 'Natural language test case is required'
      });
    }

    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Platform is required (android, ios, or web)'
      });
    }

    // 🔍 VALIDATE INPUT BEFORE GENERATING SCRIPT
    console.log('🔍 Validating test input for script generation...');
    const validationResult = inputValidationService.validateTestInput(naturalLanguageTest, platform);
    
    if (!validationResult.isValid) {
      console.log('❌ Input validation failed for script generation:', validationResult.errors);
      return res.status(400).json({
        success: false,
        error: 'Invalid test case input',
        message: 'Please fix the following issues before generating script:',
        details: validationResult.errors,
        suggestions: validationResult.suggestions,
        confidence: validationResult.confidence,
        detectedIssues: validationResult.detectedIssues
      });
    }

    // Check automation suitability
    const suitabilityResult = inputValidationService.validateAutomationSuitability(naturalLanguageTest);
    if (!suitabilityResult.suitable) {
      console.log('❌ Test case not suitable for automation:', suitabilityResult.reasons);
      return res.status(400).json({
        success: false,
        error: 'Test case not suitable for automation',
        message: 'This test case contains actions that cannot be automated',
        reasons: suitabilityResult.reasons,
        recommendations: suitabilityResult.recommendations
      });
    }

    console.log(`🤖 Generating test script for: "${naturalLanguageTest}" (${platform})`);
    console.log(`📊 Input confidence: ${validationResult.confidence}%`);

    // Generate test script using LLM
    const scriptResult = await llmService.generateTestScript(naturalLanguageTest, platform);

    res.status(200).json({
      success: true,
      testId: scriptResult.testId,
      script: scriptResult.script,
      metadata: scriptResult.metadata,
      message: 'Test script generated successfully'
    });

  } catch (error) {
    console.error('Test script generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate test script'
    });
  }
});

// Execute test with full automation
router.post('/execute', async (req, res) => {
  try {
    console.log('🚀 EXECUTE API CALLED - Request Body:', JSON.stringify(req.body, null, 2));
    
    const {
      testCaseName,
      naturalLanguageTest,
      platform,
      appId,
      appPath,
      script,
      email,
      useCloudDevices
    } = req.body;

    if (!naturalLanguageTest) {
      console.log('❌ Missing naturalLanguageTest');
      return res.status(400).json({
        success: false,
        error: 'Natural language test case is required'
      });
    }

    if (!platform) {
      console.log('❌ Missing platform');
      return res.status(400).json({
        success: false,
        error: 'Platform is required'
      });
    }

    // 🔍 COMPREHENSIVE INPUT VALIDATION
    const validationResult = inputValidationService.validateTestInput(naturalLanguageTest, platform);
    
    if (!validationResult.isValid) {
      console.log('❌ Input validation failed:', validationResult.errors);
      return res.status(400).json({
        success: false,
        error: 'Invalid test case input',
        message: 'Please fix the following issues:',
        details: validationResult.errors,
        suggestions: validationResult.suggestions,
        confidence: validationResult.confidence,
        detectedIssues: validationResult.detectedIssues
      });
    }

    // Show warnings if confidence is low but still valid
    if (validationResult.warnings.length > 0) {
      console.log('⚠️ Input validation warnings:', validationResult.warnings);
      // Continue execution but log warnings
    }

    // Check automation suitability
    const suitabilityResult = inputValidationService.validateAutomationSuitability(naturalLanguageTest);
    if (!suitabilityResult.suitable) {
      console.log('❌ Test case not suitable for automation:', suitabilityResult.reasons);
      return res.status(400).json({
        success: false,
        error: 'Test case not suitable for automation',
        message: 'This test case contains actions that cannot be automated',
        reasons: suitabilityResult.reasons,
        recommendations: suitabilityResult.recommendations
      });
    }

    console.log('✅ Starting automated test execution...');
    console.log('📋 Test Data:', { naturalLanguageTest, platform, appPath, appId, email });

    logger.test('Automated Test Execution', 'Started', {
      testCase: naturalLanguageTest,
      platform: platform
    });

    // Execute full automated test
    console.log('🎯 Calling automatedTestService.executeFullTest()...');
    const result = await automatedTestService.executeFullTest({
      testCaseName,
      naturalLanguageTest,
      platform,
      appPath,
      appId,
      email,
      useCloudDevices
    });
    
    console.log('📊 Automation result:', JSON.stringify(result, null, 2));

    if (result.success) {
      res.status(200).json({
        success: true,
        executionId: result.executionId,
        message: 'Test executed successfully with full automation',
        report: result.report,
        summary: result.summary,
        htmlReportUrl: `/reports/${result.report.id}.html`
      });
    } else {
      // Even for failures, generate a report and return it
      const userFriendlyError = automatedTestService.getUserFriendlyError(result.error);
      
      res.status(200).json({
        success: false,
        executionId: result.executionId,
        message: 'Test execution completed with failures',
        error: userFriendlyError,
        report: result.report,
        htmlReportUrl: result.report ? `/reports/${result.report.id}.html` : null,
        failureDetails: {
          failedStep: result.failedStep || 'Unknown step',
          failureReason: result.failureReason || userFriendlyError,
          screenshots: result.screenshots || [],
          stepDetails: result.stepDetails || []
        }
      });
    }

      } catch (error) {
      logger.error('Automated test execution error', {
        error: error.message,
        stack: error.stack,
        testCase: req.body.naturalLanguageTest,
        platform: req.body.platform
      });
      const userFriendlyError = automatedTestService.getUserFriendlyError(error.message);
      
      res.status(500).json({
        success: false,
        error: userFriendlyError
      });
    }
});

// Get test execution result
router.get('/result/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;

    const execution = await testExecutionService.getExecutionResult(executionId);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found',
        message: `No execution found with ID: ${executionId}`
      });
    }

    res.status(200).json({
      success: true,
      execution
    });

  } catch (error) {
    console.error('Get execution result error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get execution result'
    });
  }
});

// Get all test executions
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, offset = 0, platform, status } = req.query;

    let executions = await testExecutionService.getAllExecutions();

    // Filter by platform if specified
    if (platform) {
      executions = executions.filter(exec => exec.platform === platform);
    }

    // Filter by status if specified
    if (status) {
      executions = executions.filter(exec => exec.status === status);
    }

    // Sort by start time (newest first)
    executions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    // Apply pagination
    const paginatedExecutions = executions.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.status(200).json({
      success: true,
      executions: paginatedExecutions,
      total: executions.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Get test history error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get test history'
    });
  }
});

// Get test templates
router.get('/templates', (req, res) => {
  try {
        const templates = [
          {
            id: 'alphanso-app-template',
            name: 'Alphanso App Template',
            template: 'Click on Next Button\nClick on Language Formation\nVerify Lang-Form Exercise 1:Sentence Formation displayed\nClick on Lang-Form Exercise 1:Sentence Formation\nVerify Nouns and Verb visible\nClick on Nouns on Verbs',
            description: 'Test Alphanso app language formation exercise with sentence formation and noun/verb interaction',
            platform: 'android'
          },
          {
            id: 'lexical-semantics-template',
            name: 'Lexical Semantics Template',
            template: 'Open the App\nScroll in the Intro page\nClick on Next Button\nClick on Lexical Semantics\nClick on Lex Sem Exercise 1: Visual Identification\nClick on Picture Word Matching\nClick on the word "चम्मच" (Correct answer)\nClick on Next button on this page',
            description: 'Test Lexical Semantics app with visual identification and picture word matching exercises using Hindi text',
            platform: 'android'
          },
          {
            id: 'api-demos-template',
            name: 'API Demos Template',
            template: 'Click on Views\nClick on TextFields\nEnter Text - "Aniket Appium"\nVerify "Aniket Appium" is displayed\nClick on Back button',
            description: 'Test API Demos app text field functionality with text entry and verification',
            platform: 'android'
          }
        ];

    res.status(200).json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get test templates'
    });
  }
});

// Get supported platforms
router.get('/platforms', (req, res) => {
  try {
    const platforms = [
      {
        id: 'android',
        name: 'Android',
        description: 'Android mobile applications',
        supportedFormats: ['.apk'],
        icon: '📱'
      },
      {
        id: 'ios',
        name: 'iOS',
        description: 'iOS mobile applications',
        supportedFormats: ['.ipa'],
        icon: '📱'
      },
      {
        id: 'web',
        name: 'Web',
        description: 'Web applications',
        supportedFormats: ['url'],
        icon: '🌐'
      }
    ];

    res.status(200).json({
      success: true,
      platforms
    });

  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get supported platforms'
    });
  }
});

// Get test execution statistics
router.get('/stats', async (req, res) => {
  try {
    const executions = await testExecutionService.getAllExecutions();

    const stats = {
      total: executions.length,
      passed: executions.filter(exec => exec.status === 'passed').length,
      failed: executions.filter(exec => exec.status === 'failed').length,
      running: executions.filter(exec => exec.status === 'running').length,
      platforms: {
        android: executions.filter(exec => exec.platform === 'android').length,
        ios: executions.filter(exec => exec.platform === 'ios').length,
        web: executions.filter(exec => exec.platform === 'web').length
      },
      averageDuration: executions.length > 0 
        ? executions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / executions.length 
        : 0
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get test statistics'
    });
  }
});

// Stop test execution
router.post('/stop', async (req, res) => {
  try {
    const { executionId } = req.body;

    if (!executionId) {
      return res.status(400).json({
        success: false,
        error: 'Execution ID is required'
      });
    }

    console.log(`🛑 Stop execution requested for: ${executionId}`);

    // Stop the test execution
    const stopped = await automatedTestService.stopTestExecution(executionId);

    if (stopped) {
      res.status(200).json({
        success: true,
        message: 'Test execution stopped successfully',
        executionId: executionId
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Test execution not found or already completed',
        executionId: executionId
      });
    }

  } catch (error) {
    console.error('Error stopping test execution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop test execution',
      message: error.message
    });
  }
});

// Check emulator availability
router.get('/emulator/status', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Check if Android SDK is available
    try {
      await execAsync('adb version');
      res.json({ available: true, message: 'Android SDK detected' });
    } catch (error) {
      res.json({ available: false, message: 'Android SDK not found' });
    }
  } catch (error) {
    res.json({ available: false, message: 'Unable to check emulator status' });
  }
});

module.exports = router;
