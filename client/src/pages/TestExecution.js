import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Play, 
  Smartphone, 
  Globe, 
  FileText, 
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const TestExecution = () => {
  const [testCaseName, setTestCaseName] = useState('');
  const [testCase, setTestCase] = useState('');
  const [platform, setPlatform] = useState('android');
  const [appPath, setAppPath] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [useCloudDevices, setUseCloudDevices] = useState(false);
  const [localEmulatorAvailable, setLocalEmulatorAvailable] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [currentExecutionId, setCurrentExecutionId] = useState(null);
  const [email, setEmail] = useState('');
      const [testTemplates] = useState([
        {
          id: 'alphanso-app-template',
          name: 'Alphanso App Template',
          template: 'Click on Next Button\nClick on Language Formation\nVerify Lang-Form Exercise 1:Sentence Formation displayed\nClick on Lang-Form Exercise 1:Sentence Formation\nVerify Nouns and Verb visible\nClick on Nouns on Verbs',
          description: 'Test Alphanso app language formation exercise with sentence formation and noun/verb interaction',
          platform: 'android'
        },
        {
          id: 'lexical-semantics-template',
          name: 'Lexical Semantics Template',
          template: 'Open the App\nScroll in the Intro page\nClick on Next Button\nClick on Lexical Semantics\nClick on Lex Sem Exercise 1: Visual Identification\nClick on Picture Word Matching\nClick on the word "चम्मच" (Correct answer)\nClick on Next button on this page',
          description: 'Test Lexical Semantics app with visual identification and picture word matching exercises using Hindi text',
          platform: 'android'
        },
        {
          id: 'api-demos-template',
          name: 'API Demos Template',
          template: 'Click on Views\nClick on TextFields\nEnter Text - "Aniket Appium"\nVerify "Aniket Appium" is displayed\nClick on Back button',
          description: 'Test API Demos app text field functionality with text entry and verification',
          platform: 'android'
        }
      ]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Check if local emulator is available
  useEffect(() => {
    const checkLocalEmulator = async () => {
      try {
        const response = await axios.get('/api/emulator/status');
        setLocalEmulatorAvailable(response.data.available);
      } catch (error) {
        console.log('Local emulator not available:', error.message);
        setLocalEmulatorAvailable(false);
      }
    };
    
    checkLocalEmulator();
  }, []);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('appBinary', file);
      formData.append('platform', platform);
      formData.append('appName', file.name.replace(/\.[^/.]+$/, ''));

      const response = await axios.post('/api/upload/app', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedFile(response.data.file);
      setAppPath(response.data.fileId);
      toast.success('App uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.android.package-archive': ['.apk'],
      'application/octet-stream': ['.ipa'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const handleTemplateSelect = (template) => {
    console.log('🔍 Template selected:', template);
    setSelectedTemplate(template.id);
    setTestCase(template.template);
    setTestCaseName(template.name);
    setPlatform(template.platform);
    console.log('🔍 Template name set to:', template.name);
  };

  const validateForm = () => {
    if (!testCaseName.trim()) {
      toast.error('Please enter a test case name');
      return false;
    }

    if (!testCase.trim()) {
      toast.error('Please enter a test case description');
      return false;
    }

    if (platform === 'web') {
      if (!webUrl.trim()) {
        toast.error('Please enter a web URL');
        return false;
      }
    } else {
      if (!appPath && !uploadedFile) {
        toast.error('Please upload an app file or provide app path');
        return false;
      }
    }

    return true;
  };

  const stopExecution = async () => {
    if (!currentExecutionId) return;
    
    try {
      await axios.post('/api/tests/stop', { executionId: currentExecutionId });
      toast.success('Test execution stopped successfully');
      
      // Reset states
      setIsExecuting(false);
      setExecutionStatus(null);
      setCurrentExecutionId(null);
      
    } catch (error) {
      console.error('Error stopping test execution:', error);
      toast.error('Failed to stop test execution');
      
      // Reset states anyway
      setIsExecuting(false);
      setExecutionStatus(null);
      setCurrentExecutionId(null);
    }
  };

  const executeTest = async () => {
    if (!validateForm()) return;

    try {
      setIsExecuting(true);
      setCurrentExecutionId(null); // Reset previous execution ID
      
      // Step 1: Initializing
      setExecutionStatus({
        status: 'initializing',
        message: '🤖 Generating test script from natural language...',
        progress: 5
      });

      const testData = {
        testCaseName: testCaseName.trim() || 'Unnamed Test Case',
        naturalLanguageTest: testCase.trim(),
        platform: platform,
        appPath: platform === 'web' ? webUrl : appPath,
        useCloudDevices: useCloudDevices,
        email: email.trim() || null
      };
      

      // Step 2: Sending request (quick)
      setTimeout(() => {
        setExecutionStatus(prev => ({
          ...prev,
          message: '📤 Sending request to server...',
          progress: 10
        }));
      }, 500);

      // Step 3: Starting emulator (takes time)
      setTimeout(() => {
        setExecutionStatus(prev => ({
          ...prev,
          message: '📱 Starting emulator and launching app...',
          progress: 20
        }));
      }, 2000);

      // Step 4: Test execution starts (main phase)
      setTimeout(() => {
        setExecutionStatus(prev => ({
          ...prev,
          status: 'running',
          message: '🧪 Test execution in progress...',
          progress: 30
        }));
      }, 4000);

      const response = await axios.post('/api/tests/execute', testData);
      
      if (response.data.success) {
        // Test completed - show report generation
        setExecutionStatus(prev => ({
          ...prev,
          message: '📊 Generating comprehensive report...',
          progress: 95
        }));
        
        // Then show completion after a brief moment
        setTimeout(() => {
          setExecutionStatus({
            status: 'completed',
            message: '✅ Test execution completed successfully!',
            progress: 100,
            executionId: response.data.executionId,
            report: response.data.report,
            summary: response.data.summary,
            htmlReportUrl: response.data.htmlReportUrl
          });
          setCurrentExecutionId(response.data.executionId);
        }, 1500);
        toast.success('Test executed successfully! Check the Reports page for detailed results.');
        
        // Redirect to specific report after 2 seconds
        setTimeout(() => {
          if (response.data.htmlReportUrl) {
            // Open the specific report directly instead of going to reports list
            // Use full backend URL since reports are served by backend on port 5000
            const fullReportUrl = `http://localhost:5000${response.data.htmlReportUrl}`;
            window.location.href = fullReportUrl;
          } else {
            window.location.href = '/reports';
          }
        }, 2000);
      } else {
        // First show report generation for failed tests too
        setExecutionStatus(prev => ({
          ...prev,
          message: '📊 Generating failure report...',
          progress: 95
        }));
        
        // Then show failure after a brief moment
        setTimeout(() => {
          setExecutionStatus({
            status: 'failed',
            message: `❌ Test failed: ${response.data.error}`,
            progress: 100,
            executionId: response.data.executionId,
            report: response.data.report,
            htmlReportUrl: response.data.htmlReportUrl,
            failureDetails: response.data.failureDetails
          });
          setCurrentExecutionId(response.data.executionId);
        }, 1500);
        
        // Show failure details in toast
        const failureMsg = response.data.failureDetails 
          ? `Test failed at: ${response.data.failureDetails.failedStep} - ${response.data.failureDetails.failureReason}`
          : response.data.error;
        
        toast.error(failureMsg, { duration: 8000 });
        
        // Redirect to specific failure report even for failures to show failure details
        setTimeout(() => {
          if (response.data.htmlReportUrl) {
            // Open the specific failure report directly instead of going to reports list
            // Use full backend URL since reports are served by backend on port 5000
            const fullReportUrl = `http://localhost:5000${response.data.htmlReportUrl}`;
            window.location.href = fullReportUrl;
          } else {
            window.location.href = '/reports';
          }
        }, 3000);
      }

    } catch (error) {
      console.error('Test execution error:', error);
      setExecutionStatus({
        status: 'failed',
        message: `❌ ${error.response?.data?.error || error.message}`,
        progress: 0
      });
      
      // Show detailed error message
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(`Test execution failed: ${errorMsg}`, { duration: 8000 });
      
      // Still redirect to reports page to show any available information
      setTimeout(() => {
        window.location.href = '/reports';
      }, 3000);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-success-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-error-500" />;
      case 'running':
        return <Loader className="h-6 w-6 text-primary-500 animate-spin" />;
      default:
        return <Clock className="h-6 w-6 text-warning-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success-50 border-success-200';
      case 'failed':
        return 'bg-error-50 border-error-200';
      case 'running':
        return 'bg-primary-50 border-primary-200';
      default:
        return 'bg-warning-50 border-warning-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Execute Test</h1>
        <p className="mt-1 text-sm text-gray-500">
          Convert natural language test cases into automated test scripts
        </p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Required Fields:</span> Fields marked with <span className="text-red-500">*</span> are mandatory
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Templates */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Test Templates</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {testTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{template.name}</p>
                        <p className="text-xs text-gray-500">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Case Input */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Test Case</h3>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label htmlFor="testCaseName" className="block text-sm font-medium text-gray-700 mb-2">
                  Test Case Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="testCaseName"
                  value={testCaseName}
                  onChange={(e) => setTestCaseName(e.target.value)}
                  placeholder="Enter a name for this test case (required)"
                  className={`input ${!testCaseName.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give your test case a descriptive name
                </p>
              </div>
              <div>
                <label htmlFor="testCase" className="block text-sm font-medium text-gray-700 mb-2">
                  Test Case Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="testCase"
                  rows={4}
                  className="input"
                  placeholder="e.g., Login with valid credentials and verify dashboard loads (required)"
                  value={testCase}
                  onChange={(e) => setTestCase(e.target.value)}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Be specific about the actions, expected results, and any special conditions.
                </p>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Platform</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setPlatform('android')}
                  className={`p-4 rounded-lg border transition-colors ${
                    platform === 'android'
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Smartphone className="h-5 w-5 text-green-500 mr-2" />
                    <span className="font-medium">Android</span>
                  </div>
                </button>
                <button
                  onClick={() => setPlatform('ios')}
                  className={`p-4 rounded-lg border transition-colors ${
                    platform === 'ios'
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Smartphone className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="font-medium">iOS</span>
                  </div>
                </button>
                <button
                  onClick={() => setPlatform('web')}
                  className={`p-4 rounded-lg border transition-colors ${
                    platform === 'web'
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="font-medium">Web</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Device Selection */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Device Selection</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setUseCloudDevices(false)}
                  disabled={!localEmulatorAvailable}
                  className={`p-4 rounded-lg border transition-colors ${
                    !useCloudDevices
                      ? 'border-primary-300 bg-primary-50'
                      : localEmulatorAvailable
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center">
                    <Smartphone className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <span className="font-medium block">Local Emulator</span>
                      <span className="text-xs text-gray-500">
                        Your local Android emulator
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setUseCloudDevices(true)}
                  className={`p-4 rounded-lg border transition-colors ${
                    useCloudDevices
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <span className="font-medium block">Cloud Devices</span>
                      <span className="text-xs text-gray-500">BrowserStack cloud devices</span>
                    </div>
                  </div>
                </button>
              </div>
              {useCloudDevices && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Cloud Testing:</strong> Uses BrowserStack cloud devices. No local setup required. 
                    Free tier includes 100 minutes/month.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Email Report (Optional) */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Email Report (Optional)</h3>
            </div>
            <div className="card-body">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="input"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your email to receive a detailed test report. Leave empty to skip email reports.
                </p>
              </div>
            </div>
          </div>

          {/* App Upload/URL */}
          {platform === 'web' ? (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Web Application URL <span className="text-red-500">*</span></h3>
              </div>
              <div className="card-body">
                <div>
                  <label htmlFor="webUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Web Application URL
                  </label>
                  <input
                    type="url"
                    id="webUrl"
                    className="input"
                    placeholder="https://example.com"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">App Binary <span className="text-red-500">*</span></h3>
              </div>
              <div className="card-body">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900">
                      {isDragActive ? 'Drop the file here' : 'Upload app binary'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {platform === 'android' ? 'APK files only' : 'IPA files only'} • Max 100MB
                    </p>
                  </div>
                </div>
                {uploadedFile && (
                  <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                      <span className="text-sm text-success-700">
                        {uploadedFile.originalName} uploaded successfully
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Execute/Stop Buttons */}
          <div className="flex justify-end gap-3">
            {isExecuting && (
              <button
                onClick={stopExecution}
                className="btn-secondary px-6 py-3 text-base font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Stop Execution
              </button>
            )}
            <button
              onClick={executeTest}
              disabled={isExecuting}
              className="btn-primary px-8 py-3 text-base font-medium"
            >
              {isExecuting ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Execute Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* Execution Status */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Execution Status</h3>
            </div>
            <div className="card-body">
              {executionStatus ? (
                <div className={`p-4 rounded-lg border ${getStatusColor(executionStatus.status)}`}>
                  <div className="flex items-center mb-3">
                    {getStatusIcon(executionStatus.status)}
                    <span className="ml-2 font-medium text-gray-900 capitalize">
                      {executionStatus.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{executionStatus.message}</p>
                  
                  {executionStatus.progress > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{executionStatus.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${executionStatus.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {executionStatus.status === 'completed' && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                        <p className="text-sm text-success-700">
                          Execution ID: <span className="font-mono">{executionStatus.executionId}</span>
                        </p>
                      </div>
                      
                      {executionStatus.summary && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-blue-50 rounded">
                            <p className="font-medium text-blue-700">Steps</p>
                            <p className="text-blue-600">{executionStatus.summary.steps}</p>
                          </div>
                          <div className="p-2 bg-green-50 rounded">
                            <p className="font-medium text-green-700">Screenshots</p>
                            <p className="text-green-600">{executionStatus.summary.screenshots}</p>
                          </div>
                        </div>
                      )}
                      
                      {executionStatus.htmlReportUrl && (
                        <button
                          onClick={() => window.open(`http://localhost:5000${executionStatus.htmlReportUrl}`, '_blank')}
                          className="w-full p-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 hover:bg-primary-100 transition-colors"
                        >
                          📊 View Detailed Report
                        </button>
                      )}
                    </div>
                  )}

                  {executionStatus.status === 'failed' && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                        <p className="text-sm text-error-700">
                          Execution ID: <span className="font-mono">{executionStatus.executionId}</span>
                        </p>
                      </div>
                      
                      {executionStatus.failureDetails && (
                        <div className="space-y-2">
                          <div className="p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-xs font-medium text-red-700">Failed Step:</p>
                            <p className="text-xs text-red-600 font-mono">{executionStatus.failureDetails.failedStep}</p>
                          </div>
                          <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                            <p className="text-xs font-medium text-orange-700">Failure Reason:</p>
                            <p className="text-xs text-orange-600">{executionStatus.failureDetails.failureReason}</p>
                          </div>
                          {executionStatus.report?.failedStepInfo && (
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs font-medium text-blue-700">Step Details:</p>
                              <p className="text-xs text-blue-600">Number: {executionStatus.report.failedStepInfo.stepNumber}</p>
                              <p className="text-xs text-blue-600">Type: {executionStatus.report.failedStepInfo.stepType}</p>
                              <p className="text-xs text-blue-600">Locator: {executionStatus.report.failedStepInfo.stepLocator}</p>
                            </div>
                          )}
                          {executionStatus.failureDetails.screenshots && executionStatus.failureDetails.screenshots.length > 0 && (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-xs font-medium text-yellow-700">Screenshots:</p>
                              <p className="text-xs text-yellow-600">{executionStatus.failureDetails.screenshots.length} captured</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {executionStatus.htmlReportUrl && (
                        <button
                          onClick={() => window.open(`http://localhost:5000${executionStatus.htmlReportUrl}`, '_blank')}
                          className="w-full p-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 hover:bg-primary-100 transition-colors"
                        >
                          📊 View Failure Report
                        </button>
                      )}
                      
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Redirecting to Reports page...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-sm">Ready to execute test</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestExecution;
