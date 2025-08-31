# 🚀 Testkami - AI-Powered Test Automation Platform

<div align="center">
  <img src="client/public/logo.svg" alt="Testkami Logo" width="200" height="200">
  <h1>Testkami</h1>
  <p><strong>AI-Powered Test Automation Platform</strong></p>
  <p>Convert natural language to automated tests with real emulator execution</p>
</div>

## ✨ Features

### 🤖 **Fully Automated Test Execution**
- **One-Click Execution**: Click "Execute" and everything happens automatically
- **Emulator Management**: Automatically starts Android emulator
- **App Launch**: Seamlessly launches your app on the emulator
- **Real Test Execution**: Runs actual Appium tests on real devices
- **Smart Cleanup**: Automatically cleans up resources after execution

### 📱 **Real Emulator Integration**
- **Automatic AVD Detection**: Finds and configures your Android Virtual Devices
- **Emulator Startup**: Starts emulator with optimized settings
- **App Installation**: Installs and launches your APK automatically
- **Real Screenshots**: Captures actual screenshots from emulator
- **Device Interaction**: Real touch, swipe, and input simulation

### 📊 **Comprehensive Reporting**
- **Beautiful HTML Reports**: Professional test reports with screenshots
- **Step-by-Step Details**: Each test step with timing and status
- **Screenshot Gallery**: Visual evidence of test execution
- **Email Notifications**: Automatic report delivery to your email
- **Auto-Report Opening**: Reports open automatically after completion

### 🎯 **User-Friendly Experience**
- **Natural Language Input**: Write tests in plain English
- **Test Templates**: Pre-built templates for common scenarios
- **Progress Tracking**: Real-time execution progress with emojis
- **Error Handling**: User-friendly error messages
- **No Technical Knowledge Required**: Perfect for non-technical users

### 🔧 **Smart Configuration**
- **AVD Auto-Detection**: Automatically finds your Android emulators
- **Configuration Scripts**: Easy setup with `npm run configure-avd`
- **Fallback System**: Works with or without real emulator setup
- **Environment Validation**: Checks all requirements on startup

## 🚀 Quick Start

### 1. **Install Dependencies**
```bash
npm run install-all
```

### 2. **Configure Your AVD (Android Virtual Device)**
```bash
npm run configure-avd
```

### 3. **Start Appium Server**
```bash
appium
```

### 4. **Start Testkami**
```bash
npm start
```

### 5. **Execute Your First Test**
1. Go to http://localhost:3000
2. Enter test case: "Login with valid credentials"
3. Upload your APK file
4. Click "Execute Test"
5. Watch the magic happen! 🎉

## 📋 What Happens When You Click "Execute"

### Step 1: 🤖 **AI Script Generation**
- Converts your natural language to Appium test script
- Analyzes test requirements and platform specifics
- Generates optimized test steps

### Step 2: 📱 **Emulator Launch**
- Starts your configured Android emulator
- Waits for emulator to fully boot
- Prepares device for testing

### Step 3: 📲 **App Installation & Launch**
- Installs your uploaded APK
- Launches the application
- Grants necessary permissions

### Step 4: 🧪 **Test Execution**
- Executes each test step on real emulator
- Captures screenshots at each step
- Records detailed execution logs

### Step 5: 📊 **Report Generation**
- Creates beautiful HTML report
- Includes all screenshots and logs
- Sends email notification

### Step 6: 🧹 **Cleanup**
- Closes emulator session
- Cleans up temporary files
- Prepares for next execution

## 🎯 Example Test Cases

### Login Test
```
"Login with valid credentials and verify dashboard loads"
```

### Navigation Test
```
"Navigate through the main menu and verify all pages load correctly"
```

### Form Test
```
"Fill out the registration form and verify successful submission"
```

### Search Test
```
"Search for a product and verify search results are displayed"
```

## 📱 Supported Platforms

- **Android**: APK files with real emulator execution
- **iOS**: IPA files (simulator support)
- **Web**: URL-based testing

## 🔧 Configuration

### AVD Configuration
```bash
# List available AVDs
npm run list-avds

# Configure AVD automatically
npm run configure-avd

# Manual configuration
# Edit server/config/emulator.js
```

