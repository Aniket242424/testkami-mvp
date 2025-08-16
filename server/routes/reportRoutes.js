const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Report generation and retrieval
router.get('/:testId', reportController.getReport);
router.post('/generate/:testId', reportController.generateReport);
router.get('/download/:testId', reportController.downloadReport);

// Email notifications
router.post('/send-email/:testId', reportController.sendEmailReport);
router.post('/send-email-batch', reportController.sendBatchEmailReports);

// Report management
router.get('/list', reportController.listReports);
router.delete('/:testId', reportController.deleteReport);
router.put('/:testId/archive', reportController.archiveReport);

module.exports = router;
