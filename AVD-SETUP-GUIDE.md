# 🎯 AVD Configuration Guide

This guide will help you configure your Android Virtual Device (AVD) for Testkami testing.

## 🚀 Quick Setup

### Option 1: Automatic Configuration (Recommended)
```bash
npm run configure-avd
```

This will automatically:
- List your available AVDs
- Configure the first available AVD
- Update the configuration file

### Option 2: Manual Configuration

#### Step 1: List Available AVDs
```bash
npm run list-avds
```

#### Step 2: Update Configuration
Edit `server/config/emulator.js` and change the `avdName`:

```javascript
android: {
  avdName: 'YOUR_AVD_NAME_HERE', // Replace with your actual AVD name
  // ... other settings
}
```

## 📱 Finding Your AVD Name

### Method 1: Command Line
```bash
emulator -list-avds
```

### Method 2: Android Studio
1. Open Android Studio
2. Go to **Tools > AVD Manager**
3. Note the name of your AVD

### Method 3: Using Testkami
```bash
npm run list-avds
```

## 🔧 Configuration Options

The configuration file `server/config/emulator.js` contains several options:

### AVD Settings
```javascript
android: {
  avdName: 'Pixel_4_API_30',        // Your AVD name
  startupOptions: {
    noSnapshotLoad: true,           // Faster startup
    noBootAnim: true,               // Skip boot animation
    memory: 2048,                   // RAM in MB
    cores: 2,                       // CPU cores
    gpu: 'swiftshader_indirect'     // GPU acceleration
  }
}
```

### Timeout Settings
```javascript
timeouts: {
  bootTimeout: 60000,               // 60 seconds to boot
  checkInterval: 2000,              // Check every 2 seconds
  commandTimeout: 30000             // 30 seconds for commands
}
```

## 🎯 Using Device ID Instead of AVD Name

If you prefer to use a device ID (like `emulator-5554`), you can:

1. **Find your device ID:**
   ```bash
   adb devices
   ```

2. **Update configuration:**
   ```javascript
   android: {
     // Comment out avdName and use avdId instead
     // avdName: 'Pixel_4_API_30',
     avdId: 'emulator-5554',        // Your device ID
   }
   ```

## 🔄 Updating Configuration

### Automatic Update
```bash
npm run configure-avd
```

### Manual Update
1. Edit `server/config/emulator.js`
2. Change the `avdName` value
3. Restart the server

## ✅ Verification

After configuration, verify everything works:

```bash
# Start the server
npm start

# Check the logs for:
# ✅ Configured AVD "YOUR_AVD_NAME" is available
# 🎉 All requirements met! Real emulator testing is available.
```

## 🚀 Testing Your Configuration

1. **Start Appium server:**
   ```bash
   appium
   ```

2. **Start Testkami:**
   ```bash
   npm start
   ```

3. **Upload an APK and run a test**
   - The emulator should start automatically
   - Tests should run on the real emulator

## 🆘 Troubleshooting

### AVD Not Found
```bash
# Check available AVDs
emulator -list-avds

# If none found, create one in Android Studio
```

### Permission Issues
```bash
# Windows: Run as Administrator
# macOS/Linux: Check permissions
ls -la ~/Library/Android/sdk/emulator/emulator
```

### Configuration Not Loading
```bash
# Restart the server after configuration changes
npm start
```

### Emulator Won't Start
```bash
# Try starting manually first
emulator -avd YOUR_AVD_NAME

# Check if it starts successfully
```

## 📋 Common AVD Names

Popular AVD names you might have:
- `Pixel_4_API_30`
- `Pixel_6_API_33`
- `Nexus_5X_API_30`
- `Galaxy_S10_API_29`

## 🎯 Next Steps

Once configured:
1. ✅ AVD is automatically detected
2. ✅ Emulator starts when tests run
3. ✅ Real Appium testing is available
4. ✅ Screenshots are captured from emulator
5. ✅ Reports include real device information

Your Testkami MVP is now ready for real emulator testing! 🚀📱
