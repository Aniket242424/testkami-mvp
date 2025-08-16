const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    try {
      await fs.ensureDir(uploadDir);
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_');
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    const filename = `${nameWithoutExt}_${timestamp}${extension}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const { platform } = req.body;
  
  // Get file extension
  const extension = path.extname(file.originalname).toLowerCase();
  
  // Validate file type based on platform
  if (platform === 'android') {
    if (extension !== '.apk') {
      return cb(new Error('Only APK files are allowed for Android platform'), false);
    }
  } else if (platform === 'ios') {
    if (extension !== '.ipa') {
      return cb(new Error('Only IPA files are allowed for iOS platform'), false);
    }
  } else {
    return cb(new Error('Invalid platform specified'), false);
  }
  
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 1 // Only allow 1 file per request
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large',
        message: 'File size must be less than 100MB'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: 'Only one file can be uploaded at a time'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: error.message
    });
  }
  
  if (error.message.includes('Only APK files') || error.message.includes('Only IPA files')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: error.message
    });
  }
  
  if (error.message.includes('Invalid platform')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid platform',
      message: error.message
    });
  }
  
  // Generic error
  return res.status(500).json({
    success: false,
    error: 'Upload failed',
    message: 'An error occurred during file upload'
  });
};

module.exports = {
  upload,
  handleUploadError
};
