const path = require('path');
const fs = require('fs-extra');

class TestService {
  async prepareTestScript(testScript, appPath, deviceConfig) {
    try {
      console.log('🔧 Preparing test script for execution...');
      
      // Validate test script
      if (!testScript || !testScript.code) {
        throw new Error('Invalid test script provided');
      }

      // Prepare script with app path and device configuration
      const preparedScript = this.injectConfiguration(testScript, appPath, deviceConfig);
      
      // Validate script syntax (basic validation)
      this.validateScriptSyntax(preparedScript);
      
      // Create temporary script file
      const scriptPath = await this.createScriptFile(preparedScript);
      
      console.log('✅ Test script prepared successfully');
      
      return {
        ...preparedScript,
        scriptPath: scriptPath
      };

    } catch (error) {
      console.error('Test script preparation error:', error);
      throw new Error(`Failed to prepare test script: ${error.message}`);
    }
  }

  injectConfiguration(testScript, appPath, deviceConfig) {
    let scriptCode = testScript.code;
    
    // Replace placeholder app path
    if (appPath) {
      scriptCode = scriptCode.replace(/\/path\/to\/app\.(apk|app)/g, appPath);
    }
    
    // Inject device configuration
    if (deviceConfig) {
      scriptCode = this.injectDeviceConfig(scriptCode, deviceConfig);
    }
    
    // Add error handling and logging
    scriptCode = this.addErrorHandling(scriptCode);
    
    return {
      ...testScript,
      code: scriptCode
    };
  }

  injectDeviceConfig(scriptCode, deviceConfig) {
    // Inject device-specific capabilities
    const deviceCapabilities = this.generateDeviceCapabilities(deviceConfig);
    
    // Find capabilities object and replace it
    const capabilitiesRegex = /capabilities\s*=\s*\{[\s\S]*?\}/;
    if (capabilitiesRegex.test(scriptCode)) {
      scriptCode = scriptCode.replace(capabilitiesRegex, `capabilities = ${deviceCapabilities}`);
    } else {
      // Add capabilities if not found
      scriptCode = scriptCode.replace(
        /const\s+capabilities\s*=\s*\{/,
        `const capabilities = ${deviceCapabilities}`
      );
    }
    
    return scriptCode;
  }

  generateDeviceCapabilities(deviceConfig) {
    const baseCapabilities = {
      'appium:noReset': false,
      'appium:newCommandTimeout': 60,
      'appium:autoGrantPermissions': true
    };

    // Merge with device-specific configuration
    const capabilities = {
      ...baseCapabilities,
      ...deviceConfig
    };

    return JSON.stringify(capabilities, null, 2);
  }

  addErrorHandling(scriptCode) {
    // Add try-catch wrapper if not present
    if (!scriptCode.includes('try {') && !scriptCode.includes('catch')) {
      const wrappedCode = `
async function runTest() {
  let driver;
  
  try {
    console.log('🚀 Starting test execution...');
    
    ${scriptCode}
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take error screenshot
    if (driver) {
      try {
        await driver.saveScreenshot('./screenshots/error.png');
        console.log('📸 Error screenshot saved');
      } catch (screenshotError) {
        console.error('Failed to take error screenshot:', screenshotError.message);
      }
    }
    
    throw error;
  } finally {
    if (driver) {
      try {
        await driver.deleteSession();
        console.log('🗑️ Session cleaned up');
      } catch (cleanupError) {
        console.error('Session cleanup failed:', cleanupError.message);
      }
    }
  }
}

module.exports = { runTest };
`;
      return wrappedCode;
    }
    
    return scriptCode;
  }

  validateScriptSyntax(script) {
    // Basic syntax validation
    const requiredElements = [
      'async function',
      'driver',
      'capabilities',
      'remote'
    ];
    
    const missingElements = requiredElements.filter(element => 
      !script.code.includes(element)
    );
    
    if (missingElements.length > 0) {
      throw new Error(`Script missing required elements: ${missingElements.join(', ')}`);
    }
    
    // Check for basic JavaScript syntax
    try {
      // Basic validation - check for common syntax errors
      if (script.code.includes('function') && !script.code.includes('{')) {
        throw new Error('Invalid function syntax');
      }
      
      if (script.code.includes('await') && !script.code.includes('async')) {
        throw new Error('await used without async function');
      }
      
    } catch (error) {
      throw new Error(`Script syntax validation failed: ${error.message}`);
    }
  }

  async createScriptFile(script) {
    try {
      const scriptsDir = path.join(__dirname, '../temp/scripts');
      await fs.ensureDir(scriptsDir);
      
      const filename = `test_${Date.now()}.js`;
      const scriptPath = path.join(scriptsDir, filename);
      
      await fs.writeFile(scriptPath, script.code, 'utf8');
      
      return scriptPath;
      
    } catch (error) {
      throw new Error(`Failed to create script file: ${error.message}`);
    }
  }

  async cleanupScriptFile(scriptPath) {
    try {
      if (scriptPath && await fs.pathExists(scriptPath)) {
        await fs.remove(scriptPath);
        console.log('🗑️ Script file cleaned up');
      }
    } catch (error) {
      console.warn('Script cleanup failed:', error.message);
    }
  }

  async validateTestParameters(testCase, platform, appPath) {
    const errors = [];
    
    // Validate test case
    if (!testCase || typeof testCase !== 'string' || testCase.trim().length === 0) {
      errors.push('Test case is required and must be a non-empty string');
    }
    
    // Validate platform
    if (!platform || !['android', 'ios', 'web'].includes(platform)) {
      errors.push('Platform must be one of: android, ios, web');
    }
    
    // Validate app path for mobile platforms
    if (['android', 'ios'].includes(platform)) {
      if (!appPath) {
        errors.push('App path is required for mobile platforms');
      } else if (!await fs.pathExists(appPath)) {
        errors.push('App file does not exist at the specified path');
      }
    }
    
    return errors;
  }

  generateTestSummary(testResults) {
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

  async createTestReport(testId, testCase, testResults) {
    try {
      const reportDir = path.join(__dirname, '../reports', testId);
      await fs.ensureDir(reportDir);
      
      const summary = this.generateTestSummary(testResults);
      
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
        summary: summary,
        logs: testResults.logs || [],
        error: testResults.error || null,
        metadata: testResults.metadata || {}
      };
      
      // Save report as JSON
      const reportPath = path.join(reportDir, 'report.json');
      await fs.writeJson(reportPath, report, { spaces: 2 });
      
      // Create screenshots directory
      const screenshotsDir = path.join(reportDir, 'screenshots');
      await fs.ensureDir(screenshotsDir);
      
      return report;
      
    } catch (error) {
      throw new Error(`Failed to create test report: ${error.message}`);
    }
  }
}

module.exports = new TestService();