### Environment Variables
```bash
# Create .env file
OPENAI_API_KEY=your_openai_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

## 📊 Sample Report Features

### Visual Elements
- **Test Summary Cards**: Pass/Fail statistics
- **Step-by-Step Timeline**: Each action with status
- **Screenshot Gallery**: Visual evidence of execution
- **Performance Metrics**: Duration and timing details

### Report Sections
1. **Executive Summary**: High-level test results
2. **Test Details**: Configuration and environment info
3. **Execution Steps**: Detailed step-by-step breakdown
4. **Screenshots**: Visual evidence from emulator
5. **Generated Script**: AI-generated Appium code
6. **Error Details**: User-friendly error explanations

## 🛠️ Technical Stack

### Frontend
- **React 18**: Modern UI framework
- **Tailwind CSS**: Beautiful, responsive design
- **React Router**: Navigation and routing
- **React Hot Toast**: User notifications

### Backend
- **Node.js**: Server runtime
- **Express**: Web framework
- **Appium**: Mobile test automation
- **WebDriverIO**: Browser automation
- **OpenAI API**: Natural language processing

### Infrastructure
- **Multer**: File upload handling
- **Nodemailer**: Email notifications
- **UUID**: Unique identifiers
- **fs-extra**: File system operations

## 🚀 Advanced Features

### Real-Time Progress
- **Live Status Updates**: See what's happening in real-time
- **Progress Bar**: Visual execution progress
- **Step Indicators**: Current execution phase
- **Error Handling**: User-friendly error messages

### Smart Error Recovery
- **Automatic Retry**: Retries failed operations
- **Fallback Modes**: Works without real emulator
- **Error Classification**: Categorizes different error types
- **Recovery Suggestions**: Provides solutions for common issues

### Performance Optimization
- **Parallel Execution**: Multiple operations run simultaneously
- **Resource Management**: Efficient memory and CPU usage
- **Caching**: Reduces redundant operations
- **Cleanup**: Automatic resource cleanup

## 📧 Email Notifications

### Success Reports
- **Test Results**: Pass/Fail summary
- **Execution Details**: Duration, steps, screenshots
- **Report Links**: Direct links to HTML reports
- **Performance Metrics**: Timing and resource usage

### Error Notifications
- **Error Details**: What went wrong
- **Troubleshooting**: Suggested solutions
- **Execution ID**: For debugging purposes
- **Support Information**: How to get help

## 🔒 Security Features

- **File Validation**: Secure file upload handling
- **Input Sanitization**: Prevents injection attacks
- **Rate Limiting**: Prevents abuse
- **Error Masking**: Hides sensitive information

## 📈 Monitoring & Analytics

### Execution Statistics
- **Success Rate**: Percentage of successful tests
- **Average Duration**: Typical execution time
- **Platform Distribution**: Android vs iOS vs Web
- **Error Patterns**: Common failure points

### Performance Metrics
- **Emulator Startup Time**: How fast emulator boots
- **Test Execution Speed**: Time per test step
- **Resource Usage**: Memory and CPU consumption
- **Screenshot Quality**: Image resolution and clarity

## 🆘 Troubleshooting

### Common Issues

#### Emulator Not Starting
```bash
# Check AVD configuration
npm run list-avds

# Verify Android SDK
adb devices

# Check emulator manually
emulator -avd YOUR_AVD_NAME
```

#### Appium Connection Failed
```bash
# Start Appium server
appium

# Check Appium status
curl http://localhost:4723/status

# Verify port availability
netstat -an | grep 4723
```

#### Upload Issues
```bash
# Check file permissions
ls -la uploads/

# Verify file size limits
# Default: 100MB max file size

# Check supported formats
# Android: .apk
# iOS: .ipa
```

## 🎯 Best Practices

### Test Case Writing
- **Be Specific**: Include expected outcomes
- **Use Action Words**: "Click", "Verify", "Navigate"
- **Include Conditions**: "If logged in", "When dashboard loads"
- **Test One Thing**: Focus on single functionality

### App Preparation
- **Debug Builds**: Use debug APKs for testing
- **Proper Permissions**: Ensure app has required permissions
- **Test Data**: Prepare test accounts and data
- **Clean State**: Start with fresh app installation

### Execution Tips
- **Monitor Progress**: Watch the real-time progress
- **Check Reports**: Review generated reports
- **Save Screenshots**: Keep important visual evidence
- **Document Issues**: Note any recurring problems

## 🚀 Future Roadmap

### Planned Features
- **iOS Simulator Support**: Full iOS testing capabilities
- **Parallel Execution**: Multiple tests simultaneously
- **Test Suites**: Group related tests together
- **CI/CD Integration**: Jenkins, GitHub Actions support
- **Cloud Execution**: AWS Device Farm integration
- **Video Recording**: Full test execution videos
- **Performance Testing**: Load and stress testing
- **API Testing**: REST API automation

### Enhancement Ideas
- **Voice Commands**: Speak your test cases
- **Visual Test Builder**: Drag-and-drop test creation
- **AI Test Optimization**: Automatic test improvement
- **Predictive Analytics**: Test failure prediction
- **Mobile App**: Testkami mobile companion app

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone repository
git clone https://github.com/your-org/testkami.git

# Install dependencies
npm run install-all

# Start development servers
npm run dev

# Run tests
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Appium Community**: For the amazing mobile automation framework
- **OpenAI**: For natural language processing capabilities
- **React Team**: For the excellent frontend framework
- **Tailwind CSS**: For the beautiful design system

## 📞 Support

- **Email**: support@testkami.com
- **Documentation**: [docs.testkami.com](https://docs.testkami.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/testkami/issues)
- **Discord**: [Join our community](https://discord.gg/testkami)

---

<div align="center">
  <p><strong>Made with ❤️ by the Testkami Team</strong></p>
  <p>Transform your testing workflow with AI-powered automation</p>
</div>
