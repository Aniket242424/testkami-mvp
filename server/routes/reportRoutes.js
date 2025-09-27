const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const router = express.Router();

// Serve static reports directory
router.use('/static', express.static(path.join(__dirname, '../../reports')));

// Serve screenshot files
router.get('/screenshots/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const screenshotPath = path.join(__dirname, '../../reports/screenshots', filename);
    
    if (!await fs.pathExists(screenshotPath)) {
      return res.status(404).json({ success: false, error: 'Screenshot not found' });
    }
    
    res.sendFile(screenshotPath);
  } catch (error) {
    console.error('Error serving screenshot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get list of all reports
router.get('/list', async (req, res) => {
  try {
    const reportsDir = path.join(__dirname, '../../reports');
    const files = await fs.readdir(reportsDir);
    
    const reports = [];
    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('_error')) {
        const filePath = path.join(reportsDir, file);
        const stats = await fs.stat(filePath);
        const reportData = await fs.readJson(filePath);
        
        reports.push({
          id: reportData.id,
          executionId: reportData.executionId,
          status: reportData.status,
          testCase: reportData.testData?.naturalLanguageTest || 'Unknown',
          platform: reportData.testData?.platform || 'Unknown',
          startTime: reportData.startTime,
          endTime: reportData.endTime,
          duration: reportData.duration,
          totalSteps: reportData.summary?.totalSteps || 0,
          passedSteps: reportData.summary?.passedSteps || 0,
          failedSteps: reportData.summary?.failedSteps || 0,
          screenshots: reportData.summary?.screenshots || 0,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        });
      }
    }
    
    // Sort by creation time (newest first)
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error getting reports list:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific report by ID
router.get('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const reportPath = path.join(__dirname, '../../reports', `${reportId}.json`);
    
    if (!await fs.pathExists(reportPath)) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    const report = await fs.readJson(reportPath);
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve HTML report
router.get('/:reportId.html', async (req, res) => {
  try {
    const { reportId } = req.params;
    const htmlPath = path.join(__dirname, '../../reports', `${reportId}.html`);
    
    console.log(`🔍 Serving HTML report: ${reportId}.html`);
    console.log(`🔍 File path: ${htmlPath}`);
    
    if (!await fs.pathExists(htmlPath)) {
      console.log(`❌ HTML report not found: ${htmlPath}`);
      return res.status(404).json({ success: false, error: 'HTML report not found' });
    }
    
    console.log(`✅ HTML report found, sending file...`);
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(htmlPath);
  } catch (error) {
    console.error('Error serving HTML report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete report
router.delete('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const reportPath = path.join(__dirname, '../../reports', `${reportId}.json`);
    const htmlPath = path.join(__dirname, '../../reports', `${reportId}.html`);
    
    // Delete JSON report
    if (await fs.pathExists(reportPath)) {
      await fs.remove(reportPath);
    }
    
    // Delete HTML report
    if (await fs.pathExists(htmlPath)) {
      await fs.remove(htmlPath);
    }
    
    // Delete associated screenshots
    const screenshotsDir = path.join(__dirname, '../../reports/screenshots');
    if (await fs.pathExists(screenshotsDir)) {
      const screenshotFiles = await fs.readdir(screenshotsDir);
      for (const file of screenshotFiles) {
        if (file.includes(reportId)) {
          await fs.remove(path.join(screenshotsDir, file));
        }
      }
    }
    
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
