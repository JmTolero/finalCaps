import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

export const VendorRedirect = () => {
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    checkVendorStatus();
  }, []);

  const checkVendorStatus = async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        console.log('VendorRedirect: No user in session storage');
        setRedirectPath('/login');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userRaw);
      console.log('VendorRedirect: Checking status for user:', user);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // First check approval status
      const statusResponse = await axios.get(`${apiBase}/api/admin/users/${user.id}`);
      
      if (statusResponse.data.success) {
        const userData = statusResponse.data.user;
        
        // Check vendor status
        if (userData.vendor_status === 'pending') {
          // Check if vendor has uploaded documents
          const setupResponse = await axios.get(`${apiBase}/api/vendor/setup-status/${user.id}`);
          if (setupResponse.data.success && setupResponse.data.isVendor) {
            const vendor = setupResponse.data.vendor;
            // If vendor has documents but setup is not complete, go to setup
            if (vendor.business_permit_url && vendor.valid_id_url && vendor.proof_image_url) {
              // All documents uploaded - check if setup is complete
              if (!setupResponse.data.setupComplete) {
                setRedirectPath(`/vendor-setup?vendor_id=${vendor.vendor_id}`);
              } else {
                setRedirectPath('/vendor-pending');
              }
            } else {
              // Vendor record exists but documents not uploaded - redirect to complete registration
              // This handles the case where user started Google OAuth but didn't complete the form
              console.log('Vendor record exists but documents not uploaded, redirecting to vendor-google-complete');
              setRedirectPath('/vendor-google-complete');
            }
          } else {
            // No vendor record exists - user needs to complete registration
            // Check if they came from Google OAuth (have google_id)
            const userRaw = sessionStorage.getItem('user');
            if (userRaw) {
              const userData = JSON.parse(userRaw);
              if (userData.auth_provider === 'google' || userData.google_id) {
                // User signed up with Google but didn't complete registration
                console.log('User signed up with Google but vendor record not created, redirecting to vendor-google-complete');
                setRedirectPath('/vendor-google-complete');
              } else {
                // Regular vendor registration flow
                setRedirectPath('/vendor-pending');
              }
            } else {
              setRedirectPath('/vendor-pending');
            }
          }
        } else if (userData.vendor_status === 'rejected') {
          const ackKey = `vendorRejectionAcknowledged_${user.id}`;
          const hasAcknowledgedRejection = localStorage.getItem(ackKey) === 'true';
          
          console.log('VendorRedirect: Vendor status is rejected');
          console.log('VendorRedirect: Has acknowledged rejection?', hasAcknowledgedRejection);
          
          if (hasAcknowledgedRejection) {
            // User has acknowledged rejection, update role and go to customer page
            console.log('VendorRedirect: Rejection acknowledged, redirecting to customer');
            // Ensure role is customer
            const updatedUserData = {
              ...user,
              role: 'customer'
            };
            sessionStorage.setItem('user', JSON.stringify(updatedUserData));
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            window.dispatchEvent(new Event('userChanged'));
            setRedirectPath('/customer');
          } else {
            // Show rejection view until acknowledged - ALWAYS show pending page
            console.log('VendorRedirect: Rejection not acknowledged, redirecting to vendor-pending');
            setRedirectPath('/vendor-pending');
          }
        } else if (userData.vendor_status === 'approved') {
          // Check if setup is complete
          const setupResponse = await axios.get(`${apiBase}/api/vendor/setup-status/${user.id}`);
          if (setupResponse.data.success && setupResponse.data.isVendor) {
            if (!setupResponse.data.setupComplete) {
              // Redirect to setup page with vendor_id
              setRedirectPath(`/vendor-setup?vendor_id=${setupResponse.data.vendor.vendor_id}`);
            } else {
              setRedirectPath('/vendor');
            }
          } else {
            setRedirectPath('/vendor');
          }
        } else {
          // No vendor record found, redirect to vendor dashboard
          setRedirectPath('/vendor');
        }
      } else {
        setRedirectPath('/vendor');
      }
    } catch (error) {
      console.error('Error checking vendor status:', error);
      // If there's an error, default to vendor dashboard
      setRedirectPath('/vendor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return null;
};

export default VendorRedirect;
