import { useState, useEffect } from 'react';
import axios from 'axios';

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
    role: 'customer'
  });

  // Fetch users from API*
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/admin/users');
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
    try {
      const response = await axios.put(`http://localhost:3001/api/admin/users/${userId}`, userData);
      
      if (response.data.success) {
        // Update local state
        setUsers(users.map(user => 
          user.user_id === userId 
            ? { ...user, ...userData }
            : user
        ));
        alert('User updated successfully!');
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        alert('Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      alert(err.response?.data?.error || 'Failed to update user');
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      const response = await axios.put(`http://localhost:3001/api/admin/users/${userId}/status`, { status });
      
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
        alert(`User status updated to ${status} successfully!`);
      } else {
        alert('Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      alert(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleView = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/admin/users/${userId}`);
      if (response.data.success) {
        setSelectedUser(response.data.user);
        setShowViewModal(true);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      alert('Failed to fetch user details');
    }
  };

  const handleEdit = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/admin/users/${userId}`);
      if (response.data.success) {
        const user = response.data.user;
        setSelectedUser(user);
        setEditForm({
          fname: user.fname || '',
          lname: user.lname || '',
          username: user.username || '',
          email: user.email || '',
          contact_no: user.contact_no || '',
          role: user.role || 'customer'
        });
        setShowEditModal(true);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      alert('Failed to fetch user details');
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
    setSelectedUser(null);
    setEditForm({
      fname: '',
      lname: '',
      username: '',
      email: '',
      contact_no: '',
      role: 'customer'
    });
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

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">User Management</h1>
      
      {/* Search Bar and Role Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Role Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[120px]"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
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
            <div className="md:hidden max-h-96 overflow-y-auto space-y-4 p-4">
              {filteredUsers.map((user) => (
                <div key={user.user_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">ID: {user.user_id}</h3>
                      <p className="text-sm text-gray-600">{(user.fname || '') + ' ' + (user.lname || '')}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-gray-600 text-sm font-medium">Username:</span>
                      <p className="font-medium text-gray-900">{user.username || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm font-medium">Email:</span>
                      <p className="font-medium text-gray-900">{user.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(user.user_id)}
                      className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(user.user_id)}
                      className="flex-1 px-3 py-2 bg-green-200 text-green-700 text-sm font-medium rounded hover:bg-green-300 transition-colors"
                    >
                      Edit
                    </button>
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
        <div className="fixed inset-0 bg-gradient-to-br from-[#0693FF] to-[#C0E2FB] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-[#FFDDAE] px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">User Information</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Left Section - User Information */}
                <div className="flex-1 md:w-1/2">
                  {/* Profile Section */}
                  <div className="flex items-start space-x-4 mb-8">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Name</h2>
                      <p className="text-gray-700">{(selectedUser.fname || '') + ' ' + (selectedUser.lname || '') || 'No name provided'}</p>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-900 font-medium">Username: </span>
                      <span className="text-gray-700">{selectedUser.username || 'Not set'}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-900 font-medium">Email Address: </span>
                      <span className="text-gray-700">{selectedUser.email || 'Not provided'}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-900 font-medium">Contact No.: </span>
                      <span className="text-gray-700">{selectedUser.contact_no || 'Not provided'}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-900 font-medium">User Role: </span>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                        {selectedUser.role || 'N/A'}
                      </span>
                    </div>

                    {selectedUser.store_name && (
                      <div>
                        <span className="text-gray-900 font-medium">Store Name: </span>
                        <span className="text-gray-700">{selectedUser.store_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section - Account Information */}
                <div className="flex-1 md:w-1/2 bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h3>
                  
                  <div className="space-y-4">
                    {/* Account Status */}
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(selectedUser.status)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Account Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedUser.status)}`}>
                            {(selectedUser.status || 'active').charAt(0).toUpperCase() + (selectedUser.status || 'active').slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* User ID */}
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">User ID</p>
                          <p className="text-sm text-gray-600">#{selectedUser.user_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 space-y-4">
                      <div>
                        <span className="text-gray-900 font-medium">Registration Date:</span>
                        <span className="text-gray-700 ml-2">{formatDate(selectedUser.created_at) || 'N/A'}</span>
                      </div>
                      
                      {selectedUser.vendor_status && (
                        <div>
                          <span className="text-gray-900 font-medium">Vendor Status:</span>
                          <span className="text-gray-700 ml-2">{selectedUser.vendor_status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-between items-center">
                {/* Status Control Buttons */}
                <div className="flex space-x-3">
                  {selectedUser.status === 'active' ? (
                    <button
                      onClick={() => updateUserStatus(selectedUser.user_id, 'suspended')}
                      className="px-4 py-2 bg-red-500 text-white font-medium rounded-full hover:bg-red-600 transition-colors"
                    >
                      Suspend Account
                    </button>
                  ) : (
                    <button
                      onClick={() => updateUserStatus(selectedUser.user_id, 'active')}
                      className="px-4 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors"
                    >
                      Activate Account
                    </button>
                  )}
                  {selectedUser.status !== 'inactive' && (
                    <button
                      onClick={() => updateUserStatus(selectedUser.user_id, 'inactive')}
                      className="px-4 py-2 bg-gray-500 text-white font-medium rounded-full hover:bg-gray-600 transition-colors"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
                
                {/* Main Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={closeModals}
                    className="px-6 py-2 bg-gray-500 text-white font-medium rounded-full hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEdit(selectedUser.user_id);
                    }}
                    className="px-6 py-2 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-colors"
                  >
                    Edit User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#0693FF] to-[#C0E2FB] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-[#FFDDAE] px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">User Information</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Left Section - Edit Form */}
                <div className="flex-1 md:w-1/2">
                  {/* Profile Section */}
                  <div className="flex items-start space-x-4 mb-8">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Name</h2>
                      <p className="text-gray-700">{editForm.fname + ' ' + editForm.lname || 'Edit user details'}</p>
                    </div>
                  </div>

                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name:</label>
                        <input
                          type="text"
                          placeholder="First name"
                          value={editForm.fname}
                          onChange={(e) => setEditForm({...editForm, fname: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address:</label>
                        <input
                          type="text"
                          placeholder="Last name"
                          value={editForm.lname}
                          onChange={(e) => setEditForm({...editForm, lname: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address:</label>
                      <input
                        type="email"
                        placeholder="user@email.com"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Contact No.:</label>
                      <input
                        type="text"
                        placeholder="09123456789"
                        value={editForm.contact_no}
                        onChange={(e) => setEditForm({...editForm, contact_no: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Username:</label>
                      <input
                        type="text"
                        placeholder="username"
                        value={editForm.username}
                        onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">User Role:</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                        required
                      >
                        <option value="customer">Customer</option>
                        <option value="vendor">Vendor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </form>
                </div>

                {/* Right Section - Account Status */}
                <div className="flex-1 md:w-1/2 bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h3>
                  
                  <div className="space-y-4">
                    {/* Current Status */}
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(selectedUser.status)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedUser.status)}`}>
                            {(selectedUser.status || 'active').charAt(0).toUpperCase() + (selectedUser.status || 'active').slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* User ID Info */}
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">User ID</p>
                          <p className="text-sm text-gray-600">#{selectedUser.user_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 space-y-4">
                      <div>
                        <span className="text-gray-900 font-medium">Date submitted:</span>
                        <span className="text-gray-700 ml-2">{formatDate(selectedUser.created_at) || 'N/A'}</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-900 font-medium">Current Role:</span>
                        <span className={`inline-flex px-3 py-1 ml-2 text-sm font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                          {selectedUser.role || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-6 py-3 bg-gray-500 text-white font-medium rounded-full hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-6 py-3 bg-[#FFDDAE] text-gray-800 font-medium rounded-full hover:bg-[#ffe7c4] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminUserManagement;
