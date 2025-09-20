import React, { useState } from 'react';
import axios from 'axios';

export const LoginTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async (username, password) => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      console.log(`Testing login: ${username} / ${password}`);
      
      const res = await axios.post(`${apiBase}/api/auth/login`, {
        username,
        password
      });

      const data = res.data;
      console.log('Login response:', data);
      
      setResult({
        username,
        password,
        success: true,
        user: data.user,
        timestamp: new Date().toLocaleTimeString()
      });
      
    } catch (error) {
      console.error('Login error:', error);
      setResult({
        username,
        password,
        success: false,
        error: error.response?.data?.error || error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { username: 'vendor', password: 'dsf', label: 'Vendor (User ID 4)' },
    { username: 'customer01', password: '123456', label: 'Customer (User ID 29)' },
    { username: 'vendor01', password: '123456', label: 'Vendor01 (User ID 21)' },
    { username: 'vendor02', password: '123456', label: 'Vendor02 (User ID 22)' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Login System Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {testAccounts.map((account) => (
            <button
              key={account.username}
              onClick={() => testLogin(account.username, account.password)}
              disabled={loading}
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Test {account.label}
              <br />
              <small>{account.username} / {account.password}</small>
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p>Testing login...</p>
          </div>
        )}

        {result && (
          <div className={`p-6 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className="text-lg font-semibold mb-4">
              Test Result ({result.timestamp})
            </h3>
            
            <div className="space-y-2">
              <p><strong>Credentials:</strong> {result.username} / {result.password}</p>
              
              {result.success ? (
                <>
                  <p><strong>✅ Login Successful!</strong></p>
                  <p><strong>User ID:</strong> {result.user.id}</p>
                  <p><strong>Username:</strong> {result.user.username}</p>
                  <p><strong>Name:</strong> {result.user.firstName} {result.user.lastName}</p>
                  <p><strong>Email:</strong> {result.user.email}</p>
                  <p><strong>Role:</strong> {result.user.role}</p>
                </>
              ) : (
                <>
                  <p><strong>❌ Login Failed!</strong></p>
                  <p><strong>Error:</strong> {result.error}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginTest;

