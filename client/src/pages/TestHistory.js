import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Globe,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const TestHistory = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  useEffect(() => {
    fetchTestHistory();
  }, []);

  const fetchTestHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tests/history');
      setTests(response.data.history || []);
    } catch (error) {
      console.error('Failed to fetch test history:', error);
      toast.error('Failed to load test history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-error-500" />;
      case 'RUNNING':
        return <Clock className="h-5 w-5 text-warning-500 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'android':
        return <Smartphone className="h-4 w-4 text-green-500" />;
      case 'ios':
        return <Smartphone className="h-4 w-4 text-blue-500" />;
      case 'web':
        return <Globe className="h-4 w-4 text-purple-500" />;
      default:
        return <Zap className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.testCase.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.testId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || test.status === statusFilter;
    const matchesPlatform = !platformFilter || test.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return duration;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test History</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all test executions and their results
          </p>
        </div>
        <button
          onClick={fetchTestHistory}
          className="btn-secondary"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="PASS">Passed</option>
                <option value="FAIL">Failed</option>
                <option value="RUNNING">Running</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div>
              <select
                className="input"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option value="">All Platforms</option>
                <option value="android">Android</option>
                <option value="ios">iOS</option>
                <option value="web">Web</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-end">
              <span className="text-sm text-gray-500">
                {filteredTests.length} of {tests.length} tests
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Test List */}
      <div className="card">
        <div className="card-body">
          {filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
              <p className="text-gray-500">
                {tests.length === 0 ? 'No tests have been executed yet.' : 'No tests match your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Case
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Executed
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTests.map((test) => (
                    <tr key={test.testId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {getStatusIcon(test.status)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {test.testCase}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {test.testId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPlatformIcon(test.platform)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {test.platform}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge ${
                          test.status === 'PASS' ? 'status-pass' : 
                          test.status === 'FAIL' ? 'status-fail' : 'status-pending'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(test.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(test.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="text-primary-600 hover:text-primary-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            title="Download Report"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredTests.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to{' '}
            <span className="font-medium">{filteredTests.length}</span> of{' '}
            <span className="font-medium">{tests.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button className="btn-secondary px-3 py-2 text-sm">
              Previous
            </button>
            <button className="btn-secondary px-3 py-2 text-sm">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestHistory;
