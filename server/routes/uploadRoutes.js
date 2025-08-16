const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { upload, handleUploadError } = require('../middleware/upload');

// File upload routes
router.post('/app', upload.single('appBinary'), handleUploadError, uploadController.uploadApp);
router.post('/web-url', uploadController.uploadWebUrl);
router.get('/files', uploadController.getUploadedFiles);
router.delete('/files/:fileId', uploadController.deleteFile);

// App validation routes
router.post('/validate', uploadController.validateApp);
router.get('/supported-formats', uploadController.getSupportedFormats);

module.exports = router;
