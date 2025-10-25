import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const AdminFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    customer_feedback: 0,
    vendor_feedback: 0,
    urgent: 0,
    high: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    role: '',
    priority: ''
  });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, [filters]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const token = sessionStorage.getItem('token');

      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.priority) queryParams.append('priority', filters.priority);

      const response = await axios.get(
        `${apiBase}/api/feedback/all?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setFeedbackList(response.data.data);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const token = sessionStorage.getItem('token');

      await axios.put(
        `${apiBase}/api/feedback/${feedbackId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      fetchFeedback();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handlePriorityChange = async (feedbackId, newPriority) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const token = sessionStorage.getItem('token');

      await axios.put(
        `${apiBase}/api/feedback/${feedbackId}/status`,
        { priority: newPriority },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      fetchFeedback();
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Failed to update priority');
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      setSubmittingResponse(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const token = sessionStorage.getItem('token');

      await axios.post(
        `${apiBase}/api/feedback/${selectedFeedback.id}/respond`,
        { response: responseText.trim() },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setShowResponseModal(false);
      setResponseText('');
      setSelectedFeedback(null);
      fetchFeedback();
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      bug: 'Bug Report',
      feature_request: 'Feature Request',
      question: 'Question',
      complaint: 'Complaint',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || styles.pending;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return styles[priority] || styles.medium;
  };

  return (
    <main className="max-w-7xl mx-auto py-3 sm:py-6 px-2 sm:px-4 lg:px-6 xl:px-8 mt-6 sm:mt-8 lg:mt-16">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Feedback Management</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage customer and vendor support requests</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-2 sm:p-3">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3 lg:ml-5 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Feedback</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-2 sm:p-3">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3 lg:ml-5 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Pending</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.pending}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-500 rounded-md p-2 sm:p-3">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3 lg:ml-5 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Urgent</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.urgent + stats.high}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-2 sm:p-3">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3 lg:ml-5 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Resolved</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.resolved}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Filters</h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-1 sm:px-2 py-1 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-1 sm:px-2 py-1 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="bug">Bug</option>
              <option value="feature_request">Feature</option>
              <option value="question">Question</option>
              <option value="complaint">Complaint</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-1 sm:px-2 py-1 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-1 sm:px-2 py-1 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {(filters.status || filters.category || filters.role || filters.priority) && (
          <button
            onClick={() => setFilters({ status: '', category: '', role: '', priority: '' })}
            className="mt-3 sm:mt-4 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading feedback...</p>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filters).some(v => v) 
                ? 'Try adjusting your filters'
                : 'No feedback has been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {feedbackList.map((feedback) => (
              <div key={feedback.id} className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{feedback.subject}</h3>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(feedback.status)}`}>
                          {feedback.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(feedback.priority)}`}>
                          {feedback.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          feedback.user_role === 'vendor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {feedback.user_role}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">{getCategoryLabel(feedback.category)}</span> by {feedback.user_name} ({feedback.user_email})
                    </p>

                    {expandedFeedbackId === feedback.id && (
                      <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Description:</h4>
                          <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{feedback.description}</p>
                        </div>

                        {feedback.admin_response && (
                          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                            <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-2">
                              Response from {feedback.admin_name}:
                            </h4>
                            <p className="text-xs sm:text-sm text-blue-800 whitespace-pre-wrap">{feedback.admin_response}</p>
                            <p className="text-xs text-blue-600 mt-2">
                              {new Date(feedback.responded_at).toLocaleString()}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                            <select
                              value={feedback.status}
                              onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                              className="w-full text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>

                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                            <select
                              value={feedback.priority}
                              onChange={(e) => handlePriorityChange(feedback.id, e.target.value)}
                              className="w-full text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>

                          {!feedback.admin_response && (
                            <div className="flex-1 sm:flex-none">
                              <label className="block text-xs font-medium text-gray-700 mb-1 sm:hidden">Action</label>
                              <button
                                onClick={() => {
                                  setSelectedFeedback(feedback);
                                  setShowResponseModal(true);
                                }}
                                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Respond
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2">
                      <button
                        onClick={() => setExpandedFeedbackId(expandedFeedbackId === feedback.id ? null : feedback.id)}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        {expandedFeedbackId === feedback.id ? '▼ Show less' : '▶ Show more'}
                      </button>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(feedback.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Respond to Feedback</h2>
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponseText('');
                    setSelectedFeedback(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  disabled={submittingResponse}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{selectedFeedback.subject}</h3>
                <p className="text-xs sm:text-sm text-gray-700">{selectedFeedback.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  From: {selectedFeedback.user_name} ({selectedFeedback.user_email})
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Your Response</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  placeholder="Type your response here..."
                  disabled={submittingResponse}
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponseText('');
                    setSelectedFeedback(null);
                  }}
                  disabled={submittingResponse}
                  className="flex-1 px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submittingResponse || !responseText.trim()}
                  className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
                >
                  {submittingResponse ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Response'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminFeedback;
