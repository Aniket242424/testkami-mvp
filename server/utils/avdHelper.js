const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');

const execAsync = promisify(exec);

class AVDHelper {
  static async listAvailableAVDs() {
    try {
      console.log('🔍 Searching for available Android Virtual Devices...\n');
      
      const { stdout } = await execAsync('emulator -list-avds');
      const avds = stdout.trim().split('\n').filter(line => line.length > 0);
      
      if (avds.length === 0) {
        console.log('❌ No AVDs found. Please create an AVD in Android Studio.');
        return [];
      }
      
      console.log('📱 Available AVDs:');
      avds.forEach((avd, index) => {
        console.log(`  ${index + 1}. ${avd}`);
      });
      
      return avds;
    } catch (error) {
      console.log('❌ Error listing AVDs:', error.message);
      return [];
    }
  }

  static async listConnectedDevices() {
    try {
      console.log('🔍 Checking connected devices...\n');
      
      const { stdout } = await execAsync('adb devices');
      const lines = stdout.trim().split('\n');
      
      if (lines.length <= 1) {
        console.log('❌ No devices connected.');
        return [];
      }
      
      const devices = lines.slice(1).filter(line => line.trim().length > 0);
      
      console.log('📱 Connected devices:');
      devices.forEach(device => {
        console.log(`  ${device}`);
      });
      
      return devices;
    } catch (error) {
      console.log('❌ Error checking devices:', error.message);
      return [];
    }
  }

  static async updateAVDConfig(avdName) {
    try {
      const configPath = path.join(__dirname, '../config/emulator.js');
      const configContent = await fs.readFile(configPath, 'utf8');
      
      // Update the AVD name in the configuration
      const updatedContent = configContent.replace(
        /avdName:\s*['"`][^'"`]*['"`]/,
        `avdName: '${avdName}'`
      );
      
      await fs.writeFile(configPath, updatedContent);
      console.log(`✅ AVD configuration updated to: ${avdName}`);
      
      return true;
    } catch (error) {
      console.log('❌ Error updating AVD configuration:', error.message);
      return false;
    }
  }

  static async getAVDInfo(avdName) {
    try {
      // Get AVD configuration details
      const { stdout } = await execAsync(`emulator -avd ${avdName} -verbose -show-kernel`);
      
      // Extract basic info
      const info = {
        name: avdName,
        status: 'available',
        details: stdout.split('\n').slice(0, 10).join('\n') // First 10 lines
      };
      
      return info;
    } catch (error) {
      return {
        name: avdName,
        status: 'error',
        error: error.message
      };
    }
  }

  static async interactiveAVDSetup() {
    console.log('🎯 Interactive AVD Setup\n');
    
    // List available AVDs
    const avds = await this.listAvailableAVDs();
    
    if (avds.length === 0) {
      console.log('\n💡 To create an AVD:');
      console.log('1. Open Android Studio');
      console.log('2. Go to Tools > AVD Manager');
      console.log('3. Click "Create Virtual Device"');
      console.log('4. Select a device (e.g., Pixel 4)');
      console.log('5. Select an API level (e.g., API 30)');
      console.log('6. Click Finish');
      return false;
    }
    
    // Check if any AVD is already configured
    const configPath = path.join(__dirname, '../config/emulator.js');
    const configContent = await fs.readFile(configPath, 'utf8');
    const currentAVD = configContent.match(/avdName:\s*['"`]([^'"`]*)['"`]/)?.[1];
    
    if (currentAVD && avds.includes(currentAVD)) {
      console.log(`\n✅ Current AVD configuration: ${currentAVD}`);
      console.log('This AVD is available and configured.');
      return true;
    }
    
    // Suggest the first available AVD
    const suggestedAVD = avds[0];
    console.log(`\n💡 Suggested AVD: ${suggestedAVD}`);
    console.log('This will be automatically configured.');
    
    // Update configuration
    await this.updateAVDConfig(suggestedAVD);
    
    return true;
  }

  static async validateAVDConfig() {
    try {
      const configPath = path.join(__dirname, '../config/emulator.js');
      const configContent = await fs.readFile(configPath, 'utf8');
      const avdName = configContent.match(/avdName:\s*['"`]([^'"`]*)['"`]/)?.[1];
      
      if (!avdName) {
        console.log('❌ No AVD name configured');
        return false;
      }
      
      const avds = await this.listAvailableAVDs();
      const isValid = avds.includes(avdName);
      
      if (isValid) {
        console.log(`✅ Configured AVD "${avdName}" is available`);
      } else {
        console.log(`❌ Configured AVD "${avdName}" not found`);
        console.log('Available AVDs:', avds);
      }
      
      return isValid;
    } catch (error) {
      console.log('❌ Error validating AVD config:', error.message);
      return false;
    }
  }
}

module.exports = AVDHelper;
