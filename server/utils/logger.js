const fs = require('fs-extra');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    fs.ensureDirSync(this.logsDir);
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    return logEntry;
  }

  writeToFile(logEntry) {
    const logFile = path.join(this.logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logFile, logLine);
  }

  // Console colors for different log levels
  getColor(level) {
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m', // Green
      WARNING: '\x1b[33m', // Yellow
      ERROR: '\x1b[31m',   // Red
      DEBUG: '\x1b[35m',   // Magenta
      RESET: '\x1b[0m'     // Reset
    };
    return colors[level] || colors.RESET;
  }

  // Main logging methods
  info(message, data = null) {
    const logEntry = this.formatMessage('INFO', message, data);
    const color = this.getColor('INFO');
    const reset = this.getColor('RESET');
    
    console.log(`${color}ℹ️  [INFO]${reset} ${message}`);
    if (data) {
      console.log(`${color}   Data:${reset}`, data);
    }
    
    this.writeToFile(logEntry);
  }

  success(message, data = null) {
    const logEntry = this.formatMessage('SUCCESS', message, data);
    const color = this.getColor('SUCCESS');
    const reset = this.getColor('RESET');
    
    console.log(`${color}✅ [SUCCESS]${reset} ${message}`);
    if (data) {
      console.log(`${color}   Data:${reset}`, data);
    }
    
    this.writeToFile(logEntry);
  }

  warning(message, data = null) {
    const logEntry = this.formatMessage('WARNING', message, data);
    const color = this.getColor('WARNING');
    const reset = this.getColor('RESET');
    
    console.log(`${color}⚠️  [WARNING]${reset} ${message}`);
    if (data) {
      console.log(`${color}   Data:${reset}`, data);
    }
    
    this.writeToFile(logEntry);
  }

  error(message, error = null) {
    const logEntry = this.formatMessage('ERROR', message, error);
    const color = this.getColor('ERROR');
    const reset = this.getColor('RESET');
    
    console.log(`${color}❌ [ERROR]${reset} ${message}`);
    if (error) {
      console.log(`${color}   Error:${reset}`, error);
      if (error.stack) {
        console.log(`${color}   Stack:${reset}`, error.stack);
      }
    }
    
    this.writeToFile(logEntry);
  }

  debug(message, data = null) {
    const logEntry = this.formatMessage('DEBUG', message, data);
    const color = this.getColor('DEBUG');
    const reset = this.getColor('RESET');
    
    console.log(`${color}🔍 [DEBUG]${reset} ${message}`);
    if (data) {
      console.log(`${color}   Data:${reset}`, data);
    }
    
    this.writeToFile(logEntry);
  }

  // Specialized logging methods for different components
  api(method, endpoint, data = null) {
    this.info(`API ${method} ${endpoint}`, data);
  }

  test(testName, step, data = null) {
    this.info(`🧪 Test: ${testName} - ${step}`, data);
  }

  emulator(action, data = null) {
    this.info(`📱 Emulator: ${action}`, data);
  }

  appium(action, data = null) {
    this.info(`🔌 Appium: ${action}`, data);
  }

  file(action, filename, data = null) {
    this.info(`📁 File: ${action} - ${filename}`, data);
  }

  email(action, data = null) {
    this.info(`📧 Email: ${action}`, data);
  }

  // Performance logging
  performance(operation, duration, data = null) {
    this.info(`⚡ Performance: ${operation} took ${duration}ms`, data);
  }

  // Memory usage logging
  memory() {
    const memUsage = process.memoryUsage();
    this.debug('Memory Usage', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    });
  }

  // Request logging middleware
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Log request
      this.api(req.method, req.url, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Log response
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.api(`${req.method} ${res.statusCode}`, req.url, {
          duration: `${duration}ms`,
          statusCode: res.statusCode
        });
      });

      next();
    };
  }

  // Error logging middleware
  errorLogger() {
    return (error, req, res, next) => {
      this.error('Unhandled Error', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      next(error);
    };
  }

  // Startup logging
  startup(component, data = null) {
    this.success(`🚀 ${component} started successfully`, data);
  }

  // Shutdown logging
  shutdown(component, data = null) {
    this.warning(`🛑 ${component} shutting down`, data);
  }

  // Configuration logging
  config(component, config) {
    this.info(`⚙️  ${component} configuration loaded`, config);
  }

  // Health check logging
  health(status, data = null) {
    if (status === 'healthy') {
      this.success('🏥 Health check passed', data);
    } else {
      this.warning('🏥 Health check failed', data);
    }
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
