import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SubscriptionFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const errorMessage = searchParams.get('error') || 'Payment was not completed successfully.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Failed</h1>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-900 mb-2">Payment Error</h3>
          <p className="text-red-800 text-sm">{errorMessage}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/vendor')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Back to Dashboard
          </button>
          
          <button
            onClick={() => navigate('/vendor?tab=subscription')}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionFailed;
