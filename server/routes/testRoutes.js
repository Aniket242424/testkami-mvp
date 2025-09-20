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
      naturalLanguageTest,
      platform,
      appId,
      appPath,
      script,
      email = 'amahangade24@gmail.com'
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
    console.log('🔍 Validating test input...');
    const validationResult = inputValidationService.validateTestInput(naturalLanguageTest, platform);
    
    console.log('🔍 Validation result:', JSON.stringify(validationResult, null, 2));
    
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
      naturalLanguageTest,
      platform,
      appPath,
      appId,
      email
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
      // Return user-friendly error
      const userFriendlyError = automatedTestService.getUserFriendlyError(result.error);
      
      res.status(500).json({
        success: false,
        error: userFriendlyError,
        executionId: result.executionId,
        report: result.report
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
        id: 'login-test',
        name: 'Login Test',
        template: 'Login with valid credentials and verify dashboard loads',
        description: 'Test user login functionality with valid credentials',
        platform: 'android'
      },
      {
        id: 'web-login-test',
        name: 'Web Login Test',
        template: 'Login with valid credentials and verify dashboard loads',
        description: 'Test web application login functionality',
        platform: 'web'
      },
      {
        id: 'navigation-test',
        name: 'Navigation Test',
        template: 'Navigate through the main menu and verify all pages load correctly',
        description: 'Test app navigation and menu functionality',
        platform: 'android'
      },
      {
        id: 'form-test',
        name: 'Form Test',
        template: 'Fill out the registration form and verify successful submission',
        description: 'Test form submission and validation',
        platform: 'web'
      },
      {
        id: 'ios-login-test',
        name: 'iOS Login Test',
        template: 'Login with valid credentials and verify dashboard loads',
        description: 'Test iOS app login functionality',
        platform: 'ios'
      },
      {
        id: 'search-test',
        name: 'Search Test',
        template: 'Search for a product and verify search results are displayed',
        description: 'Test search functionality',
        platform: 'web'
      },
      {
        id: 'alphanso-app-template',
        name: 'Alphanso App Template',
        template: 'Click on Next Button\nClick on Language Formation\nVerify Lang-Form Exercise 1:Sentence Formation displayed\nClick on Lang-Form Exercise 1:Sentence Formation\nVerify Nouns and Verb visible\nClick on Nouns on Verbs',
        description: 'Test Alphanso app language formation exercise with sentence formation and noun/verb interaction',
        platform: 'android'
      },
      {
        id: 'api-demos-template',
        name: 'API Demos Template',
        template: 'Click on Views\nClick on TextFields\nEnter Text - "Aniket Appium"\nVerify "Aniket Appium" is displayed\nClick on Back button',
        description: 'Test API Demos app text field functionality with text entry and verification',
        platform: 'android'
      },
      {
        id: 'lexical-semantics-template',
        name: 'Lexical Semantics Template',
        template: 'Open the App\nScroll in the Intro page\nClick on Next Button\nClick on Lexical Semantics\nClick on Lex Sem Exercise 1: Visual Identification\nClick on Picture Noun Matching\nClick on the word "spoon" (Correct answer)\nClick on Next button on this page',
        description: 'Test Lexical Semantics app with visual identification and picture noun matching exercises',
        platform: 'android'
      },
      {
        id: 'form-validation-template',
        name: 'Form Validation Template',
        template: 'Click on Registration\nEnter username "testuser123"\nEnter email "test@example.com"\nEnter password "TestPass123"\nClick on Submit button\nVerify "Registration successful" message is displayed',
        description: 'Test form validation with user registration including field validation and success verification',
        platform: 'android'
      },
      {
        id: 'navigation-menu-template',
        name: 'Navigation Menu Template',
        template: 'Click on Menu button\nVerify all menu items are visible\nClick on Settings\nVerify Settings page loads\nClick on Back button\nClick on Profile\nVerify Profile page loads\nClick on Back button',
        description: 'Test app navigation through menu system with page verification and back navigation',
        platform: 'android'
      },
      {
        id: 'search-functionality-template',
        name: 'Search Functionality Template',
        template: 'Click on Search icon\nEnter search term "mobile app"\nClick on Search button\nVerify search results are displayed\nClick on first result\nVerify result details page loads\nClick on Back button',
        description: 'Test search functionality with search term entry, results display, and navigation to details',
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

module.exports = router;
