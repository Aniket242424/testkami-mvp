const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function checkAppiumInstallation() {
  console.log('🔍 Checking Appium installation...');
  
  try {
    // Check Appium version
    try {
      const { stdout: appiumVersion } = await execAsync('npx appium --version');
      console.log('✅ Appium version:', appiumVersion.trim());
    } catch (error) {
      console.log('❌ Appium not found. Installing...');
      try {
        await execAsync('npm install -g appium');
        console.log('✅ Appium installed successfully');
      } catch (installError) {
        console.error('❌ Failed to install Appium:', installError.message);
        return false;
      }
    }
    
    // Check Appium drivers
    try {
      const { stdout: drivers } = await execAsync('npx appium driver list');
      console.log('📱 Available Appium drivers:');
      console.log(drivers);
      
      // Check if UiAutomator2 driver is installed
      if (!drivers.includes('uiautomator2')) {
        console.log('📱 Installing UiAutomator2 driver...');
        await execAsync('npx appium driver install uiautomator2');
        console.log('✅ UiAutomator2 driver installed');
      } else {
        console.log('✅ UiAutomator2 driver is already installed');
      }
    } catch (driverError) {
      console.error('❌ Error checking drivers:', driverError.message);
    }
    
    // Check Android SDK
    try {
      const { stdout: adbVersion } = await execAsync('adb version');
      console.log('✅ Android SDK found:', adbVersion.split('\n')[0]);
    } catch (error) {
      console.error('❌ Android SDK not found. Please install Android Studio and set ANDROID_HOME');
      return false;
    }
    
    // Check emulators
    try {
      const { stdout: emulators } = await execAsync('emulator -list-avds');
      console.log('📱 Available emulators:');
      console.log(emulators);
    } catch (error) {
      console.error('❌ Error listing emulators:', error.message);
    }
    
    console.log('✅ Appium installation check completed');
    return true;
    
  } catch (error) {
    console.error('❌ Appium check failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  checkAppiumInstallation();
}

module.exports = { checkAppiumInstallation };
