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
    this.globalDeadline = null;
    this.pendingSetValueCount = 0;
  }

  async executeFullTest(testData) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.executionId = executionId;
    
    const startTime = Date.now();
    
    try {
      logger.info('🧪 Test', 'Automated Test Execution - Started', { executionId });
      
      // Step 1: Generate test script
      console.log('📝 Step 1: Generating test script...');
      console.log('🔍 Input testData:', JSON.stringify(testData, null, 2));
      console.log('🔍 naturalLanguageTest:', testData.naturalLanguageTest);
      logger.info('🧪 Test', 'Script Generation - Started', { executionId });
      
      const scriptResult = await llmService.generateTestScript(
        testData.naturalLanguageTest,
        testData.platform
      );
      console.log(`🧠 Script source: ${scriptResult?.source || 'unknown'}`);
      console.log('🔍 Generated script:', scriptResult?.code?.substring(0, 500) + '...');
      
      logger.info('🧪 Test', 'Script Generation - Completed', { executionId });
      
      // Step 2: Start emulator and launch app
      console.log('📱 Step 2: Starting emulator and launching app...');
      logger.info('📱 Emulator', 'Starting emulator and launching app', { executionId });
      
      const emulatorResult = await this.startEmulatorAndApp(testData);
      
      logger.info('📱 Emulator', 'Emulator and app launched successfully', { executionId });
      
      // Step 3: Execute test script (set global 60s deadline)
      console.log('🧪 Step 3: Executing test script...');
      logger.info('🧪 Test', 'Test Execution - Started', { executionId });
      this.globalDeadline = Date.now() + 90000; // 90s total for execution
      
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
    } finally {
      this.globalDeadline = null;
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
      
      // Use steps directly from LLM service if available, otherwise parse the script
      let parsed;
      if (scriptResult.steps && scriptResult.steps.length > 0) {
        console.log('🔍 Using steps directly from LLM service:', scriptResult.steps.length);
        console.log('🔍 Raw steps from LLM:', JSON.stringify(scriptResult.steps, null, 2));
        parsed = scriptResult.steps.map(step => {
          // Extract locator from the code if it exists
          let locator = step.locator || step.target;
          if (!locator && step.code) {
            // Extract locator from code like: await driver.$('~target').click();
            const match = step.code.match(/driver\.\$\(['"`]([^'"`]+)['"`]\)/);
            if (match) {
              locator = match[1];
            }
          }
          
          // If still no locator, try to extract from description
          if (!locator && step.description) {
            // Extract from descriptions like "Click on Next Button"
            const descMatch = step.description.match(/Click on (.+)/i);
            if (descMatch) {
              locator = descMatch[1];
            }
          }
          
          // If still no locator, use a fallback based on step type
          if (!locator) {
            if (step.description && step.description.includes('Scroll')) {
              locator = 'scrollable';
            } else if (step.description && step.description.includes('Open')) {
              locator = 'app';
            } else {
              locator = step.description || 'unknown';
            }
          }
          
          return {
            type: step.type || 'click', // Keep the original type from LLM service
            locator: locator,
            value: step.value,
            description: step.description
          };
        });
        console.log('🔍 Final parsed steps:', JSON.stringify(parsed, null, 2));
        console.log('🔍 Step types:', parsed.map(s => s.type));
      } else {
        console.log('🔍 Parsing script to extract steps...');
        parsed = this.parseScriptToSteps(scriptResult.script || scriptResult.code);
        console.log('🔍 Final parsed steps:', JSON.stringify(parsed, null, 2));
      }

      // Reorder: ensure any setValue appears right after "TextFields" click
      const textFieldsIdx = parsed.findIndex(s => (s.type === 'click' && (String(s.locator).toLowerCase().includes('textfield') || String(s.description || '').toLowerCase().includes('textfield'))));
      const firstSetIdx = parsed.findIndex(s => s.type === 'setValue');
      if (textFieldsIdx >= 0 && firstSetIdx >= 0 && firstSetIdx > textFieldsIdx + 1) {
        const [sv] = parsed.splice(firstSetIdx, 1);
        parsed.splice(textFieldsIdx + 1, 0, sv);
      }

      // Count pending text entries for guard
      this.pendingSetValueCount = parsed.filter(s => s.type === 'setValue').length;

      // Print a clear, concise step plan before execution
      const plannedSteps = parsed.map((s, idx) => `${idx + 1}. ${s.description || s.type || 'Step'} (${s.type || 'code'})`);
      console.log('🗺️ Planned Steps:\n' + plannedSteps.join('\n'));
      console.log('🔍 Step details:', JSON.stringify(parsed, null, 2));
      logs.push('Planned Steps:');
      plannedSteps.forEach(s => logs.push(s));
      
      for (let i = 0; i < parsed.length; i++) {
        const step = parsed[i];
        const stepStartTime = Date.now();
        
        // Global timeout check
        if (this.globalDeadline && Date.now() >= this.globalDeadline) {
          throw new Error('Global execution timeout reached (90000ms)');
        }
        
        try {
          console.log(`📝 Executing step ${i + 1}: ${step.description}`);
          logs.push(`Executing step ${i + 1}: ${step.description}`);

          // Execute structured step if available, otherwise eval fallback
          if (step.type) {
            await this.executeParsedStep(driver, step);
          } else {
            await this.executeStepCode(step.code, driver);
          }

          // Decrement guard when setValue succeeds
          if (step.type === 'setValue' && this.pendingSetValueCount > 0) {
            this.pendingSetValueCount -= 1;
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
          
          // Abort remaining steps on failure
          throw stepError;
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

    // 1) Extract explicit actions directly (more tolerant regexes)
    const clickRegex = /(?:await\s+)?driver\.\$\((['"`])([^'"`]+)\1\)\.click\(\)/g;
    let clickMatch;
    while ((clickMatch = clickRegex.exec(script)) !== null) {
      const locatorRaw = clickMatch[2];
      const locator = this.normalizeTarget(locatorRaw);
      steps.push({ type: 'click', locator, description: `Click on ${locator}` });
    }

    // 2) Extract complex click patterns with try-catch blocks
    const complexClickRegex = /\/\/ Smart clicking with multiple strategies for: ([^\n]+)[\s\S]*?await driver\.\$\(['"`]([^'"`]+)['"`]\)\.click\(\)/g;
    let complexClickMatch;
    while ((complexClickMatch = complexClickRegex.exec(script)) !== null) {
      const target = complexClickMatch[1];
      const locator = complexClickMatch[2];
      steps.push({ type: 'click', locator, description: `Click on ${target}` });
    }

    const setValueRegex = /(?:await\s+)?driver\.\$\((['"`])([^'"`]+)\1\)\.setValue\((['"`])([^'"`]+)\3\)/g;
    let setValueMatch;
    while ((setValueMatch = setValueRegex.exec(script)) !== null) {
      const locatorRaw = setValueMatch[2];
      const value = setValueMatch[4];
      const locator = this.normalizeTarget(locatorRaw);
      steps.push({ type: 'setValue', locator, value, description: `Set value on ${locator}` });
    }

    const pauseRegex = /(?:await\s+)?driver\.pause\((\d+)\)/g;
    let pauseMatch;
    while ((pauseMatch = pauseRegex.exec(script)) !== null) {
      const ms = parseInt(pauseMatch[1], 10);
      steps.push({ type: 'pause', value: ms, description: `Wait ${ms}ms` });
    }

    const backRegex = /(?:await\s+)?driver\.back\(\)/g;
    let backMatch;
    while ((backMatch = backRegex.exec(script)) !== null) {
      steps.push({ type: 'back', description: 'Go back' });
    }

    // Inject setValue if NL indicates entry
    const nlEnterRegexes = [
      /Enter\s+Text\s*(?:-|:)\s*"([^"]+)"/i,
      /Enter\s+Text\s*(?:-|:)\s*'([^']+)'/i,
      /\bEnter\s+"([^"]+)"/i,
      /\bEnter\s+'([^']+)'/i,
      /\bType\s+"([^"]+)"/i,
      /\bType\s+'([^']+)'/i
    ];
    for (const rx of nlEnterRegexes) {
      const m = script.match(rx);
      if (m && m[1]) {
        steps.push({ type: 'setValue', locator: 'input', value: m[1], description: `Enter text` });
        break;
      }
    }

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
    // Respect remaining global time
    const remainingGlobal = this.globalDeadline ? Math.max(0, this.globalDeadline - Date.now()) : 60000;
    const timeoutMs = Math.min(60000, remainingGlobal);
    const maxRetries = 2; // keep retries minimal to honor global timeout

    // Do not auto-dismiss popups before steps to avoid unintended navigation
    
    console.log(`🔍 Executing step: type="${step.type}", locator="${step.locator}", description="${step.description}"`);

    switch (step.type) {
      case 'click': {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const target = this.normalizeTarget(step.locator);
            const el = await this.findElementSmart(driver, target, timeoutMs);
            console.log(`➡️ Click: ${target}`);
            await el.click();
            return;
          } catch (err) {
            if (attempt === maxRetries) throw err;
            await this.dismissSystemPopups(driver);
            // Auto-scroll to try revealing the element between attempts
            try { await this.performScroll(driver, 'down'); } catch {}
            await driver.pause(800 * attempt);
          }
        }
        return;
      }
      case 'scroll': {
        try {
          console.log(`📜 Executing scroll action: ${step.description}`);
          // Robust, code-independent scrolling
          const direction = /up/i.test(step.description || '') ? 'up' : /left/i.test(step.description || '') ? 'left' : /right/i.test(step.description || '') ? 'right' : 'down';
          try {
            const size = await driver.getWindowSize();
            const left = Math.floor(size.width * 0.1);
            const top = Math.floor(size.height * 0.1);
            const width = Math.floor(size.width * 0.8);
            const height = Math.floor(size.height * 0.8);
            await driver.execute('mobile: scrollGesture', {
              left, top, width, height,
              direction,
              percent: 0.8
            });
          } catch (e) {
            // Fallback to W3C actions
            const size = await driver.getWindowSize();
            const startY = direction === 'down' ? Math.floor(size.height * 0.8) : direction === 'up' ? Math.floor(size.height * 0.2) : Math.floor(size.height * 0.5);
            const endY = direction === 'down' ? Math.floor(size.height * 0.2) : direction === 'up' ? Math.floor(size.height * 0.8) : Math.floor(size.height * 0.5);
            const startX = direction === 'left' ? Math.floor(size.width * 0.8) : direction === 'right' ? Math.floor(size.width * 0.2) : Math.floor(size.width * 0.5);
            const endX = direction === 'left' ? Math.floor(size.width * 0.2) : direction === 'right' ? Math.floor(size.width * 0.8) : Math.floor(size.width * 0.5);
            await driver.performActions([
              {
                type: 'pointer',
                id: 'finger1',
                parameters: { pointerType: 'touch' },
                actions: [
                  { type: 'pointerMove', duration: 0, x: startX, y: startY },
                  { type: 'pointerDown', button: 0 },
                  { type: 'pause', duration: 300 },
                  { type: 'pointerMove', duration: 500, x: endX, y: endY },
                  { type: 'pointerUp', button: 0 }
                ]
              }
            ]);
          }
          await driver.pause(1000);
          return;
        } catch (err) {
          console.log(`⚠️ Scroll failed: ${err.message}`);
          throw err;
        }
      }
      case 'setValue': {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const target = this.normalizeTarget(step.locator);
            let el;

            const waitForField = async (candidate) => {
              await candidate.waitForExist({ timeout: 10000 });
              await candidate.waitForDisplayed({ timeout: 10000 }).catch(() => {});
              return candidate;
            };

            if (!target || /^(input|text|textfield|edit|enter)$/i.test(target)) {
              // 1) Try to find a visible, empty EditText field first
              try {
                const allEditTexts = await driver.$$('android=new UiSelector().className("android.widget.EditText")');
                console.log(`🔍 Found ${allEditTexts.length} EditText fields`);
                
                // Look for an empty, visible field
                for (let i = 0; i < allEditTexts.length; i++) {
                  const field = allEditTexts[i];
                  try {
                    const isDisplayed = await field.isDisplayed();
                    const text = await field.getText();
                    console.log(`📝 Field ${i + 1}: displayed=${isDisplayed}, text="${text}"`);
                    
                    if (isDisplayed && (!text || text.trim() === '' || text === 'hint text')) {
                      el = field;
                      console.log(`✅ Selected empty field ${i + 1} for text entry`);
                      break;
                    }
                  } catch (err) {
                    console.log(`⚠️ Could not check field ${i + 1}: ${err.message}`);
                  }
                }
                
                // If no empty field found, use the first visible one
                if (!el) {
                  for (let i = 0; i < allEditTexts.length; i++) {
                    const field = allEditTexts[i];
                    try {
                      if (await field.isDisplayed()) {
                        el = field;
                        console.log(`✅ Selected first visible field ${i + 1} for text entry`);
                        break;
                      }
                    } catch (err) {}
                  }
                }
              } catch (err) {
                console.log(`⚠️ Could not find EditText fields: ${err.message}`);
              }
              
              // Fallback to original logic if above failed
              if (!el) {
                // 1) Focused EditText
                el = await driver.$('android=new UiSelector().className("android.widget.EditText").focused(true)');
                if (!(await el.isExisting())) {
                  // 2) First EditText by class
                  el = await driver.$('android=new UiSelector().className("android.widget.EditText")');
                }
                if (!(await el.isExisting())) {
                  // 3) XPath fallback
                  el = await driver.$('//android.widget.EditText');
                }
                if (!(await el.isExisting())) {
                  // 4) Scroll into view by class
                  try {
                    el = await driver.$('android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().className("android.widget.EditText"))');
                  } catch {}
                }
              }
              if (!(await el.isExisting())) {
                // 5) Tap common row and retry (TextFields -> EditText example)
                try {
                  const row = await driver.$('android=new UiSelector().textContains("EditText")');
                  if (await row.isExisting()) {
                    console.log('➡️ Opening EditText example row');
                    await row.click();
                    await driver.pause(500);
                  }
                } catch {}
                // Retry focused/class/xpath after opening
                el = await driver.$('android=new UiSelector().className("android.widget.EditText").focused(true)');
                if (!(await el.isExisting())) el = await driver.$('android=new UiSelector().className("android.widget.EditText")');
                if (!(await el.isExisting())) el = await driver.$('//android.widget.EditText');
              }
            } else {
              el = await this.findElementSmart(driver, target, timeoutMs);
            }

            // Final guard: wait up to 10s for the field
            el = await waitForField(el);

            try { await el.click(); } catch {}
            await driver.pause(200);
            const valueToType = String(step.value ?? '');
            console.log(`✏️ Entering text: "${valueToType}"`);
            
            // Click the field to focus it
            await el.click();
            await driver.pause(500); // Wait for field to focus
            console.log(`🎯 Field clicked and focused`);
            
            // Clear any existing text and enter new text
            try { 
              await el.clearValue(); 
              console.log(`🧹 Cleared existing text`);
            } catch (err) {
              console.log(`⚠️ Could not clear field: ${err.message}`);
            }
            
            console.log(`⌨️ Typing: "${valueToType}"`);
            
            // Try multiple text entry methods
            try {
              await el.setValue(valueToType);
              console.log(`✅ Text entry completed with setValue`);
            } catch (err) {
              console.log(`⚠️ setValue failed, trying sendKeys: ${err.message}`);
              try {
                await el.addValue(valueToType);
                console.log(`✅ Text entry completed with addValue`);
              } catch (err2) {
                console.log(`⚠️ addValue failed, trying direct input: ${err2.message}`);
                // Last resort: use driver keys
                await driver.keys(valueToType);
                console.log(`✅ Text entry completed with driver.keys`);
              }
            }
            
            // Wait a moment for UI to update
            await driver.pause(1000);
            
            // Read back and verify
            let typed = '';
            try { typed = await el.getText(); } catch {}
            if (!typed) {
              try { typed = await el.getAttribute('text'); } catch {}
            }
            if (!typed) {
              try { typed = await el.getAttribute('content-desc'); } catch {}
            }
            console.log(`✅ Entered text now reads: "${typed}"`);
            
            // Verify text was entered correctly
            console.log(`🔍 Verifying text entry...`);
            
            if (!typed || !typed.includes(valueToType)) {
              throw new Error(`Entered text mismatch. Expected contains: "${valueToType}", Actual: "${typed}"`);
            }
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
      case 'back': {
        // Block back until all setValue steps complete
        if (this.pendingSetValueCount > 0) {
          throw new Error('Back requested before text entry completed');
        }
        await driver.back();
        await driver.pause(500);
        return;
      }
      case 'verify': {
        const target = step.target;
        console.log(`🔍 Verifying: "${target}"`);
        
        // First try to find in input field
        try {
          const inputField = await driver.$("android=new UiSelector().className(\"android.widget.EditText\")");
          const inputText = await inputField.getText();
          if (inputText && inputText.includes(target)) {
            console.log(`✅ Text found in input field: "${inputText}"`);
            return;
          }
        } catch (err) {
          console.log(`⚠️ Input field check failed: ${err.message}`);
        }
        
        // Try to find as displayed text element
        try {
          await driver.$(`android=new UiSelector().textContains("${target}")`).waitForDisplayed({ timeout: 5000 });
          console.log(`✅ Text found as displayed element`);
          return;
        } catch (err) {
          throw new Error(`Verification failed: "${target}" not found in input field or as displayed text`);
        }
      }
      case 'back': {
        try {
          console.log(`⬅️ Executing back action: ${step.description}`);
          if (step.code) {
            await eval(step.code);
          } else {
            await driver.back();
          }
          await driver.pause(1000);
          return;
        } catch (err) {
          console.log(`⚠️ Back action failed: ${err.message}`);
          throw err;
        }
      }
      case 'wait': {
        try {
          console.log(`⏳ Executing wait action: ${step.description}`);
          if (step.code) {
            await eval(step.code);
          } else {
            await driver.pause(2000);
          }
          return;
        } catch (err) {
          console.log(`⚠️ Wait action failed: ${err.message}`);
          throw err;
        }
      }
      default: {
        console.log(`⚠️ Unknown step type: ${step.type}, treating as click`);
        // Fallback to click for unknown types
        try {
          const target = this.normalizeTarget(step.locator);
          const el = await this.findElementSmart(driver, target, timeoutMs);
          console.log(`➡️ Click (fallback): ${target}`);
          await el.click();
          return;
        } catch (err) {
          console.log(`⚠️ Fallback click failed: ${err.message}`);
          throw err;
        }
      }
    }
  }

  async findElementSmart(driver, locator, timeoutMs = 60000) {
    // Prefer WDIO string selector strategies to avoid unsupported locator issues
    const candidates = [];

    // Normalize to plain text target if came with '~'
    const plain = locator.startsWith('~') ? locator.slice(1) : locator;
    console.log(`🔍 Finding element: "${plain}"`);

    if (locator.startsWith('~')) {
      candidates.push(() => driver.$(`~${plain}`));
      candidates.push(() => driver.$(`android=new UiSelector().text("${plain}")`));
      candidates.push(() => driver.$(`android=new UiSelector().textContains("${plain}")`));
      candidates.push(() => driver.$(`android=new UiSelector().description("${plain}")`));
      candidates.push(() => driver.$(`android=new UiSelector().descriptionContains("${plain}")`));
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
      candidates.push(() => driver.$(`android=new UiSelector().text("${plain}")`));
      candidates.push(() => driver.$(`android=new UiSelector().textContains("${plain}")`));
      candidates.push(() => driver.$(`android=new UiSelector().description("${plain}")`));
      candidates.push(() => driver.$(`android=new UiSelector().descriptionContains("${plain}")`));
      
      // Enhanced partial matching for your specific test case
      const words = plain.split(/\s+/);
      if (words.length > 1) {
        // Try with first few words
        const partial = words.slice(0, Math.min(3, words.length)).join(' ');
        candidates.push(() => driver.$(`android=new UiSelector().textContains("${partial}")`));
        
        // Try with last few words
        const lastPartial = words.slice(-Math.min(3, words.length)).join(' ');
        candidates.push(() => driver.$(`android=new UiSelector().textContains("${lastPartial}")`));
        
        // Try with individual significant words
        words.forEach(word => {
          if (word.length > 3) { // Only try words longer than 3 characters
            candidates.push(() => driver.$(`android=new UiSelector().textContains("${word}")`));
          }
        });

        // Special handling for common UI patterns
        if (words.includes('next') || words.includes('continue')) {
          candidates.push(() => driver.$(`android=new UiSelector().textContains("Next")`));
          candidates.push(() => driver.$(`android=new UiSelector().textContains("Continue")`));
          candidates.push(() => driver.$(`android=new UiSelector().textContains("Proceed")`));
        }
        
        if (words.includes('lexical') || words.includes('semantics')) {
          candidates.push(() => driver.$(`android=new UiSelector().textContains("Lexical")`));
          candidates.push(() => driver.$(`android=new UiSelector().textContains("Semantics")`));
        }
        
        if (words.includes('exercise') || words.includes('visual')) {
          candidates.push(() => driver.$(`android=new UiSelector().textContains("Exercise")`));
          candidates.push(() => driver.$(`android=new UiSelector().textContains("Visual")`));
        }
        
        if (words.includes('picture') || words.includes('matching')) {
          candidates.push(() => driver.$(`android=new UiSelector().textContains("Picture")`));
          candidates.push(() => driver.$(`android=new UiSelector().textContains("Matching")`));
        }
      }

      // Scroll into view by text if not immediately present
      candidates.push(() => driver.$(`android=new UiScrollable(new UiSelector().scrollable(true)).scrollTextIntoView("${plain}")`));
      candidates.push(() => driver.$(`android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().textContains("${plain}"))`));
    }

    // Enforce overall deadline across strategies to avoid multi-minute waits
    const deadline = Date.now() + timeoutMs;
    let lastError;
    for (let idx = 0; idx < candidates.length; idx++) {
      const getEl = candidates[idx];
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      // Per-strategy cap: at most 2s or remaining time
      const perStrategyTimeout = Math.min(2000, Math.max(500, remaining));
      try {
        const el = await getEl();
        await el.waitForExist({ timeout: perStrategyTimeout });
        await el.waitForDisplayed({ timeout: perStrategyTimeout }).catch(() => {});
        console.log(`✅ Found element with strategy`);
        return el;
      } catch (err) {
        lastError = err;
        console.log(`⚠️ Strategy failed: element ("${err.message}") still not existing after ${perStrategyTimeout}ms`);
        // Every few strategies, attempt a scroll to reveal content
        if ((idx + 1) % 4 === 0) {
          try {
            await this.performScroll(driver, 'down');
          } catch {}
        }
      }
    }
    throw new Error(`Locator not found within ${timeoutMs}ms: ${plain}`);
  }

  async performScroll(driver, direction = 'down') {
    try {
      const size = await driver.getWindowSize();
      const left = Math.floor(size.width * 0.1);
      const top = Math.floor(size.height * 0.1);
      const width = Math.floor(size.width * 0.8);
      const height = Math.floor(size.height * 0.8);
      await driver.execute('mobile: scrollGesture', {
        left, top, width, height,
        direction,
        percent: 0.8
      });
    } catch (e) {
      // Fallback to W3C pointer actions
      const size = await driver.getWindowSize();
      const startY = direction === 'down' ? Math.floor(size.height * 0.8) : direction === 'up' ? Math.floor(size.height * 0.2) : Math.floor(size.height * 0.5);
      const endY = direction === 'down' ? Math.floor(size.height * 0.2) : direction === 'up' ? Math.floor(size.height * 0.8) : Math.floor(size.height * 0.5);
      const startX = direction === 'left' ? Math.floor(size.width * 0.8) : direction === 'right' ? Math.floor(size.width * 0.2) : Math.floor(size.width * 0.5);
      const endX = direction === 'left' ? Math.floor(size.width * 0.2) : direction === 'right' ? Math.floor(size.width * 0.8) : Math.floor(size.width * 0.5);
      await driver.performActions([
        {
          type: 'pointer',
          id: 'finger1',
          parameters: { pointerType: 'touch' },
          actions: [
            { type: 'pointerMove', duration: 0, x: startX, y: startY },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 300 },
            { type: 'pointerMove', duration: 500, x: endX, y: endY },
            { type: 'pointerUp', button: 0 }
          ]
        }
      ]);
    }
  }

  normalizeTarget(locator) {
    if (!locator) return locator;
    if (locator.startsWith('~')) locator = locator.slice(1);
    return String(locator)
      .replace(/\bagain\b/ig, '')
      .replace(/\bbutton\b/ig, '')
      .replace(/\bthe\b|\ba\b|\ban\b/ig, '')
      .trim();
  }

  async dismissSystemPopups(driver) {
    const labels = [
      'Close app', 'Wait', 'OK', 'Allow', 'ALLOW', 'Continue', 'Cancel', 'Got it',
      'ALLOW ONLY WHILE USING THE APP', 'WHILE USING THE APP', "Don't allow",
    ];

    try {
      // 1) Common Android dialog buttons by resource-id
      const ids = ['android:id/button1', 'android:id/button2', 'android:id/button3'];
      for (const id of ids) {
        try {
          const byId = await driver.$(`android=new UiSelector().resourceId("${id}")`);
          if (await byId.isExisting() && await byId.isDisplayed()) {
            await byId.click();
            await driver.pause(250);
          }
        } catch {}
      }

      // 2) Direct text matches
      for (const text of labels) {
        try {
          const el = await driver.$(`android=new UiSelector().text("${text}")`);
          if (await el.isExisting()) {
            await el.click();
            await driver.pause(250);
            continue;
          }
        } catch {}
        try {
          const el2 = await driver.$(`android=new UiSelector().textContains("${text}")`);
          if (await el2.isExisting()) {
            await el2.click();
            await driver.pause(250);
            continue;
          }
        } catch {}
      }

      // 3) Regex match on any button text (case-insensitive)
      const regexes = ['OK', 'Allow', 'Cancel', 'Got it', 'While Using', "Don\\'t allow", 'Wait'];
      for (const rx of regexes) {
        try {
          const el = await driver.$(`android=new UiSelector().className("android.widget.Button").textMatches("(?i).*${rx}.*")`);
          if (await el.isExisting()) {
            await el.click();
            await driver.pause(250);
          }
        } catch {}
      }

      // 4) As a last resort, press ENTER then BACK
      try { await driver.execute('mobile: pressKey', { keycode: 66 }); await driver.pause(200); } catch {}
      try { await driver.execute('mobile: pressKey', { keycode: 4 }); await driver.pause(200); } catch {}
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

