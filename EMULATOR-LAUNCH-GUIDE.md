# 📱 Testkami Emulator Launch Guide

## 🚀 How Emulator Launching Works

When you click the **Execute** button in Testkami, here's what happens:

### 1. **Click Execute Button** 
- Frontend sends test case to backend
- Backend starts the automated test process

### 2. **Emulator Launch** 
- Backend starts Android emulator with visible GUI
- Emulator window opens on your screen
- Uses your configured AVD: `Manastik_Medico`

### 3. **App Launch**
- Appium driver initializes
- Your uploaded app (.apk) is installed and launched
- App appears on the emulator screen

### 4. **Test Execution**
- Test script runs automatically
- Each step is executed on the emulator
- Screenshots are captured for each step

## 🔧 Emulator Configuration

### Current AVD Setup
```javascript
// server/config/emulator.js
android: {
  avdName: 'Manastik_Medico', // Your available AVD
  startupOptions: {
    memory: 4096,             // 4GB RAM
    cores: 4,                 // 4 CPU cores
    gpu: 'host',              // Host GPU acceleration
    skin: '1080x1920',        // Screen resolution
    dpi: 420                  // Screen DPI
  }
}
```

### Available AVDs
```bash
# Your available AVDs:
- Manastik_Medico
- Manastik_User
```

## 🎯 What You'll See

### When Emulator Launches:
1. **Emulator Window Opens** - You'll see the Android emulator window appear
2. **Boot Animation** - Android boots up (may take 30-60 seconds)
3. **Home Screen** - Android home screen appears
4. **App Installation** - Your app gets installed automatically
5. **App Launch** - Your app opens on the emulator
6. **Test Execution** - Test steps run automatically with visible actions

### Visual Feedback:
- ✅ Emulator window is visible on your screen
- ✅ You can see the Android interface
- ✅ App installation and launch is visible
- ✅ Test actions are performed visibly
- ✅ Screenshots are captured at each step

## 🛠️ Troubleshooting

### If Emulator Doesn't Launch:

#### 1. Check AVD Availability
```bash
# List available AVDs
emulator -list-avds

# Should show:
Manastik_Medico
Manastik_User
```

#### 2. Check Android SDK
```bash
# Check if emulator command is available
emulator -version

# Check if adb is working
adb devices
```

#### 3. Manual Emulator Test
```bash
# Test emulator launch manually
emulator -avd Manastik_Medico -gpu host -no-audio -no-snapshot-load -no-boot-anim -memory 4096 -cores 4 -skin 1080x1920 -dpi 420 -show-kernel -verbose
```

#### 4. Check System Resources
- Ensure you have at least 8GB RAM available
- Close other resource-intensive applications
- Ensure virtualization is enabled in BIOS

### Common Issues:

#### Issue: "Emulator failed to boot within timeout"
**Solution:**
- Increase timeout in `server/config/emulator.js`:
```javascript
timeouts: {
  bootTimeout: 120000,      // Increase to 2 minutes
  checkInterval: 5000,      // Check every 5 seconds
  commandTimeout: 60000     // Increase command timeout
}
```

#### Issue: "GPU acceleration not available"
**Solution:**
- Update emulator configuration:
```javascript
startupOptions: {
  gpu: 'swiftshader_indirect', // Use software rendering
  // ... other options
}
```

#### Issue: "Emulator window not visible"
**Solution:**
- Check if emulator process is running:
```bash
# Check running emulator processes
tasklist | findstr emulator
```

## 📊 Performance Optimization

### For Better Performance:
1. **Increase Memory**: Set to 4096MB or higher
2. **Use Host GPU**: Enable hardware acceleration
3. **Skip Boot Animation**: Faster startup
4. **Disable Audio**: Reduces resource usage
5. **Use SSD**: Faster emulator startup

### Current Optimizations:
```javascript
startupOptions: {
  memory: 4096,             // 4GB RAM for smooth performance
  cores: 4,                 // 4 CPU cores
  gpu: 'host',              // Hardware acceleration
  noBootAnim: true,         // Skip boot animation
  noAudio: true,            // Disable audio
  noSnapshotLoad: true      // Fresh start each time
}
```

## 🔍 Debugging

### Enable Verbose Logging:
```javascript
// In server/services/appiumService.js
const emulatorArgs = [
  // ... other args
  '-verbose',               // Verbose output
  '-show-kernel'            // Show kernel messages
];
```

### Check Logs:
```bash
# View server logs
tail -f logs/$(date +%Y-%m-%d).log

# Filter emulator logs
grep "Emulator" logs/$(date +%Y-%m-%d).log
```

### Test Emulator Launch:
```bash
# Run test script
node test-emulator.js
```

## 🎮 Manual Testing

### Test Emulator Launch Manually:
```bash
# 1. Start emulator manually
emulator -avd Manastik_Medico -gpu host -no-audio -no-snapshot-load -no-boot-anim -memory 4096 -cores 4 -skin 1080x1920 -dpi 420 -show-kernel -verbose

# 2. Check if emulator is running
adb devices

# 3. Test app installation
adb install path/to/your/app.apk

# 4. Launch app
adb shell am start -n com.yourapp.package/.MainActivity
```

## 📱 Expected User Experience

### When You Click Execute:

1. **Immediate Feedback**: Progress indicator shows "Starting emulator..."
2. **Emulator Window**: Android emulator window opens on your screen
3. **Boot Process**: You see Android booting up (30-60 seconds)
4. **App Installation**: Your app gets installed automatically
5. **App Launch**: Your app opens and becomes visible
6. **Test Execution**: You see test actions being performed
7. **Screenshots**: Each step is captured as a screenshot
8. **Report Generation**: Detailed report is created with screenshots

### Visual Timeline:
```
Click Execute → Emulator Opens → Android Boots → App Installs → App Launches → Tests Run → Report Generated
     ↓              ↓              ↓            ↓            ↓           ↓           ↓
  0-5s          5-10s         10-60s       60-70s       70-80s     80-120s    120-130s
```

## 🎯 Success Indicators

### You'll Know It's Working When:
- ✅ Emulator window appears on your screen
- ✅ You see Android booting up
- ✅ Android home screen appears
- ✅ Your app gets installed and launched
- ✅ Test actions are performed visibly
- ✅ Screenshots are captured
- ✅ Detailed report is generated

### Console Logs You'll See:
```
ℹ️  [INFO] 📱 Emulator: Starting emulator with visible GUI
ℹ️  [INFO] 📱 Emulator: Emulator started successfully
ℹ️  [INFO] Emulator window should be visible on your screen
ℹ️  [INFO] 🔌 Appium: Initializing Appium driver
ℹ️  [INFO] 🔌 Appium: Driver initialized successfully
ℹ️  [INFO] 🧪 Test: Test Execution - Started
ℹ️  [INFO] 🧪 Test: Test Execution - Completed
✅ [SUCCESS] Full test execution completed successfully
```

## 🚀 Next Steps

1. **Test the Flow**: Click Execute and watch the emulator launch
2. **Upload an App**: Upload a .apk file to test with
3. **Try Different Tests**: Test various scenarios
4. **Check Reports**: View generated reports with screenshots
5. **Customize**: Modify emulator settings as needed

The emulator should now launch visibly on your screen when you click Execute! 🎉
