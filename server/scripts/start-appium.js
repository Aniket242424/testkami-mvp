const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function startAppiumServer() {
  console.log('🚀 Starting Appium server manually...');
  
  try {
    // Kill any existing Appium processes
    try {
      await execAsync('taskkill /f /im node.exe /fi "WINDOWTITLE eq appium*"');
      console.log('🧹 Killed existing Appium processes');
    } catch (error) {
      // Ignore if no processes to kill
    }
    
    // Start Appium server
    console.log('📱 Starting Appium server on port 4723...');
    const appiumProcess = exec('npx appium --base-path /wd/hub --port 4723 --log-level info', {
      stdio: 'inherit',
      windowsHide: false
    });
    
    appiumProcess.stdout.on('data', (data) => {
      console.log(`📱 Appium: ${data}`);
    });
    
    appiumProcess.stderr.on('data', (data) => {
      console.error(`❌ Appium Error: ${data}`);
    });
    
    appiumProcess.on('close', (code) => {
      console.log(`📱 Appium server exited with code ${code}`);
    });
    
    console.log('✅ Appium server started successfully!');
    console.log('📱 Server is running on http://localhost:4723');
    console.log('📱 Press Ctrl+C to stop the server');
    
  } catch (error) {
    console.error('❌ Failed to start Appium server:', error);
  }
}

// Run if called directly
if (require.main === module) {
  startAppiumServer();
}

module.exports = { startAppiumServer };
