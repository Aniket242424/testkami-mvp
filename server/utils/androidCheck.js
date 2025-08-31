const { exec } = require('child_process');
const { promisify } = require('util');
const AVDHelper = require('./avdHelper');

const execAsync = promisify(exec);

class AndroidCheck {
  static async checkAndroidSDK() {
    try {
      const { stdout } = await execAsync('adb version');
      console.log('✅ Android SDK found:', stdout.split('\n')[0]);
      return true;
    } catch (error) {
      console.log('❌ Android SDK not found. Please install Android Studio and SDK.');
      return false;
    }
  }

  static async checkEmulator() {
    try {
      const avds = await AVDHelper.listAvailableAVDs();
      
      if (avds.length > 0) {
        // Validate current AVD configuration
        const isValid = await AVDHelper.validateAVDConfig();
        if (!isValid) {
          console.log('⚠️ Current AVD configuration is invalid. Running interactive setup...');
          await AVDHelper.interactiveAVDSetup();
        }
        return avds;
      } else {
        console.log('❌ No AVDs found. Please create an AVD in Android Studio.');
        return [];
      }
    } catch (error) {
      console.log('❌ Emulator not found. Please install Android SDK.');
      return [];
    }
  }

  static async checkAppium() {
    try {
      const { stdout } = await execAsync('npx appium --version');
      console.log('✅ Appium found:', stdout.trim());
      return true;
    } catch (error) {
      console.log('❌ Appium not found. Please install: npm install -g appium');
      return false;
    }
  }

  static async runFullCheck() {
    console.log('🔍 Checking Android development environment...\n');
    
    const sdkOk = await this.checkAndroidSDK();
    const avds = await this.checkEmulator();
    const appiumOk = await this.checkAppium();
    
    console.log('\n📋 Summary:');
    console.log(`Android SDK: ${sdkOk ? '✅' : '❌'}`);
    console.log(`AVDs: ${avds.length > 0 ? '✅' : '❌'} (${avds.length} found)`);
    console.log(`Appium: ${appiumOk ? '✅' : '❌'}`);
    
    if (sdkOk && avds.length > 0 && appiumOk) {
      console.log('\n🎉 All requirements met! Real emulator testing is available.');
      return true;
    } else {
      console.log('\n⚠️ Some requirements missing. See setup-android.md for installation guide.');
      console.log('The system will fall back to simulated testing.');
      return false;
    }
  }
}

module.exports = AndroidCheck;
