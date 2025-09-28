# 🛠️ **TestKami MVP Setup Guide - Complete Installation**

## 📋 **System Requirements**

### **Minimum Requirements:**
- **OS**: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space
- **Node.js**: Version 16 or higher
- **Git**: Latest version

### **For Android Testing:**
- **Android Studio** (latest version)
- **Android SDK** (API level 21+)
- **Java Development Kit (JDK)** 8 or 11

---

## 🚀 **Step 1: Install Prerequisites**

### **Install Node.js**
1. **Go to [nodejs.org](https://nodejs.org)**
2. **Download LTS version** (recommended)
3. **Run installer** and follow setup wizard
4. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```

### **Install Git**
1. **Go to [git-scm.com](https://git-scm.com)**
2. **Download for your OS**
3. **Run installer** with default settings
4. **Verify installation:**
   ```bash
   git --version
   ```

### **Install Android Studio (For Android Testing)**
1. **Go to [developer.android.com/studio](https://developer.android.com/studio)**
2. **Download Android Studio**
3. **Run installer** and follow setup wizard
4. **During setup, install:**
   - Android SDK
   - Android SDK Platform-Tools
   - Android Virtual Device (AVD)

---

## 📥 **Step 2: Clone TestKami Repository**

### **Clone the Repository**
```bash
# Open terminal/command prompt
git clone https://github.com/your-username/testkami-mvp.git
cd testkami-mvp
```

### **Verify Repository Structure**
You should see:
```
testkami-mvp/
├── client/          # React frontend
├── server/          # Node.js backend
├── uploads/         # App uploads directory
├── reports/         # Test reports directory
├── package.json     # Root package.json
└── README.md        # Project documentation
```

---

## 📦 **Step 3: Install Dependencies**

### **Install Root Dependencies**
```bash
# From the root directory
npm install
```

### **Install Server Dependencies**
```bash
cd server
npm install
```

### **Install Client Dependencies**
```bash
cd ../client
npm install
```

### **Verify Installation**
```bash
# Check if all packages installed
npm list --depth=0
```

---

## ⚙️ **Step 4: Environment Configuration**

### **Create Environment File**
```bash
cd server
# Create .env file
touch .env  # On Windows: type nul > .env
```

### **Configure Environment Variables**
Open `.env` file and add:
```env
# Gemini AI Configuration
USE_GEMINI=true
GEMINI_API_KEY=your_gemini_api_key_here

# Cloud Device Configuration (set to false for local testing)
USE_CLOUD_DEVICES=false

# BrowserStack Configuration (optional for cloud testing)
BROWSERSTACK_USERNAME=your_browserstack_username
BROWSERSTACK_ACCESS_KEY=your_browserstack_access_key

# Application Configuration
NODE_ENV=development
PORT=5000
```

### **Get Gemini API Key**
1. **Go to [makersuite.google.com](https://makersuite.google.com)**
2. **Sign in with Google account**
3. **Create new API key**
4. **Copy the key** and paste in `.env` file

---

## 📱 **Step 5: Android Setup (For Local Testing)**

### **Configure Android SDK**
1. **Open Android Studio**
2. **Go to File → Settings → Appearance & Behavior → System Settings → Android SDK**
3. **Install required SDK platforms:**
   - Android 11 (API 30)
   - Android 10 (API 29)
   - Android 9 (API 28)

### **Create Virtual Device**
1. **Open AVD Manager** in Android Studio
2. **Click "Create Virtual Device"**
3. **Choose device** (e.g., Pixel 4)
4. **Select system image** (e.g., Android 11)
5. **Configure AVD** and click "Finish"

### **Start Emulator**
1. **Click play button** next to your AVD
2. **Wait for emulator to boot** (may take 2-3 minutes)
3. **Verify emulator is running:**
   ```bash
   adb devices
   ```

---

## 🚀 **Step 6: Start TestKami**

### **Start Development Server**
```bash
# From root directory
npm run dev
```

### **Verify Services are Running**
You should see:
```
✅ TestKami Server started successfully
✅ React development server started
✅ Appium server started
✅ Android SDK detected
```

### **Access TestKami**
1. **Open browser**
2. **Go to `http://localhost:3000`**
3. **You should see TestKami interface**

---

## 🧪 **Step 7: Test Installation**

### **Run a Simple Test**
1. **Upload a test APK** (e.g., ApiDemos-debug.apk)
2. **Select "Local Emulator"**
3. **Use a test template:**
   ```
   Test Case Name: Basic Test
   Test Description: Click on Views, Click on TextFields, Enter Text - "Hello", Verify "Hello" is displayed
   ```
4. **Click "Execute Test"**
5. **Watch test run** on your emulator

### **Verify Test Report**
- **Test should complete** successfully
- **Screenshot gallery** should show steps
- **Report should be generated** in `reports/` directory

---

## 🔧 **Troubleshooting Common Issues**

### **Port Already in Use**
```bash
# Kill processes on ports 3000 and 5000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### **Android SDK Not Found**
```bash
# Add Android SDK to PATH
export ANDROID_HOME=/path/to/android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### **Node Modules Issues**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### **Emulator Not Detected**
```bash
# Restart ADB
adb kill-server
adb start-server
adb devices
```

---

## 📊 **Step 8: Verify Complete Setup**

### **Check All Components**
```bash
# Check Node.js
node --version

# Check npm
npm --version

# Check Git
git --version

# Check Android SDK
adb version

# Check emulator
adb devices
```

### **Test All Features**
- [ ] **Frontend loads** at `http://localhost:3000`
- [ ] **Backend responds** at `http://localhost:5000`
- [ ] **Emulator detected** in device selection
- [ ] **APK upload** works
- [ ] **Test execution** runs successfully
- [ ] **Report generation** works
- [ ] **Screenshots captured** properly

---

## 🎯 **Quick Start Commands**

### **Complete Setup in One Go**
```bash
# 1. Clone repository
git clone https://github.com/your-username/testkami-mvp.git
cd testkami-mvp

# 2. Install dependencies
npm install
cd server && npm install
cd ../client && npm install

# 3. Set up environment
cd ../server
echo "USE_GEMINI=true" > .env
echo "GEMINI_API_KEY=your_key_here" >> .env
echo "USE_CLOUD_DEVICES=false" >> .env

# 4. Start TestKami
cd ..
npm run dev
```

### **Daily Usage**
```bash
# Start emulator (in Android Studio)
# Start TestKami
npm run dev
# Open http://localhost:3000
```

---

## 📝 **Setup Checklist**

### **Prerequisites**
- [ ] Node.js installed
- [ ] Git installed
- [ ] Android Studio installed
- [ ] Android SDK configured
- [ ] Virtual device created

### **TestKami Setup**
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Gemini API key configured
- [ ] Server starts successfully
- [ ] Frontend loads correctly

### **Testing**
- [ ] Emulator detected
- [ ] APK upload works
- [ ] Test execution successful
- [ ] Report generation works
- [ ] Screenshots captured

---

## 🚀 **You're Ready!**

**TestKami is now fully set up and ready to use!**

- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000`
- **Reports**: `http://localhost:5000/reports/`

**Start testing your mobile apps with plain English!** 🎉

---

## 📚 **Additional Resources**

### **TestKami Features**
- **Natural Language Testing**: Write tests in plain English
- **Screenshot Capture**: Automatic screenshots for each step
- **Detailed Reports**: Comprehensive test execution reports
- **Local & Cloud Testing**: Support for both local emulators and cloud devices
- **Template System**: Pre-built test templates for common scenarios

### **Supported Platforms**
- **Android**: APK files with local emulator or cloud devices
- **Web**: Website testing (coming soon)
- **iOS**: IPA files (coming soon)

### **Test Templates Available**
- **API Demos Template**: Basic navigation and form testing
- **Lexical Semantics Template**: Text input and verification
- **Custom Tests**: Write your own test cases

### **Getting Help**
- **Check logs**: Server logs provide detailed error information
- **Test templates**: Start with pre-built templates
- **Simple tests**: Begin with basic navigation tests
- **Community**: Join our community for support

---

## 🔄 **Next Steps**

1. **Test with different apps** to understand capabilities
2. **Try various test scenarios** to explore features
3. **Share feedback** to help improve TestKami
4. **Contribute** to the project if interested
5. **Stay updated** with new features and improvements

**Happy Testing!** 🚀
