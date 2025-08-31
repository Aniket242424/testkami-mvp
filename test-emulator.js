const appiumService = require('./server/services/appiumService');
const logger = require('./server/utils/logger');

async function testEmulatorLaunch() {
  console.log('🧪 Testing Emulator Launch...');
  
  try {
    // Step 1: Start emulator
    console.log('📱 Step 1: Starting emulator...');
    const emulatorStarted = await appiumService.startEmulator();
    
    if (emulatorStarted) {
      console.log('✅ Emulator started successfully!');
      console.log('👀 You should see the emulator window open on your screen.');
      
      // Step 2: Initialize driver
      console.log('🔌 Step 2: Initializing Appium driver...');
      const driverInitialized = await appiumService.initializeDriver({
        platformName: 'Android',
        deviceName: 'Android Emulator',
        autoGrantPermissions: true,
        noReset: false
      });
      
      if (driverInitialized) {
        console.log('✅ Driver initialized successfully!');
        
        // Step 3: Take a screenshot to verify
        console.log('📸 Step 3: Taking screenshot...');
        const screenshotPath = await appiumService.takeScreenshot('test_launch');
        console.log(`✅ Screenshot saved: ${screenshotPath}`);
        
        // Step 4: Cleanup
        console.log('🧹 Step 4: Cleaning up...');
        await appiumService.cleanup();
        console.log('✅ Cleanup completed!');
        
        console.log('\n🎉 Test completed successfully!');
        console.log('📱 The emulator should have been visible on your screen.');
        
      } else {
        console.log('❌ Failed to initialize driver');
      }
    } else {
      console.log('❌ Failed to start emulator');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmulatorLaunch();
