# 📊 Testkami Logging & Auto-Restart Guide

## 🚀 Auto-Restart with Nodemon

### What is Auto-Restart?
The Testkami server now automatically restarts when you make changes to any server files, thanks to **nodemon**. This means you don't need to manually restart the server every time you modify code.

### How It Works
- **File Watching**: Nodemon watches all `.js`, `.json`, and `.env` files in the `server/` directory
- **Automatic Restart**: When any watched file changes, the server automatically restarts
- **Smart Ignoring**: Ignores `node_modules`, `client/`, `logs/`, `reports/`, and `uploads/` directories
- **Delay**: 1-second delay to prevent rapid restarts

### Starting the Server with Auto-Restart
```bash
# Development mode (with auto-restart)
npm start

# Production mode (without auto-restart)
npm run start-prod
```

### Nodemon Configuration
The `nodemon.json` file contains:
```json
{
  "watch": ["server/**/*.js", "server/**/*.json", "server/**/*.env"],
  "ignore": ["node_modules/**/*", "client/**/*", "logs/**/*"],
  "ext": "js,json,env",
  "delay": "1000",
  "verbose": true,
  "colours": true
}
```

## 📝 Comprehensive Logging System

### Log Levels
The logging system provides different levels of detail:

1. **INFO** (ℹ️) - General information
2. **SUCCESS** (✅) - Successful operations
3. **WARNING** (⚠️) - Warnings and potential issues
4. **ERROR** (❌) - Errors and failures
5. **DEBUG** (🔍) - Detailed debugging information

### Log Categories

#### 🧪 Test Execution Logs
```javascript
logger.test('Test Name', 'Step', { executionId, data });
```
- Test start/completion
- Step-by-step execution
- Performance metrics

#### 📱 Emulator Logs
```javascript
logger.emulator('Action', { executionId, data });
```
- Emulator startup/shutdown
- App installation/launch
- Device status

#### 🔌 Appium Logs
```javascript
logger.appium('Action', { executionId, data });
```
- Driver initialization
- Test execution
- Connection status

#### 📁 File Operations
```javascript
logger.file('Action', 'filename', { data });
```
- File uploads/downloads
- Report generation
- Screenshot capture

#### 📧 Email Operations
```javascript
logger.email('Action', { executionId, data });
```
- Email sending
- Report delivery
- Error notifications

#### ⚡ Performance Logs
```javascript
logger.performance('Operation', duration, { data });
```
- Execution time
- Memory usage
- Resource consumption

### Console Output Examples

#### Server Startup
```
✅ [SUCCESS] 🚀 Testkami Server started successfully
   Data: { port: 5000, environment: 'development', healthCheck: 'http://localhost:5000/health' }

🔍 [DEBUG] Memory Usage
   Data: { rss: '45MB', heapTotal: '20MB', heapUsed: '15MB', external: '2MB' }

✅ [SUCCESS] MVP Mode: Basic functionality enabled
```

#### API Request
```
ℹ️  [INFO] API GET /api/tests/templates
   Data: { ip: '::1', userAgent: 'curl/7.68.0', query: {}, params: {} }

ℹ️  [INFO] API GET 200 /api/tests/templates
   Data: { duration: '15ms', statusCode: 200 }
```

#### Test Execution
```
ℹ️  [INFO] 🧪 Test: Automated Test Execution - Started
   Data: { executionId: 'uuid-123', testCase: 'Login test', platform: 'android' }

ℹ️  [INFO] 🧪 Test: Script Generation - Started
   Data: { executionId: 'uuid-123' }

ℹ️  [INFO] 📱 Emulator: Starting emulator and launching app
   Data: { executionId: 'uuid-123' }

ℹ️  [INFO] ⚡ Performance: Full test execution took 25000ms
   Data: { executionId: 'uuid-123' }
```

### Log File Storage

#### Location
All logs are stored in the `logs/` directory with daily rotation:
```
logs/
├── 2024-01-15.log
├── 2024-01-16.log
└── 2024-01-17.log
```

