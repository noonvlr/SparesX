'use client';

import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';

export default function DebugAuthPage() {
  const { user, isLoading } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testProfileEndpoint = async () => {
    setLoading(true);
    try {
      console.log('Testing profile endpoint...');
      const response = await apiClient.get('/users/profile/full');
      console.log('Test response:', response.data);
      setTestResult({ success: true, data: response.data });
    } catch (error: any) {
      console.error('Test error:', error);
      setTestResult({ 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status,
        headers: error.response?.headers
      });
    } finally {
      setLoading(false);
    }
  };

  const testBasicProfile = async () => {
    setLoading(true);
    try {
      console.log('Testing basic profile endpoint...');
      const response = await apiClient.get('/users/profile');
      console.log('Basic profile response:', response.data);
      setTestResult({ success: true, data: response.data });
    } catch (error: any) {
      console.error('Basic profile test error:', error);
      setTestResult({ 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="space-y-6">
        {/* Auth Status */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}</p>
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        </div>

        {/* LocalStorage Info */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">LocalStorage Info</h2>
          <p><strong>User:</strong> {localStorage.getItem('user') || 'Not found'}</p>
          <p><strong>Access Token:</strong> {localStorage.getItem('accessToken') ? 'Exists' : 'Not found'}</p>
          <p><strong>Refresh Token:</strong> {localStorage.getItem('refreshToken') ? 'Exists' : 'Not found'}</p>
        </div>

        {/* API Client Info */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">API Client Info</h2>
          <p><strong>Base URL:</strong> {apiClient.defaults.baseURL}</p>
          <p><strong>Headers:</strong> {JSON.stringify(apiClient.defaults.headers, null, 2)}</p>
        </div>

        {/* Test Buttons */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">API Tests</h2>
          <div className="space-x-4">
            <button
              onClick={testBasicProfile}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test Basic Profile
            </button>
            <button
              onClick={testProfileEndpoint}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test Full Profile
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Test Results</h2>
            <pre className="bg-white p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
