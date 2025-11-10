import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const GoogleCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: 'loading', message: 'Processing Google authentication...' });

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Get the current URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const token = urlParams.get('token');
        const userParam = urlParams.get('user');
        
        if (error) {
          // Check if user cancelled the authentication
          if (error === 'cancelled') {
            setStatus({ 
              type: 'error', 
              message: 'Google sign-in was cancelled. You can try again or use regular login.' 
            });
          } else {
            setStatus({ 
              type: 'error', 
              message: 'Google authentication failed. Please try again.' 
            });
          }
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (token && userParam) {
          // Parse user data from URL parameters
          const user = JSON.parse(decodeURIComponent(userParam));
          
          // Save user info and JWT token in sessionStorage
          sessionStorage.setItem("user", JSON.stringify(user));
          sessionStorage.setItem("token", token);

          // Dispatch custom event to notify App component of user change
          window.dispatchEvent(new Event('userChanged'));

          setStatus({ 
            type: 'success', 
            message: 'Google authentication successful! Redirecting...' 
          });

            const role = (user?.role || "customer").toLowerCase();

          // Determine redirect path similar to manual login (handles rejected vendors)
          const determineRedirect = async () => {
            if (role === "admin") {
              navigate("/admin");
              return;
            }

            const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";

            if (role === "vendor") {
              try {
                const statusResponse = await fetch(`${apiBase}/api/admin/users/${user.id}`);
                if (statusResponse.ok) {
                  const statusData = await statusResponse.json();
                  if (statusData.success) {
                    const userData = statusData.user;
                    const ackKey = `vendorRejectionAcknowledged_${user.id}`;
                    const hasAcknowledgedRejection = localStorage.getItem(ackKey) === 'true';

                    if (userData.vendor_status === 'rejected' && hasAcknowledgedRejection) {
                      const updatedUser = {
                        ...user,
                        role: 'customer'
                      };
                      sessionStorage.setItem("user", JSON.stringify(updatedUser));
                      window.dispatchEvent(new Event('userChanged'));
                      navigate("/customer");
                      return;
                    }

                    if (userData.vendor_status === 'pending') {
                      navigate("/vendor-pending");
                      return;
                    }

                    if (userData.vendor_status === 'rejected') {
                      navigate("/vendor-pending");
                      return;
                    }

                    // Approved vendors
                    navigate("/vendor");
                    return;
                  }
                }
              } catch (error) {
                console.error('Google callback vendor status check failed:', error);
              }
              // Default for vendors on error
              navigate("/vendor");
              return;
            }

            // Customer fallback
            navigate("/customer");
          };

          setTimeout(determineRedirect, 1500);
        } else {
          throw new Error('No authentication data received');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        setStatus({ 
          type: 'error', 
          message: 'Authentication failed. Please try again.' 
        });
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleGoogleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            {status.type === 'loading' && (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            )}
            {status.type === 'success' && (
              <div className="text-green-600 text-6xl mb-4">✅</div>
            )}
            {status.type === 'error' && (
              <div className="text-red-600 text-6xl mb-4">❌</div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {status.type === 'loading' && 'Authenticating...'}
            {status.type === 'success' && 'Success!'}
            {status.type === 'error' && 'Authentication Failed'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {status.message}
          </p>
          
          {status.type === 'error' && (
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
