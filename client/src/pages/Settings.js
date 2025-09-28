import React, { useState, useEffect } from 'react';
import { 
  Key,
  Mail,
  Server,
  Globe,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const Settings = () => {
  const [settings, setSettings] = useState({
    openaiApiKey: '',
    sendgridApiKey: '',
    fromEmail: '',
    toEmail: 'amahangade24@gmail.com',
    appiumUrl: 'http://localhost:4723'
  });
  const [systemStatus, setSystemStatus] = useState({
    server: 'unknown',
    openai: 'unknown',
    sendgrid: 'unknown',
    appium: 'unknown'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check server health
      await axios.get('/health');
      setSystemStatus(prev => ({ ...prev, server: 'healthy' }));
    } catch (error) {
      setSystemStatus(prev => ({ ...prev, server: 'unhealthy' }));
    }

    // Check OpenAI (mock)
    setSystemStatus(prev => ({ ...prev, openai: 'configured' }));

    // Check SendGrid (mock)
    setSystemStatus(prev => ({ ...prev, sendgrid: 'configured' }));

    // Check Appium (mock)
    setSystemStatus(prev => ({ ...prev, appium: 'unavailable' }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'configured':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'unhealthy':
      case 'unavailable':
        return <AlertCircle className="h-5 w-5 text-error-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'unhealthy':
        return 'Unhealthy';
      case 'configured':
        return 'Configured';
      case 'unavailable':
        return 'Unavailable';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'configured':
        return 'text-success-600';
      case 'unhealthy':
      case 'unavailable':
        return 'text-error-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure system settings and integrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* API Configuration */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">API Configuration</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="openaiApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    id="openaiApiKey"
                    className="input pl-10"
                    placeholder="sk-..."
                    value={settings.openaiApiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Required for natural language to test script conversion
                </p>
              </div>

              <div>
                <label htmlFor="sendgridApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  SendGrid API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    id="sendgridApiKey"
                    className="input pl-10"
                    placeholder="SG..."
                    value={settings.sendgridApiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, sendgridApiKey: e.target.value }))}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Required for email report delivery
                </p>
              </div>
            </div>
          </div>

          {/* Email Configuration */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  From Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    id="fromEmail"
                    className="input pl-10"
                    placeholder="noreply@yourdomain.com"
                    value={settings.fromEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Must be verified with SendGrid
                </p>
              </div>

              <div>
                <label htmlFor="toEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Recipient Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    id="toEmail"
                    className="input pl-10"
                    placeholder="reports@yourdomain.com"
                    value={settings.toEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, toEmail: e.target.value }))}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Default email for test reports
                </p>
              </div>
            </div>
          </div>

          {/* Appium Configuration */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Appium Configuration</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="appiumUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Appium MCP Server URL
                </label>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    id="appiumUrl"
                    className="input pl-10"
                    placeholder="http://localhost:4723"
                    value={settings.appiumUrl}
                    onChange={(e) => setSettings(prev => ({ ...prev, appiumUrl: e.target.value }))}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  URL of your Appium MCP server
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary px-8 py-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">System Status</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Server</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(systemStatus.server)}
                    <span className={`ml-2 text-sm ${getStatusColor(systemStatus.server)}`}>
                      {getStatusText(systemStatus.server)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">OpenAI API</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(systemStatus.openai)}
                    <span className={`ml-2 text-sm ${getStatusColor(systemStatus.openai)}`}>
                      {getStatusText(systemStatus.openai)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">SendGrid</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(systemStatus.sendgrid)}
                    <span className={`ml-2 text-sm ${getStatusColor(systemStatus.sendgrid)}`}>
                      {getStatusText(systemStatus.sendgrid)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Appium MCP</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(systemStatus.appium)}
                    <span className={`ml-2 text-sm ${getStatusColor(systemStatus.appium)}`}>
                      {getStatusText(systemStatus.appium)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={checkSystemStatus}
                  className="btn-secondary w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Status
                </button>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">System Information</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Version:</span>
                  <span className="text-gray-900">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Environment:</span>
                  <span className="text-gray-900">Development</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Node.js:</span>
                  <span className="text-gray-900">v18.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">React:</span>
                  <span className="text-gray-900">v18.2.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
