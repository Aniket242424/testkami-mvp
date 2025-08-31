module.exports = {
  android: {
    avdName: 'Manastik_Medico',
    startupOptions: {
      noSnapshotLoad: true,
      noBootAnim: true,
      wipeData: false,
      memory: 4096,
      cores: 4,
      gpu: 'host',
      skin: '1080x1920',
      dpi: 420
    },
    timeouts: {
      bootTimeout: 60000,
      checkInterval: 2000,
      commandTimeout: 30000
    }
  },
  appium: {
    serverUrl: 'http://localhost:4723',
    serverPort: 4723,
    capabilities: {
      android: {
        platformName: 'Android',
        automationName: 'UiAutomator2',
        deviceName: 'Android Emulator',
        noReset: false,
        newCommandTimeout: 60,
        autoGrantPermissions: true
      }
    }
  },
  screenshots: {
    directory: 'reports/screenshots',
    format: 'png',
    quality: 90,
    captureOnFailure: true,
    captureOnSuccess: true
  }
};
