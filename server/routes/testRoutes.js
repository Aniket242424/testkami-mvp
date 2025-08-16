const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { validateTestRequest } = require('../middleware/validation');

// Test execution routes
router.post('/execute', validateTestRequest, testController.executeTest);
router.post('/generate-script', validateTestRequest, testController.generateTestScript);
router.get('/status/:testId', testController.getTestStatus);
router.get('/history', testController.getTestHistory);

// Test management routes
router.get('/templates', testController.getTestTemplates);
router.post('/templates', testController.createTestTemplate);
router.put('/templates/:id', testController.updateTestTemplate);
router.delete('/templates/:id', testController.deleteTestTemplate);

// Test results and reports
router.get('/results/:testId', testController.getTestResults);
router.get('/screenshots/:testId', testController.getTestScreenshots);
router.post('/retry/:testId', testController.retryTest);

module.exports = router;
