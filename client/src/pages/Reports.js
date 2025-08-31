import React, { useState, useEffect } from 'react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/list');
      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports);
      } else {
        console.error('Failed to fetch reports:', data.message);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewReport = (report) => {
    setSelectedReport(report);
    setShowDetails(true);
  };

  const openReportInNewTab = (reportId) => {
    // Open the HTML report in a new tab using the backend server URL
    window.open(`http://localhost:5000/reports/${reportId}.html`, '_blank');
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        fetchReports(); // Refresh the list
      } else {
        console.error('Failed to delete report:', data.message);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    if (status === 'PASS') {
      return <span className="text-green-500">✅</span>;
    } else if (status === 'FAIL') {
      return <span className="text-red-500">❌</span>;
    }
    return <span className="text-yellow-500">⏳</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Test Reports</h1>
        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No reports found</div>
          <div className="text-gray-400">Run some tests to generate reports</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(report.status)}
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Test Execution {report.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(report.timestamp)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    report.status === 'PASS' 
                      ? 'bg-green-100 text-green-800' 
                      : report.status === 'FAIL'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDuration(report.duration)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center space-x-2">
                <button
                  onClick={() => openReportInNewTab(report.id)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  View Report
                </button>
                <button
                  onClick={() => viewReport(report)}
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                >
                  Details
                </button>
                <button
                  onClick={() => deleteReport(report.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Details Modal */}
      {showDetails && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Report Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Test Information</h3>
                <p><strong>ID:</strong> {selectedReport.id}</p>
                <p><strong>Status:</strong> {selectedReport.status}</p>
                <p><strong>Duration:</strong> {formatDuration(selectedReport.duration)}</p>
                <p><strong>Timestamp:</strong> {formatDate(selectedReport.timestamp)}</p>
              </div>

              {selectedReport.steps && selectedReport.steps.length > 0 && (
                <div>
                  <h3 className="font-semibold">Test Steps</h3>
                  <div className="space-y-2">
                    {selectedReport.steps.map((step, index) => (
                      <div key={index} className="border-l-4 border-gray-200 pl-3">
                        <p className="font-medium">{step.name}</p>
                        <p className="text-sm text-gray-500">
                          Status: {step.status} | Duration: {formatDuration(step.duration)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.screenshots && selectedReport.screenshots.length > 0 && (
                <div>
                  <h3 className="font-semibold">Screenshots ({selectedReport.screenshots.length})</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReport.screenshots.map((screenshot, index) => (
                      <div key={index} className="text-center">
                        <img
                          src={`http://localhost:5000/reports/screenshots/${screenshot.path.split('/').pop()}`}
                          alt={screenshot.name}
                          className="w-full h-32 object-cover rounded border"
                        />
                        <p className="text-xs text-gray-500 mt-1">{screenshot.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => openReportInNewTab(selectedReport.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Open Full Report
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
