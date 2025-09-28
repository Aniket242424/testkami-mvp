module.exports = {
  browserstack: {
    // Free tier: 100 minutes/month
    serverUrl: 'https://hub-cloud.browserstack.com/wd/hub',
    capabilities: {
      platformName: 'Android',
      device: 'Samsung Galaxy S10', // Free device in BrowserStack
      os_version: '10.0',
      project: 'TestKami MVP',
      build: new Date().toISOString().split('T')[0],
      name: 'MVP Test',
      // Free tier settings
      realMobile: true,
      autoGrantPermissions: true,
      noReset: false,
      newCommandTimeout: 300
    }
  },
  
  // Alternative devices for free tier
  freeDevices: [
    {
      device: 'Samsung Galaxy S10',
      os_version: '10.0'
    },
    {
      device: 'Google Pixel 4',
      os_version: '10.0'
    },
    {
      device: 'OnePlus 8',
      os_version: '10.0'
    }
  ],
  
  // App upload settings
  appUpload: {
    timeout: 300000, // 5 minutes for app upload
    retries: 3
  }
};

