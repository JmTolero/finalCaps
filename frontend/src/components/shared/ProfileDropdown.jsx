import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from './FeedbackModal';

/**
 * ProfileDropdown Component
 * 
 * SECURITY IMPROVEMENTS:
 * - Server-side role verification before navigation
 * - Proper logout with API call to invalidate server session
 * - Access denied alerts for unauthorized users
 * - No direct navigation without verification
 */
export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Get user data from sessionStorage
  useEffect(() => {
    const updateUser = () => {
      const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
      const userData = userRaw ? JSON.parse(userRaw) : null;
      setUser(userData);
    };

    // Initial load
    updateUser();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        updateUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab login/logout
    const handleUserChange = () => {
      updateUser();
    };

    window.addEventListener('userChanged', handleUserChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API endpoint to invalidate server-side session
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      await fetch(`${apiBase}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with client-side logout even if API fails
    }

    // Clear user data from sessionStorage
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('pendingVendor');
    
    // Dispatch custom event to notify App component of user change
    window.dispatchEvent(new Event('userChanged'));
    
    // Close dropdown
    setIsOpen(false);
    
    // Navigate to login page
    navigate('/login');
  };

  const getRoleDisplayName = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Administrator';
      case 'vendor':
        return 'Vendor';
      case 'customer':
        return 'Customer';
      default:
        return 'User';
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'vendor':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'customer':
        return 'bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon/Picture */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-10 h-10 ${getRoleColor(user.role)} rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 overflow-hidden`}
        aria-label="Profile menu"
      >
        {user.profile_image_url ? (
          <img 
            src={user.profile_image_url} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 sm:w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 transform transition-all duration-200 ease-in-out origin-top-right sm:right-0 right-[-1rem] max-w-[calc(100vw-2rem)] overflow-hidden">
          <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 min-w-0 max-w-full">
            <div className="font-medium text-gray-900 truncate max-w-full">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.firstName || user.fname || user.name || 'User'
              }
            </div>
            <div 
              className="text-gray-500 text-xs mt-1 truncate overflow-hidden break-all max-w-full" 
              title={user.email}
              style={{ wordBreak: 'break-all', maxWidth: '100%' }}
            >
              {user.email || 'No email'}
            </div>
            <div className="text-gray-500 text-xs mt-1 truncate max-w-full">{getRoleDisplayName(user.role)}</div>
          </div>
          
          {/* Role-specific menu items */}
          {user.role?.toLowerCase() === 'admin' && (
            <>
              <button
                onClick={async () => {
                  // Verify admin access before navigation
                  try {
                    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
                    const response = await fetch(`${apiBase}/api/auth/verify-admin`, {
                      credentials: 'include',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (response.ok) {
                      navigate('/admin');
                    } else {
                      alert('Access denied. You are not authorized to access the admin dashboard.');
                      navigate('/login');
                    }
                  } catch (error) {
                    console.error('Admin verification failed:', error);
                    alert('Unable to verify admin access. Please log in again.');
                    navigate('/login');
                  }
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 flex items-center gap-3 touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </button>
            </>
          )}

          {user.role?.toLowerCase() === 'vendor' && (
            <>
              <button
                onClick={async () => {
                  // Verify vendor access before navigation
                  try {
                    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
                    const response = await fetch(`${apiBase}/api/auth/verify-vendor`, {
                      credentials: 'include',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (response.ok) {
                      navigate('/vendor');
                    } else {
                      alert('Access denied. You are not authorized to access the vendor dashboard.');
                      navigate('/login');
                    }
                  } catch (error) {
                    console.error('Vendor verification failed:', error);
                    alert('Unable to verify vendor access. Please log in again.');
                    navigate('/login');
                  }
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 flex items-center gap-3 touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Vendor Dashboard
              </button>
              <button
                onClick={() => {
                  setShowFeedbackModal(true);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 flex items-center gap-3 touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Customer Support
              </button>
            </>
          )}

          {user.role?.toLowerCase() === 'customer' && (
            <>
              <button
                onClick={() => {
                  navigate('/customer?view=orders');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 flex items-center gap-3 touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Orders
              </button>
              <button
                onClick={() => {
                  navigate('/customer/my-feedback');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 flex items-center gap-3 touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                My Feedback
              </button>
              <button
                onClick={() => {
                  navigate('/customer?view=settings');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 flex items-center gap-3 touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account Settings
              </button>
              <button
                onClick={async () => {
                  try {
                    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
                    const response = await fetch(`${apiBase}/api/auth/verify-vendor`, {
                      credentials: 'include',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (response.ok) {
                      navigate('/vendor');
                    } else {
                      // Check if user is already a vendor
                      const userRaw = sessionStorage.getItem('user');
                      if (userRaw) {
                        const userData = JSON.parse(userRaw);
                        if (userData.role === 'vendor') {
                          navigate('/vendor');
                        } else {
                          // Redirect to become vendor page
                          navigate('/become-vendor');
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Vendor verification failed:', error);
                    navigate('/become-vendor');
                  }
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 flex items-center gap-3 touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Become Vendor
              </button>
            </>
          )}

          <div className="border-t border-gray-100"></div>
          
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors duration-200 flex items-center gap-3 touch-manipulation"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      )}
      
      {/* Feedback Modal for Vendors */}
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userRole={user?.role?.toLowerCase() || 'customer'}
      />
    </div>
  );
};
