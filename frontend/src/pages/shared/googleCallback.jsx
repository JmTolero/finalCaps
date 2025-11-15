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
          
          // Save user info and JWT token in localStorage
          localStorage.setItem("user", JSON.stringify(user));
          sessionStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("token", token);
          sessionStorage.setItem("token", token);

          // Dispatch custom event to notify App component of user change
          window.dispatchEvent(new Event('userChanged'));

          const role = (user?.role || "customer").toLowerCase();

          // Determine redirect path similar to manual login (handles rejected vendors)
          // Check vendor status BEFORE showing success message and navigating
          const determineRedirect = async () => {
            setStatus({ 
              type: 'loading', 
              message: 'Checking your account status...' 
            });

            if (role === "admin") {
              navigate("/admin");
              return;
            }

            const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";

            // Check vendor status for both vendors and customers (rejected vendors have customer role)
            // This ensures rejected vendors see the rejection message
            try {
              const statusResponse = await fetch(`${apiBase}/api/admin/users/${user.id}`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData.success) {
                  const userData = statusData.user;
                  const ackKey = `vendorRejectionAcknowledged_${user.id}`;
                  const hasAcknowledgedRejection = localStorage.getItem(ackKey) === 'true';

                  console.log('Google callback - vendor_status:', userData.vendor_status);
                  console.log('Google callback - role:', role);
                  console.log('Google callback - hasAcknowledgedRejection:', hasAcknowledgedRejection);

                  // Handle rejected vendor status (even if role is customer)
                  if (userData.vendor_status === 'rejected') {
                    if (hasAcknowledgedRejection) {
                      // Already acknowledged, go to customer page
                      console.log('Google callback - Rejection acknowledged, going to customer');
                      const updatedUser = {
                        ...user,
                        role: 'customer'
                      };
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      sessionStorage.setItem("user", JSON.stringify(updatedUser));
                      window.dispatchEvent(new Event('userChanged'));
                      navigate("/customer");
                      return;
                    } else {
                      // Not acknowledged, show rejection message
                      console.log('Google callback - Rejection not acknowledged, going to vendor-pending');
                      // Update role to customer to match backend (but still show pending page)
                      const updatedUser = {
                        ...user,
                        role: 'customer'
                      };
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      sessionStorage.setItem("user", JSON.stringify(updatedUser));
                      window.dispatchEvent(new Event('userChanged'));
                      navigate("/vendor-pending");
                      return;
                    }
                  }

                  // Handle pending vendor status
                  if (userData.vendor_status === 'pending') {
                    console.log('Google callback - Vendor status is pending, checking if documents uploaded');
                    // Check if vendor has uploaded documents by checking vendor details directly
                    let shouldGoToPending = false;
                    let shouldGoToComplete = false;
                    
                    try {
                      // Create timeout controller for fetch
                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for faster response
                      
                      try {
                        // First check setup-status to see if vendor exists
                        const setupResponse = await fetch(`${apiBase}/api/vendor/setup-status/${user.id}`, {
                          signal: controller.signal
                        });
                        
                        if (setupResponse.ok) {
                          const setupData = await setupResponse.json();
                          if (setupData.success && setupData.isVendor && setupData.vendor?.vendor_id) {
                            // Vendor exists, now check vendor details for document URLs
                            const vendorId = setupData.vendor.vendor_id;
                            
                            // Fetch vendor details to check document URLs
                            const vendorDetailsResponse = await fetch(`${apiBase}/api/admin/vendors/${vendorId}`, {
                              signal: controller.signal
                            });
                            
                            if (vendorDetailsResponse.ok) {
                              const vendorDetailsData = await vendorDetailsResponse.json();
                              if (vendorDetailsData.success && vendorDetailsData.vendor) {
                                const vendor = vendorDetailsData.vendor;
                                // Check if all documents are uploaded
                                if (vendor.business_permit_url && vendor.valid_id_url && vendor.proof_image_url) {
                                  console.log('Google callback - All documents uploaded, going to vendor-pending');
                                  shouldGoToPending = true;
                                } else {
                                  // Documents not uploaded - redirect to complete registration
                                  console.log('Google callback - Documents not uploaded, going to vendor-google-complete');
                                  shouldGoToComplete = true;
                                }
                              } else {
                                // Couldn't get vendor details, assume pending
                                console.log('Google callback - Could not get vendor details, assuming pending');
                                shouldGoToPending = true;
                              }
                            } else {
                              // Couldn't fetch vendor details, assume pending
                              console.log('Google callback - Could not fetch vendor details, assuming pending');
                              shouldGoToPending = true;
                            }
                          } else {
                            // No vendor record found but status is pending - redirect to complete registration
                            console.log('Google callback - No vendor record but status is pending, going to vendor-google-complete');
                            shouldGoToComplete = true;
                          }
                        } else {
                          // API error but status is pending - assume pending (safe default)
                          console.log('Google callback - Setup status API error but vendor_status is pending, going to vendor-pending');
                          shouldGoToPending = true;
                        }
                        
                        clearTimeout(timeoutId);
                      } catch (fetchError) {
                        clearTimeout(timeoutId);
                        throw fetchError;
                      }
                    } catch (setupError) {
                      console.error('Error checking vendor documents:', setupError);
                      // On error, if vendor_status is pending, assume they're pending (safe default)
                      // This prevents redirecting to vendor-google-complete which requires URL params
                      console.log('Google callback - Document check failed but vendor_status is pending, going to vendor-pending');
                      shouldGoToPending = true;
                    }
                    
                    // Update user data and redirect immediately (no delay)
                    const updatedUser = {
                      ...user,
                      role: shouldGoToPending ? (role === 'vendor' ? 'vendor' : 'customer') : 'customer'
                    };
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    sessionStorage.setItem("user", JSON.stringify(updatedUser));
                    window.dispatchEvent(new Event('userChanged'));
                    
                    // Redirect immediately without delay
                    if (shouldGoToPending) {
                      navigate("/vendor-pending");
                    } else if (shouldGoToComplete) {
                      // Only redirect to vendor-google-complete if we have token/user params
                      // Otherwise redirect to vendor-pending as fallback
                      if (token && userParam) {
                        navigate(`/vendor-google-complete?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam)}&existing=false`);
                      } else {
                        // No params available, go to pending instead
                        console.log('Google callback - No token/user params, redirecting to vendor-pending instead');
                        navigate("/vendor-pending");
                      }
                    }
                    return;
                  }

                  // Handle vendor role (approved vendors)
                  if (role === "vendor") {
                    if (userData.vendor_status === 'approved') {
                      console.log('Google callback - Vendor approved, going to vendor dashboard');
                      navigate("/vendor");
                      return;
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Google callback vendor status check failed:', error);
            }

            // Default fallback based on role - redirect immediately
            if (role === "vendor") {
              navigate("/vendor");
              return;
            }

            // Customer fallback
            navigate("/customer");
          };

          // Start checking immediately (no delay)
          determineRedirect();
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
