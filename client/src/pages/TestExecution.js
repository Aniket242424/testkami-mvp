import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Play, 
  Smartphone, 
  Globe, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const TestExecution = () => {
  const [testCase, setTestCase] = useState('');
  const [platform, setPlatform] = useState('android');
  const [appPath, setAppPath] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [testTemplates] = useState([
    {
      id: 'login-test',
      name: 'Login Test',
      template: 'Login with valid credentials and verify dashboard loads',
      description: 'Test user login functionality with valid credentials',
      platform: 'android'
    },
    {
      id: 'web-login-test',
      name: 'Web Login Test',
      template: 'Login with valid credentials and verify dashboard loads',
      description: 'Test web application login functionality',
      platform: 'web'
    },
    {
      id: 'navigation-test',
      name: 'Navigation Test',
      template: 'Navigate through the main menu and verify all pages load correctly',
      description: 'Test app navigation and menu functionality',
      platform: 'android'
    },
    {
      id: 'form-test',
      name: 'Form Test',
      template: 'Fill out the registration form and verify successful submission',
      description: 'Test form submission and validation',
      platform: 'web'
    },
    {
      id: 'ios-login-test',
      name: 'iOS Login Test',
      template: 'Login with valid credentials and verify dashboard loads',
      description: 'Test iOS app login functionality',
      platform: 'ios'
    },
    {
      id: 'search-test',
      name: 'Search Test',
      template: 'Search for a product and verify search results are displayed',
      description: 'Test search functionality',
      platform: 'web'
    },
    {
      id: 'alphanso-app-template',
      name: 'Alphanso App Template',
      template: 'Click on Next Button\nClick on Language Formation\nVerify Lang-Form Exercise 1:Sentence Formation displayed\nClick on Lang-Form Exercise 1:Sentence Formation\nVerify Nouns and Verb visible\nClick on Nouns on Verbs',
      description: 'Test Alphanso app language formation exercise with sentence formation and noun/verb interaction',
      platform: 'android'
    },
    {
      id: 'api-demos-template',
      name: 'API Demos Template',
      template: 'Click on Views\nClick on TextFields\nEnter Text - "Aniket Appium"\nVerify "Aniket Appium" is displayed\nClick on Back button',
      description: 'Test API Demos app text field functionality with text entry and verification',
      platform: 'android'
    },
    {
      id: 'lexical-semantics-template',
      name: 'Lexical Semantics Template',
      template: 'Open the App\nScroll in the Intro page\nClick on Next Button\nClick on Lexical Semantics\nClick on Lex Sem Exercise 1: Visual Identification\nClick on Picture Noun Matching\nClick on the word "spoon" (Correct answer)\nClick on Next button on this page',
      description: 'Test Lexical Semantics app with visual identification and picture noun matching exercises',
      platform: 'android'
    },
    {
      id: 'form-validation-template',
      name: 'Form Validation Template',
      template: 'Click on Registration\nEnter username "testuser123"\nEnter email "test@example.com"\nEnter password "TestPass123"\nClick on Submit button\nVerify "Registration successful" message is displayed',
      description: 'Test form validation with user registration including field validation and success verification',
      platform: 'android'
    },
    {
      id: 'navigation-menu-template',
      name: 'Navigation Menu Template',
      template: 'Click on Menu button\nVerify all menu items are visible\nClick on Settings\nVerify Settings page loads\nClick on Back button\nClick on Profile\nVerify Profile page loads\nClick on Back button',
      description: 'Test app navigation through menu system with page verification and back navigation',
      platform: 'android'
    },
    {
      id: 'search-functionality-template',
      name: 'Search Functionality Template',
      template: 'Click on Search icon\nEnter search term "mobile app"\nClick on Search button\nVerify search results are displayed\nClick on first result\nVerify result details page loads\nClick on Back button',
      description: 'Test search functionality with search term entry, results display, and navigation to details',
      platform: 'android'
    }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

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
    setSelectedTemplate(template.id);
    setTestCase(template.template);
    setPlatform(template.platform);
  };

  const validateForm = () => {
    if (!testCase.trim()) {
      toast.error('Please enter a test case');
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

  const executeTest = async () => {
    if (!validateForm()) return;

    try {
      setIsExecuting(true);
      
      // Step 1: Initializing
      setExecutionStatus({
        status: 'initializing',
        message: '🤖 Generating test script from natural language...',
        progress: 10
      });

      const testData = {
        naturalLanguageTest: testCase.trim(),
        platform: platform,
        appPath: platform === 'web' ? webUrl : appPath
      };

      // Step 2: Starting emulator
      setTimeout(() => {
        setExecutionStatus(prev => ({
          ...prev,
          message: '📱 Starting emulator and launching app...',
          progress: 30
        }));
      }, 2000);

      // Step 3: Executing test
      setTimeout(() => {
        setExecutionStatus(prev => ({
          ...prev,
          message: '🧪 Executing test script on emulator...',
          progress: 60
        }));
      }, 5000);

      // Step 4: Generating report
      setTimeout(() => {
        setExecutionStatus(prev => ({
          ...prev,
          message: '📊 Generating comprehensive report...',
          progress: 80
        }));
      }, 8000);

      const response = await axios.post('/api/tests/execute', testData);
      
      if (response.data.success) {
        setExecutionStatus({
          status: 'completed',
          message: '✅ Test execution completed successfully!',
          progress: 100,
          executionId: response.data.executionId,
          report: response.data.report,
          summary: response.data.summary,
          htmlReportUrl: response.data.htmlReportUrl
        });
        toast.success('Test executed successfully! Check the Reports page for detailed results.');
        
        // Redirect to reports page after 2 seconds
        setTimeout(() => {
          window.location.href = '/reports';
        }, 2000);
      } else {
        throw new Error(response.data.error || 'Test execution failed');
      }

    } catch (error) {
      console.error('Test execution error:', error);
      setExecutionStatus({
        status: 'failed',
        message: `❌ ${error.response?.data?.error || error.message}`,
        progress: 0
      });
      toast.error('Test execution failed');
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
              <div>
                <label htmlFor="testCase" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your test case in natural language
                </label>
                <textarea
                  id="testCase"
                  rows={4}
                  className="input"
                  placeholder="e.g., Login with valid credentials and verify dashboard loads"
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

          {/* App Upload/URL */}
          {platform === 'web' ? (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Web Application URL</h3>
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
                <h3 className="text-lg font-medium text-gray-900">App Binary</h3>
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

          {/* Execute Button */}
          <div className="flex justify-end">
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
                          onClick={() => window.open(executionStatus.htmlReportUrl, '_blank')}
                          className="w-full p-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 hover:bg-primary-100 transition-colors"
                        >
                          📊 View Detailed Report
                        </button>
                      )}
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
