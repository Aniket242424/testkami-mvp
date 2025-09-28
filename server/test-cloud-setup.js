#!/usr/bin/env node

/**
 * Test script to verify cloud device setup
 * Run with: node test-cloud-setup.js
 */

require('dotenv').config({ path: './.env' });

const cloudTestService = require('./services/cloudTestService');

async function testCloudSetup() {
  console.log('🧪 Testing Cloud Device Setup...\n');
  
  // Test 1: Check if credentials are configured
  console.log('1️⃣ Checking BrowserStack credentials...');
  if (cloudTestService.isCloudConfigured()) {
    console.log('✅ BrowserStack credentials are configured');
  } else {
    console.log('❌ BrowserStack credentials are missing');
    console.log('   Please set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY');
    return;
  }
  
  // Test 2: Check cloud usage
  console.log('\n2️⃣ Checking cloud usage...');
  try {
    const usage = await cloudTestService.getCloudUsage();
    if (usage) {
      console.log(`✅ Cloud usage: ${usage.minutesUsed}/${usage.minutesAvailable} minutes used`);
      console.log(`   Parallel sessions: ${usage.parallelSessionsRunning}/${usage.parallelSessionsMaxAllowed}`);
    } else {
      console.log('⚠️ Could not fetch cloud usage (this is normal for some accounts)');
    }
  } catch (error) {
    console.log('⚠️ Could not fetch cloud usage:', error.message);
  }
  
  // Test 3: List available devices
  console.log('\n3️⃣ Available free devices:');
  const devices = cloudTestService.getFreeDevices();
  devices.forEach((device, index) => {
    console.log(`   ${index + 1}. ${device.device} (Android ${device.os_version})`);
  });
  
  console.log('\n✅ Cloud setup test completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Set USE_CLOUD_DEVICES=true in your .env file');
  console.log('   2. Run a test to verify cloud device execution');
  console.log('   3. Check the logs for cloud device usage');
}

// Run the test
testCloudSetup().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
