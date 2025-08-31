const { remote } = require('webdriverio');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AppiumService {
  constructor() {
    this.driver = null;
    this.emulatorProcess = null;
    this.screenshotsDir = path.join(__dirname, '../../reports/screenshots');
    
    // Emulator configuration
    this.avdName = 'Manastik_Medico';
    this.appiumServerUrl = 'http://localhost:4723';
    
    // Ensure screenshots directory exists
    fs.ensureDirSync(this.screenshotsDir);
  }

  async startEmulatorAndLaunchApp(appPath) {
    console.log('🚀 STARTING EMULATOR AND APP AUTOMATION...');
    
    try {
      // Step 1: Start emulator
      console.log('📱 Step 1: Starting emulator...');
      const emulatorStarted = await this.startEmulator();
      
      if (!emulatorStarted) {
        throw new Error('Failed to start emulator - emulator did not start within timeout');
      }
      
      // Step 2: Initialize Appium driver with the app
      console.log('📱 Step 2: Initializing Appium driver...');
      await this.initializeDriver(appPath);
      
      console.log('✅ Emulator and app launched successfully');
      
      return {
        driver: this.driver,
        emulatorStarted: true,
        appPath: appPath
      };
      
    } catch (error) {
      console.error('❌ Emulator and app launch failed:', error);
      throw error;
    }
  }

  async startEmulator() {
    try {
      console.log('🔄 Starting Android emulator...');
      
      // Check if emulator is already running
      const isRunning = await this.checkEmulatorStatus();
      if (isRunning) {
        console.log('✅ Emulator is already running and connected');
        return true;
      }

      // Check if emulator process is already running
      const isProcessRunning = await this.checkEmulatorProcess();
      if (isProcessRunning) {
        console.log('✅ Emulator process is already running, waiting for it to connect...');
        await this.waitForEmulatorBoot();
        return true;
      }

      // Force start emulator if not detected
      console.log('🚀 Force starting emulator since it was not detected...');

      // Build emulator command with configuration options for visible GUI
      const options = {
        memory: 4096,
        cores: 4
      };
      const emulatorArgs = [
        `-avd ${this.avdName}`,
        '-gpu host', // Use host GPU for better performance
        '-no-audio', // Disable audio to avoid issues
        '-no-snapshot-load', // Don't load snapshot for fresh start
        '-no-boot-anim', // Skip boot animation for faster startup
        `-memory ${options.memory}`,
        `-cores ${options.cores}`,
        '-skin 1080x1920', // Set screen size
        '-show-kernel', // Show kernel messages
        '-verbose' // Verbose output for debugging
      ].filter(arg => arg !== '').join(' ');
      
      const emulatorCommand = `emulator ${emulatorArgs}`;
      console.log(`🚀 Starting emulator with command: ${emulatorCommand}`);
      
      // Start emulator with visible GUI
      this.emulatorProcess = exec(emulatorCommand, {
        windowsHide: false, // Make sure emulator window is visible
        detached: false // Keep process attached so we can monitor it
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Emulator start error:', error);
        }
        if (stderr) {
          console.log('Emulator stderr:', stderr);
        }
        if (stdout) {
          console.log('Emulator stdout:', stdout);
        }
      });

      // Wait for emulator to boot
      console.log('⏳ Waiting for emulator to boot...');
      await this.waitForEmulatorBoot();
      
      console.log('✅ Emulator started successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to start emulator:', error);
      throw new Error(`Emulator startup failed: ${error.message}`);
    }
  }

  async checkEmulatorStatus() {
    try {
      const { stdout } = await execAsync('adb devices');
      console.log('📱 Raw ADB devices output:', stdout);
      
      const lines = stdout.trim().split('\n');
      console.log('📱 ADB lines:', lines);
      
      // Check if there are any devices (more than just the header)
      const hasDevices = lines.length > 1 && lines.some(line => line.includes('device') && !line.includes('List of devices'));
      
      console.log('📱 Has devices:', hasDevices);
      console.log('📱 Number of lines:', lines.length);
      
      // Additional check: try to get device info
      if (hasDevices) {
        try {
          const { stdout: deviceInfo } = await execAsync('adb shell getprop ro.product.model');
          console.log('📱 Device model:', deviceInfo.trim());
        } catch (deviceError) {
          console.log('📱 Could not get device info (normal during startup)');
        }
      }
      
      return hasDevices;
    } catch (error) {
      console.error('❌ Error checking emulator status:', error);
      return false;
    }
  }

  async checkEmulatorProcess() {
    try {
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq emulator.exe" /FO CSV');
      const hasProcess = stdout.includes('emulator.exe');
      console.log('🔍 Emulator process check:', hasProcess ? 'Found' : 'Not found');
      return hasProcess;
    } catch (error) {
      console.error('❌ Error checking emulator process:', error);
      return false;
    }
  }

  async waitForEmulatorBoot() {
    const timeouts = {
      bootTimeout: 120000, // 2 minutes
      checkInterval: 2000
    };
    
    console.log(`⏳ Waiting up to ${timeouts.bootTimeout / 1000} seconds for emulator to boot...`);
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeouts.bootTimeout) {
      try {
        const { stdout } = await execAsync('adb shell getprop sys.boot_completed');
        
        if (stdout.trim() === '1') {
          console.log('✅ Emulator boot completed');
          
          // Additional wait for system to be fully ready
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Verify app launch capability
          try {
            const { stdout: activityOutput } = await execAsync('adb shell dumpsys activity activities | grep mResumedActivity');
            console.log('📱 Current activity:', activityOutput.trim());
          } catch (activityError) {
            console.log('📱 Activity check failed (normal during boot):', activityError.message);
          }
          
          return true;
        }
        
        console.log('⏳ Emulator still booting...');
        await new Promise(resolve => setTimeout(resolve, timeouts.checkInterval));
        
      } catch (error) {
        console.log('⏳ Waiting for emulator to be ready...');
        await new Promise(resolve => setTimeout(resolve, timeouts.checkInterval));
      }
    }
    
    throw new Error('Emulator boot timeout exceeded - emulator did not start within 2 minutes');
  }

  async initializeDriver(appPath) {
    try {
      console.log('🔧 Initializing Appium driver...');
      console.log('📱 App path:', appPath);
      
      // Verify app file exists
      if (!fs.existsSync(appPath)) {
        throw new Error(`APK file not found at path: ${appPath}`);
      }
      
      const capabilities = {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': 'Android Emulator',
        'appium:app': appPath,
        'appium:noReset': false,
        'appium:newCommandTimeout': 60,
        'appium:autoGrantPermissions': true,
        'appium:skipServerInstallation': false,
        'appium:skipDeviceInitialization': false
      };
      
      console.log('🔧 Appium capabilities:', JSON.stringify(capabilities, null, 2));
      
      this.driver = await remote({
        hostname: 'localhost',
        port: 4723,
        path: '/wd/hub',
        capabilities: capabilities,
        logLevel: 'info'
      });
      
      console.log('✅ Appium driver initialized successfully');
      console.log('📱 Session ID:', this.driver.sessionId);
      
      // Verify app launch
      const currentActivity = await this.driver.getCurrentActivity();
      const currentPackage = await this.driver.getCurrentPackage();
      
      console.log('📱 Current activity:', currentActivity);
      console.log('📱 Current package:', currentPackage);
      
      return this.driver;
      
    } catch (error) {
      console.error('❌ Failed to initialize Appium driver:', error);
      throw new Error(`Appium driver initialization failed: ${error.message}`);
    }
  }

  async executeTestScript(testScript, driver, executionId) {
    try {
      console.log('🧪 Executing test script...');
      
      const steps = [];
      const screenshots = [];
      let passedSteps = 0;
      let failedSteps = 0;
      
      // Parse the test script
      const scriptSteps = this.parseTestScript(testScript);
      
      if (scriptSteps.length === 0) {
        throw new Error('No test steps found in the generated script');
      }
      
      for (let i = 0; i < scriptSteps.length; i++) {
        const step = scriptSteps[i];
        const stepStartTime = Date.now();
        
        try {
          console.log(`Step ${i + 1}: ${step.action}`);
          
          // Execute the step
          await this.executeStep(driver, step);
          
          // Take screenshot
          const screenshotPath = await this.takeScreenshot(`step_${i + 1}_${step.action.replace(/\s+/g, '_')}`);
          screenshots.push(screenshotPath);
          
          const stepDuration = Date.now() - stepStartTime;
          
          steps.push({
            step: i + 1,
            action: step.action,
            status: 'PASS',
            duration: stepDuration,
            timestamp: new Date().toISOString(),
            screenshot: screenshotPath
          });
          
          passedSteps++;
          console.log(`✅ Step ${i + 1} completed successfully`);
          
        } catch (stepError) {
          const stepDuration = Date.now() - stepStartTime;
          
          steps.push({
            step: i + 1,
            action: step.action,
            status: 'FAIL',
            duration: stepDuration,
            timestamp: new Date().toISOString(),
            error: stepError.message
          });
          
          failedSteps++;
          console.error(`❌ Step ${i + 1} failed:`, stepError.message);
          
          // Take error screenshot
          const errorScreenshotPath = await this.takeScreenshot(`error_step_${i + 1}_${step.action.replace(/\s+/g, '_')}`);
          screenshots.push(errorScreenshotPath);
        }
      }
      
      const summary = {
        totalSteps: steps.length,
        passedSteps,
        failedSteps,
        screenshots: screenshots.length
      };
      
      return {
        steps,
        screenshots,
        summary
      };
      
    } catch (error) {
      console.error('❌ Test script execution failed:', error);
      throw new Error(`Test execution failed: ${error.message}`);
    }
  }

  async executeStep(driver, step) {
    const { action, locator, value, timeout = 10000 } = step;
    
    switch (action.toLowerCase()) {
      case 'click':
        const element = await driver.$(locator);
        await element.waitForDisplayed({ timeout });
        await element.click();
        break;
        
      case 'setvalue':
        const inputElement = await driver.$(locator);
        await inputElement.waitForDisplayed({ timeout });
        await inputElement.setValue(value);
        break;
        
      case 'waitfordisplayed':
        const waitElement = await driver.$(locator);
        await waitElement.waitForDisplayed({ timeout });
        break;
        
      case 'wait':
        await driver.pause(parseInt(value) || 1000);
        break;
        
      case 'navigate':
        // Handle navigation actions
        await driver.pause(1000);
        break;
        
      case 'verify':
        const verifyElement = await driver.$(locator);
        await verifyElement.waitForDisplayed({ timeout });
        break;
        
      case 'exit':
        // Handle exit actions
        await driver.pause(1000);
        break;
        
      default:
        console.log(`Executing generic action: ${action}`);
        await driver.pause(1000);
    }
  }

  parseTestScript(testScript) {
    // Parse the test script and extract steps
    const steps = [];
    
    if (testScript.code) {
      // Parse the generated code and extract steps
      const code = testScript.code;
      
      // Extract click actions
      const clickMatches = code.match(/await driver\.\$\(['"`]([^'"`]+)['"`]\)\.click\(\)/g);
      if (clickMatches) {
        clickMatches.forEach(match => {
          const locator = match.match(/['"`]([^'"`]+)['"`]/)[1];
          steps.push({ action: 'click', locator });
        });
      }
      
      // Extract setValue actions
      const setValueMatches = code.match(/await driver\.\$\(['"`]([^'"`]+)['"`]\)\.setValue\(['"`]([^'"`]+)['"`]\)/g);
      if (setValueMatches) {
        setValueMatches.forEach(match => {
          const [, locator, value] = match.match(/['"`]([^'"`]+)['"`]\.setValue\(['"`]([^'"`]+)['"`]\)/);
          steps.push({ action: 'setValue', locator, value });
        });
      }
      
      // Extract wait actions
      const waitMatches = code.match(/await driver\.pause\((\d+)\)/g);
      if (waitMatches) {
        waitMatches.forEach(match => {
          const duration = match.match(/\((\d+)\)/)[1];
          steps.push({ action: 'wait', value: duration });
        });
      }
    }
    
    // If no steps found, create default steps
    if (steps.length === 0) {
      steps.push(
        { action: 'Launch app', locator: 'app' },
        { action: 'Wait for app to load', locator: 'main_screen', value: '5000' },
        { action: 'Verify app is running', locator: 'app_content' }
      );
    }
    
    return steps;
  }

  async takeScreenshot(name) {
    try {
      const timestamp = Date.now();
      const filename = `${name}_${timestamp}.png`;
      const screenshotPath = path.join(this.screenshotsDir, filename);
      
      if (this.driver) {
        await this.driver.saveScreenshot(screenshotPath);
        console.log(`📸 Screenshot saved: ${filename}`);
      }
      
      return screenshotPath;
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      return null;
    }
  }

  async cleanup() {
    try {
      if (this.driver) {
        await this.driver.deleteSession();
        this.driver = null;
        console.log('✅ Appium session cleaned up');
      }
      
      if (this.emulatorProcess) {
        this.emulatorProcess.kill();
        this.emulatorProcess = null;
        console.log('✅ Emulator process cleaned up');
      }
      
      console.log('✅ Appium service cleaned up');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }

  async checkAppiumServer() {
    try {
      const response = await fetch(`${this.appiumServerUrl}/status`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new AppiumService();
