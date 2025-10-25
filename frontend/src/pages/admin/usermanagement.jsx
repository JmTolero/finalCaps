import { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../../utils/imageUtils';

export const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fname: '',
    lname: '',
    username: '',
    email: '',
    contact_no: '',
    birth_date: '',
    gender: '',
    role: 'customer'
  });

  // Modal states for user management actions
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Fetch users from API*
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/admin/users`);
      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
      setError(`Failed to fetch users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, userData) => {
    setLoadingAction(true);
    setShowEditModal(false);
    setSelectedUser(null);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.put(`${apiBase}/api/admin/users/${userId}`, userData);
      
      if (response.data.success) {
        // Update local state
        setUsers(users.map(user => 
          user.user_id === userId 
            ? { ...user, ...userData }
            : user
        ));
        setLoadingAction(false);
        setSuccessMessage('User information updated successfully!');
        setShowSuccessModal(true);
        
        // Auto-hide success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        setLoadingAction(false);
        setErrorMessage('Failed to update user information');
        setShowErrorModal(true);
        
        // Auto-hide error modal after 5 seconds
        setTimeout(() => {
          setShowErrorModal(false);
          setErrorMessage('');
        }, 5000);
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setLoadingAction(false);
      setErrorMessage(err.response?.data?.error || 'Failed to update user information');
      setShowErrorModal(true);
      
      // Auto-hide error modal after 5 seconds
      setTimeout(() => {
        setShowErrorModal(false);
        setErrorMessage('');
      }, 5000);
    }
  };

  const updateUserStatus = async (userId, status) => {
    setLoadingAction(true);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.put(`${apiBase}/api/admin/users/${userId}/status`, { status });
      
      if (response.data.success) {
        // Update local state
        setUsers(users.map(user => 
          user.user_id === userId 
            ? { ...user, status: status }
            : user
        ));
        // Update selected user if it's the one being modified
        if (selectedUser && selectedUser.user_id === userId) {
          setSelectedUser({ ...selectedUser, status: status });
        }
        setLoadingAction(false);
        setSuccessMessage(`User status updated to ${status.charAt(0).toUpperCase() + status.slice(1)} successfully!`);
        setShowSuccessModal(true);
        
        // Auto-hide success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        setLoadingAction(false);
        setErrorMessage('Failed to update user status');
        setShowErrorModal(true);
        
        // Auto-hide error modal after 5 seconds
        setTimeout(() => {
          setShowErrorModal(false);
          setErrorMessage('');
        }, 5000);
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      setLoadingAction(false);
      setErrorMessage(err.response?.data?.error || 'Failed to update user status');
      setShowErrorModal(true);
      
      // Auto-hide error modal after 5 seconds
      setTimeout(() => {
        setShowErrorModal(false);
        setErrorMessage('');
      }, 5000);
    }
  };

  const handleView = async (userId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/admin/users/${userId}`);
      if (response.data.success) {
        setSelectedUser(response.data.user);
        setShowViewModal(true);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setErrorMessage('Failed to fetch user details');
      setShowErrorModal(true);
    }
  };

  const handleEdit = async (userId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/admin/users/${userId}`);
      if (response.data.success) {
        const user = response.data.user;
        setSelectedUser(user);
        // Format birth_date for HTML date input (YYYY-MM-DD format)
        let formattedBirthDate = '';
        if (user.birth_date) {
          try {
            // If birth_date is an ISO string or contains time, extract just the date
            if (user.birth_date.includes('T')) {
              formattedBirthDate = new Date(user.birth_date).toISOString().split('T')[0];
            } else {
              // If it's already in YYYY-MM-DD format, use as is
              formattedBirthDate = user.birth_date;
            }
          } catch (dateError) {
            console.error('Error formatting birth_date:', dateError);
            formattedBirthDate = '';
          }
        }
        
        setEditForm({
          fname: user.fname || '',
          lname: user.lname || '',
          username: user.username || '',
          email: user.email || '',
          contact_no: user.contact_no || '',
          birth_date: formattedBirthDate,
          gender: user.gender || '',
          role: user.role || 'customer'
        });
        setShowEditModal(true);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setErrorMessage('Failed to fetch user details');
      setShowErrorModal(true);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (selectedUser) {
      updateUser(selectedUser.user_id, editForm);
    }
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowViewModal(false);
    setShowDeleteWarningModal(false);
    setShowDeleteConfirmModal(false);
    setSelectedUser(null);
    setEditForm({
      fname: '',
      lname: '',
      username: '',
      email: '',
      contact_no: '',
      birth_date: '',
      gender: '',
      role: 'customer'
    });
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setLoadingAction(true);
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.delete(`${apiBase}/api/admin/users/${selectedUser.user_id}`);
      
      if (response.data.success) {
        setSuccessMessage(`User ${selectedUser.fname} ${selectedUser.lname} has been deleted successfully`);
        setShowSuccessModal(true);
        setShowDeleteConfirmModal(false);
        setShowViewModal(false);
        setSelectedUser(null);
        // Refresh the users list
        await fetchUsers();
        
        // Auto-hide success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        setErrorMessage('Failed to delete user');
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete user';
      setErrorMessage(`Failed to delete user: ${errorMsg}`);
      setShowErrorModal(true);
    } finally {
      setLoadingAction(false);
    }
  };

  const confirmDeleteUser = () => {
    setShowDeleteWarningModal(true);
  };

  const proceedToDeleteConfirmation = () => {
    setShowDeleteWarningModal(false);
    setShowDeleteConfirmModal(true);
  };

  const viewDocument = (documentUrl, title) => {
    if (documentUrl) {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const imageUrl = getImageUrl(documentUrl, apiBase);
      window.open(imageUrl, '_blank');
    } else {
      setErrorMessage('No document available for viewing');
      setShowErrorModal(true);
    }
  };

  const downloadDocument = (documentUrl, documentType) => {
    if (documentUrl) {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const imageUrl = getImageUrl(documentUrl, apiBase);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${documentType}_${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      setErrorMessage('No document available for download');
      setShowErrorModal(true);
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.fname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.lname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
                       (user.role && user.role.toLowerCase() === roleFilter.toLowerCase());
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'vendor':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        );
      case 'inactive':
        return (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 8z"/>
            </svg>
          </div>
        );
      case 'suspended':
        return (
          <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 7 9.5 10.5 12 7 14.5 8.5 16 12 13.5 15.5 16 17 14.5 13.5 12 17 9.5 15.5 8z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatGender = (gender) => {
    if (!gender) return 'Not provided';
    return gender.charAt(0).toUpperCase() + gender.slice(1).replace('_', ' ');
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-6 lg:py-10 min-h-screen mt-6 sm:mt-8 lg:mt-10">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 lg:mb-6">User Management</h1>
      
      {/* Search Bar and Role Filter */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm sm:text-base"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Role Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2 sm:px-3 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[100px] sm:min-w-[120px] text-sm sm:text-base"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-gray-50 rounded-lg shadow-lg overflow-hidden">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-lg text-gray-500">Loading users...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-500">{error}</div>
            <button 
              onClick={fetchUsers}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Users Table */}
        {!loading && !error && (
          <>
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <h2 className="text-lg sm:text-xl font-semibold">Users</h2>
                <span className="text-sm text-gray-600 mt-1 sm:mt-0">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                </span>
              </div>
            </div>

            {/* Desktop Table View with Scrolling */}
            <div className="hidden md:block">
              <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#FFDDAE] sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-50 divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-100 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.user_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(user.fname || '') + ' ' + (user.lname || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.username || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                            {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleView(user.user_id)}
                            className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(user.user_id)}
                            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded hover:bg-green-200 transition-colors"
                          >
                            Edit
                          </button>
                          {user.status === 'active' ? (
                            <button
                              onClick={() => updateUserStatus(user.user_id, 'suspended')}
                              className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition-colors"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserStatus(user.user_id, 'active')}
                              className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded hover:bg-green-200 transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden max-h-80 sm:max-h-96 overflow-y-auto space-y-3 sm:space-y-4 p-3 sm:p-4">
              {filteredUsers.map((user) => (
                <div key={user.user_id} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">ID: {user.user_id}</h3>
                      <p className="text-sm sm:text-base text-gray-600 truncate">{(user.fname || '') + ' ' + (user.lname || '')}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role || 'N/A'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                        {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Username:</span>
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{user.username || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">Email:</span>
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{user.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-row gap-2">
                    <button
                      onClick={() => handleView(user.user_id)}
                      className="flex-1 px-2 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(user.user_id)}
                      className="flex-1 px-2 py-2 bg-green-200 text-green-700 text-xs font-medium rounded hover:bg-green-300 transition-colors"
                    >
                      Edit
                    </button>
                    {user.status === 'active' ? (
                      <button
                        onClick={() => updateUserStatus(user.user_id, 'suspended')}
                        className="flex-1 px-2 py-2 bg-red-200 text-red-700 text-xs font-medium rounded hover:bg-red-300 transition-colors"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => updateUserStatus(user.user_id, 'active')}
                        className="flex-1 px-2 py-2 bg-green-200 text-green-700 text-xs font-medium rounded hover:bg-green-300 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found.
              </div>
            )}
          </>
        )}
      </div>

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-50 rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-[#FFDDAE] px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">User Information</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-600 hover:text-gray-800 focus:outline-none p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                
                {/* Left Section - User Information */}
                <div className="flex-1 lg:w-1/2">
                  {/* Profile Section */}
                  <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-300 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{(selectedUser.fname || '') + ' ' + (selectedUser.lname || '') || 'No name provided'}</h2>
                      <p className="text-xs sm:text-sm text-gray-600">User ID: #{selectedUser.user_id}</p>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <span className="text-gray-900 font-medium text-sm sm:text-base">Username: </span>
                      <span className="text-gray-700 text-sm sm:text-base">{selectedUser.username || 'Not set'}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-900 font-medium text-sm sm:text-base">Email Address: </span>
                      <span className="text-gray-700 text-sm sm:text-base break-words">{selectedUser.email || 'Not provided'}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-900 font-medium text-sm sm:text-base">Contact No.: </span>
                      <span className="text-gray-700 text-sm sm:text-base">{selectedUser.contact_no || 'Not provided'}</span>
                    </div>

                    <div>
                      <span className="text-gray-900 font-medium text-sm sm:text-base">Birth Date: </span>
                      <span className="text-gray-700 text-sm sm:text-base">{selectedUser.birth_date ? formatDate(selectedUser.birth_date) : 'Not provided'}</span>
                    </div>

                    <div>
                      <span className="text-gray-900 font-medium text-sm sm:text-base">Gender: </span>
                      <span className="text-gray-700 text-sm sm:text-base">{formatGender(selectedUser.gender)}</span>
                    </div>

                    {selectedUser.location && (
                      <div>
                        <span className="text-gray-900 font-medium text-sm sm:text-base">Location: </span>
                        <span className="text-gray-700 text-sm sm:text-base">{selectedUser.location}</span>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-gray-900 font-medium text-sm sm:text-base">User Role: </span>
                      <span className={`inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                        {selectedUser.role || 'N/A'}
                      </span>
                    </div>

                    {selectedUser.store_name && (
                      <div>
                        <span className="text-gray-900 font-medium text-sm sm:text-base">Store Name: </span>
                        <span className="text-gray-700 text-sm sm:text-base">{selectedUser.store_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section - Account Information */}
                <div className="flex-1 lg:w-1/2 bg-blue-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Account Information</h3>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {/* Account Status */}
                    <div className="bg-white rounded-lg p-3 sm:p-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {getStatusIcon(selectedUser.status)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base">Account Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedUser.status)}`}>
                            {(selectedUser.status || 'active').charAt(0).toUpperCase() + (selectedUser.status || 'active').slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                      <div>
                        <span className="text-gray-900 font-medium text-sm sm:text-base">Registration Date:</span>
                        <span className="text-gray-700 ml-2 text-sm sm:text-base">{formatDate(selectedUser.created_at) || 'N/A'}</span>
                      </div>
                      
                      {selectedUser.vendor_id && (
                        <div>
                          <span className="text-gray-900 font-medium text-sm sm:text-base">Vendor ID:</span>
                          <span className="text-gray-700 ml-2 text-sm sm:text-base">#{selectedUser.vendor_id}</span>
                        </div>
                      )}
                      
                      {selectedUser.vendor_status && (
                        <div>
                          <span className="text-gray-900 font-medium text-sm sm:text-base">Vendor Status:</span>
                          <span className="text-gray-700 ml-2 text-sm sm:text-base">{selectedUser.vendor_status}</span>
                        </div>
                      )}

                      {/* Vendor Documents - Only show for vendors */}
                      {selectedUser.role === 'vendor' && (selectedUser.business_permit_url || selectedUser.valid_id_url || selectedUser.proof_image_url) && (
                        <div className="mt-4 sm:mt-6">
                          <h4 className="text-sm sm:text-md font-semibold text-gray-900 mb-3 sm:mb-4">Document Verification</h4>
                          <div className="space-y-2 sm:space-y-3">
                            
                            {/* Valid ID */}
                            {selectedUser.valid_id_url && (
                              <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-xs sm:text-sm">Valid ID</p>
                                    <div className="flex flex-col sm:flex-row sm:space-x-3 mt-1 space-y-1 sm:space-y-0">
                                      <button
                                        onClick={() => viewDocument(selectedUser.valid_id_url, 'Valid ID')}
                                        className="text-xs text-green-600 hover:text-green-800 underline text-left"
                                      >
                                        👁️ View
                                      </button>
                                      <button
                                        onClick={() => downloadDocument(selectedUser.valid_id_url, 'valid_id')}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline text-left"
                                      >
                                        📥 Download
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Business Permit */}
                            {selectedUser.business_permit_url && (
                              <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-xs sm:text-sm">Business Permit</p>
                                    <div className="flex flex-col sm:flex-row sm:space-x-3 mt-1 space-y-1 sm:space-y-0">
                                      <button
                                        onClick={() => viewDocument(selectedUser.business_permit_url, 'Business Permit')}
                                        className="text-xs text-green-600 hover:text-green-800 underline text-left"
                                      >
                                        👁️ View
                                      </button>
                                      <button
                                        onClick={() => downloadDocument(selectedUser.business_permit_url, 'business_permit')}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline text-left"
                                      >
                                        📥 Download
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Ice Cream Making Proof */}
                            {selectedUser.proof_image_url && (
                              <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-xs sm:text-sm">Ice Cream Making Proof</p>
                                    <div className="flex flex-col sm:flex-row sm:space-x-3 mt-1 space-y-1 sm:space-y-0">
                                      <button
                                        onClick={() => viewDocument(selectedUser.proof_image_url, 'Ice Cream Making Proof')}
                                        className="text-xs text-green-600 hover:text-green-800 underline text-left"
                                      >
                                        👁️ View
                                      </button>
                                      <button
                                        onClick={() => downloadDocument(selectedUser.proof_image_url, 'ice_cream_proof')}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline text-left"
                                      >
                                        📥 Download
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                {/* First Row: Status Control Buttons */}
                <div className="flex flex-row gap-2 sm:gap-3">
                  {selectedUser.status === 'active' ? (
                    <button
                      onClick={() => updateUserStatus(selectedUser.user_id, 'suspended')}
                      className="flex-1 px-2 sm:px-3 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => updateUserStatus(selectedUser.user_id, 'active')}
                      className="flex-1 px-2 sm:px-3 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors text-xs sm:text-sm"
                    >
                      Activate
                    </button>
                  )}
                  {selectedUser.status !== 'inactive' && (
                    <button
                      onClick={() => updateUserStatus(selectedUser.user_id, 'inactive')}
                      className="flex-1 px-2 sm:px-3 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors text-xs sm:text-sm"
                    >
                      Deactivate
                    </button>
                  )}
                  <button
                    onClick={confirmDeleteUser}
                    className="flex-1 px-2 sm:px-3 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
                  >
                    Delete
                  </button>
                </div>
                
                {/* Second Row: Main Action Buttons */}
                <div className="flex flex-row gap-2 sm:gap-3">
                  <button
                    onClick={closeModals}
                    className="flex-1 px-2 sm:px-3 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors text-xs sm:text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEdit(selectedUser.user_id);
                    }}
                    className="flex-1 px-2 sm:px-3 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-50 rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-[#FFDDAE] px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Edit User Information</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-600 hover:text-gray-800 focus:outline-none p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                
                {/* Left Section - Edit Form */}
                <div className="flex-1 lg:w-1/2">
                  {/* Profile Section */}
                  <div className="flex items-start space-x-3 sm:space-x-4 mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Name</h2>
                      <p className="text-gray-700 text-sm sm:text-base truncate">{editForm.fname + ' ' + editForm.lname || 'Edit user details'}</p>
                    </div>
                  </div>

                  <form onSubmit={handleEditSubmit} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">First Name:</label>
                        <input
                          type="text"
                          placeholder="First name"
                          value={editForm.fname}
                          onChange={(e) => setEditForm({...editForm, fname: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm sm:text-base"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Last Name:</label>
                        <input
                          type="text"
                          placeholder="Last name"
                          value={editForm.lname}
                          onChange={(e) => setEditForm({...editForm, lname: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Email Address:</label>
                      <input
                        type="email"
                        placeholder="user@email.com"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm sm:text-base"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Contact No.:</label>
                      <input
                        type="text"
                        placeholder="09123456789"
                        value={editForm.contact_no}
                        onChange={(e) => setEditForm({...editForm, contact_no: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm sm:text-base"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Birth Date:</label>
                        <input
                          type="date"
                          value={editForm.birth_date}
                          onChange={(e) => setEditForm({...editForm, birth_date: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Gender:</label>
                        <select
                          value={editForm.gender}
                          onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm sm:text-base"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Username:</label>
                      <input
                        type="text"
                        placeholder="username"
                        value={editForm.username}
                        onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">User Role:</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm sm:text-base"
                        required
                      >
                        <option value="customer">Customer</option>
                        <option value="vendor">Vendor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="flex flex-row gap-2 sm:gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModals}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-500 text-white font-medium rounded-lg sm:rounded-xl hover:bg-gray-600 transition-colors text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loadingAction}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-blue-500 text-white font-medium rounded-lg sm:rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        {loadingAction ? 'Updating...' : 'Update User'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Section - Account Status */}
                <div className="flex-1 lg:w-1/2 bg-blue-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Account Information</h3>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {/* Current Status */}
                    <div className="bg-white rounded-lg p-3 sm:p-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {getStatusIcon(selectedUser.status)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedUser.status)}`}>
                            {(selectedUser.status || 'active').charAt(0).toUpperCase() + (selectedUser.status || 'active').slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* User ID Info */}
                    <div className="bg-white rounded-lg p-3 sm:p-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base">User ID</p>
                          <p className="text-xs sm:text-sm text-gray-600">#{selectedUser.user_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                      <div>
                        <span className="text-gray-900 font-medium text-sm sm:text-base">Date submitted:</span>
                        <span className="text-gray-700 ml-2 text-sm sm:text-base">{formatDate(selectedUser.created_at) || 'N/A'}</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-900 font-medium text-sm sm:text-base">Current Role:</span>
                        <span className={`inline-flex px-2 sm:px-3 py-1 ml-2 text-xs sm:text-sm font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                          {selectedUser.role || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Removed since they're now in the form */}
            </div>
          </div>
        </div>
      )}
      {/* Modal: Success Message */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{successMessage}</p>
            <div className="animate-pulse text-xs sm:text-sm text-green-600">
              ✅ {successMessage.includes('status') ? 'Status updated' : 'Information updated'}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Error Message */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Error!</h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{errorMessage}</p>
            <button
              onClick={() => {
                setShowErrorModal(false);
                setErrorMessage('');
              }}
              className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Delete Warning */}
      {showDeleteWarningModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-3 sm:p-6 lg:p-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-3 sm:mb-4 text-center">⚠️ CRITICAL WARNING ⚠️</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-red-800 font-semibold text-sm sm:text-base lg:text-lg mb-2">
                You are about to PERMANENTLY DELETE:
              </p>
              <p className="text-red-700 font-bold text-base sm:text-lg lg:text-xl mb-3">
                {selectedUser.fname} {selectedUser.lname}
              </p>
              <div className="text-red-700 space-y-1 text-xs sm:text-sm lg:text-base">
                <p>• User account and profile</p>
                <p>• All notifications and messages</p>
                <p>• All cart items and preferences</p>
                <p>• All addresses and location data</p>
                {selectedUser.role === 'vendor' && (
                  <>
                    <p>• <strong>ALL VENDOR DATA:</strong></p>
                    <p className="ml-2 sm:ml-4">• Store profile and documents</p>
                    <p className="ml-2 sm:ml-4">• All products and flavors</p>
                    <p className="ml-2 sm:ml-4">• All orders and order history</p>
                    <p className="ml-2 sm:ml-4">• All reviews and ratings</p>
                  </>
                )}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-yellow-800 font-bold text-center text-sm sm:text-base">
                🚨 THIS ACTION CANNOT BE UNDONE! 🚨
              </p>
              <p className="text-yellow-700 text-center mt-2 text-xs sm:text-sm">
                All data will be permanently removed from the database and cannot be recovered.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
              <button
                onClick={() => setShowDeleteWarningModal(false)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gray-500 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-base sm:text-lg"
              >
                Cancel - Keep User
              </button>
              <button
                onClick={proceedToDeleteConfirmation}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors text-base sm:text-lg"
              >
                I Understand - Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 text-center">Final Confirmation</h3>
            <p className="text-gray-600 mb-2 text-center text-sm sm:text-base">
              Delete <strong>{selectedUser.fname} {selectedUser.lname}</strong> permanently?
            </p>
            <p className="text-red-600 text-xs sm:text-sm mb-4 sm:mb-6 text-center font-semibold">
              ⚠️ This action cannot be undone. All user data will be permanently deleted.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 px-4 py-2 sm:py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 sm:py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for Actions */}
      {loadingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing...</h3>
            <p className="text-gray-600">Please wait while we update the user information</p>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminUserManagement;
