import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavWithLogo } from "../../components/shared/nav";
import axios from 'axios';

export const MyFeedback = () => {
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Convert UTC to Philippine Time
  const toPhilippineTime = (utcDate) => {
    const date = new Date(utcDate);
    // Add 8 hours for Philippine Time (UTC+8)
    date.setHours(date.getHours() + 8);
    return date;
  };

  useEffect(() => {
    fetchMyFeedback();
  }, []);

  const fetchMyFeedback = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const token = sessionStorage.getItem('token');

      const response = await axios.get(
        `${apiBase}/api/feedback/my-feedback`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setFeedbackList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
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

  const getStatusLabel = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
    <>
      <NavWithLogo />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 mb-6 relative overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm flex-shrink-0">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  
                  {/* Title and Description */}
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">My Feedback</h1>
                    <p className="text-blue-100 text-sm sm:text-base">Track your feedback submissions and admin responses</p>
                    {!loading && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-white font-semibold">{feedbackList.length} {feedbackList.length === 1 ? 'Feedback' : 'Feedbacks'}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Back Button */}
                <button
                  onClick={() => navigate(-1)}
                  className="self-start sm:self-center bg-white text-blue-600 px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
              </div>
            </div>
          </div>

          {/* Feedback List */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4 font-medium">Loading your feedback...</p>
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Feedback Yet</h3>
              <p className="text-gray-600 mb-6">You haven't submitted any feedback. Share your thoughts with us!</p>
              <button
                onClick={() => navigate(-1)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {feedbackList.map((feedback) => (
                <div key={feedback.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 border-blue-600 relative group">
                  {/* Top gradient accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
                  
                  <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon indicator */}
                        <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex-shrink-0 mt-1">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                            {feedback.subject}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm ${getStatusBadge(feedback.status)}`}>
                              {getStatusLabel(feedback.status)}
                            </span>
                            <span className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm ${getPriorityBadge(feedback.priority)}`}>
                              {feedback.priority.charAt(0).toUpperCase() + feedback.priority.slice(1)} Priority
                            </span>
                            <span className="px-4 py-2 text-xs font-bold rounded-lg shadow-sm bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-300">
                              {getCategoryLabel(feedback.category)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Date badge */}
                      <div className="text-right ml-4 flex-shrink-0 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-bold text-gray-700">
                            {toPhilippineTime(feedback.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          {toPhilippineTime(feedback.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {expandedId === feedback.id && (
                      <div className="mt-6 space-y-5 pt-5 border-t-2 border-gray-100">
                        {/* Your Message */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-l-4 border-gray-400 shadow-sm">
                          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            Your Message
                          </h4>
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">{feedback.description}</p>
                        </div>

                        {/* Admin Response */}
                        {feedback.admin_response ? (
                          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 border-l-4 border-blue-600 rounded-xl p-6 shadow-md relative overflow-hidden">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                            
                            <div className="relative z-10">
                              <div className="mb-4">
                                <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 uppercase tracking-wide">
                                  <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  Admin Response {feedback.admin_name && `from ${feedback.admin_name}`}
                                </h4>
                              </div>
                              <p className="text-blue-900 whitespace-pre-wrap mb-4 leading-relaxed font-medium text-base bg-white bg-opacity-50 p-4 rounded-lg">{feedback.admin_response}</p>
                              {feedback.responded_at && (
                                <div className="flex items-center gap-2 bg-blue-200 bg-opacity-50 px-4 py-2 rounded-lg">
                                  <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-xs text-blue-900 font-bold">
                                    Responded on {toPhilippineTime(feedback.responded_at).toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 border-l-4 border-yellow-500 rounded-xl p-6 shadow-sm relative overflow-hidden">
                            {/* Animated waiting indicator */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 opacity-20 rounded-full -mr-12 -mt-12 animate-pulse"></div>
                            
                            <div className="relative z-10 flex items-center gap-4">
                              <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 animate-pulse text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm text-yellow-900 font-bold mb-1">
                                  {feedback.status === 'pending' 
                                    ? 'Waiting for admin review' 
                                    : 'Admin is working on your feedback'}
                                </p>
                                <p className="text-xs text-yellow-800">We'll notify you once there's an update</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Toggle Button */}
                    <button
                      onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
                      className="mt-6 w-full sm:w-auto text-sm text-white bg-blue-600 hover:bg-blue-700 font-bold px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      {expandedId === feedback.id ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Show Less
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Show Details
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyFeedback;

