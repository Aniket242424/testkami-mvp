# Android SDK & Appium Setup Guide

To run real emulator tests, you need to set up Android SDK and Appium server.

## 📱 Prerequisites

1. **Node.js 18+** (already installed)
2. **Java JDK 11+**
3. **Android Studio** (for Android SDK)

## 🛠️ Installation Steps

### 1. Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install with default settings
3. Open Android Studio and complete setup

### 2. Set up Android SDK
1. Open Android Studio
2. Go to **Tools > SDK Manager**
3. Install:
   - **Android SDK Platform 30** (or latest)
   - **Android SDK Build-Tools**
   - **Android Emulator**
   - **Android SDK Platform-Tools**

### 3. Create Android Virtual Device (AVD)
1. In Android Studio, go to **Tools > AVD Manager**
2. Click **Create Virtual Device**
3. Select **Pixel 4** (or any device)
4. Select **API Level 30** (Android 11)
5. Name it: `Pixel_4_API_30`
6. Click **Finish**

### 4. Set Environment Variables
Add these to your system PATH:

**Windows:**
```bash
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
PATH=%PATH%;%ANDROID_HOME%\platform-tools
PATH=%PATH%;%ANDROID_HOME%\emulator
```

**macOS/Linux:**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

### 5. Install Appium Server
```bash
npm install -g appium
```

### 6. Install Appium Doctor
```bash
npm install -g appium-doctor
```

### 7. Verify Installation
```bash
# Check Android SDK
adb devices

# Check Appium
appium --version

# Check setup
appium-doctor --android
```

## 🚀 Starting the System

### 1. Start Appium Server
```bash
appium
```

### 2. Start Testkami
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm start
```

## 📋 Troubleshooting

### Emulator not starting?
1. Check AVD exists: `emulator -list-avds`
2. Start manually: `emulator -avd Pixel_4_API_30`
3. Check ADB: `adb devices`

### Appium connection failed?
1. Ensure Appium server is running on port 4723
2. Check: `curl http://localhost:4723/status`
3. Restart Appium server

### Permission issues?
1. Windows: Run as Administrator
2. macOS/Linux: `sudo chmod +x /path/to/android/sdk/emulator`

## 🔧 Configuration

Update `server/services/appiumService.js` with your AVD name:
```javascript
this.avdName = 'Your_AVD_Name'; // Change this to your AVD name
```

## 📱 Testing

1. Upload an APK file
2. Enter test case: "Login with valid credentials"
3. Click "Execute Test"
4. Watch emulator start and test run!

## 🆘 Support

If you encounter issues:
1. Check `appium-doctor --android` output
2. Verify all environment variables
3. Ensure emulator can start manually
4. Check Appium server logs
