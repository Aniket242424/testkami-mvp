const { exec, execAsync } = require('../utils/execUtils');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const llmService = require('./llmService');
const appiumService = require('./appiumService');
const reportService = require('./reportService');
const emailService = require('./emailService');

class AutomatedTestService {
  constructor() {
    this.executionId = null;
  }

  async executeFullTest(testData) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.executionId = executionId;
    
    const startTime = Date.now();
    
    try {
      logger.info('🧪 Test', 'Automated Test Execution - Started', { executionId });
      
      // Step 1: Generate test script
      console.log('📝 Step 1: Generating test script...');
      logger.info('🧪 Test', 'Script Generation - Started', { executionId });
      
      const scriptResult = await llmService.generateTestScript(
        testData.naturalLanguageTest,
        testData.platform
      );
      
      logger.info('🧪 Test', 'Script Generation - Completed', { executionId });
      
      // Step 2: Start emulator and launch app
      console.log('📱 Step 2: Starting emulator and launching app...');
      logger.info('📱 Emulator', 'Starting emulator and launching app', { executionId });
      
      const emulatorResult = await this.startEmulatorAndApp(testData);
      
      logger.info('📱 Emulator', 'Emulator and app launched successfully', { executionId });
      
      // Step 3: Execute test script
      console.log('🧪 Step 3: Executing test script...');
      logger.info('🧪 Test', 'Test Execution - Started', { executionId });
      
      const testResult = await this.executeTestScript(scriptResult, emulatorResult.driver, executionId);
      
      logger.info('🧪 Test', 'Test Execution - Completed', { executionId });
      
      // Step 4: Generate comprehensive report
      console.log('📊 Step 4: Generating comprehensive report...');
      logger.info('🧪 Test', 'Generating comprehensive report', { executionId });
      
      const reportResult = await this.generateReport(testData, scriptResult, emulatorResult, testResult, executionId);
      
      // Step 5: Send email report
      console.log('📧 Step 5: Sending email report...');
      logger.info('📧 Email', 'Sending test report', { executionId });
      
      await emailService.sendTestReport(reportResult, testData.email);
      
      logger.info('📧 Email', 'Email report sent successfully', { executionId });
      
      // Step 6: Cleanup
      console.log('🧹 Step 6: Performing cleanup...');
      logger.info('🧪 Test', 'Performing cleanup', { executionId });
      
      await this.performCleanup(emulatorResult.driver);
      
      const totalDuration = Date.now() - startTime;
      logger.info('⚡ Performance', `Full test execution took ${totalDuration}ms`, { executionId });
      
      logger.success('🧪 Test', 'Full test execution completed successfully', { executionId });
      
      return {
        success: true,
        executionId,
        report: reportResult,
        summary: {
          status: testResult.summary.failedSteps > 0 ? 'FAIL' : 'PASS',
          duration: totalDuration,
          steps: testResult.summary.totalSteps,
          screenshots: testResult.summary.screenshots
        }
      };
      
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error('❌ Full test execution failed:', error);
      
      // Generate error report
      const errorReport = await this.generateErrorReport(testData, error, executionId, totalDuration);
      
      // Send error email
      try {
        await emailService.sendTestReport(errorReport, testData.email);
      } catch (emailError) {
        console.error('Failed to send error email:', emailError);
      }
      
      throw error;
    }
  }

  async startEmulatorAndApp(testData) {
    console.log('🚀 STARTING EMULATOR AND APP AUTOMATION...');
    
    try {
      // Check and start Appium server
      await this.ensureAppiumServerRunning();
      
      // Get the actual APK file path from the file ID
      console.log('📱 Resolving APK file path...');
      console.log('📱 File ID from test data:', testData.appPath);
      
      const uploadController = require('../controllers/uploadController');
      console.log('📱 Upload controller loaded:', typeof uploadController);
      console.log('📱 Upload controller keys:', Object.keys(uploadController));
      
      const uploadedFiles = uploadController.uploadedFiles;
      console.log('📱 Uploaded files Map:', typeof uploadedFiles);
      console.log('📱 Uploaded files size:', uploadedFiles ? uploadedFiles.size : 'undefined');
      
      if (!uploadedFiles) {
        throw new Error('Uploaded files Map is not available');
      }
      
      const fileInfo = uploadedFiles.get(testData.appPath);
      
      if (!fileInfo) {
        throw new Error(`APK file not found for ID: ${testData.appPath}`);
      }
      
      console.log('📱 File info found:', fileInfo);
      console.log('📱 Using APK path for app installation and launch');
      
      // Start emulator and launch app
      const emulatorResult = await appiumService.startEmulatorAndLaunchApp(fileInfo.filePath);
      
      console.log('✅ Emulator and app launched successfully');
      
      return emulatorResult;
      
    } catch (error) {
      console.error('❌ Emulator and app launch failed:', error);
      throw error;
    }
  }

  async ensureAppiumServerRunning() {
    try {
      // Check if Appium server is already running
      const { stdout } = await execAsync('powershell -Command "try { Invoke-WebRequest -Uri http://localhost:4723/status -UseBasicParsing -TimeoutSec 5 | Select-Object -ExpandProperty Content } catch { exit 1 }"');
      
      if (stdout.includes('"ready":true')) {
        console.log('✅ Appium server is already running');
        return;
      } else {
        throw new Error('Appium server not responding');
      }
    } catch (statusError) {
      console.log('🔄 Appium server not running, starting it...');
      
      // Kill any existing Appium processes first
      try {
        await execAsync('taskkill /f /im node.exe /fi "WINDOWTITLE eq appium*"');
        console.log('🧹 Killed existing Appium processes');
      } catch (killError) {
        // Ignore errors if no processes to kill
      }
      
      // Start Appium server
      console.log('🚀 Starting Appium server process...');
      const appiumProcess = exec('npx appium --base-path /wd/hub --port 4723 --log-level info', { 
        detached: true,
        stdio: 'pipe',
        windowsHide: false
      });
      
      // Wait for server to start with faster checks
      let serverStarted = false;
      for (let i = 0; i < 30; i++) { // Reduced to 30 seconds
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
          
          // Try multiple methods to check if Appium is running
          try {
            // Method 1: Direct port check (fastest)
            const { stdout } = await execAsync('netstat -an | findstr :4723');
            if (stdout.includes('LISTENING')) {
              serverStarted = true;
              console.log('✅ Appium server started successfully (port check)');
              break;
            }
          } catch (portError) {
            // Method 2: Try curl if port check fails
            try {
              const { stdout } = await execAsync('curl -s --connect-timeout 3 http://localhost:4723/status');
              if (stdout.includes('"status":0') || stdout.includes('"ready":true')) {
                serverStarted = true;
                console.log('✅ Appium server started successfully (status check)');
                break;
              }
            } catch (curlError) {
              // Continue waiting
            }
          }
          
          console.log(`⏳ Waiting for Appium server... (${i + 1}/30)`);
        } catch (checkError) {
          console.log(`⏳ Waiting for Appium server... (${i + 1}/30)`);
        }
      }
      
      if (!serverStarted) {
        throw new Error('Appium server failed to start. Please start it manually and try again.');
      }
    }
  }

  async executeTestScript(scriptResult, driver, executionId) {
    try {
      console.log('🧪 Executing test script...');
      
      const steps = [];
      const screenshots = [];
      const logs = [];
      
      // Parse the generated script to extract steps
      const testSteps = this.parseScriptToSteps(scriptResult.script || scriptResult.code);
      
      for (let i = 0; i < testSteps.length; i++) {
        const step = testSteps[i];
        const stepStartTime = Date.now();
        
        try {
          console.log(`📝 Executing step ${i + 1}: ${step.description}`);
          logs.push(`Executing step ${i + 1}: ${step.description}`);

          // Execute structured step if available, otherwise eval fallback
          if (step.type) {
            await this.executeParsedStep(driver, step);
          } else {
            await this.executeStepCode(step.code, driver);
          }
          
          const stepDuration = Date.now() - stepStartTime;
          
          // Take screenshot after step execution
          const screenshotPath = await this.takeScreenshot(driver, `step_${i + 1}_${Date.now()}`);
          screenshots.push({
            name: `Step ${i + 1}: ${step.description}`,
            path: screenshotPath,
            timestamp: new Date().toISOString()
          });
          
          steps.push({
            name: step.description,
            status: 'passed',
            duration: stepDuration,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Step ${i + 1} completed successfully`);
          logs.push(`Step ${i + 1} completed successfully`);
          
        } catch (stepError) {
          const stepDuration = Date.now() - stepStartTime;
          
          // Take screenshot on failure
          const screenshotPath = await this.takeScreenshot(driver, `step_${i + 1}_error_${Date.now()}`);
          screenshots.push({
            name: `Step ${i + 1} Error: ${step.description}`,
            path: screenshotPath,
            timestamp: new Date().toISOString()
          });
          
          steps.push({
            name: step.description,
            status: 'failed',
            duration: stepDuration,
            timestamp: new Date().toISOString(),
            error: stepError.message
          });
          
          console.error(`❌ Step ${i + 1} failed:`, stepError.message);
          logs.push(`Step ${i + 1} failed: ${stepError.message}`);
          
          // Continue with next step instead of stopping
        }
      }
      
      return {
        steps,
        screenshots,
        logs,
        summary: {
          totalSteps: steps.length,
          passedSteps: steps.filter(s => s.status === 'passed').length,
          failedSteps: steps.filter(s => s.status === 'failed').length,
          totalDuration: steps.reduce((sum, step) => sum + step.duration, 0),
          screenshots: screenshots.length
        }
      };
      
    } catch (error) {
      console.error('❌ Test script execution failed:', error);
      throw error;
    }
  }

  parseScriptToSteps(script) {
    const steps = [];

    // 1) Extract explicit actions directly
    // Clicks
    const clickRegex = /await\s+driver\.\$\((['"`])([^'"`]+)\1\)\.click\(\)/g;
    let clickMatch;
    while ((clickMatch = clickRegex.exec(script)) !== null) {
      const locator = clickMatch[2];
      steps.push({ type: 'click', locator, description: `Click on ${locator.replace(/^~/,'')}` });
    }

    // setValue
    const setValueRegex = /await\s+driver\.\$\((['"`])([^'"`]+)\1\)\.setValue\((['"`])([^'"`]+)\3\)/g;
    let setValueMatch;
    while ((setValueMatch = setValueRegex.exec(script)) !== null) {
      const locator = setValueMatch[2];
      const value = setValueMatch[4];
      steps.push({ type: 'setValue', locator, value, description: `Set value on ${locator.replace(/^~/,'')}` });
    }

    // pause
    const pauseRegex = /await\s+driver\.pause\((\d+)\)/g;
    let pauseMatch;
    while ((pauseMatch = pauseRegex.exec(script)) !== null) {
      const ms = parseInt(pauseMatch[1], 10);
      steps.push({ type: 'pause', value: ms, description: `Wait ${ms}ms` });
    }

    // 2) If none extracted, fallback to previous step grouping
    if (steps.length === 0) {
      const lines = script.split('\n');
      let currentStep = null;
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('// Step') || (trimmedLine.includes('console.log') && trimmedLine.includes('Step'))) {
          if (currentStep) steps.push(currentStep);
          const stepMatch = trimmedLine.match(/Step \d+: (.+)/);
          const description = stepMatch ? stepMatch[1] : 'Execute test step';
          currentStep = { description, code: trimmedLine };
        } else if (currentStep && trimmedLine) {
          currentStep.code += '\n' + trimmedLine;
        }
      }
      if (currentStep) steps.push(currentStep);
      if (steps.length === 0) steps.push({ description: 'Execute test script', code: script });
    }

    return steps;
  }

  async executeParsedStep(driver, step) {
    const timeoutMs = 10000;
    const maxRetries = 3;

    // Dismiss any system popups before each step
    await this.dismissSystemPopups(driver);

    switch (step.type) {
      case 'click': {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const el = await this.findElementSmart(driver, step.locator, timeoutMs);
            await el.click();
            return;
          } catch (err) {
            if (attempt === maxRetries) throw err;
            await this.dismissSystemPopups(driver);
            await driver.pause(800 * attempt);
          }
        }
        return;
      }
      case 'setValue': {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const el = await this.findElementSmart(driver, step.locator, timeoutMs);
            await el.clearValue?.();
            await el.setValue(step.value ?? '');
            return;
          } catch (err) {
            if (attempt === maxRetries) throw err;
            await this.dismissSystemPopups(driver);
            await driver.pause(800 * attempt);
          }
        }
        return;
      }
      case 'pause': {
        await driver.pause(Number(step.value) || 1000);
        return;
      }
      default: {
        return;
      }
    }
  }

  async findElementSmart(driver, locator, timeoutMs = 8000) {
    // Prefer WDIO string selector strategies to avoid unsupported locator issues
    const candidates = [];

    if (locator.startsWith('~')) {
      const name = locator.slice(1);
      candidates.push(() => driver.$(`~${name}`));
      candidates.push(() => driver.$(`android=new UiSelector().text("${name}")`));
      candidates.push(() => driver.$(`android=new UiSelector().description("${name}")`));
    } else {
      // XPath if provided
      if (locator.startsWith('//') || locator.startsWith('(')) {
        candidates.push(() => driver.$(locator));
      }

      // Resource-id like com.app:id/foo
      if (/^[\w.]+:id\//.test(locator)) {
        candidates.push(() => driver.$(`android=new UiSelector().resourceId("${locator}")`));
      }

      // Text / contains / desc
      candidates.push(() => driver.$(`android=new UiSelector().text("${locator}")`));
      candidates.push(() => driver.$(`android=new UiSelector().textContains("${locator}")`));
      candidates.push(() => driver.$(`android=new UiSelector().description("${locator}")`));
      candidates.push(() => driver.$(`android=new UiSelector().descriptionContains("${locator}")`));
    }

    let lastError;
    for (const getEl of candidates) {
      try {
        const el = await getEl();
        await el.waitForExist({ timeout: timeoutMs });
        await el.waitForDisplayed({ timeout: timeoutMs }).catch(() => {});
        return el;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error(`Element not found: ${locator}`);
  }

  async dismissSystemPopups(driver) {
    const labels = [
      'Close app', 'Wait', 'OK', 'Allow', 'ALLOW', 'Continue', 'Cancel', 'Got it',
      'ALLOW ONLY WHILE USING THE APP', 'WHILE USING THE APP', "Don't allow",
    ];

    try {
      for (const text of labels) {
        try {
          const el = await driver.$(`android=new UiSelector().text("${text}")`);
          if (await el.isExisting()) {
            await el.click();
            await driver.pause(300);
            continue;
          }
        } catch {}
        try {
          const el2 = await driver.$(`android=new UiSelector().textContains("${text}")`);
          if (await el2.isExisting()) {
            await el2.click();
            await driver.pause(300);
            continue;
          }
        } catch {}
      }
    } catch {}
  }

  async executeStepCode(stepCode, driver) {
    try {
      // Create a safe execution environment
      const safeCode = this.sanitizeCode(stepCode);
      
      // Execute the code with the driver context
      const result = await eval(`
        (async () => {
          const driver = arguments[0];
          ${safeCode}
        })
      `)(driver);
      
      return result;
    } catch (error) {
      console.error('Step execution error:', error);
      throw error;
    }
  }

  sanitizeCode(code) {
    // Remove wrappers and potentially unsafe code so we can execute isolated step lines
    let cleaned = code;

    // Strip common wrappers produced by generators
    cleaned = cleaned.replace(/async\s+function\s+executeTest\s*\([^)]*\)\s*\{[\s\S]*?\n/g, ''); // remove function header
    cleaned = cleaned.replace(/\n\}\s*$/g, ''); // trailing closing brace
    cleaned = cleaned.replace(/executeTest\s*\(\s*\)\s*;?/g, ''); // function invoker

    // Remove try/catch blocks that may be split across steps
    cleaned = cleaned.replace(/\btry\s*\{?/g, '');
    cleaned = cleaned.replace(/\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?\}/g, ''); // entire catch block
    cleaned = cleaned.replace(/^\s*}\s*catch\b.*$/gm, ''); // orphan catch lines

    // Remove potentially dangerous code and replace with safe alternatives
    cleaned = cleaned
      .replace(/eval\(/g, '// eval(')
      .replace(/require\(/g, '// require(')
      .replace(/process\./g, '// process.')
      .replace(/__dirname/g, '// __dirname')
      .replace(/__filename/g, '// __filename');

    return cleaned;
  }

  async takeScreenshot(driver, filename) {
    try {
      const screenshotsDir = path.join(__dirname, '../../reports/screenshots');
      await fs.ensureDir(screenshotsDir);
      
      const screenshotPath = path.join(screenshotsDir, `${filename}.png`);
      await driver.saveScreenshot(screenshotPath);
      
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      console.error('Screenshot error:', error);
      return null;
    }
  }

  async generateReport(testData, scriptResult, emulatorResult, testResult, executionId) {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const reportPath = path.join(__dirname, '../../reports', `${reportId}.json`);
    const htmlReportPath = path.join(__dirname, '../../reports', `${reportId}.html`);
    
    const report = {
      id: reportId,
      executionId,
      testData,
      status: testResult.summary.failedSteps > 0 ? 'FAIL' : 'PASS',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: testResult.summary.totalDuration,
      summary: {
        totalSteps: testResult.summary.totalSteps,
        passedSteps: testResult.summary.passedSteps,
        failedSteps: testResult.summary.failedSteps,
        totalDuration: testResult.summary.totalDuration,
        screenshots: testResult.summary.screenshots
      },
      steps: testResult.steps,
      screenshots: testResult.screenshots,
      logs: testResult.logs,
      script: scriptResult,
      emulatorInfo: emulatorResult,
      generatedAt: new Date().toISOString()
    };
    
    // Save JSON report
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    // Generate HTML report
    const htmlReport = await reportService.generateHTMLReport(report);
    await fs.writeFile(htmlReportPath, htmlReport);
    
    return {
      ...report,
      jsonPath: reportPath,
      htmlPath: htmlReportPath
    };
  }

  async generateErrorReport(testData, error, executionId, duration) {
    const reportId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const reportPath = path.join(__dirname, '../../reports', `${reportId}.json`);
    const htmlReportPath = path.join(__dirname, '../../reports', `${reportId}.html`);
    
    const report = {
      id: reportId,
      executionId,
      testData,
      status: 'FAIL',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration,
      error: error.message,
      summary: {
        totalSteps: 0,
        passedSteps: 0,
        failedSteps: 1,
        totalDuration: duration,
        screenshots: 0
      },
      steps: [],
      screenshots: [],
      logs: [`Test execution failed: ${error.message}`],
      generatedAt: new Date().toISOString()
    };
    
    // Save JSON report
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    // Generate HTML report
    const htmlReport = await reportService.generateHTMLReport(report);
    await fs.writeFile(htmlReportPath, htmlReport);
    
    return {
      ...report,
      jsonPath: reportPath,
      htmlPath: htmlReportPath
    };
  }

  async performCleanup(driver) {
    try {
      if (driver) {
        await appiumService.cleanup();
        console.log('✅ Appium service cleaned up');
      }
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  getUserFriendlyError(errorMessage) {
    if (errorMessage.includes('Appium server failed to start')) {
      return 'Appium server could not be started. Please ensure Appium is installed and try again.';
    }
    if (errorMessage.includes('emulator')) {
      return 'Emulator could not be started. Please ensure Android emulator is available and try again.';
    }
    if (errorMessage.includes('APK file not found')) {
      return 'App file not found. Please upload a valid APK file and try again.';
    }
    return 'An error occurred during test execution. Please try again.';
  }
}

module.exports = new AutomatedTestService();
