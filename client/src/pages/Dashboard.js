import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  History, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Smartphone,
  Globe,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    runningTests: 0,
    successRate: 0,
    averageDuration: '0s'
  });

  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API calls
      const mockStats = {
        totalTests: 156,
        passedTests: 142,
        failedTests: 14,
        runningTests: 2,
        successRate: 91.0,
        averageDuration: '45.2s'
      };

      const mockRecentTests = [
        {
          id: 'test-001',
          testCase: 'Login with valid credentials',
          platform: 'android',
          status: 'PASS',
          duration: '32.1s',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: 'test-002',
          testCase: 'Add item to cart',
          platform: 'ios',
          status: 'PASS',
          duration: '28.5s',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          id: 'test-003',
          testCase: 'Search functionality',
          platform: 'web',
          status: 'FAIL',
          duration: '45.2s',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 'test-004',
          testCase: 'User registration',
          platform: 'android',
          status: 'PASS',
          duration: '38.7s',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        }
      ];

      setStats(mockStats);
      setRecentTests(mockRecentTests);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your test automation activities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTests}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Passed Tests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.passedTests}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-error-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-error-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Failed Tests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.failedTests}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Running Tests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.runningTests}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate and Average Duration */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Success Rate</h3>
          </div>
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-3xl font-bold text-gray-900">{stats.successRate}%</div>
                <div className="text-sm text-gray-500">Overall test success rate</div>
              </div>
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-success-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Average Duration</h3>
          </div>
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-3xl font-bold text-gray-900">{stats.averageDuration}</div>
                <div className="text-sm text-gray-500">Average test execution time</div>
              </div>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              to="/execute"
              className="group relative rounded-lg border border-gray-200 bg-white p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <Play className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    Execute Test
                  </h4>
                  <p className="text-sm text-gray-500">Run a new test case</p>
                </div>
              </div>
            </Link>

            <Link
              to="/history"
              className="group relative rounded-lg border border-gray-200 bg-white p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <History className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    View History
                  </h4>
                  <p className="text-sm text-gray-500">Check test execution history</p>
                </div>
              </div>
            </Link>

            <Link
              to="/reports"
              className="group relative rounded-lg border border-gray-200 bg-white p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                    View Reports
                  </h4>
                  <p className="text-sm text-gray-500">Access detailed test reports</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Tests */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Tests</h3>
            <Link
              to="/history"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="card-body">
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {recentTests.map((test) => (
                <li key={test.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(test.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {test.testCase}
                      </p>
                      <div className="flex items-center mt-1">
                        {getPlatformIcon(test.platform)}
                        <span className="ml-1 text-xs text-gray-500 capitalize">
                          {test.platform}
                        </span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{test.duration}</span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(test.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`status-badge ${
                        test.status === 'PASS' ? 'status-pass' : 
                        test.status === 'FAIL' ? 'status-fail' : 'status-pending'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