#### Log Format
Each log entry is in JSON format:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "API GET /api/tests/templates",
  "data": {
    "ip": "::1",
    "userAgent": "curl/7.68.0",
    "query": {},
    "params": {}
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Logging level (default: INFO)
LOG_LEVEL=DEBUG

# Log file retention (default: 30 days)
LOG_RETENTION_DAYS=30

# Enable/disable file logging (default: true)
LOG_TO_FILE=true

# Enable/disable console logging (default: true)
LOG_TO_CONSOLE=true
```

### Customizing Log Levels
```javascript
// In your code
if (process.env.NODE_ENV === 'development') {
  logger.debug('Detailed debug information', { data });
}

// Only log errors in production
if (process.env.NODE_ENV === 'production') {
  logger.error('Production error', error);
}
```

## 🛠️ Using the Logger in Your Code

### Basic Usage
```javascript
const logger = require('./utils/logger');

// Simple logging
logger.info('User logged in', { userId: 123 });
logger.success('File uploaded successfully', { filename: 'test.apk' });
logger.warning('High memory usage detected', { usage: '85%' });
logger.error('Database connection failed', error);
logger.debug('Processing step 3 of 5', { step: 3, total: 5 });
```

### Specialized Logging
```javascript
// API requests
logger.api('POST', '/api/tests/execute', { body: testData });

// Test execution
logger.test('Login Test', 'Started', { executionId: 'test-123' });

// Emulator operations
logger.emulator('Starting emulator', { avdName: 'Pixel_4_API_30' });

// File operations
logger.file('Upload', 'test.apk', { size: '15MB' });

// Email operations
logger.email('Sending report', { to: 'user@example.com' });

// Performance monitoring
logger.performance('Database query', 150, { query: 'SELECT * FROM tests' });
```

### Memory Monitoring
```javascript
// Log current memory usage
logger.memory();

// Output:
// 🔍 [DEBUG] Memory Usage
//    Data: { rss: '45MB', heapTotal: '20MB', heapUsed: '15MB', external: '2MB' }
```

## 📊 Monitoring and Debugging

### Health Check Endpoint
```bash
curl http://localhost:5000/health
```

Response includes:
- Server status
- Uptime
- Memory usage
- Environment info

### Real-time Log Monitoring
```bash
# Watch logs in real-time
tail -f logs/$(date +%Y-%m-%d).log

# Filter by log level
grep '"level":"ERROR"' logs/$(date +%Y-%m-%d).log

# Search for specific execution
grep 'executionId.*uuid-123' logs/$(date +%Y-%m-%d).log
```

### Performance Monitoring
```javascript
// Monitor specific operations
const start = Date.now();
await someOperation();
logger.performance('Operation Name', Date.now() - start);
```

## 🚨 Error Handling

### Automatic Error Logging
All unhandled errors are automatically logged with:
- Error message and stack trace
- Request details (URL, method, body)
- Timestamp and context

### User-Friendly Error Messages
```javascript
// Convert technical errors to user-friendly messages
const userFriendlyError = automatedTestService.getUserFriendlyError(error.message);
```

### Error Recovery
```javascript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    operation: 'riskyOperation',
    error: error.message,
    stack: error.stack
  });
  
  // Continue with fallback
  await fallbackOperation();
}
```

## 🔄 Auto-Restart Features

### Manual Restart
```bash
# In the terminal where nodemon is running
rs
```

### Restart Triggers
- Any `.js` file change in `server/`
- Any `.json` file change in `server/`
- Any `.env` file change
- Configuration file changes

### Restart Messages
```
🔄 Server restarted due to changes
💥 Server crashed, restarting...
```

## 📈 Best Practices

### 1. Use Appropriate Log Levels
```javascript
// Use DEBUG for detailed troubleshooting
logger.debug('Variable values', { userId, sessionId, timestamp });

// Use INFO for general flow
logger.info('User action completed', { action: 'login', userId });

// Use WARNING for potential issues
logger.warning('High CPU usage', { usage: '90%' });

// Use ERROR for actual failures
logger.error('Database connection failed', error);
```

### 2. Include Context in Logs
```javascript
// Good: Include relevant context
logger.info('Test execution started', {
  executionId: 'test-123',
  testCase: 'Login test',
  platform: 'android',
  timestamp: new Date().toISOString()
});

// Bad: Missing context
logger.info('Test started');
```

### 3. Monitor Performance
```javascript
// Wrap operations with performance logging
const start = Date.now();
await expensiveOperation();
logger.performance('Expensive Operation', Date.now() - start);
```

### 4. Handle Errors Gracefully
```javascript
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', {
    operation: 'operationName',
    error: error.message,
    context: { userId, data }
  });
  
  // Provide user-friendly error
  throw new Error('Operation could not be completed. Please try again.');
}
```

## 🎯 Summary

The Testkami logging and auto-restart system provides:

✅ **Automatic Server Restart** - No manual restarts needed  
✅ **Comprehensive Logging** - All actions logged with context  
✅ **Multiple Log Levels** - From debug to error  
✅ **File and Console Output** - Logs saved to files and displayed  
✅ **Performance Monitoring** - Track execution times  
✅ **Error Tracking** - Detailed error information  
✅ **Health Monitoring** - Server status and metrics  
✅ **User-Friendly Messages** - Convert technical errors to readable text  

This system makes debugging and monitoring your Testkami application much easier and more efficient! 🚀
