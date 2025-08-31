const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');

// In-memory storage for uploaded files (in production, use a database)
const uploadedFiles = new Map();

// Export the uploadedFiles Map so other services can access it
module.exports.uploadedFiles = uploadedFiles;

class UploadController {
  // Upload app binary (APK/IPA)
  async uploadApp(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          message: 'Please select a file to upload'
        });
      }

      const { originalname, filename, path: filePath, size } = req.file;
      const { platform, appName, version } = req.body;

      // Validate file type
      const allowedExtensions = platform === 'android' ? ['.apk'] : ['.ipa'];
      const fileExtension = path.extname(originalname).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        await fs.remove(filePath);
        return res.status(400).json({
          success: false,
          error: 'Invalid file type',
          message: `Only ${allowedExtensions.join(', ')} files are allowed for ${platform} platform`
        });
      }

      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (size > maxSize) {
        await fs.remove(filePath);
        return res.status(400).json({
          success: false,
          error: 'File too large',
          message: 'File size must be less than 100MB'
        });
      }

      const fileId = uuidv4();
      const fileInfo = {
        id: fileId,
        originalName: originalname,
        fileName: filename,
        filePath: filePath,
        size: size,
        platform: platform,
        appName: appName || originalname.replace(fileExtension, ''),
        version: version || '1.0.0',
        uploadedAt: new Date().toISOString(),
        status: 'uploaded'
      };

      uploadedFiles.set(fileId, fileInfo);

      console.log(`📱 App uploaded: ${originalname} (${platform})`);

      res.status(201).json({
        success: true,
        fileId,
        file: fileInfo,
        message: 'App binary uploaded successfully'
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to upload app binary'
      });
    }
  }

  // Upload web app URL
  async uploadWebUrl(req, res) {
    try {
      const { url, appName, platform = 'web' } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'URL required',
          message: 'Please provide a valid web app URL'
        });
      }

      // Validate URL format
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid URL',
          message: 'Please provide a valid HTTP/HTTPS URL'
        });
      }

      const fileId = uuidv4();
      const fileInfo = {
        id: fileId,
        originalName: `${appName || 'web-app'}.url`,
        fileName: `${fileId}.url`,
        filePath: url,
        size: 0,
        platform: platform,
        appName: appName || 'Web Application',
        version: '1.0.0',
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
        type: 'web-url'
      };

      uploadedFiles.set(fileId, fileInfo);

      console.log(`🌐 Web app URL uploaded: ${url}`);

      res.status(201).json({
        success: true,
        fileId,
        file: fileInfo,
        message: 'Web app URL uploaded successfully'
      });

    } catch (error) {
      console.error('Web URL upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to upload web app URL'
      });
    }
  }

  // Get list of uploaded files
  async getUploadedFiles(req, res) {
    try {
      const { platform, limit = 50, offset = 0 } = req.query;
      
      let files = Array.from(uploadedFiles.values());
      
      // Filter by platform if specified
      if (platform) {
        files = files.filter(file => file.platform === platform);
      }

      // Apply pagination
      const paginatedFiles = files
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
        .map(file => ({
          id: file.id,
          originalName: file.originalName,
          appName: file.appName,
          platform: file.platform,
          version: file.version,
          size: file.size,
          uploadedAt: file.uploadedAt,
          status: file.status,
          type: file.type || 'binary'
        }));

      res.status(200).json({
        success: true,
        files: paginatedFiles,
        total: files.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      console.error('File list retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve uploaded files'
      });
    }
  }

  // Delete uploaded file
  async deleteFile(req, res) {
    try {
      const { fileId } = req.params;
      const fileInfo = uploadedFiles.get(fileId);
      
      if (!fileInfo) {
        return res.status(404).json({
          success: false,
          error: 'File not found',
          message: `No file found with ID: ${fileId}`
        });
      }

      // Remove file from filesystem if it's a binary file
      if (fileInfo.type !== 'web-url' && fileInfo.filePath) {
        try {
          await fs.remove(fileInfo.filePath);
        } catch (fsError) {
          console.warn('File system cleanup failed:', fsError.message);
        }
      }

      // Remove from memory
      uploadedFiles.delete(fileId);

      console.log(`🗑️ File deleted: ${fileInfo.originalName}`);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to delete file'
      });
    }
  }

  // Validate uploaded app
  async validateApp(req, res) {
    try {
      const { fileId } = req.body;
      const fileInfo = uploadedFiles.get(fileId);
      
      if (!fileInfo) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      // Mock validation logic
      const validationResult = {
        isValid: true,
        platform: fileInfo.platform,
        appName: fileInfo.appName,
        version: fileInfo.version,
        size: fileInfo.size,
        checksum: 'mock-checksum-12345',
        validationDate: new Date().toISOString(),
        warnings: [],
        errors: []
      };

      // Simulate validation checks
      if (fileInfo.size === 0 && fileInfo.type !== 'web-url') {
        validationResult.isValid = false;
        validationResult.errors.push('File appears to be empty');
      }

      if (fileInfo.size > 50 * 1024 * 1024) { // 50MB
        validationResult.warnings.push('File size is large and may take longer to process');
      }

      // Update file status
      fileInfo.status = validationResult.isValid ? 'validated' : 'invalid';
      uploadedFiles.set(fileId, fileInfo);

      res.status(200).json({
        success: true,
        fileId,
        validation: validationResult,
        message: validationResult.isValid ? 'App validation successful' : 'App validation failed'
      });

    } catch (error) {
      console.error('App validation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to validate app'
      });
    }
  }

  // Get supported file formats
  async getSupportedFormats(req, res) {
    try {
      const formats = {
        android: {
          extensions: ['.apk'],
          maxSize: '100MB',
          description: 'Android Application Package'
        },
        ios: {
          extensions: ['.ipa'],
          maxSize: '100MB',
          description: 'iOS Application Package'
        },
        web: {
          extensions: ['url'],
          maxSize: 'N/A',
          description: 'Web Application URL'
        }
      };

      res.status(200).json({
        success: true,
        formats
      });

    } catch (error) {
      console.error('Format retrieval error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve supported formats'
      });
    }
  }
}

const uploadController = new UploadController();

// Export both the controller methods and the uploadedFiles Map
module.exports = {
  uploadApp: uploadController.uploadApp.bind(uploadController),
  uploadWebUrl: uploadController.uploadWebUrl.bind(uploadController),
  getUploadedFiles: uploadController.getUploadedFiles.bind(uploadController),
  deleteFile: uploadController.deleteFile.bind(uploadController),
  validateApp: uploadController.validateApp.bind(uploadController),
  getSupportedFormats: uploadController.getSupportedFormats.bind(uploadController),
  uploadedFiles: uploadedFiles
};
