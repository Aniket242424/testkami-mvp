const { remote } = require('webdriverio');
const cloudConfig = require('../config/cloud');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

class CloudTestService {
  constructor() {
    this.browserstackUsername = process.env.BROWSERSTACK_USERNAME;
    this.browserstackAccessKey = process.env.BROWSERSTACK_ACCESS_KEY;
  }

  /**
   * Upload APK to BrowserStack cloud storage
   */
  async uploadAppToBrowserStack(appPath) {
    try {
      console.log('📤 Uploading APK to BrowserStack...');
      
      const form = new FormData();
      form.append('file', fs.createReadStream(appPath));
      
      console.log(`🔑 Using credentials: ${this.browserstackUsername} / ${this.browserstackAccessKey.substring(0, 4)}...`);
      
      const response = await axios.post(
        'https://api-cloud.browserstack.com/app-automate/upload',
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          auth: {
            username: this.browserstackUsername,
            password: this.browserstackAccessKey
          },
          timeout: cloudConfig.appUpload.timeout,
          validateStatus: function (status) {
            return status < 500; // Don't throw for 4xx errors
          }
        }
      );
      
      if (response.status !== 200) {
        console.error(`❌ Upload failed with status ${response.status}:`, response.data);
        throw new Error(`Upload failed: ${response.status} - ${response.data?.message || response.statusText}`);
      }
      
      const appUrl = response.data.app_url;
      console.log(`✅ APK uploaded successfully: ${appUrl}`);
      return appUrl;
      
    } catch (error) {
      console.error('❌ Failed to upload APK to BrowserStack:', error.message);
      throw new Error(`App upload failed: ${error.message}`);
    }
  }

  /**
   * Create cloud device driver
   */
  async createCloudDriver(appUrl) {
    try {
      console.log('🌐 Connecting to cloud device...');
      
      const capabilities = {
        ...cloudConfig.browserstack.capabilities,
        app: appUrl,
        // Add authentication
        'browserstack.user': this.browserstackUsername,
        'browserstack.key': this.browserstackAccessKey
      };

      const driver = await remote({
        hostname: 'hub-cloud.browserstack.com',
        port: 443,
        path: '/wd/hub',
        protocol: 'https',
        capabilities
      });

      console.log('✅ Connected to cloud device successfully');
      return driver;
      
    } catch (error) {
      console.error('❌ Failed to connect to cloud device:', error.message);
      throw new Error(`Cloud device connection failed: ${error.message}`);
    }
  }

  /**
   * Execute test on cloud device
   */
  async executeTestOnCloud(testData, scriptResult) {
    const executionId = `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let driver = null;

    try {
      console.log('🚀 Starting cloud test execution...');
      
      // 1. Upload APK to BrowserStack
      const appUrl = await this.uploadAppToBrowserStack(testData.appPath);
      
      // 2. Create cloud driver
      driver = await this.createCloudDriver(appUrl);
      
      // 3. Wait for app to launch
      await driver.pause(5000);
      
      // 4. Execute test script (reuse existing logic)
      const automatedTestService = require('./automatedTestService');
      const testResult = await automatedTestService.executeTestScript(scriptResult, driver, executionId);
      
      console.log('✅ Cloud test execution completed successfully');
      return {
        success: true,
        executionId,
        testResult,
        cloudDevice: cloudConfig.browserstack.capabilities.device
      };
      
    } catch (error) {
      console.error('❌ Cloud test execution failed:', error.message);
      throw error;
      
    } finally {
      // Cleanup cloud session
      if (driver) {
        try {
          await driver.deleteSession();
          console.log('🧹 Cloud session cleaned up');
        } catch (cleanupError) {
          console.log('⚠️ Cloud session cleanup failed:', cleanupError.message);
        }
      }
    }
  }

  /**
   * Check if cloud credentials are configured
   */
  isCloudConfigured() {
    return !!(this.browserstackUsername && this.browserstackAccessKey);
  }

  /**
   * Get available free devices
   */
  getFreeDevices() {
    return cloudConfig.freeDevices;
  }

  /**
   * Get cloud usage info
   */
  async getCloudUsage() {
    try {
      const response = await axios.get(
        'https://api.browserstack.com/automate/plan.json',
        {
          auth: {
            username: this.browserstackUsername,
            password: this.browserstackAccessKey
          }
        }
      );
      
      return {
        minutesUsed: response.data.minutes_used,
        minutesAvailable: response.data.minutes_available,
        parallelSessionsRunning: response.data.parallel_sessions_running,
        parallelSessionsMaxAllowed: response.data.parallel_sessions_max_allowed
      };
      
    } catch (error) {
      console.error('❌ Failed to get cloud usage:', error.message);
      return null;
    }
  }
}

module.exports = new CloudTestService();

