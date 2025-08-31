#!/usr/bin/env node

/**
 * AVD Configuration Script
 * Run this script to configure your Android Virtual Device for Testkami
 */

const AVDHelper = require('./server/utils/avdHelper');

async function main() {
  console.log('🎯 Testkami AVD Configuration\n');
  console.log('This script will help you configure your Android Virtual Device for testing.\n');
  
  try {
    // Run interactive AVD setup
    const success = await AVDHelper.interactiveAVDSetup();
    
    if (success) {
      console.log('\n✅ AVD configuration completed successfully!');
      console.log('\n🚀 Next steps:');
      console.log('1. Start Appium server: appium');
      console.log('2. Start Testkami server: npm start');
      console.log('3. Upload an APK and run tests!');
    } else {
      console.log('\n❌ AVD configuration failed.');
      console.log('Please ensure Android Studio and SDK are properly installed.');
    }
  } catch (error) {
    console.error('❌ Error during AVD configuration:', error.message);
  }
}

// Run the script
main().catch(console.error);
