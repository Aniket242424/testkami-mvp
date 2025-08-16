const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes (comment out problematic ones for now)
// const testRoutes = require('./routes/testRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
// const reportRoutes = require('./routes/reportRoutes');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/reports', express.static(path.join(__dirname, '../reports')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Mock API endpoints for MVP
app.get('/api/tests/templates', (req, res) => {
  res.json({
    success: true,
    templates: [
      {
        id: 'login-test',
        name: 'Login Test',
        template: 'Test user login functionality',
        description: 'Test user login functionality',
        platform: 'android'
      },
      {
        id: 'web-test',
        name: 'Web Test',
        template: 'Test web application functionality',
        description: 'Test web application functionality',
        platform: 'web'
      },
      {
        id: 'navigation-test',
        name: 'Navigation Test',
        template: 'Test app navigation and menu functionality',
        description: 'Test app navigation and menu functionality',
        platform: 'android'
      },
      {
        id: 'form-test',
        name: 'Form Test',
        template: 'Test form submission and validation',
        description: 'Test form submission and validation',
        platform: 'web'
      }
    ]
  });
});

app.get('/api/tests/history', (req, res) => {
  res.json({
    success: true,
    history: []
  });
});

app.post('/api/tests/execute', (req, res) => {
  res.json({
    success: true,
    testId: 'mock-test-' + Date.now(),
    message: 'Test execution completed (mock)',
    report: {
      status: 'PASS',
      duration: '2.5s',
      steps: 3
    }
  });
});

// API routes (only upload for now)
app.use('/api/upload', uploadRoutes);
// app.use('/api/tests', testRoutes);
// app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size.',
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist.`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Testkami Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('✅ MVP Mode: Basic functionality enabled');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
