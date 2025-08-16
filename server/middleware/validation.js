const validateTestRequest = (req, res, next) => {
  const { testCase, appPath, platform } = req.body;

  const errors = [];

  // Validate test case
  if (!testCase || typeof testCase !== 'string' || testCase.trim().length === 0) {
    errors.push('Test case is required and must be a non-empty string');
  } else if (testCase.trim().length < 10) {
    errors.push('Test case must be at least 10 characters long');
  }

  // Validate platform
  if (!platform || !['android', 'ios', 'web'].includes(platform)) {
    errors.push('Platform must be one of: android, ios, web');
  }

  // Validate app path (required for mobile platforms)
  if (['android', 'ios'].includes(platform) && !appPath) {
    errors.push('App path is required for mobile platforms');
  }

  // Validate web URL format for web platform
  if (platform === 'web' && appPath) {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(appPath)) {
      errors.push('Invalid web app URL format');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please fix the following errors:',
      errors
    });
  }

  next();
};

const validateUploadRequest = (req, res, next) => {
  const { platform, appName } = req.body;

  const errors = [];

  // Validate platform
  if (!platform || !['android', 'ios', 'web'].includes(platform)) {
    errors.push('Platform must be one of: android, ios, web');
  }

  // Validate app name
  if (appName && (typeof appName !== 'string' || appName.trim().length === 0)) {
    errors.push('App name must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please fix the following errors:',
      errors
    });
  }

  next();
};

const validateEmailRequest = (req, res, next) => {
  const { email } = req.body;

  if (email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }
  }

  next();
};

module.exports = {
  validateTestRequest,
  validateUploadRequest,
  validateEmailRequest
};
