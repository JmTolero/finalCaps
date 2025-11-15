
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AddressForm from "../../components/shared/AddressForm";
import FeedbackModal from "../../components/shared/FeedbackModal";
import LocationPickerModal from "../../components/vendor/LocationPickerModal";
import { ProvinceDropdown, CityDropdown, RegionDropdown } from "../../components/shared/DropdownSelect";
import logoImage from "../../assets/images/LOGO.png";
import { getImageUrl } from "../../utils/imageUtils";
import axios from "axios";
import { getAvailabilityByDate } from "../../services/availabilityService";

// Vendor Dashboard Icons
import dashboardIcon from "../../assets/images/vendordashboardicon/vendorDashboardicon.png";
import inventoryIcon from "../../assets/images/vendordashboardicon/inventoryProductVendorIcon.png";
import ordersIcon from "../../assets/images/vendordashboardicon/vendorOrderIcon.png";
import addCustomerIcon from "../../assets/images/vendordashboardicon/addcustomericon.png";
import paymentsIcon from "../../assets/images/vendordashboardicon/paymentsvendoricon.png";
import subscriptionIcon from "../../assets/images/vendordashboardicon/subscription.png";
import transactionIcon from "../../assets/images/vendordashboardicon/transaction.png";
  import profileIcon from "../../assets/images/vendordashboardicon/profileVendorIcon.png";
import storeIcon from "../../assets/images/vendordashboardicon/shop.png";
import bellNotificationIcon from "../../assets/images/bellNotification.png";
import feedbackIcon from "../../assets/images/feedback.png";
import VendorSubscription from "./VendorSubscription";

export const Vendor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Add CSS for hiding scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [activeView, setActiveView] = useState("dashboard");
  const [activeTab, setActiveTab] = useState("profile");
  const [vendorData, setVendorData] = useState({
    fname: "",
    email: "",
    store_name: "",
    contact_no: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    unit_number: "",
    street_name: "",
    barangay: "",
    cityVillage: "",
    province: "",
    region: "",
    postal_code: "",
    landmark: "",
    address_type: "business",
  });
  const [status, setStatus] = useState({ type: null, message: "" });
  const [showStatus, setShowStatus] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [qrSetupCompleted, setQrSetupCompleted] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    // Check if user exists in sessionStorage to avoid unnecessary loading screen on refresh
    const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    return !userRaw; // Only show loading if no user in sessionStorage
  });
  const [isUserChanging, setIsUserChanging] = useState(false);
  
  // Location picker modal state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedAddressForLocation, setSelectedAddressForLocation] = useState(null);
  
  // Payment proof modal state
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [selectedOrderForPaymentProof, setSelectedOrderForPaymentProof] = useState(null);
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    confirmed_orders: 0,
    delivered_orders: 0,
    sales_today: 0,
    sales_this_month: 0,
    top_flavor: "N/A",
    product_count: 0, // Actually counts flavors, not products
    upcoming_deliveries: [],
  });
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Customer feedback state
  const [customerFeedback, setCustomerFeedback] = useState({
    reviews: [],
    summary: {
      total_reviews: 0,
      average_rating: 0,
      five_star: 0,
      four_star: 0,
      three_star: 0,
      two_star: 0,
      one_star: 0
    }
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  
  // Upcoming deliveries filter state
  const [deliveryFilter, setDeliveryFilter] = useState({
    status: 'all', // all, confirmed, preparing, out_for_delivery
    urgency: 'all' // all, today, tomorrow, upcoming, overdue
  });

  // Filter upcoming deliveries based on current filter settings
  const getFilteredDeliveries = () => {
    if (!dashboardData.upcoming_deliveries) return [];
    
    return dashboardData.upcoming_deliveries.filter(delivery => {
      // Filter by status
      const statusMatch = deliveryFilter.status === 'all' || delivery.status === deliveryFilter.status;
      
      // Filter by urgency
      let urgencyMatch = true;
      if (deliveryFilter.urgency !== 'all') {
        const deliveryDate = new Date(delivery.delivery_datetime);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const deliveryDay = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
        const diffTime = deliveryDay.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (deliveryFilter.urgency) {
          case 'overdue':
            urgencyMatch = diffDays < 0;
            break;
          case 'today':
            urgencyMatch = diffDays === 0;
            break;
          case 'tomorrow':
            urgencyMatch = diffDays === 1;
            break;
          case 'upcoming':
            urgencyMatch = diffDays > 1 && diffDays <= 7;
            break;
          default:
            urgencyMatch = true;
        }
      }
      
      return statusMatch && urgencyMatch;
    });
  };

  // My Store data state
  const [publishedFlavors, setPublishedFlavors] = useState([]);
  const [publishedFlavorsLoading, setPublishedFlavorsLoading] = useState(false);    

  // Drum management state
  const [drumReturnLoading, setDrumReturnLoading] = useState(null);
  const [selectedReturnOrders, setSelectedReturnOrders] = useState([]); // For checkbox selection
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning' // 'warning', 'danger', 'info'
  });
  const [availableDrums, setAvailableDrums] = useState({
    small: 0,
    medium: 0,
    large: 0,
  });
  
  // Subscription limits state
  const [subscriptionLimits, setSubscriptionLimits] = useState({
    drum_limit: 5,
    flavor_limit: 5,
    order_limit: 50,
    subscription_plan: 'free'
  });
  const [isEditingDrums, setIsEditingDrums] = useState(false);
  const [tempDrums, setTempDrums] = useState({
    small: 0,
    medium: 0,
    large: 0,
  });

  // Drum capacity in gallons (editable by vendor)
  const [drumCapacity, setDrumCapacity] = useState({
    small: 3, // 3 gallons per small drum
    medium: 5, // 5 gallons per medium drum
    large: 8, // 8 gallons per large drum
  });
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);

  const [tempCapacity, setTempCapacity] = useState({
    small: 3,
    medium: 5,
    large: 8,
  });

  // Drum prices (editable by vendor)
  const [drumPrices, setDrumPrices] = useState({
    small: 0, // Default to 0 - vendor must set prices
    medium: 0, // Default to 0 - vendor must set prices
    large: 0, // Default to 0 - vendor must set prices
  });
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [tempPrices, setTempPrices] = useState({
    small: 0,
    medium: 0,
    large: 0,
  });

  // Delivery pricing state
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [tempDeliveryZones, setTempDeliveryZones] = useState([]);
  const [newDeliveryZone, setNewDeliveryZone] = useState({
    city: '',
    province: '',
    region: '',
    delivery_price: 0
  });
  const [showAddZoneForm, setShowAddZoneForm] = useState(false);

  // Orders state
  const [vendorOrders, setVendorOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [recentStatusChange, setRecentStatusChange] = useState(null); // For undo functionality
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    selectedDate: '',
    enabled: false
  });
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Flavor form state
  const [flavorForm, setFlavorForm] = useState({
    name: "",
    description: "",
  });
  const [flavorImages, setFlavorImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSavingFlavor, setIsSavingFlavor] = useState(false);
  
  // Saved flavors state
  const [savedFlavors, setSavedFlavors] = useState([]);
  const [flavorSearchTerm, setFlavorSearchTerm] = useState("");
  const [flavorsLoading, setFlavorsLoading] = useState(false);
  
  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedFlavorImages, setSelectedFlavorImages] = useState([]);
  const [selectedFlavorName, setSelectedFlavorName] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Drum setup validation modal state
  const [showDrumSetupModal, setShowDrumSetupModal] = useState(false);
  
  // Order action modal states

  const [showDeclineReasonModal, setShowDeclineReasonModal] = useState(false);
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [showCODPaymentModal, setShowCODPaymentModal] = useState(false);
  const [codPaymentData, setCodPaymentData] = useState({ orderId: null, amount: null });
  const [isConfirmingCODPayment, setIsConfirmingCODPayment] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  
  // Flavor editing state
  const [editingFlavor, setEditingFlavor] = useState(null);
  const [isEditingFlavor, setIsEditingFlavor] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [flavorToDelete, setFlavorToDelete] = useState(null);

  const isFlavorLimitReached = !isEditingFlavor && subscriptionLimits.flavor_limit !== -1 && savedFlavors.length >= subscriptionLimits.flavor_limit;
  
  // Profile dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Sidebar state - always closed on initial load for clean login experience
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Walk-in order state
  const [walkInCart, setWalkInCart] = useState([]);
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [walkInQuantity, setWalkInQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState({
    street: '',
    barangay: '',
    city: '',
    province: '',
    postalCode: ''
  });
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState('cash');
  const [walkInPaymentOption, setWalkInPaymentOption] = useState('full'); // 'full' or 'partial'
  const [walkInDeliveryDate, setWalkInDeliveryDate] = useState('');
  const [walkInDeliveryTime, setWalkInDeliveryTime] = useState('');
  const [showWalkInSuccess, setShowWalkInSuccess] = useState(false);
  
  // Walk-in date-based availability state
  const [walkInDateAvailability, setWalkInDateAvailability] = useState(null);
  const [walkInAvailabilityLoading, setWalkInAvailabilityLoading] = useState(false);
  
  // Cancel walk-in order modal state
  const [showCancelWalkInModal, setShowCancelWalkInModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Transaction history state
  const [transactions, setTransactions] = useState([]);
  const [transactionStats, setTransactionStats] = useState({
    total_transactions: 0,
    total_earnings: 0,
    pending_count: 0,
    gcash_transactions: 0,
    cash_transactions: 0
  });
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState({
    start_date: '',
    end_date: '',
    payment_method: 'all',
    status: 'all'
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const fetchAddresses = useCallback(
    async (userId = null) => {
    try {
        const apiBase =
          process.env.REACT_APP_API_URL || "http://localhost:3001";
      const userIdToUse = userId || currentVendor?.user_id;
      
      if (!userIdToUse) {
          console.log("No vendor user ID available yet");
        return;
      }
      
        const response = await axios.get(
          `${apiBase}/api/addresses/user/${userIdToUse}/addresses`
        );
      setAddresses(response.data || []);
    } catch (error) {
        console.error("Error fetching addresses:", error);
      setAddresses([]);
      if (error.response?.status === 404) {
          updateStatus("info", "No addresses found for this vendor yet.");
      } else {
          updateStatus("error", "Failed to load addresses. Please try again.");
      }
    }
    },
    [currentVendor?.user_id, setAddresses]
  );

  // Fetch subscription limits
  const fetchSubscriptionLimits = useCallback(async (vendorId = null) => {
    try {
      const targetVendorId = vendorId || currentVendor?.vendor_id;
      if (!targetVendorId) return;
      
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      console.log('Fetching subscription limits for vendor:', targetVendorId);
      const response = await fetch(`${apiBase}/api/admin/subscription/vendor/${targetVendorId}`);
      const data = await response.json();
      
      console.log('Subscription limits response:', data);
      
      if (data.success && data.subscription) {
        setSubscriptionLimits({
          drum_limit: data.subscription.drum_limit,
          flavor_limit: data.subscription.flavor_limit,
          order_limit: data.subscription.order_limit,
          subscription_plan: data.subscription.subscription_plan
        });
        console.log('Subscription limits set:', data.subscription);
      } else {
        console.error('Failed to fetch subscription limits:', data);
      }
    } catch (error) {
      console.error('Error fetching subscription limits:', error);
    }
  }, [currentVendor]);

  const fetchCurrentVendor = useCallback(async () => {
    try {
      // Only set loading if we don't have vendor data yet
      if (!currentVendor) {
        setIsInitialLoading(true);
      }
      
      // Get user ID from sessionStorage
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        throw new Error('No user session found');
      }
      const user = JSON.parse(userRaw);
      
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      console.log('Fetching vendor data from:', `${apiBase}/api/vendor/current`, 'for user:', user.id);
      const response = await axios.get(`${apiBase}/api/vendor/current`, {
        headers: {
          'x-user-id': user.id
        }
      });
      
      if (response.data.success && response.data.vendor) {
        console.log('Vendor data received:', response.data.vendor);
        setCurrentVendor(response.data.vendor);
        setQrSetupCompleted(response.data.vendor.qr_code_setup_completed || false);
        setVendorData({
          fname: response.data.vendor.fname || '',
          email: response.data.vendor.email || '',
          store_name: response.data.vendor.store_name || '',
          contact_no: response.data.vendor.contact_no || '',
        });

        // Check if store_name is null and redirect to setup
        if (!response.data.vendor.store_name) {
          navigate("/vendor-setup");
          return;
        }
        
        // Set profile image if available
        if (response.data.vendor.profile_image_url) {
          const apiBase =
            process.env.REACT_APP_API_URL || "http://localhost:3001";
          const imageUrl = getImageUrl(response.data.vendor.profile_image_url, apiBase, 'vendor-documents');
          setProfileImage(imageUrl);
          setProfileImagePreview(imageUrl);
        }
        
        console.log("Current vendor:", response.data.vendor);
        
        // Fetch addresses for this vendor user
        fetchAddresses(response.data.vendor.user_id);
        
        // Fetch subscription limits after vendor data is loaded
        // Use a small delay to ensure currentVendor state is updated
        setTimeout(() => {
          if (response.data.vendor.vendor_id) {
            fetchSubscriptionLimits(response.data.vendor.vendor_id);
          }
        }, 200);
      } else {
        console.error('API returned unsuccessful response:', response.data);
        updateStatus(
          "error",
          response.data.error ||
            "No vendor found. Please register as a vendor first."
        );
      }
    } catch (error) {
      console.error("Error fetching current vendor:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      
      if (error.response?.status === 404) {
        updateStatus(
          "error",
          "No vendor account found. Please register as a vendor first."
        );
      } else if (
        error.code === "ECONNREFUSED" ||
        error.message.includes("Network Error")
      ) {
        updateStatus(
          "error",
          "Cannot connect to server. Please make sure the backend server is running on port 3001."
        );
      } else {
        updateStatus(
          "error",
          `Failed to load vendor information: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    } finally {
      setIsInitialLoading(false);
    }
  }, [fetchAddresses, fetchSubscriptionLimits, navigate, currentVendor]);

  const fetchDashboardData = useCallback(async (vendorId) => {
    if (!vendorId) return;
    
    try {
      setDashboardLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(
        `${apiBase}/api/vendor/dashboard/${vendorId}`
      );
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setDashboardData({
        total_orders: 0,
        total_revenue: 0,
        pending_orders: 0,
        confirmed_orders: 0,
        delivered_orders: 0,
        sales_today: 0,
        sales_this_month: 0,
        top_flavor: "N/A",
        product_count: 0,
        upcoming_deliveries: [],
      });
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const fetchCustomerFeedback = useCallback(async (vendorId) => {
    if (!vendorId) return;
    
    try {
      setFeedbackLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(
        `${apiBase}/api/reviews/vendor/${vendorId}`
      );
      
      if (response.data.success) {
        setCustomerFeedback({
          reviews: response.data.reviews || [],
          summary: response.data.summary || {
            total_reviews: 0,
            average_rating: 0,
            five_star: 0,
            four_star: 0,
            three_star: 0,
            two_star: 0,
            one_star: 0
          }
        });
      }
    } catch (error) {
      console.error("Error fetching customer feedback:", error);
      setCustomerFeedback({
        reviews: [],
        summary: {
          total_reviews: 0,
          average_rating: 0,
          five_star: 0,
          four_star: 0,
          three_star: 0,
          two_star: 0,
          one_star: 0
        }
      });
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  const fetchPublishedFlavors = useCallback(async () => {
    if (!currentVendor?.vendor_id) {
      console.log('❌ Cannot fetch published flavors: no vendor_id', currentVendor);
      return;
    }
    
    try {
      console.log('🔄 Fetching published flavors for vendor_id:', currentVendor.vendor_id);
      console.log('🔄 Current vendor object:', currentVendor);
      setPublishedFlavorsLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const apiUrl = `${apiBase}/api/vendor/flavors/${currentVendor.vendor_id}`;
      console.log('🔄 API URL:', apiUrl);
      
      const response = await axios.get(apiUrl);
      
      console.log('📦 Published flavors response:', response.data);
      
      if (response.data.success) {
        // Filter only published flavors
        const published = response.data.flavors.filter(flavor => flavor.store_status === 'published');
        console.log('✅ Published flavors found:', published.length, published);
        console.log('📊 All flavors from API:', response.data.flavors.map(f => ({
          id: f.flavor_id,
          name: f.flavor_name,
          status: f.store_status,
          vendor_id: f.vendor_id
        })));
        setPublishedFlavors(published);
      } else {
        console.log('❌ API returned unsuccessful response:', response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching published flavors:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      setPublishedFlavors([]);
    } finally {
      setPublishedFlavorsLoading(false);
    }
  }, [currentVendor]);

  const handleDrumsEdit = () => {
    setIsEditingDrums(true);
    setTempDrums({ ...availableDrums });
  };

  const handleDrumsSave = async () => {
    if (!currentVendor?.vendor_id) return;
    
    const newTotal = tempDrums.small + tempDrums.medium + tempDrums.large;
    const currentTotal = availableDrums.small + availableDrums.medium + availableDrums.large;
    
    // Check if the new total exceeds the subscription limit
    if (subscriptionLimits.drum_limit !== -1 && newTotal > subscriptionLimits.drum_limit) {
      setConfirmModalData({
        title: 'Drum Limit Exceeded',
        message: `You are trying to set ${newTotal} drums, but your ${subscriptionLimits.subscription_plan} plan only allows ${subscriptionLimits.drum_limit} drums. This action will be blocked by the system.`,
        confirmText: 'Continue Anyway',
        cancelText: 'Cancel',
        type: 'warning',
        onConfirm: () => {
          // Show another modal with upgrade suggestion
          setConfirmModalData({
            title: 'Upgrade Required',
            message: `To add more drums, you need to upgrade your subscription plan. Would you like to go to the subscription page to upgrade?`,
            confirmText: 'Go to Subscription',
            cancelText: 'Cancel',
            type: 'info',
            onConfirm: () => {
              setActiveView('subscription');
              setShowConfirmModal(false);
            }
          });
        }
      });
      setShowConfirmModal(true);
      return;
    }

    // Check if the new total is at the limit (show warning but allow)
    if (subscriptionLimits.drum_limit !== -1 && newTotal === subscriptionLimits.drum_limit && newTotal > currentTotal) {
      setConfirmModalData({
        title: 'Drum Limit Reached',
        message: `You are setting your drum count to ${newTotal}, which is the maximum allowed for your ${subscriptionLimits.subscription_plan} plan. You won't be able to add more drums without upgrading.`,
        confirmText: 'Save Changes',
        cancelText: 'Cancel',
        type: 'warning',
        onConfirm: () => {
          setShowConfirmModal(false);
          performDrumsSave();
        }
      });
      setShowConfirmModal(true);
      return;
    }

    // If within limits, proceed with save
    performDrumsSave();
  };

  const performDrumsSave = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.put(`${apiBase}/api/vendor/drums/${currentVendor.vendor_id}/stock`, {
        small: tempDrums.small,
        medium: tempDrums.medium,
        large: tempDrums.large
      });

      if (response.data.success) {
        setAvailableDrums({ ...tempDrums });
        setIsEditingDrums(false);
        const totalDrums = tempDrums.small + tempDrums.medium + tempDrums.large;
        updateStatus(
          "success",
          `Available inventory updated: ${tempDrums.small} small drums (${
            tempDrums.small * drumCapacity.small
          } gal), ${tempDrums.medium} medium drums (${
            tempDrums.medium * drumCapacity.medium
          } gal), ${tempDrums.large} large drums (${
            tempDrums.large * drumCapacity.large
          } gal) - Total: ${totalDrums} drums`
        );
      } else {
        updateStatus("error", response.data.error || "Failed to update drum inventory");
      }
    } catch (error) {
      console.error("Error updating drum stock:", error);
      if (error.response?.status === 403) {
        updateStatus("error", "Drum limit exceeded. Please upgrade your subscription to add more drums.");
      } else {
        updateStatus("error", "Failed to update drum inventory. Please try again.");
      }
    }
  };

  const handleDrumsCancel = () => {
    setTempDrums({ ...availableDrums });
    setIsEditingDrums(false);
  };

  const handleCapacityEdit = () => {
    setIsEditingCapacity(true);
    setTempCapacity({ ...drumCapacity });
  };

  const handleCapacitySave = async () => {
    if (!currentVendor?.vendor_id) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.put(`${apiBase}/api/vendor/drums/${currentVendor.vendor_id}/capacity`, {
        small: tempCapacity.small,
        medium: tempCapacity.medium,
        large: tempCapacity.large
      });

      if (response.data.success) {
        setDrumCapacity({ ...tempCapacity });
        setIsEditingCapacity(false);
        updateStatus(
          "success",
          `Drum capacity updated: Small ${tempCapacity.small} gal, Medium ${tempCapacity.medium} gal, Large ${tempCapacity.large} gal`
        );
      } else {
        updateStatus("error", response.data.error || "Failed to update drum capacity");
      }
    } catch (error) {
      console.error("Error updating drum capacity:", error);
      updateStatus("error", "Failed to update drum capacity. Please try again.");
    }
  };

  const handleCapacityCancel = () => {
    setTempCapacity({ ...drumCapacity });
    setIsEditingCapacity(false);
  };


  const handleCapacityChange = (size, value) => {
    setTempCapacity((prev) => ({
      ...prev,
      [size]: parseInt(value) || 0,
    }));
  };

  const handlePricesEdit = () => {
    setIsEditingPrices(true);
    setTempPrices({ ...drumPrices });
  };

  const handlePricesSave = async () => {
    if (!currentVendor?.vendor_id) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.put(`${apiBase}/api/vendor/drums/${currentVendor.vendor_id}/pricing`, {
        small: tempPrices.small,
        medium: tempPrices.medium,
        large: tempPrices.large
      });

      if (response.data.success) {
        setDrumPrices({ ...tempPrices });
        setIsEditingPrices(false);
        updateStatus(
          "success",
          `Drum prices updated: Small ₱${tempPrices.small}, Medium ₱${tempPrices.medium}, Large ₱${tempPrices.large}`
        );
      } else {
        updateStatus("error", response.data.error || "Failed to update drum prices");
      }
    } catch (error) {
      console.error("Error updating drum prices:", error);
      updateStatus("error", "Failed to update drum prices. Please try again.");
    }
  };

  const handlePricesCancel = () => {
    setTempPrices({ ...drumPrices });
    setIsEditingPrices(false);
  };

  const handlePriceChange = (size, value) => {
    setTempPrices((prev) => ({
      ...prev,
      [size]: parseInt(value) || 0,
    }));
  };

  // Delivery pricing functions
  const fetchDeliveryPricing = useCallback(async () => {
    if (!currentVendor?.vendor_id) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/vendor/delivery/${currentVendor.vendor_id}/pricing`);
      
      if (response.data.success) {
        // Add region information to existing zones
        const zonesWithRegion = response.data.delivery_zones.map(zone => {
          // Determine region based on province
          let region = '';
          if (zone.province === 'Metro Manila') {
            region = 'NCR';
          } else if (zone.province === 'Cebu') {
            region = 'Region VII';
          } else if (zone.province === 'Laguna' || zone.province === 'Cavite' || zone.province === 'Rizal' || zone.province === 'Batangas' || zone.province === 'Quezon') {
            region = 'Region IV-A';
          } else if (zone.province === 'Davao del Sur') {
            region = 'Region XI';
          } else if (zone.province === 'Bohol' || zone.province === 'Negros Oriental' || zone.province === 'Siquijor') {
            region = 'Region VII';
          } else if (zone.province === 'Iloilo' || zone.province === 'Negros Occidental') {
            region = 'Region VI';
          } else if (zone.province === 'Leyte' || zone.province === 'Eastern Samar' || zone.province === 'Northern Samar' || zone.province === 'Western Samar' || zone.province === 'Southern Leyte' || zone.province === 'Biliran') {
            region = 'Region VIII';
          } else if (zone.province === 'Zamboanga del Norte' || zone.province === 'Zamboanga del Sur' || zone.province === 'Zamboanga Sibugay') {
            region = 'Region IX';
          } else if (zone.province === 'Bukidnon' || zone.province === 'Camiguin' || zone.province === 'Lanao del Norte' || zone.province === 'Misamis Occidental' || zone.province === 'Misamis Oriental') {
            region = 'Region X';
          } else if (zone.province === 'Compostela Valley' || zone.province === 'Davao del Norte' || zone.province === 'Davao Occidental' || zone.province === 'Davao Oriental') {
            region = 'Region XI';
          } else if (zone.province === 'North Cotabato' || zone.province === 'Sarangani' || zone.province === 'South Cotabato' || zone.province === 'Sultan Kudarat') {
            region = 'Region XII';
          } else if (zone.province === 'Agusan del Norte' || zone.province === 'Agusan del Sur' || zone.province === 'Dinagat Islands' || zone.province === 'Surigao del Norte' || zone.province === 'Surigao del Sur') {
            region = 'Region XIII';
          } else if (zone.province === 'Basilan' || zone.province === 'Lanao del Sur' || zone.province === 'Maguindanao' || zone.province === 'Sulu' || zone.province === 'Tawi-Tawi') {
            region = 'ARMM';
          } else if (zone.province === 'Abra' || zone.province === 'Benguet' || zone.province === 'Ifugao' || zone.province === 'Kalinga' || zone.province === 'Mountain Province' || zone.province === 'Apayao') {
            region = 'CAR';
          } else if (zone.province === 'Ilocos Norte' || zone.province === 'Ilocos Sur' || zone.province === 'La Union' || zone.province === 'Pangasinan') {
            region = 'Region I';
          } else if (zone.province === 'Batanes' || zone.province === 'Cagayan' || zone.province === 'Isabela' || zone.province === 'Nueva Vizcaya' || zone.province === 'Quirino') {
            region = 'Region II';
          } else if (zone.province === 'Aurora' || zone.province === 'Bataan' || zone.province === 'Bulacan' || zone.province === 'Nueva Ecija' || zone.province === 'Pampanga' || zone.province === 'Tarlac' || zone.province === 'Zambales') {
            region = 'Region III';
          } else if (zone.province === 'Marinduque' || zone.province === 'Mindoro Occidental' || zone.province === 'Mindoro Oriental' || zone.province === 'Palawan' || zone.province === 'Romblon') {
            region = 'Region IV-B';
          } else if (zone.province === 'Albay' || zone.province === 'Camarines Norte' || zone.province === 'Camarines Sur' || zone.province === 'Catanduanes' || zone.province === 'Masbate' || zone.province === 'Sorsogon') {
            region = 'Region V';
          } else if (zone.province === 'Aklan' || zone.province === 'Antique' || zone.province === 'Capiz' || zone.province === 'Guimaras') {
            region = 'Region VI';
          }
          
          return {
            ...zone,
            region: region
          };
        });
        
        setDeliveryZones(zonesWithRegion);
      }
    } catch (error) {
      console.error("Error fetching delivery pricing:", error);
      // Set empty array on error
      setDeliveryZones([]);
    }
  }, [currentVendor]);

  const handleDeliveryEdit = () => {
    setIsEditingDelivery(true);
    setTempDeliveryZones([...deliveryZones]);
    // Auto-scroll to the edit form after a short delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.getElementById('edit-zones-form');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleDeliverySave = async () => {
    if (!currentVendor?.vendor_id) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.put(`${apiBase}/api/vendor/delivery/${currentVendor.vendor_id}/pricing`, {
        delivery_zones: tempDeliveryZones
      });

      if (response.data.success) {
        setDeliveryZones([...tempDeliveryZones]);
        setIsEditingDelivery(false);
        updateStatus(
          "success",
          `Delivery pricing updated for ${tempDeliveryZones.length} zones`
        );
      } else {
        updateStatus("error", response.data.error || "Failed to update delivery pricing");
      }
    } catch (error) {
      console.error("Error updating delivery pricing:", error);
      updateStatus("error", "Failed to update delivery pricing. Please try again.");
    }
  };

  const handleDeliveryCancel = () => {
    setTempDeliveryZones([...deliveryZones]);
    setIsEditingDelivery(false);
    setShowAddZoneForm(false);
  };

  const handleAddZoneClick = () => {
    setShowAddZoneForm(true);
    // Auto-scroll to the form after a short delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.getElementById('add-zone-form');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleDeliveryZoneChange = (index, field, value) => {
    const updatedZones = [...tempDeliveryZones];
    updatedZones[index] = {
      ...updatedZones[index],
      [field]: value
    };
    setTempDeliveryZones(updatedZones);
  };

  const handleEditDeliveryZoneDropdownChange = (index, field, selectedOption) => {
    const updatedZones = [...tempDeliveryZones];
    
    if (field === 'region') {
      updatedZones[index][field] = selectedOption.region;
      // Clear province and city when region changes
      updatedZones[index].province = '';
      updatedZones[index].city = '';
    } else if (field === 'province') {
      updatedZones[index][field] = selectedOption.name;
      // Clear city when province changes
      updatedZones[index].city = '';
    } else {
      updatedZones[index][field] = selectedOption.name;
    }
    
    setTempDeliveryZones(updatedZones);
  };

  const handleNewDeliveryZoneDropdownChange = (field, selectedOption) => {
    let updatedZone = { ...newDeliveryZone };
    
    if (field === 'region') {
      updatedZone[field] = selectedOption.region;
      // Clear province and city when region changes
      updatedZone.province = '';
      updatedZone.city = '';
    } else if (field === 'province') {
      updatedZone[field] = selectedOption.name;
      // Clear city when province changes
      updatedZone.city = '';
    } else {
      updatedZone[field] = selectedOption.name;
    }
    
    setNewDeliveryZone(updatedZone);
  };

  const handleAddDeliveryZone = async () => {
    if (!newDeliveryZone.city || !newDeliveryZone.province || newDeliveryZone.delivery_price <= 0) {
      updateStatus("error", "Please fill in all fields with valid values");
      return;
    }

    if (!currentVendor?.vendor_id) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.post(`${apiBase}/api/vendor/delivery/${currentVendor.vendor_id}/zones`, {
        city: newDeliveryZone.city,
        province: newDeliveryZone.province,
        delivery_price: parseFloat(newDeliveryZone.delivery_price)
      });

      if (response.data.success) {
        setNewDeliveryZone({ city: '', province: '', region: '', delivery_price: 0 });
        setShowAddZoneForm(false);
        fetchDeliveryPricing(); // Refresh the list
        updateStatus("success", "Delivery zone added successfully");
      } else {
        updateStatus("error", response.data.error || "Failed to add delivery zone");
      }
    } catch (error) {
      console.error("Error adding delivery zone:", error);
      updateStatus("error", "Failed to add delivery zone. Please try again.");
    }
  };

   const handleRemoveDeliveryZone = async (deliveryPricingId) => {
     if (!currentVendor?.vendor_id) return;
     
     try {
       const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
       const response = await axios.delete(`${apiBase}/api/vendor/delivery/${currentVendor.vendor_id}/zones/${deliveryPricingId}`);

       if (response.data.success) {
         fetchDeliveryPricing(); // Refresh the list
         updateStatus("success", "Delivery zone removed successfully");
       } else {
         updateStatus("error", response.data.error || "Failed to remove delivery zone");
       }
     } catch (error) {
       console.error("Error removing delivery zone:", error);
       updateStatus("error", "Failed to remove delivery zone. Please try again.");
     }
   };

  // Fetch vendor orders
  const fetchVendorOrders = useCallback(async () => {
    if (!currentVendor?.vendor_id) {
      console.log('❌ Cannot fetch vendor orders: no vendor_id', currentVendor);
      return [];
    }
    
    try {
      console.log('🔄 Fetching orders for vendor_id:', currentVendor.vendor_id);
      setOrdersLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/orders/vendor/${currentVendor.vendor_id}`);
      
      console.log('📦 Vendor orders response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Vendor orders found:', response.data.orders.length);
        console.log('📊 Order details:', response.data.orders.map(o => ({
          id: o.order_id,
          status: o.status,
          payment_status: o.payment_status,
          customer: `${o.customer_fname} ${o.customer_lname}`,
          amount: o.total_amount
        })));
        console.log('✅ Successfully fetched orders:', response.data.orders?.length || 0);
        console.log('📋 Orders data:', response.data.orders);
        setVendorOrders(response.data.orders);
        return response.data.orders;
      } else {
        console.log('❌ API returned unsuccessful response:', response.data);
        setVendorOrders([]);
        return [];
      }
    } catch (error) {
      console.error("❌ Error fetching vendor orders:", error);
      setVendorOrders([]);
      return [];
    } finally {
      setOrdersLoading(false);
    }
  }, [currentVendor]);

  // Fetch vendor transactions
  const fetchVendorTransactions = useCallback(async () => {
    if (!currentVendor?.vendor_id) {
      console.log('❌ Cannot fetch vendor transactions: no vendor_id', currentVendor);
      return;
    }
    
    try {
      console.log('🔄 Fetching transactions for vendor_id:', currentVendor.vendor_id);
      setTransactionsLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const queryParams = new URLSearchParams({
        ...transactionFilters,
        page: 1,
        limit: 50
      });
      
      const response = await axios.get(`${apiBase}/api/orders/vendor/${currentVendor.vendor_id}/transactions?${queryParams}`);
      
      console.log('💰 Vendor transactions response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Vendor transactions found:', response.data.transactions.length);
        setTransactions(response.data.transactions);
        setTransactionStats(response.data.statistics);
      } else {
        console.log('❌ Failed to fetch vendor transactions:', response.data.error);
        setTransactions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching vendor transactions:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [currentVendor, transactionFilters]);

   // Manual refresh vendor orders
   const handleRefreshOrders = async () => {
     if (!currentVendor?.vendor_id) return;
     
     try {
       const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
       const response = await axios.get(`${apiBase}/api/orders/vendor/${currentVendor.vendor_id}`);
       
       if (response.data.success) {
         setVendorOrders(response.data.orders);
         console.log('🔄 Manually refreshed vendor orders:', response.data.orders?.length || 0);
       } else {
         console.log('❌ API returned unsuccessful response:', response.data);
       }
     } catch (error) {
       console.error('❌ Error refreshing vendor orders:', error);
    }
   };

   // Fetch notifications for vendor
  const fetchNotifications = useCallback(async () => {
     try {
       if (!currentVendor?.vendor_id) return;

       const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
       
       setNotificationsLoading(true);
       
       const response = await axios.get(`${apiBase}/api/notifications/vendor/${currentVendor.user_id}`, {
         headers: {
           Authorization: `Bearer ${sessionStorage.getItem('token')}`
         }
       });

       if (response.data.success) {
         setNotifications(response.data.notifications);
         console.log('📬 Fetched vendor notifications:', response.data.notifications.length);
         console.log('📬 Notifications data:', response.data.notifications);
         console.log('📬 API URL called:', `${apiBase}/api/notifications/vendor/${currentVendor.user_id}`);
         console.log('📬 User ID used:', currentVendor.user_id);
       }
     } catch (error) {
       console.error('Error fetching vendor notifications:', error);
     } finally {
       setNotificationsLoading(false);
     }
  }, [currentVendor]);

   // Fetch unread notification count for vendor
  const fetchUnreadCount = useCallback(async () => {
     try {
       if (!currentVendor?.vendor_id) return;

       const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
       
       const response = await axios.get(`${apiBase}/api/notifications/vendor/${currentVendor.user_id}/unread-count`, {
         headers: {
           Authorization: `Bearer ${sessionStorage.getItem('token')}`
         }
       });

       if (response.data.success) {
         setUnreadCount(response.data.unread_count);
       }
     } catch (error) {
       console.error('Error fetching unread count:', error);
     }
  }, [currentVendor]);

   // Mark notification as read
   const markNotificationAsRead = async (notificationId) => {
     try {
       const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
       
       await axios.put(`${apiBase}/api/notifications/${notificationId}/read`, {}, {
         headers: {
           Authorization: `Bearer ${sessionStorage.getItem('token')}`
         }
       });

       // Update local state
       setNotifications(prev => prev.map(n => 
         n.id === notificationId ? { ...n, is_read: true } : n
       ));
       
       // Update unread count
       setUnreadCount(prev => Math.max(0, prev - 1));
       
       console.log(`📖 Marked vendor notification ${notificationId} as read`);
     } catch (error) {
       console.error('Error marking notification as read:', error);
     }
   };

   // Mark all notifications as read
   const markAllNotificationsAsRead = async () => {
     try {
       const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
       
       await axios.put(`${apiBase}/api/notifications/vendor/${currentVendor.user_id}/mark-all-read`, {}, {
         headers: {
           Authorization: `Bearer ${sessionStorage.getItem('token')}`
         }
       });

       // Update local state - mark all notifications as read
       setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
       
       // Reset unread count to 0
       setUnreadCount(0);
       
       console.log(`📖 Marked all vendor notifications as read`);
     } catch (error) {
       console.error('Error marking all notifications as read:', error);
       alert('Failed to mark all notifications as read. Please try again.');
     }
   };

  // Handle decline reason submission
  const handleDeclineReasonSubmit = () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining the order.');
      return;
    }
    
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.order_id, 'cancelled', null, declineReason.trim());
      setShowDeclineReasonModal(false);
      setSelectedOrder(null);
      setDeclineReason('');
    }
  };



  // Handle prepare order
  const handlePrepareOrder = (order) => {
    setSelectedOrder(order);
    setShowPrepareModal(true);
  };

  // Confirm prepare order
  const confirmPrepareOrder = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.order_id, 'preparing');
      setShowPrepareModal(false);
      setSelectedOrder(null);
    }
  };

  // Handle ready for delivery
  const handleReadyOrder = (order) => {
    setSelectedOrder(order);
    setShowReadyModal(true);
  };

  // Confirm ready for delivery
  const confirmReadyOrder = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.order_id, 'out_for_delivery');
      setShowReadyModal(false);
      setSelectedOrder(null);
    }
  };

  const hasPendingRemainingBalance = (order, method) => {
    if (!order) return false;
    const remainingBalance = parseFloat(order.remaining_balance ?? 0) || 0;
    if (remainingBalance <= 0) return false;

    const remainingMethod = (order.remaining_payment_method || '').toLowerCase();
    const targetMethod = (method || '').toLowerCase();
    const isPartial = order.payment_status === 'partial';
    const isConfirmed = Boolean(order.remaining_payment_confirmed_at);

    return isPartial && remainingMethod === targetMethod && !isConfirmed;
  };

  // Handle mark as delivered
  const handleDeliveredOrder = (order) => {
    const remainingBalance = parseFloat(order?.remaining_balance ?? 0) || 0;
    const isCodPending = hasPendingRemainingBalance(order, 'cod');
    const isGCashPending = hasPendingRemainingBalance(order, 'gcash');

    if (isCodPending) {
      updateStatus(
        "error",
        `Cannot mark as delivered. COD payment of ₱${remainingBalance.toFixed(2)} is still pending. Please confirm COD payment collection first.`
      );
      return;
    }

    if (isGCashPending) {
      updateStatus(
        "error",
        `Cannot mark as delivered. GCash payment proof for ₱${remainingBalance.toFixed(2)} is still pending. Please verify the customer's payment before completing delivery.`
      );
      return;
    }
    
    setSelectedOrder(order);
    setShowDeliveredModal(true);
  };

  // Confirm mark as delivered
  const confirmDeliveredOrder = () => {
    if (selectedOrder) {
      const remainingBalance = parseFloat(selectedOrder?.remaining_balance ?? 0) || 0;
      const isCodPending = hasPendingRemainingBalance(selectedOrder, 'cod');
      const isGCashPending = hasPendingRemainingBalance(selectedOrder, 'gcash');

      if (isCodPending) {
        updateStatus("error", `Cannot mark as delivered. COD payment of ₱${remainingBalance.toFixed(2)} is still pending. Please confirm COD payment collection first.`);
        setShowDeliveredModal(false);
        setSelectedOrder(null);
        return;
      }

      if (isGCashPending) {
        updateStatus("error", `Cannot mark as delivered. GCash payment proof for ₱${remainingBalance.toFixed(2)} is still pending. Please verify the customer's payment before completing delivery.`);
        setShowDeliveredModal(false);
        setSelectedOrder(null);
        return;
      }
      
      updateOrderStatus(selectedOrder.order_id, 'delivered');
      setShowDeliveredModal(false);
      setSelectedOrder(null);
    }
  };

  // Handle COD payment confirmation button click - show modal
  const handleConfirmCODPaymentClick = (orderId, remainingBalance) => {
    // Validate remaining balance before opening modal
    const balance = parseFloat(remainingBalance) || 0;
    if (balance <= 0) {
      updateStatus("error", "No remaining balance to collect. This order may already be fully paid.");
      return;
    }
    
    console.log('💰 Opening COD payment modal:', { orderId, remainingBalance: balance });
    setCodPaymentData({ 
      orderId, 
      amount: balance
    });
    setShowCODPaymentModal(true);
  };

  // Handle COD payment confirmation
  const handleConfirmCODPayment = async () => {
    if (!codPaymentData.orderId || !codPaymentData.amount) {
      updateStatus("error", "Missing order information. Please try again.");
      return;
    }
    
    setIsConfirmingCODPayment(true);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Ensure amount is a number
      const amountToSend = parseFloat(codPaymentData.amount);
      if (isNaN(amountToSend) || amountToSend <= 0) {
        updateStatus("error", "Invalid payment amount. Please try again.");
        setIsConfirmingCODPayment(false);
        return;
      }

      // First, refresh order data to get the latest remaining balance
      const currentOrders = await fetchVendorOrders();
      
      // Find the current order to verify it still has remaining balance
      const currentOrder = currentOrders.find(o => o.order_id === codPaymentData.orderId);
      if (currentOrder) {
        const currentRemainingBalance = parseFloat(currentOrder.remaining_balance || 0);
        if (currentRemainingBalance <= 0) {
          updateStatus("error", "No remaining balance to collect. This order has already been fully paid.");
          setIsConfirmingCODPayment(false);
          setShowCODPaymentModal(false);
          setCodPaymentData({ orderId: null, amount: null });
          return;
        }
        
        // Update amount to match current remaining balance
        const actualAmount = currentRemainingBalance;
        console.log('💰 Confirming COD payment:', {
          orderId: codPaymentData.orderId,
          requestedAmount: amountToSend,
          actualRemainingBalance: actualAmount
        });

        const response = await axios.post(`${apiBase}/api/orders/${codPaymentData.orderId}/confirm-cod-payment`, {
          amount_collected: actualAmount
        });

        console.log('✅ COD payment confirmation response:', response.data);

        if (response.data.success) {
          // Close modal
          setShowCODPaymentModal(false);
          const confirmedOrderId = codPaymentData.orderId;
          setCodPaymentData({ orderId: null, amount: null });
          
          // Refresh orders first to get latest data
          const updatedOrders = await fetchVendorOrders();
          
          // Update selectedOrder immediately if it's the same order and modal is still open
          if (selectedOrder && selectedOrder.order_id === confirmedOrderId && updatedOrders.length > 0) {
            const updatedOrder = updatedOrders.find(o => o.order_id === confirmedOrderId);
            if (updatedOrder) {
              setSelectedOrder(updatedOrder);
            } else {
              // Fallback: update with expected values
              setSelectedOrder({
                ...selectedOrder,
                payment_status: 'paid',
                remaining_balance: 0,
                remaining_payment_method: null
              });
            }
          }
          
          updateStatus("success", `COD payment of ₱${parseFloat(actualAmount).toFixed(2)} confirmed successfully!`);
        } else {
          const errorMsg = response.data.error || "Failed to confirm COD payment";
          console.error('❌ COD payment confirmation failed:', errorMsg);
          updateStatus("error", errorMsg);
        }
      } else {
        updateStatus("error", "Order not found. Please refresh and try again.");
      }
    } catch (error) {
      console.error('❌ Error confirming COD payment:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to confirm COD payment. Please try again.";
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });
      updateStatus("error", errorMessage);
      
      // Don't close modal on error so user can try again or check details
    } finally {
      setIsConfirmingCODPayment(false);
    }
  };

   // Update order status (approve/decline)
   const updateOrderStatus = async (orderId, newStatus, previousStatus = null, declineReason = null) => {
     try {
       console.log('🔄 Updating order status:', orderId, 'to', newStatus);
       if (declineReason) {
         console.log('Decline reason:', declineReason);
       }
       
       // Store previous status for undo functionality (if not provided, get from current orders)
       if (!previousStatus) {
         const currentOrder = vendorOrders.find(o => o.order_id === orderId);
         previousStatus = currentOrder?.status;
       }
       
       const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
       const requestBody = { status: newStatus };
       if (newStatus === 'cancelled' && declineReason) {
         requestBody.decline_reason = declineReason;
       }
       
       const response = await axios.put(`${apiBase}/api/orders/${orderId}/status`, requestBody);
       
       if (response.data.success) {
         const statusMessage = newStatus === 'preparing' ? 'Ice cream preparation started! Customer has been notified.' :
                              newStatus === 'out_for_delivery' ? 'Order marked as out for delivery! Customer will be notified.' :
                              newStatus === 'delivered' ? 'Order marked as delivered! Thank you for completing this order.' :
                              newStatus === 'confirmed' ? 'Order approved! Customer can now proceed with payment.' :
                              newStatus === 'cancelled' ? 'Order has been declined.' :
                              `Order status updated to ${newStatus}`;
         
         // Store recent change for potential undo (only for certain actions)
         if (['confirmed', 'preparing', 'out_for_delivery'].includes(newStatus)) {
           setRecentStatusChange({
             orderId,
             newStatus,
             previousStatus,
             timestamp: Date.now()
           });
           
           // Clear undo option after 30 seconds
           setTimeout(() => {
             setRecentStatusChange(null);
           }, 30000);
         }
         
         updateStatus("success", statusMessage);
         fetchVendorOrders(); // Refresh the orders list
       } else {
         updateStatus("error", response.data.error || "Failed to update order status");
       }
     } catch (error) {
       console.error("❌ Error updating order status:", error);
       updateStatus("error", "Failed to update order status. Please try again.");
     }
   };

  // Undo recent status change
  const undoStatusChange = async () => {
    if (!recentStatusChange) return;
    
    try {
      console.log('🔄 Undoing status change for order:', recentStatusChange.orderId);
      await updateOrderStatus(recentStatusChange.orderId, recentStatusChange.previousStatus, recentStatusChange.newStatus);
      setRecentStatusChange(null);
      updateStatus("success", "Status change has been undone successfully.");
    } catch (error) {
      console.error("❌ Error undoing status change:", error);
      updateStatus("error", "Failed to undo status change. Please manually update if needed.");
    }
  };

  // Handle drum return pickup
  const handleDrumReturnPickup = async (orderId) => {
    showConfirmModalDialog(
      'Mark Container as Returned',
      'Mark this container as returned? This will update the status to "returned".',
      () => confirmDrumReturnPickup(orderId),
      'Mark as Returned',
      'Cancel',
      'warning'
    );
  };

  const confirmDrumReturnPickup = async (orderId) => {
    setShowConfirmModal(false);
    setDrumReturnLoading(orderId);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.post(`${apiBase}/api/orders/${orderId}/drum-return`, {
        drum_status: 'returned',
        return_requested_at: new Date().toISOString()
      });
      
      if (response.data.success) {
        updateStatus("success", `Container for Order #${orderId} marked as returned successfully!`);
        // Refresh orders to show updated status
        fetchVendorOrders();
      } else {
        updateStatus("error", response.data.error || "Failed to update container status");
      }
    } catch (error) {
      console.error('Error updating container return status:', error);
      updateStatus("error", "Failed to update container status. Please try again.");
    } finally {
      setDrumReturnLoading(null);
    }
  };

  const handleDrumSizeChange = (size, value) => {
    setTempDrums((prev) => ({
      ...prev,
      [size]: parseInt(value) || 0,
    }));
  };

  const getTotalDrums = () => {
    return availableDrums.small + availableDrums.medium + availableDrums.large;
  };

  // Show confirmation modal
  const showConfirmModalDialog = (title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning') => {
    setConfirmModalData({
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      type
    });
    setShowConfirmModal(true);
  };

  // Handle bulk marking containers as returned
  const handleBulkMarkReturned = async () => {
    const containerReturnOrders = vendorOrders.filter(order => 
      order.drum_status === 'not returned' || order.drum_status === 'return_requested'
    );

    if (containerReturnOrders.length === 0) {
      updateStatus("info", "No containers are currently pending return.");
      return;
    }

    showConfirmModalDialog(
      'Mark All Containers as Returned',
      `Mark ${containerReturnOrders.length} containers as returned? This will update their status to "returned".`,
      () => confirmBulkMarkReturned(),
      'Mark All as Returned',
      'Cancel',
      'warning'
    );
  };

  const confirmBulkMarkReturned = async () => {
    setShowConfirmModal(false);
    setDrumReturnLoading('bulk');
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      let successCount = 0;
      let errorCount = 0;

      // Get container return orders
      const containerReturnOrders = vendorOrders.filter(order => 
        order.drum_status === 'not returned' || order.drum_status === 'return_requested'
      );

      // Process each order individually
      for (const order of containerReturnOrders) {
        try {
          const response = await axios.post(`${apiBase}/api/orders/${order.order_id}/drum-return`, {
            drum_status: 'returned',
            return_requested_at: new Date().toISOString()
          });
          
          if (response.data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error updating order ${order.order_id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        updateStatus("success", `Successfully marked ${successCount} containers as returned!`);
        // Refresh orders to show updated status
        fetchVendorOrders();
        setSelectedReturnOrders([]); // Clear selection
      }
      
      if (errorCount > 0) {
        updateStatus("error", `Failed to update ${errorCount} containers. Please try again.`);
      }
    } catch (error) {
      console.error('Error in bulk mark returned:', error);
      updateStatus("error", "Failed to mark containers as returned. Please try again.");
    } finally {
      setDrumReturnLoading(null);
    }
  };

  // Handle marking selected containers as returned
  const handleMarkSelectedReturned = async () => {
    if (selectedReturnOrders.length === 0) {
      updateStatus("info", "Please select containers to mark as returned.");
      return;
    }

    showConfirmModalDialog(
      'Mark Selected Containers as Returned',
      `Mark ${selectedReturnOrders.length} selected container(s) as returned?`,
      () => confirmMarkSelectedReturned(),
      'Mark Selected',
      'Cancel',
      'warning'
    );
  };

  const confirmMarkSelectedReturned = async () => {
    setShowConfirmModal(false);
    setDrumReturnLoading('selected');
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      let successCount = 0;
      let errorCount = 0;

      // Process each selected order
      for (const orderId of selectedReturnOrders) {
        try {
          const response = await axios.post(`${apiBase}/api/orders/${orderId}/drum-return`, {
            drum_status: 'returned',
            return_requested_at: new Date().toISOString()
          });
          
          if (response.data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error updating order ${orderId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        updateStatus("success", `Successfully marked ${successCount} container(s) as returned!`);
        // Refresh orders to show updated status
        fetchVendorOrders();
        setSelectedReturnOrders([]); // Clear selection
      }
      
      if (errorCount > 0) {
        updateStatus("error", `Failed to update ${errorCount} container(s). Please try again.`);
      }
    } catch (error) {
      console.error('Error in mark selected returned:', error);
      updateStatus("error", "Failed to mark containers as returned. Please try again.");
    } finally {
      setDrumReturnLoading(null);
    }
  };

  // Toggle container selection
  const handleToggleReturnSelection = (orderId) => {
    setSelectedReturnOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // Select all containers for return
  const handleSelectAllReturns = () => {
    const containerReturnOrders = vendorOrders.filter(order => 
      order.drum_status === 'not returned' || order.drum_status === 'return_requested'
    );
    const allOrderIds = containerReturnOrders.map(order => order.order_id);
    
    if (selectedReturnOrders.length === allOrderIds.length) {
      setSelectedReturnOrders([]); // Deselect all
    } else {
      setSelectedReturnOrders(allOrderIds); // Select all
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = [...flavorImages, ...files];
    setFlavorImages(newImages);

    // Create previews for new images
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = flavorImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);

    setFlavorImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleFlavorFormChange = (field, value) => {
    setFlavorForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fetchSavedFlavors = useCallback(async () => {
    if (!currentVendor?.vendor_id) {
      console.log('❌ Cannot fetch saved flavors: no vendor_id', currentVendor);
      return;
    }
    
    try {
      console.log('🔄 Fetching saved flavors for vendor_id:', currentVendor.vendor_id);
      console.log('🔄 Current vendor object:', currentVendor);
      setFlavorsLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const apiUrl = `${apiBase}/api/vendor/flavors/${currentVendor.vendor_id}`;
      console.log('🔄 API URL:', apiUrl);
      
      const response = await axios.get(apiUrl);
      
      console.log('📦 Saved flavors response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Saved flavors found:', response.data.flavors.length, response.data.flavors);
        setSavedFlavors(response.data.flavors);
      } else {
        console.log('❌ API returned unsuccessful response:', response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching flavors:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
    } finally {
      setFlavorsLoading(false);
    }
  }, [currentVendor]);

  // Fetch drum pricing and availability from database
  const fetchDrumData = useCallback(async () => { 
    if (!currentVendor?.vendor_id) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/vendor/drums/${currentVendor.vendor_id}/pricing`);
      
      if (response.data.success) {
        const drums = response.data.drums;
        
        // Update drum prices for display
        setDrumPrices({
          small: drums.small.price,
          medium: drums.medium.price,
          large: drums.large.price
        });
        
        // Update available drums
        setAvailableDrums({
          small: drums.small.stock,
          medium: drums.medium.stock,
          large: drums.large.stock
        });
        
        // Update drum capacity
        setDrumCapacity({
          small: drums.small.gallons,
          medium: drums.medium.gallons,
          large: drums.large.gallons
        });
      }
    } catch (error) {
      console.error("Error fetching drum data:", error);
    }
  }, [currentVendor]);

  const openImageModal = (imageUrls, flavorName) => {
    setSelectedFlavorImages(imageUrls);
    setSelectedFlavorName(flavorName);
    setCurrentImageIndex(0);
    setImageModalOpen(true);
  };

  const closeImageModal = useCallback(() => {
    setImageModalOpen(false);
    setSelectedFlavorImages([]);
    setSelectedFlavorName("");
    setCurrentImageIndex(0);
  }, []);

  const handleViewPaymentProof = (order) => {
    setSelectedOrderForPaymentProof(order);
    setShowPaymentProofModal(true);
  };

  const handleClosePaymentProofModal = (e) => {
    if (e.target === e.currentTarget) {
      setShowPaymentProofModal(false);
      setSelectedOrderForPaymentProof(null);
    }
  };

  const handleToggleOrderDetails = (orderId) => {
    const isExpanding = expandedOrderId !== orderId;
    setExpandedOrderId(isExpanding ? orderId : null);
    
    // Auto-scroll to the expanded content after a short delay to allow DOM update
    if (isExpanding) {
      setTimeout(() => {
        const orderElement = document.getElementById(`order-${orderId}`);
        if (orderElement) {
          orderElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  };

    const startEditFlavor = (flavor) => { 
    setEditingFlavor(flavor);
    setIsEditingFlavor(true);
    
    // Parse existing images
    let existingImages = [];
    try {
      existingImages = JSON.parse(flavor.image_url || '[]');
    } catch (e) {
      if (flavor.image_url) {
        existingImages = [flavor.image_url];
      }
    }
    
    // Pre-fill the form
    setFlavorForm({
      name: flavor.flavor_name,
      description: flavor.flavor_description,
    });
    
    // Set existing images as previews
    setImagePreviews(existingImages.map((img, index) => ({
      id: `existing-${index}`,
      url: getImageUrl(img, process.env.REACT_APP_API_URL || "http://localhost:3001") || `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${img}`,
      isExisting: true,
      filename: img
    })));
    setFlavorImages([]); // Clear new images
    
    // Scroll to the form
    document.getElementById('flavor-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEditFlavor = () => {
    setEditingFlavor(null);
    setIsEditingFlavor(false);
    setFlavorForm({ name: "", description: "" });
    setFlavorImages([]);
    setImagePreviews([]);
  };

  const confirmDeleteFlavor = (flavor) => {
    setFlavorToDelete(flavor);
    setDeleteConfirmOpen(true);
  };

  const cancelDeleteFlavor = () => {
    setDeleteConfirmOpen(false);
    setFlavorToDelete(null);
  };

  const deleteFlavor = async () => {
    if (!flavorToDelete) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.delete(
        `${apiBase}/api/vendor/flavors/${flavorToDelete.flavor_id}`
      );
      
      if (response.data.success) {
        updateStatus("success", `Flavor "${flavorToDelete.flavor_name}" deleted successfully!`);
        await fetchSavedFlavors(); // Refresh the list
        setDeleteConfirmOpen(false);
        setFlavorToDelete(null);
      } else {
        updateStatus("error", response.data.error || "Failed to delete flavor");
      }
    } catch (error) {
      console.error("Error deleting flavor:", error);
      const apiError = error?.response?.data;
      if (apiError?.error) {
        updateStatus("error", apiError.error);
      } else {
        updateStatus("error", "Failed to delete flavor. Please try again.");
      }
    }
  };

  const updateFlavorStoreStatus = async (flavorId, newStatus) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.patch(
        `${apiBase}/api/vendor/flavors/${flavorId}/store-status`,
        { store_status: newStatus }
      );
      
      if (response.data.success) {
        const statusMessage = newStatus === 'published' ? 'published to store' : 'status updated';
        updateStatus("success", `Flavor ${statusMessage} successfully!`);
        await fetchSavedFlavors(); // Refresh the list
      } else {
        updateStatus("error", response.data.error || "Failed to update flavor status");
      }
    } catch (error) {
      console.error("Error updating flavor store status:", error);
      const apiError = error?.response?.data;
      const isUpgradeRequired = error?.response?.status === 403 && apiError?.upgrade_required;

      if (isUpgradeRequired) {
        setConfirmModalData({
          title: 'Upgrade Required',
          message: apiError?.error || 'You reached your free plan limit. Upgrade your subscription to publish more flavors.',
          confirmText: 'Go to Subscription',
          cancelText: 'Maybe Later',
          type: 'warning',
          onConfirm: () => {
            setActiveView('subscription');
            setShowConfirmModal(false);
          }
        });
        setShowConfirmModal(true);
        updateStatus(
          "error",
          apiError?.error || "You reached your free plan limit. Upgrade your subscription to publish more flavors."
        );
      } else if (apiError?.error) {
        updateStatus("error", apiError.error);
      } else {
        updateStatus("error", "Failed to update flavor status. Please try again.");
      }
    }
  };

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => 
      prev === selectedFlavorImages.length - 1 ? 0 : prev + 1
    );
  }, [selectedFlavorImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? selectedFlavorImages.length - 1 : prev - 1
    );
  }, [selectedFlavorImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!imageModalOpen) return;
      
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'Escape') {
        closeImageModal();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [imageModalOpen, selectedFlavorImages.length, nextImage, prevImage, closeImageModal]);

  // Handle window resize for sidebar responsiveness
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      // Only auto-adjust if transitioning between mobile and desktop
      if (isDesktop && !isSidebarOpen) {
        // Optionally auto-open on desktop
        // setIsSidebarOpen(true);
      } else if (!isDesktop && isSidebarOpen) {
        // Auto-close when resizing to mobile
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Helper function to check if an order is a walk-in order
  const isWalkInOrder = (order) => {
    if (!order || !order.delivery_address) return false;
    const fullAddress = order.delivery_address || '';
    return fullAddress.includes('Customer: ') && fullAddress.includes('Contact: ');
  };

  // Handle cancel walk-in order button click
  const handleCancelWalkInOrderClick = (order) => {
    setOrderToCancel(order);
    setCancelReason('');
    setShowCancelWalkInModal(true);
  };

  // Confirm cancel walk-in order
  const handleCancelWalkInOrder = async () => {
    if (!orderToCancel) return;
    
    try {
      await updateOrderStatus(orderToCancel.order_id, 'cancelled', null, cancelReason.trim() || 'Cancelled by vendor');
      setShowCancelWalkInModal(false);
      setOrderToCancel(null);
      setCancelReason('');
      updateStatus("success", "Walk-in order cancelled successfully.");
      
      // Refresh availability if a delivery date is selected
      // This ensures the availability count updates after drums are released
      if (walkInDeliveryDate && currentVendor?.vendor_id) {
        try {
          const response = await getAvailabilityByDate(currentVendor.vendor_id, walkInDeliveryDate);
          if (response.success && response.availability) {
            const simplifiedAvailability = {
              small: response.availability.small?.available_count || 0,
              medium: response.availability.medium?.available_count || 0,
              large: response.availability.large?.available_count || 0
            };
            setWalkInDateAvailability(simplifiedAvailability);
          }
        } catch (error) {
          console.error('Error refreshing availability after cancellation:', error);
        }
      }
      
      // Refresh dashboard data to update order list
      if (currentVendor?.vendor_id) {
        fetchDashboardData(currentVendor.vendor_id);
      }
    } catch (error) {
      console.error("Error cancelling walk-in order:", error);
      updateStatus("error", "Failed to cancel order. Please try again.");
    }
  };

  // Helper function to get available drums for walk-in orders
  const getWalkInAvailableDrums = (size) => {
    if (!size || !size.trim()) {
      return 0;
    }
    
    // Normalize size to lowercase for consistent lookup
    const normalizedSize = size.toLowerCase();
    
    // If we have date-specific availability, use that
    if (walkInDateAvailability) {
      let dateAvail = walkInDateAvailability[size] ?? walkInDateAvailability[normalizedSize];
      
      // If still not found, try other case variations
      if (dateAvail === undefined || dateAvail === null) {
        const capitalized = size.charAt(0).toUpperCase() + size.slice(1).toLowerCase();
        dateAvail = walkInDateAvailability[capitalized] ?? walkInDateAvailability[normalizedSize];
      }
      
      // Return the value if found (even if it's 0, which is a valid value)
      if (dateAvail !== undefined && dateAvail !== null) {
        return dateAvail;
      }
    }
    
    // Fallback: return 0 if no date availability is available
    return 0;
  };

  // Walk-in order functions
  const addToWalkInCart = () => {
    if (!selectedFlavor || !selectedSize) {
      updateStatus("error", "Please select a flavor and size");
      return;
    }

    const flavor = savedFlavors.find(f => f.flavor_id === parseInt(selectedFlavor));
    if (!flavor) {
      updateStatus("error", "Selected flavor not found");
      return;
    }

    const priceKey = `${selectedSize}_price`;
    const price = flavor[priceKey];
    
    if (!price || price === 0) {
      updateStatus("error", `Price not set for ${selectedSize} size`);
      return;
    }

    // If delivery date is selected, check availability
    if (walkInDeliveryDate) {
      const availableDrums = getWalkInAvailableDrums(selectedSize);
      
      if (availableDrums === 0) {
        const dateDisplay = formatPhilippineDateOnly(walkInDeliveryDate);
        updateStatus("error", `No ${selectedSize} drums available for ${dateDisplay}. Please select a different date or size.`);
        return;
      }

      // Calculate total quantity in cart for this size (including current item)
      const existingQuantityForSize = walkInCart
        .filter(item => item.size.toLowerCase() === selectedSize.toLowerCase())
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const totalQuantityAfterAdd = existingQuantityForSize + walkInQuantity;
      
      // Check if requested quantity exceeds available
      if (totalQuantityAfterAdd > availableDrums) {
        const remaining = availableDrums - existingQuantityForSize;
        updateStatus("error", `Only ${remaining} ${selectedSize} drum(s) available for ${formatPhilippineDateOnly(walkInDeliveryDate)}. ${existingQuantityForSize > 0 ? `You already have ${existingQuantityForSize} in cart.` : ''} Please reduce quantity.`);
        return;
      }
    }

    const cartItem = {
      id: Date.now(),
      flavor_id: flavor.flavor_id,
      flavor_name: flavor.flavor_name,
      size: selectedSize,
      quantity: walkInQuantity,
      price: price,
      subtotal: price * walkInQuantity
    };

    setWalkInCart([...walkInCart, cartItem]);
    setSelectedFlavor('');
    setSelectedSize('');
    setWalkInQuantity(1);
    updateStatus("success", "Item added to cart");
    
    // Auto-scroll to Order Items section on mobile
    if (window.innerWidth < 768) {
      setTimeout(() => {
        const orderItemsSection = document.getElementById('walk-in-order-items');
        if (orderItemsSection) {
          orderItemsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  };

  const removeFromWalkInCart = (itemId) => {
    setWalkInCart(walkInCart.filter(item => item.id !== itemId));
  };

  const getWalkInCartTotal = () => {
    return walkInCart.reduce((total, item) => total + item.subtotal, 0);
  };

  const submitWalkInOrder = async () => {
    if (walkInCart.length === 0) {
      updateStatus("error", "Please add items to the order");
      return;
    }

    // Check subscription limits for orders (monthly limit)
    if (subscriptionLimits.order_limit !== -1) {
      // Get current month's order count
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentMonthOrders = vendorOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });
      
      if (currentMonthOrders.length >= subscriptionLimits.order_limit) {
        setConfirmModalData({
          title: 'Monthly Order Limit Reached',
          message: `You have reached your monthly order limit of ${subscriptionLimits.order_limit} for your ${subscriptionLimits.subscription_plan} plan. To process more orders, you need to upgrade your subscription.`,
          confirmText: 'Go to Subscription',
          cancelText: 'Cancel',
          type: 'warning',
          onConfirm: () => {
            setActiveView('subscription');
            setShowConfirmModal(false);
          }
        });
        setShowConfirmModal(true);
        return;
      }
    }

    // Validate customer name
    if (!customerName.trim()) {
      updateStatus("error", "Please enter customer's name");
      return;
    }

    // Validate customer contact
    if (!customerContact.trim()) {
      updateStatus("error", "Please enter customer's contact number");
      return;
    }

    // Validate customer address
    if (!customerAddress.street || !customerAddress.barangay || !customerAddress.city) {
      updateStatus("error", "Please fill in customer's delivery address (Street, Barangay, and City are required)");
      return;
    }

    // Validate delivery date and time
    if (!walkInDeliveryDate || !walkInDeliveryTime) {
      updateStatus("error", "Please select delivery date and time");
      return;
    }

    // Validate availability for all items in cart before submitting
    for (const item of walkInCart) {
      const availableDrums = getWalkInAvailableDrums(item.size);
      
      // Calculate total quantity for this size in cart
      const totalQuantityForSize = walkInCart
        .filter(cartItem => cartItem.size.toLowerCase() === item.size.toLowerCase())
        .reduce((sum, cartItem) => sum + cartItem.quantity, 0);
      
      if (availableDrums === 0) {
        updateStatus("error", `No ${item.size} drums available for ${formatPhilippineDateOnly(walkInDeliveryDate)}. Please remove or change these items.`);
        return;
      }
      
      if (totalQuantityForSize > availableDrums) {
        updateStatus("error", `Only ${availableDrums} ${item.size} drum(s) available for ${formatPhilippineDateOnly(walkInDeliveryDate)}, but you have ${totalQuantityForSize} in cart. Please reduce quantity.`);
        return;
      }
    }

    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Format customer address with customer info
      const customerInfo = `Customer: ${customerName}, Contact: ${customerContact}${customerEmail ? `, Email: ${customerEmail}` : ''}`;
      const deliveryAddress = [
        customerInfo,
        customerAddress.street,
        customerAddress.barangay,
        customerAddress.city,
        customerAddress.province,
        customerAddress.postalCode
      ].filter(Boolean).join(', ');

      // Combine date and time for delivery_datetime
      const deliveryDateTime = `${walkInDeliveryDate} ${walkInDeliveryTime}:00`;

      const orderItems = walkInCart.map(item => ({
        flavor_id: item.flavor_id,
        size: item.size,
        quantity: item.quantity,
        price: item.price
      }));

      // Determine payment status and calculate payment amount based on payment option
      const totalAmount = getWalkInCartTotal();
      let paymentStatus = 'unpaid';
      let paymentAmount = 0;
      
      if (walkInPaymentOption === 'partial') {
        // 50% down payment
        paymentStatus = 'partial';
        paymentAmount = totalAmount * 0.5; // 50% of total
      } else {
        // Full payment - for walk-in orders, we assume they pay full amount
        paymentStatus = 'paid';
        paymentAmount = totalAmount;
      }

      const orderPayload = {
        customer_id: currentVendor.user_id, // Use vendor's user_id as placeholder for walk-in
        vendor_id: currentVendor.vendor_id,
        delivery_address: deliveryAddress,
        delivery_datetime: deliveryDateTime,
        payment_method: walkInPaymentMethod,
        payment_type: walkInPaymentOption,
        subtotal: totalAmount,
        delivery_fee: 0,
        total_amount: totalAmount,
        payment_amount: paymentAmount, // Amount actually paid (50% for partial, 100% for full)
        status: 'confirmed', // Walk-in orders are automatically approved
        payment_status: paymentStatus,
        items: orderItems
      };

      console.log('Creating walk-in order:', orderPayload);

      const response = await axios.post(`${apiBase}/api/orders`, orderPayload);

      if (response.data.success) {
        updateStatus("success", `Walk-in order #${response.data.order_id} created successfully!`);
        setShowWalkInSuccess(true);
        
        // Scroll to top to show success message
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        
        // Clear the cart and form
        setWalkInCart([]);
        setCustomerName('');
        setCustomerContact('');
        setCustomerEmail('');
        setCustomerAddress({
          street: '',
          barangay: '',
          city: '',
          province: '',
          postalCode: ''
        });
        setWalkInPaymentMethod('cash');
        setWalkInPaymentOption('full');
        setWalkInDeliveryDate('');
        setWalkInDeliveryTime('');
        
        // Refresh dashboard data
        if (currentVendor?.vendor_id) {
          fetchDashboardData(currentVendor.vendor_id);
        }

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowWalkInSuccess(false);
        }, 3000);
      } else {
        updateStatus("error", response.data.error || "Failed to create walk-in order");
      }
    } catch (error) {
      console.error("Error creating walk-in order:", error);
      
      // Provide more detailed error messages
      let errorMessage = "Failed to create walk-in order. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        const serverError = error.response.data;
        if (serverError?.error) {
          errorMessage = serverError.error;
        } else if (serverError?.message) {
          errorMessage = serverError.message;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid order data. Please check all fields and try again.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later or contact support.";
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Cannot connect to server. Please check your internet connection and try again.";
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }
      
      updateStatus("error", errorMessage);
    }
  };

  const handleSaveFlavor = async () => {
    if (isSavingFlavor) return;

    if (!flavorForm.name.trim()) {
      updateStatus("error", "Please enter a flavor name");
      return;
    }

    // Check if we have any images (either new or existing)
    const hasNewImages = flavorImages.length > 0;
    const hasExistingImages = imagePreviews.some(img => img.isExisting);
    
    if (!hasNewImages && !hasExistingImages) {
      updateStatus("error", "Please upload at least one image");
      return;
    }

    if (!currentVendor?.vendor_id) {
      updateStatus("error", "Vendor information not available");
      return;
    }

    // Check subscription limits for flavors (only for new flavors, not editing)
    if (!isEditingFlavor && subscriptionLimits.flavor_limit !== -1) {
      if (savedFlavors.length >= subscriptionLimits.flavor_limit) {
        setConfirmModalData({
          title: 'Flavor Limit Reached',
          message: `You have reached your flavor limit of ${subscriptionLimits.flavor_limit} for your ${subscriptionLimits.subscription_plan} plan. To add more flavors, you need to upgrade your subscription.`,
          confirmText: 'Go to Subscription',
          cancelText: 'Cancel',
          type: 'warning',
          onConfirm: () => {
            setActiveView('subscription');
            setShowConfirmModal(false);
          }
        });
        setShowConfirmModal(true);
        return;
      }
    }

    // Check if drum inventory and prices are set before allowing flavor save
    const hasDrumInventory = availableDrums.small > 0 || availableDrums.medium > 0 || availableDrums.large > 0;
    const hasDrumPrices = drumPrices.small > 0 || drumPrices.medium > 0 || drumPrices.large > 0;
    
    if (!hasDrumInventory || !hasDrumPrices) {
      setShowDrumSetupModal(true);
      return;
    }

    try {
      setIsSavingFlavor(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Create FormData for flavor upload
      const formData = new FormData();
      formData.append("flavor_name", flavorForm.name.trim());
      formData.append("flavor_description", flavorForm.description.trim());
      
      // Add new images
      flavorImages.forEach((image, index) => {
        formData.append("images", image);
      });

      let response;
      if (isEditingFlavor && editingFlavor) {
        // Update existing flavor
        response = await axios.put(
          `${apiBase}/api/vendor/flavors/${editingFlavor.flavor_id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        // Create new flavor
        response = await axios.post(
          `${apiBase}/api/vendor/flavors/${currentVendor.vendor_id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      if (response.data.success) {
        const action = isEditingFlavor ? "updated" : "saved";
        updateStatus(
          "success",
          `Flavor "${flavorForm.name}" ${action} successfully!`
        );

        // Refresh the flavors list
        await fetchSavedFlavors();

        // Reset form
        setFlavorForm({
          name: "",
          description: "",
          drumSize: "small",
          drumsUsed: "",
        });
        setFlavorImages([]);
        setImagePreviews([]);
        setEditingFlavor(null);
        setIsEditingFlavor(false);
      } else {
        updateStatus("error", response.data.error || `Failed to ${isEditingFlavor ? 'update' : 'save'} flavor`);
      }
    } catch (error) {
      console.error("Error saving flavor:", error);
      updateStatus("error", `Failed to ${isEditingFlavor ? 'update' : 'save'} flavor. Please try again.`);
    } finally {
      setIsSavingFlavor(false);
    }
  };

  // Reset vendor data helper function
  const resetVendorData = useCallback(() => {
    setCurrentVendor(null);
    setVendorData({
      fname: "",
      email: "",
      store_name: "",
      contact_no: "",
    });
    setProfileImage(null);
    setProfileImagePreview(null);
    setAddresses([]);
    setPublishedFlavors([]);
    setSavedFlavors([]);
    setDashboardData({
      total_orders: 0,
      total_revenue: 0,
      pending_orders: 0,
      confirmed_orders: 0,
      delivered_orders: 0,
      sales_today: 0,
      sales_this_month: 0,
      top_flavor: "N/A",
      product_count: 0,
      upcoming_deliveries: [],
    });
    setAvailableDrums({
      small: 0,
      medium: 0,
      large: 0,
    });
  }, []);

  // Track current user ID to detect changes
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch vendor data when component mounts or user changes
  useEffect(() => {
    const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    if (userRaw) {
      const user = JSON.parse(userRaw);
      // Always fetch vendor data for vendors, regardless of currentVendor state
      if (user.role === 'vendor') {
        // Check if this is a different user
        const isDifferentUser = currentUserId !== user.id;
        if (isDifferentUser || !currentVendor) {
          console.log('🔄 User changed or no vendor data:', { 
            currentUserId, 
            newUserId: user.id, 
            hasVendor: !!currentVendor,
            isDifferentUser,
            userName: user.username
          });
          setCurrentUserId(user.id);
          resetVendorData();
          fetchCurrentVendor();
        }
      }
    } else {
      // No user in session, reset everything
      setCurrentUserId(null);
      resetVendorData();
    }
  }, [resetVendorData, fetchCurrentVendor, currentVendor, currentUserId]);

  // Listen for user changes to refetch vendor data
  useEffect(() => {
    const handleUserChange = async () => {
      console.log('🔄 UserChanged event triggered');
      setIsUserChanging(true);
      const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user.role === 'vendor') {
          // Always reset and fetch for user changes
          console.log('UserChanged event - resetting vendor data for user:', user.id);
          setCurrentUserId(user.id);
          resetVendorData();
          setIsInitialLoading(true); // Ensure loading state is set during user change
          await fetchCurrentVendor();
        }
      } else {
        setCurrentUserId(null);
        resetVendorData();
        setIsInitialLoading(false);
      }
      setIsUserChanging(false);
    };

    window.addEventListener('userChanged', handleUserChange);
    return () => {
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, [resetVendorData, fetchCurrentVendor]);

  // Fetch vendor data when settings view becomes active
  useEffect(() => {
    const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    if (userRaw) {
      const user = JSON.parse(userRaw);
      // Only fetch vendor data when settings view becomes active and we don't have current vendor data
      if (user.role === 'vendor' && activeView === "settings" && !currentVendor) {
        fetchCurrentVendor();
      }
    }
  }, [activeView, currentVendor, fetchCurrentVendor]);

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      [
        "dashboard",
        "orders",
        "inventory",
        "my-store",
        "addCustomerOrders",
        "payments",
        "analytics",
      ].includes(tab)
    ) {
      setActiveView(tab);
    }
  }, [searchParams]);

  // Fetch dashboard data when dashboard view is active and vendor is loaded
  useEffect(() => {
    if (activeView === "dashboard" && currentVendor?.vendor_id && !isInitialLoading) {
      fetchDashboardData(currentVendor.vendor_id);
    }
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, fetchDashboardData]);

  // Fetch customer feedback when feedback view is active and vendor is loaded
  useEffect(() => {
    if (activeView === "feedback" && currentVendor?.vendor_id && !isInitialLoading) {
      fetchCustomerFeedback(currentVendor.vendor_id);
    }
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, fetchCustomerFeedback]);

  // Fetch published flavors when my-store view is active and vendor is loaded
  useEffect(() => {
    if (activeView === "my-store" && currentVendor?.vendor_id && !isInitialLoading && !isUserChanging) {
      console.log('🔄 Triggering fetchPublishedFlavors - conditions:', {
        activeView,
        vendorId: currentVendor?.vendor_id,
        isInitialLoading,
        isUserChanging
      });
      fetchPublishedFlavors();
    }
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, isUserChanging, fetchPublishedFlavors]);

  // Fetch saved flavors when inventory view is active and vendor is loaded
  useEffect(() => {
    if (activeView === "inventory" && currentVendor?.vendor_id && !isInitialLoading && !isUserChanging) {
      console.log('🔄 Triggering fetchSavedFlavors - conditions:', {
        activeView,
        vendorId: currentVendor?.vendor_id,
        isInitialLoading,
        isUserChanging
      });
      fetchSavedFlavors();
    }
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, isUserChanging, fetchSavedFlavors]);

  // Fetch drum data when vendor is loaded
  useEffect(() => {
    if (currentVendor?.vendor_id && !isInitialLoading) {
      fetchDrumData();
      fetchDeliveryPricing();
    }
  }, [currentVendor?.vendor_id, isInitialLoading, fetchDrumData, fetchDeliveryPricing]);

  // Fetch notifications when vendor is loaded
  useEffect(() => {
    if (currentVendor?.vendor_id && !isInitialLoading) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [currentVendor?.vendor_id, isInitialLoading, fetchNotifications, fetchUnreadCount]);

  // Fetch vendor orders when orders view is active and vendor is loaded
  useEffect(() => {
    if (activeView === "orders" && currentVendor?.vendor_id && !isInitialLoading && !isUserChanging) {
      console.log('🔄 Triggering fetchVendorOrders - conditions:', {
        activeView,
        vendorId: currentVendor?.vendor_id,
        isInitialLoading,
        isUserChanging
      });
      fetchVendorOrders();
    }
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, isUserChanging, fetchVendorOrders]);

  // Fetch vendor orders when dashboard view is active (for sidebar order counts)
  useEffect(() => {
    if ((activeView === "dashboard" || activeView === "orders") && currentVendor?.vendor_id && !isInitialLoading && !isUserChanging) {
      console.log('🔄 Triggering fetchVendorOrders for dashboard/orders - conditions:', {
        activeView,
        vendorId: currentVendor?.vendor_id,
        isInitialLoading,
        isUserChanging
      });
      fetchVendorOrders();
    }
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, isUserChanging, fetchVendorOrders]);

  // Fetch vendor orders when vendor is first loaded (for sidebar order counts)
  useEffect(() => {
    if (currentVendor?.vendor_id && !isInitialLoading && !isUserChanging && vendorOrders.length === 0) {
      console.log('🔄 Triggering fetchVendorOrders on vendor load - conditions:', {
        vendorId: currentVendor?.vendor_id,
        isInitialLoading,
        isUserChanging,
        currentOrdersLength: vendorOrders.length
      });
      fetchVendorOrders();
    }
  }, [currentVendor?.vendor_id, isInitialLoading, isUserChanging, vendorOrders.length, fetchVendorOrders]);

  // Fetch saved flavors when walk-in order view is active
  useEffect(() => {
    if (activeView === "addCustomerOrders" && currentVendor?.vendor_id && !isInitialLoading && !isUserChanging) {
      console.log('🔄 Loading flavors for walk-in orders');
      fetchSavedFlavors();
    }
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, isUserChanging, fetchSavedFlavors]);

  // Fetch date-specific availability for walk-in orders when delivery date changes
  useEffect(() => {
    const fetchWalkInDateAvailability = async () => {
      if (!currentVendor?.vendor_id || !walkInDeliveryDate) {
        setWalkInDateAvailability(null);
        return;
      }

      try {
        setWalkInAvailabilityLoading(true);
        console.log('📅 Fetching walk-in availability for date:', walkInDeliveryDate);
        const response = await getAvailabilityByDate(currentVendor.vendor_id, walkInDeliveryDate);
        console.log('📅 Walk-in availability response:', response);
        
        // Extract just the counts from the nested structure
        if (response.success && response.availability) {
          const simplifiedAvailability = {
            small: response.availability.small?.available_count || 0,
            medium: response.availability.medium?.available_count || 0,
            large: response.availability.large?.available_count || 0
          };
          console.log('📅 Simplified walk-in availability:', simplifiedAvailability);
          setWalkInDateAvailability(simplifiedAvailability);
        }
      } catch (error) {
        console.error('Error fetching walk-in date availability:', error);
        setWalkInDateAvailability(null);
      } finally {
        setWalkInAvailabilityLoading(false);
      }
    };

    fetchWalkInDateAvailability();
  }, [walkInDeliveryDate, currentVendor?.vendor_id]);

  // Fetch transactions when transaction history view is active
  useEffect(() => {
    if (activeView === "transactions" && currentVendor?.vendor_id && !isInitialLoading && !isUserChanging) {
      console.log('🔄 Loading transaction history');
      fetchVendorTransactions();
    }
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, isUserChanging, fetchVendorTransactions]);

  // Auto-refresh vendor notifications every 30 seconds for real-time updates
  useEffect(() => {
    let interval;
    
    if (currentVendor?.vendor_id && !isInitialLoading && !isUserChanging) {
      // Set up auto-refresh every 30 seconds for notification updates
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing vendor notifications...');
        fetchNotifications();
        fetchUnreadCount();
      }, 30000); // 30 seconds for notification updates
    }
    
    // Cleanup interval on component unmount or vendor change
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentVendor?.vendor_id, isInitialLoading, isUserChanging, fetchNotifications, fetchUnreadCount]);

  // Helper function to generate initials from name
  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  // Helper function to get avatar color based on initials
  const getAvatarColor = (initials) => {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-600' },
      { bg: 'bg-green-100', text: 'text-green-600' },
      { bg: 'bg-purple-100', text: 'text-purple-600' },
      { bg: 'bg-orange-100', text: 'text-orange-600' },
      { bg: 'bg-pink-100', text: 'text-pink-600' },
      { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      { bg: 'bg-red-100', text: 'text-red-600' },
      { bg: 'bg-yellow-100', text: 'text-yellow-600' }
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Helper function to render stars
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    while (stars.length < 5) {
      stars.push('☆');
    }
    
    return stars.join('');
  };

  // Helper function to format dates in Philippines timezone
  const formatPhilippineDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    try {
      // Handle MySQL DATETIME strings (format: "YYYY-MM-DD HH:mm:ss")
      // MySQL returns dates in the server's timezone (+08:00 for Philippines)
      // So we need to treat it as if it's already in PHT, not UTC
      let date;
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
        // MySQL DATETIME format - treat as local time in PHT
        // Append timezone offset to ensure correct parsing
        date = new Date(dateString + '+08:00');
      } else {
        // ISO format or other - parse normally
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const defaultOptions = {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        ...options
      };
      
      return date.toLocaleString('en-PH', defaultOptions);
    } catch (error) {
      console.error('Date formatting error:', error);
      return new Date(dateString).toLocaleString();
    }
  };

  // Helper function to format date only (no time) in Philippines timezone
  const formatPhilippineDateOnly = (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const defaultOptions = {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
      };
      
      return date.toLocaleDateString('en-PH', defaultOptions);
    } catch (error) {
      console.error('Date formatting error:', error);
      return new Date(dateString).toLocaleDateString();
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const reviewDate = new Date(dateString);
    const diffTime = Math.abs(now - reviewDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleAddressChange = (addressData) => {
    setNewAddress(addressData);
  };

  const handleAddStoreAddressClick = () => {
    setShowAddressForm(true);
    setEditingAddress(null);
    setNewAddress({
      unit_number: "",
      street_name: "",
      barangay: "",
      cityVillage: "",
      province: "",
      region: "",
      postal_code: "",
      landmark: "",
      address_type: "business",
    });
    // Auto-scroll to the form after a short delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.getElementById('add-store-address-form');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const saveAddress = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      if (!currentVendor?.user_id) {
        updateStatus(
          "error",
          "Vendor information not loaded. Please refresh the page."
        );
        return;
      }
      
      if (editingAddress) {
        // Update existing address
        await axios.put(
          `${apiBase}/api/addresses/address/${editingAddress.address_id}`,
          newAddress
        );
        updateStatus("success", "Store address updated successfully!");
      } else {
        // Create new address with business label
        // Set as default if this is the first address
        const isFirstAddress = addresses.length === 0;
        
        const addressPayload = {
          ...newAddress,
          address_label: "Store Location",
          is_default: isFirstAddress, // Auto-set as default for first address
        };
        await axios.post(
          `${apiBase}/api/addresses/user/${currentVendor.user_id}/address`,
          addressPayload
        );
        updateStatus(
          "success",
          `Store address added successfully!${
            isFirstAddress ? " (Set as default)" : ""
          }`
        );
      }
      
      setShowAddressForm(false);
      setEditingAddress(null);
      fetchAddresses();
      
      // Clear form
      setNewAddress({
        unit_number: "",
        street_name: "",
        barangay: "",
        cityVillage: "",
        province: "",
        region: "",
        postal_code: "",
        landmark: "",
        address_type: "business",
      });
    } catch (error) {
      updateStatus(
        "error",
        error.response?.data?.error || "Failed to save address"
      );
    }
  };

  const editAddress = (address) => {
    setEditingAddress(address);
    setNewAddress(address);
    setShowAddressForm(true);
  };

  const deleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      await axios.delete(`${apiBase}/api/addresses/address/${addressId}`);
      updateStatus("success", "Address deleted successfully!");
      fetchAddresses();
    } catch (error) {
      updateStatus(
        "error",
        error.response?.data?.error || "Failed to delete address"
      );
    }
  };

  // Handle setting exact location
  const handleSetExactLocation = (address) => {
    setSelectedAddressForLocation(address);
    setShowLocationPicker(true);
  };

  const handleLocationSaved = (location) => {
    updateStatus("success", "Exact location saved successfully! Customers will now see your precise store location.");
    fetchAddresses(); // Refresh addresses to show updated location info
  };

  const setPrimaryAddress = async (addressId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      if (!currentVendor?.user_id || !currentVendor?.vendor_id) {
        updateStatus("error", "Vendor information not loaded.");
        return;
      }

      // Set as primary address for both user and vendor
      await axios.put(
        `${apiBase}/api/addresses/user/${currentVendor.user_id}/primary-address/${addressId}`
      );
      
      // Also set as primary address for vendor (business location)
      await axios.put(
        `${apiBase}/api/vendor/${currentVendor.vendor_id}/primary-address/${addressId}`
      );
      
      updateStatus("success", "Business location set successfully!");
      fetchAddresses();
      fetchCurrentVendor(); // Refresh vendor data to show updated primary address
    } catch (error) {
      console.error("Error setting primary address:", error);
      updateStatus(
        "error",
        error.response?.data?.error || "Failed to set business location"
      );
    }
  };

  // Handle clicks outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("pendingVendor");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pendingVendor");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("userChanged"));
    navigate("/login");
  };

  const handleSettingsClick = () => {
    setActiveView("settings");
    setIsProfileDropdownOpen(false);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateStatus = (type, message) => {
    setStatus({ type, message });
    setShowStatus(true);
    
    // Auto-scroll to status message after a short delay to ensure it's rendered
    setTimeout(() => {
      const statusElement = document.getElementById('status-message');
      if (statusElement) {
        const navbarHeight = 80; // Approximate navbar height
        const elementPosition = statusElement.offsetTop;
        const offsetPosition = elementPosition - navbarHeight - 20; // Extra 20px padding
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
    
    // Auto-hide all messages after 3 seconds
    setTimeout(() => {
      setShowStatus(false);
      // Clear the status message after animation
      setTimeout(() => {
        setStatus({ type: null, message: "" });
      }, 300); // Match the transition duration
    }, 3000);
  };

  const handleSaveProfile = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("fname", vendorData.fname);
      formData.append("store_name", vendorData.store_name);
      formData.append("email", vendorData.email);
      formData.append("contact_no", vendorData.contact_no);
      
      // Add profile image if a new one was selected
      if (newProfileImage) {
        formData.append("profile_image", newProfileImage);
      }

      const response = await axios.put(
        `${apiBase}/api/vendor/profile/${currentVendor?.vendor_id}`,
        formData,
        {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        }
      );

      if (response.data.success) {
        updateStatus("success", "Profile updated successfully!");
        
        // Update current vendor data
        setCurrentVendor((prev) => ({
          ...prev,
          fname: vendorData.fname,
          store_name: vendorData.store_name,
          email: vendorData.email,
          contact_no: vendorData.contact_no,
        }));
        
        // Update profile image if changed
        if (newProfileImage && response.data.profile_image_url) {
          const imageUrl = getImageUrl(response.data.profile_image_url, apiBase, 'vendor-documents');
          setProfileImage(imageUrl);
          setProfileImagePreview(imageUrl);
          setNewProfileImage(null);
        } else if (newProfileImage) {
          // Fallback: keep the preview from FileReader if backend didn't return URL
          setNewProfileImage(null);
        } else {
          // If no new image was uploaded, keep the current profile image preview
          setProfileImagePreview(profileImage);
        }
      } else {
        updateStatus(
          "error",
          response.data.message || "Failed to update profile"
        );
        }
        
        // Navigate to notifications view
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
    } catch (error) {
      console.error("Error updating profile:", error);
      updateStatus("error", "Failed to update profile. Please try again.");
    }
  };

  const settingsTabs = [
    { id: "profile", label: "Profile" },
    { id: "addresses", label: "Store Addresses" },
    { id: "documents", label: "Documents" },
    { id: "gcash", label: "QR Code Setup" },
  ];

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: dashboardIcon },
    ...(qrSetupCompleted ? [{ id: "inventory", label: "Product Management", icon: inventoryIcon }] : []),
    { id: "my-store", label: "My Store", icon: storeIcon },
    { id: "orders", label: "Orders", icon: ordersIcon },
    {
      id: "addCustomerOrders",
      label: "Add Customer Orders",
      icon: addCustomerIcon,
    },
        {
          id: "transactions",
          label: "Transaction History",
          icon: transactionIcon,
        },
    { id: "payments", label: "Pricing", icon: paymentsIcon },
    { id: "subscription", label: "Subscription", icon: subscriptionIcon },
  ];

  // Settings View with Sidebar Layout
  if (activeView === "settings") {
    return (
      <>
        {/* Custom Navbar */}
        <header className="w-full h-16 bg-sky-100 flex items-center justify-between px-3 sm:px-6 lg:px-8 fixed top-0 left-0 z-20 overflow-visible">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 sm:p-2 rounded-md hover:bg-blue-200 transition-colors"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link to="/">
              <img
                src={logoImage}
                alt="ChillNet Logo"
                className="ChillNet-Logo h-8 sm:h-10 rounded-full object-cover"
              />
            </Link>
          </div>
          
          {/* Profile Dropdown in Navbar */}
          <div className="relative flex items-center space-x-1 sm:space-x-2" ref={profileDropdownRef}>
            {/* Notification and Feedback Icons */}
            <button
              onClick={() => {
                setActiveView("notifications");
                if (window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
              }}
              className="p-1.5 sm:p-2 rounded-full hover:bg-blue-200 transition-colors relative"
            >
              <img 
                src={bellNotificationIcon} 
                alt="Notifications" 
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
              {/* Notification badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveView("feedback");
                if (window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
              }}
              className="p-1.5 sm:p-2 rounded-full hover:bg-blue-200 transition-colors"
            >
              <img 
                src={feedbackIcon} 
                alt="Feedback" 
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
            </button>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-72 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden">
                <div className="py-1">
                  {/* User Info */}
                  <div className="px-4 py-2 text-sm text-gray-700 border-b min-w-0 max-w-full">
                    <div className="font-medium truncate max-w-full">
                      {currentVendor?.fname || "Vendor"}
                    </div>
                    <div className="text-gray-500 truncate overflow-hidden break-all max-w-full" title={currentVendor?.email}>{currentVendor?.email}</div>
                  </div>
                  
                  {/* Settings */}
                  <button
                    onClick={handleSettingsClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </button>
                  
                  {/* My Feedback */}
                  <button
                    onClick={() => {
                      navigate('/customer/my-feedback');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    My Feedback
                  </button>
                  
                  {/* Customer Support */}
                  <button
                    onClick={() => {
                      setShowFeedbackModal(true);
                      setIsProfileDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Customer Support
                  </button>
                  
                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
              </div>
            )}
          </div>
        </header>

         <div className="min-h-screen flex">
           {/* Sidebar */}
          <div
            className={`${
              isSidebarOpen ? "w-56 sm:w-64 left-0" : "w-56 sm:w-64 -left-56 sm:-left-64 lg:w-20 lg:left-0"
            } bg-[#BBDEF8] h-[calc(100vh-4rem)] fixed top-16 z-50 transition-all duration-300 overflow-y-auto shadow-2xl`}
          >
            <div className="p-3 sm:p-4 pt-6 sm:pt-8">
               {/* Menu items */}
               <ul className="flex flex-col space-y-2 sm:space-y-3">
                 {sidebarItems.map((item) => (
                   <li key={item.id}>
                     <button
                       onClick={() => {
                         setActiveView(item.id);
                         // Close sidebar on mobile after selection
                         if (window.innerWidth < 1024) {
                           setIsSidebarOpen(false);
                         }
                       }}
                      className={`w-full flex ${
                        isSidebarOpen
                          ? "items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3"
                          : "items-center justify-center p-2.5 sm:p-3"
                      } rounded-lg transition-all duration-200 ${
                         activeView === item.id
                          ? "bg-blue-500 text-white font-semibold shadow-lg border-l-4 border-blue-700"
                          : "text-gray-700 hover:bg-blue-200 hover:text-gray-900"
                       }`}
                     >
                       <img 
                         src={item.icon} 
                         alt={item.label} 
                         className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 object-contain ${
                           activeView === item.id ? 'brightness-0 invert' : ''
                         }`}
                       />
                       {isSidebarOpen && (
                         <span className="font-medium text-xs">{item.label}</span>
                       )}
                     </button>
                   </li>
                 ))}
               </ul>
               
               {/* Separate Profile Button */}
               <div className="mt-3 sm:mt-4">
                 <button
                   onClick={() => {
                    console.log(
                      "Profile button clicked in sidebar - navigating to settings/profile"
                    );
                    setActiveView("settings");
                    setActiveTab("profile");
                    // Close sidebar on mobile after selection
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex ${
                    isSidebarOpen
                      ? "items-center gap-2 sm:gap-3"
                      : "items-center justify-center"
                  } p-2.5 sm:p-3 ${
                    isSidebarOpen ? "text-left" : "text-center"
                  } rounded-lg transition-all duration-200 ${
                    activeView === "settings"
                      ? "bg-blue-500 text-white font-semibold shadow-lg border-l-4 border-blue-700"
                      : "text-gray-700 hover:bg-blue-200 hover:text-gray-900"
                  }`}
                >
                  <img 
                    src={profileIcon} 
                    alt="Profile" 
                    className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 object-contain ${
                      activeView === "settings" ? 'brightness-0 invert' : ''
                    }`}
                  />
                  {isSidebarOpen && (
                    <span className="font-medium text-xs">Profile</span>
                  )}
                 </button>
               </div>
             </div>
           </div>

          {/* Backdrop overlay when sidebar is open (mobile/tablet only) */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 z-40 top-16 transition-opacity duration-300 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 w-full">
            <div className="p-4 sm:p-6 lg:p-8 pt-24 sm:pt-28">
              <div className="max-w-6xl mx-auto mt-8 sm:mt-6">
              {/* Header - Mobile Responsive */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                {/* Mobile Layout */}
                <div className="block md:hidden">
                  <div className="flex flex-col items-center text-center space-y-3">
                    {/* Icon - Smaller */}
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    
                    {currentVendor && (
                      <div className="w-full space-y-3">
                        {/* Store Information Card - Mobile - Smaller */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/30 shadow-sm">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700">Store Information</span>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-gray-800 text-center">{currentVendor.store_name}</h3>
                            <p className="text-xs text-gray-600 text-center">Owner: {currentVendor.fname}</p>
                            <p className="text-xs text-gray-500 text-center">ID: {currentVendor.vendor_id}</p>
                            <div className="flex justify-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                currentVendor.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : currentVendor.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {currentVendor.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Contact Details Card - Mobile - Smaller */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/30 shadow-sm">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700">Contact Details</span>
                          </div>
                          <div className="space-y-1 text-center">
                            <p className="text-sm text-gray-700 font-medium break-all">{currentVendor.email}</p>
                            <p className="text-xs text-gray-600">{currentVendor.contact_no || "Contact not provided"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex items-center space-x-6">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    
                    {currentVendor && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:mt-6">
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                          <div className="flex items-center space-x-2 mb-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700">Store Information</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{currentVendor.store_name}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Owner: {currentVendor.fname} | ID: {currentVendor.vendor_id}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Status: 
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                              currentVendor.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : currentVendor.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {currentVendor.status}
                            </span>
                          </p>
                        </div>
                        
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                          <div className="flex items-center space-x-2 mb-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700">Contact Details</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {currentVendor.email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {currentVendor.contact_no || "Contact not provided"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {status.type && showStatus && (
                  <div
                    id="status-message"
                    className={`p-4 rounded-lg mb-6 transition-all duration-300 transform ${
                      showStatus
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2"
                    } ${
                      status.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : status.type === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                  {status.message}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {/* Settings Sidebar */}
                <div className="lg:col-span-1 order-1">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:sticky lg:top-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </h3>
                    {/* Mobile: Horizontal row layout */}
                    <nav className="flex flex-wrap gap-2 sm:gap-3 lg:hidden">
                      {settingsTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 min-w-0 px-2 sm:px-3 py-2 sm:py-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center touch-manipulation ${
                            activeTab === tab.id
                                ? "bg-blue-500 text-white border border-blue-600 shadow-lg transform scale-[1.02]"
                                : "text-gray-600 hover:bg-blue-50 hover:text-gray-900 hover:shadow-md active:bg-blue-100"
                          }`}
                        >
                          <span className="font-medium text-xs text-center leading-tight">{tab.label}</span>
                        </button>
                      ))}
                    </nav>
                    {/* Desktop: Vertical sidebar layout */}
                    <nav className="hidden lg:block space-y-2">
                      {settingsTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center ${
                            activeTab === tab.id
                                ? "bg-blue-500 text-white border border-blue-600 shadow-lg transform scale-[1.02]"
                                : "text-gray-600 hover:bg-blue-50 hover:text-gray-900 hover:shadow-md active:bg-blue-100"
                          }`}
                        >
                          <span className="font-medium text-xs flex-1">{tab.label}</span>
                          {activeTab === tab.id && (
                            <svg className="w-4 h-4 ml-auto text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-3 order-2">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8">
                    {/* Profile Tab */}
                      {activeTab === "profile" && (
                      <div>
                          <h2 className="text-2xl font-semibold mb-6">
                            Store Information
                          </h2>
                        <div className="space-y-6">
                          {/* Profile Image Upload Section */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 lg:p-8 border border-blue-100">
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile Picture
                              </h3>
                            <div className="flex flex-col md:flex-row items-center space-y-4 sm:space-y-6 md:space-y-0 md:space-x-8">
                              {/* Current/Preview Image */}
                              <div className="flex-shrink-0">
                                <div className="relative">
                                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-lg border-2 sm:border-4 border-white flex items-center justify-center">
                                    {profileImagePreview ? (
                                      <img 
                                        src={profileImagePreview} 
                                        alt="Profile preview" 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                        <svg
                                          className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-400"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                  </div>
                                  {profileImagePreview && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Upload Button */}
                              <div className="flex-1 text-center md:text-left">
                                <label className="block cursor-pointer">
                                    <span className="sr-only">
                                      Choose profile photo
                                    </span>
                                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors duration-200">
                                    <div className="text-center">
                                      <svg className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-blue-400 mb-2 sm:mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                      </svg>
                                      <div className="flex justify-center">
                                        <span className="bg-blue-500 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2 rounded-md sm:rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 text-sm sm:text-base">
                                          Choose File
                                        </span>
                                      </div>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfileImageChange}
                                        className="hidden"
                                      />
                                    </div>
                                  </div>
                                </label>
                                <div className="mt-4 space-y-2">
                                  <p className="text-sm text-gray-600">
                                    JPG, PNG or GIF. Max size 20MB.
                                  </p>
                                  {newProfileImage && (
                                    <div className="flex items-center justify-center md:justify-start space-x-2">
                                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      <p className="text-sm text-green-600 font-medium">
                                        New image selected: {newProfileImage.name}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Owner Name
                              </label>
                              <input
                                type="text"
                                  value={vendorData.fname || ""}
                                  onChange={(e) =>
                                    setVendorData({
                                      ...vendorData,
                                      fname: e.target.value,
                                    })
                                  }
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                placeholder="Your full name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Store Name
                              </label>
                              <input
                                type="text"
                                  value={vendorData.store_name || ""}
                                  onChange={(e) =>
                                    setVendorData({
                                      ...vendorData,
                                      store_name: e.target.value,
                                    })
                                  }
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                placeholder="Your store name"
                              />
                            </div>
                          </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                              </label>
                              <input
                                type="email"
                                  value={vendorData.email || ""}
                                  onChange={(e) =>
                                    setVendorData({
                                      ...vendorData,
                                      email: e.target.value,
                                    })
                                  }
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                placeholder="your@email.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Number
                              </label>
                              <input
                                type="text"
                                  value={vendorData.contact_no || ""}
                                  onChange={(e) =>
                                    setVendorData({
                                      ...vendorData,
                                      contact_no: e.target.value,
                                    })
                                  }
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                placeholder="09123456789"
                              />
                            </div>
                          </div>
                          <div className="flex justify-center sm:justify-end">
                            <button 
                              onClick={handleSaveProfile}
                              className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg text-sm sm:text-base w-full sm:w-auto"
                            >
                              Save Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Addresses Tab */}
                      {activeTab === "addresses" && (
                      <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-semibold">
                              Store Addresses
                            </h2>
                          <button
                            onClick={handleAddStoreAddressClick}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base w-full sm:w-auto"
                          >
                            + Add Store Address
                          </button>
                        </div>

                        {/* Address List */}
                        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                          {addresses.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-gray-500">
                              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🏪</div>
                                <p className="text-base sm:text-lg">
                                  No store addresses added yet
                                </p>
                                <p className="text-xs sm:text-sm">
                                  Add your store address to help customers find
                                  you
                                </p>
                            </div>
                          ) : (
                            addresses.map((address, index) => (
                                <div
                                  key={index}
                                  className="border border-gray-200 rounded-lg p-3 sm:p-4"
                                >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                                  <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 mb-2">
                                        <h3 className="font-semibold text-base sm:text-lg">
                                          {address.address_type} Address
                                        </h3>
                                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                        {address.is_default === 1 && (
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            ⭐ Default
                                          </span>
                                        )}
                                        {currentVendor?.primary_address_id === address.address_id && (
                                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                                            🏪 Business Location
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-600 mt-1 break-words">
                                        {address.unit_number &&
                                          `${address.unit_number}, `}
                                        {address.street_name},{" "}
                                        {address.barangay},{" "}
                                        {address.cityVillage},{" "}
                                        {address.province}
                                        {address.postal_code &&
                                          ` ${address.postal_code}`}
                                    </p>
                                    {address.landmark && (
                                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                        Landmark: {address.landmark}
                                      </p>
                                    )}
                                    
                                    {/* Location Accuracy Status */}
                                    <div className="mt-2 flex items-center space-x-2">
                                      {address.exact_latitude && address.exact_longitude ? (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          Exact Location Set
                                        </span>
                                      ) : address.latitude && address.longitude ? (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                          Approximate Location
                                        </span>
                                      ) : (
                                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                          Location Needed
                                        </span>
                                      )}
                                    </div>

                                    {currentVendor?.primary_address_id === address.address_id && (
                                      <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-500 rounded">
                                        <p className="text-xs text-blue-700">
                                          ℹ️ This is what customers and admin see as your store location
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-row sm:flex-row md:flex-col gap-2 flex-wrap md:flex-nowrap">
                                    <button
                                      onClick={() => editAddress(address)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-none md:w-full flex items-center justify-center gap-1 sm:gap-2"
                                    >
                                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                    
                                    {/* Set Exact Location Button */}
                                    <button
                                      onClick={() => handleSetExactLocation(address)}
                                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-2 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-none md:w-full"
                                    >
                                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      {address.exact_latitude && address.exact_longitude ? 'Update Location' : 'Set Exact Location'}
                                    </button>
                                    
                                    {currentVendor?.primary_address_id !== address.address_id && (
                                      <button
                                          onClick={() =>
                                            setPrimaryAddress(address.address_id)
                                          }
                                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-2 sm:px-4 py-2 sm:py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-none md:w-full flex items-center justify-center gap-1 sm:gap-2"
                                      >
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="hidden sm:inline">Set as Business Location</span>
                                        <span className="sm:hidden">Set Primary</span>
                                      </button>
                                    )}
                                    
                                    <button
                                        onClick={() =>
                                          deleteAddress(address.address_id)
                                        }
                                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-2 sm:px-4 py-2 sm:py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-none md:w-full flex items-center justify-center gap-1 sm:gap-2"
                                    >
                                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Address Form */}
                        {showAddressForm && (
                          <div id="add-store-address-form" className="border-t pt-4 sm:pt-6">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                                {editingAddress
                                  ? "Edit Store Address"
                                  : "Add New Store Address"}
                            </h3>
                            <AddressForm
                              addressData={newAddress}
                              onAddressChange={handleAddressChange}
                              showAddressType={true}
                              addressType="business"
                              required={true}
                              labelPrefix="Store "
                            />
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                              <button
                                onClick={() => {
                                  setShowAddressForm(false);
                                  setEditingAddress(null);
                                }}
                                className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base w-full sm:w-auto"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveAddress}
                                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base w-full sm:w-auto"
                              >
                                  {editingAddress
                                    ? "Update Address"
                                    : "Save Address"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents Tab */}
                      {activeTab === "gcash" && (
                      <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
                          <h2 className="text-xl sm:text-2xl font-semibold">
                            GCash QR Code Setup
                          </h2>
                          <button
                            onClick={() => navigate('/vendor/gcash-account')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Manage QR Code
                          </button>
                        </div>

                        <div className="bg-green-50 rounded-lg p-6">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                              <span className="text-2xl">📱</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Direct QR Payments</h3>
                              <p className="text-sm text-gray-600">Set up your GCash QR code for direct customer payments</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <h4 className="font-medium text-gray-900 mb-2">💡 How direct payments work:</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• You receive 100% of payment - no platform fees</li>
                                <li>• Customers scan your QR code and pay directly</li>
                                <li>• Money goes straight to your GCash account</li>
                                <li>• Build direct relationship with customers</li>
                              </ul>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <h4 className="font-medium text-blue-900 mb-2">📱 Setup Process:</h4>
                              <ol className="text-sm text-blue-800 space-y-1">
                                <li>1. Get your GCash QR code from the app</li>
                                <li>2. Upload it to your vendor profile</li>
                                <li>3. Customers will scan it during checkout</li>
                                <li>4. Receive payments directly to your GCash</li>
                              </ol>
                            </div>

                            <div className="flex justify-center">
                              <button
                                onClick={() => navigate('/vendor/gcash-account')}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
                              >
                                Set Up QR Code
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      )}

                      {activeTab === "documents" && (
                      <div>
                          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
                            Documents
                          </h2>
                          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
                            View your uploaded business documents and identification.
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {/* Business Permit */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Business Permit</h3>
                                  <p className="text-xs sm:text-sm text-gray-500">Legal business registration</p>
                                </div>
                              </div>
                              
                              {currentVendor?.business_permit_url ? (
                                <div className="space-y-3">
                                  <div className="relative">
                                    <img
                                      src={getImageUrl(currentVendor.business_permit_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents')}
                                      alt="Business Permit"
                                      className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                    <div className="w-full h-24 sm:h-32 bg-gray-100 rounded-lg border border-gray-200 hidden items-center justify-center">
                                      <div className="text-center">
                                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-sm text-gray-500">Business Permit</p>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => window.open(getImageUrl(currentVendor.business_permit_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents'), '_blank')}
                                    className="w-full px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                                  >
                                    View Document
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <p className="text-gray-500 text-sm">No business permit uploaded</p>
                                </div>
                              )}
                            </div>

                            {/* Valid ID */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Valid ID</h3>
                                  <p className="text-xs sm:text-sm text-gray-500">Government issued ID</p>
                                </div>
                              </div>
                              
                              {currentVendor?.valid_id_url ? (
                                <div className="space-y-3">
                                  <div className="relative">
                                    <img
                                      src={getImageUrl(currentVendor.valid_id_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents')}
                                      alt="Valid ID"
                                      className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                    <div className="w-full h-24 sm:h-32 bg-gray-100 rounded-lg border border-gray-200 hidden items-center justify-center">
                                      <div className="text-center">
                                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                        </svg>
                                        <p className="text-sm text-gray-500">Valid ID</p>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => window.open(getImageUrl(currentVendor.valid_id_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents'), '_blank')}
                                    className="w-full px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                                  >
                                    View Document
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                  </svg>
                                  <p className="text-gray-500 text-sm">No valid ID uploaded</p>
                                </div>
                              )}
                            </div>

                            {/* Proof of Address */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Proof of Address</h3>
                                  <p className="text-xs sm:text-sm text-gray-500">Address verification document</p>
                                </div>
                              </div>
                              
                              {currentVendor?.proof_image_url ? (
                                <div className="space-y-3">
                                  <div className="relative">
                                    <img
                                      src={getImageUrl(currentVendor.proof_image_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents')}
                                      alt="Proof of Address"
                                      className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                    <div className="w-full h-24 sm:h-32 bg-gray-100 rounded-lg border border-gray-200 hidden items-center justify-center">
                                      <div className="text-center">
                                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <p className="text-sm text-gray-500">Proof of Address</p>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => window.open(getImageUrl(currentVendor.proof_image_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents'), '_blank')}
                                    className="w-full px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                                  >
                                    View Document
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <p className="text-gray-500 text-sm">No proof of address uploaded</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Document Status Summary */}
                          <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                            <h3 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Document Status</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${currentVendor?.business_permit_url ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs sm:text-sm text-blue-800">
                                  Business Permit: {currentVendor?.business_permit_url ? 'Uploaded' : 'Missing'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${currentVendor?.valid_id_url ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs sm:text-sm text-blue-800">
                                  Valid ID: {currentVendor?.valid_id_url ? 'Uploaded' : 'Missing'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${currentVendor?.proof_image_url ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs sm:text-sm text-blue-800">
                                  Proof of Address: {currentVendor?.proof_image_url ? 'Uploaded' : 'Missing'}
                                </span>
                              </div>
                            </div>
                          </div>
                      </div>
                    )}


                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
                    
        {/* Location Picker Modal */}
        <LocationPickerModal
          isOpen={showLocationPicker}
          onClose={() => {
            setShowLocationPicker(false);
            setSelectedAddressForLocation(null);
          }}
          addressId={selectedAddressForLocation?.address_id}
          currentCoordinates={selectedAddressForLocation}
          onLocationSaved={handleLocationSaved}
        />
      </>
    );
  }

  // Show loading screen while fetching initial data
  if (isInitialLoading && !currentVendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your vendor dashboard...</p>
        </div>
      </div>
    );
  }

  // Main Dashboard View with Sidebar Layout
  return (
    <>
      {/* Custom Navbar */}
      <header className="w-full h-16 bg-sky-100 flex items-center justify-between px-3 sm:px-6 lg:px-8 fixed top-0 left-0 z-20 overflow-visible">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 sm:p-2 rounded-md hover:bg-blue-200 transition-colors"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <Link to="/">
            <img
              src={logoImage}
              alt="ChillNet Logo"
              className="ChillNet-Logo h-8 sm:h-10 rounded-full object-cover"
            />
          </Link>
        </div>
        
        {/* Profile Dropdown in Navbar */}
        <div className="relative flex items-center space-x-1 sm:space-x-2" ref={profileDropdownRef}>
          {/* Notification and Feedback Icons */}
          <button
            onClick={() => {
              setActiveView("notifications");
              if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
              }
            }}
            className="p-1.5 sm:p-2 rounded-full hover:bg-blue-200 transition-colors relative"
          >
            <img 
              src={bellNotificationIcon} 
              alt="Notifications" 
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
            {/* Notification badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => {
              setActiveView("feedback");
              if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
              }
            }}
            className="p-1.5 sm:p-2 rounded-full hover:bg-blue-200 transition-colors"
          >
            <img 
              src={feedbackIcon} 
              alt="Feedback" 
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
          </button>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="p-2 rounded-full hover:bg-blue-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-72 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden">
              <div className="py-1">
                {/* User Info */}
                <div className="px-4 py-2 text-sm text-gray-700 border-b min-w-0 max-w-full">
                  <div className="font-medium truncate max-w-full">
                    {currentVendor?.fname || "Vendor"}
                  </div>
                  <div className="text-gray-500 truncate overflow-hidden break-all max-w-full" title={currentVendor?.email}>{currentVendor?.email}</div>
                </div>
                
                {/* Settings */}
                <button
                  onClick={handleSettingsClick}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                </button>
                
                {/* My Feedback */}
                <button
                  onClick={() => {
                    navigate('/customer/my-feedback');
                    setIsProfileDropdownOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  My Feedback
                </button>
                
                {/* Customer Support */}
                <button
                  onClick={() => {
                    setShowFeedbackModal(true);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  Customer Support
                </button>
                
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
            </div>
          )}
        </div>
      </header>

       <div className="min-h-screen flex">
         {/* Sidebar */}
        <div
          className={`${
            isSidebarOpen ? "w-56 sm:w-64 left-0" : "w-56 sm:w-64 -left-56 sm:-left-64 lg:w-20 lg:left-0"
          } bg-[#BBDEF8] h-[calc(100vh-4rem)] fixed top-16 z-50 transition-all duration-300 overflow-y-auto shadow-2xl`}
        >
          <div className="p-3 sm:p-4 pt-6 sm:pt-8">
             {/* Menu items */}
             <ul className="flex flex-col space-y-2 sm:space-y-3">
               {sidebarItems.map((item) => (
                 <li key={item.id}>
                   <button
                     onClick={() => {
                      console.log(
                        "Clicked item:",
                        item.id,
                        "Current activeView:",
                        activeView
                      );
                       setActiveView(item.id);
                       // Close sidebar on mobile after selection
                       if (window.innerWidth < 1024) {
                         setIsSidebarOpen(false);
                       }
                     }}
                    className={`w-full flex ${
                      isSidebarOpen
                        ? "items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3"
                        : "items-center justify-center p-2.5 sm:p-3"
                    } rounded-lg transition-all duration-200 ${
                       activeView === item.id
                        ? "bg-blue-500 text-white font-semibold shadow-lg border-l-4 border-blue-700"
                        : "text-gray-700 hover:bg-blue-200 hover:text-gray-900"
                     }`}
                   >
                     <img 
                       src={item.icon} 
                       alt={item.label} 
                       className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 object-contain ${
                         activeView === item.id ? 'brightness-0 invert' : ''
                       }`}
                     />
                    {isSidebarOpen && (
                      <span className="font-medium text-xs">{item.label}</span>
                    )}
                   </button>
                 </li>
               ))}
             </ul>
             
             {/* Separate Profile Button */}
             <div className="mt-3 sm:mt-4">
                 <button
                   onClick={() => {
                  console.log(
                    "Profile button clicked in sidebar - navigating to settings/profile"
                  );
                  setActiveView("settings");
                  setActiveTab("profile");
                  // Close sidebar on mobile after selection
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`w-full flex ${
                  isSidebarOpen
                    ? "items-center gap-2 sm:gap-3"
                    : "items-center justify-center"
                } p-2.5 sm:p-3 ${
                  isSidebarOpen ? "text-left" : "text-center"
                } rounded-lg transition-all duration-200 ${
                  activeView === "settings"
                    ? "bg-blue-500 text-white font-semibold shadow-lg border-l-4 border-blue-700"
                    : "text-gray-700 hover:bg-blue-200 hover:text-gray-900"
                 }`}
               >
                 <img 
                   src={profileIcon} 
                   alt="Profile" 
                   className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 object-contain ${
                     activeView === "settings" ? 'brightness-0 invert' : ''
                   }`}
                 />
                 {isSidebarOpen && <span className="font-medium text-xs">Profile</span>}
               </button>
             </div>
           </div>
         </div>

        {/* Backdrop overlay when sidebar is open (mobile/tablet only) */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40 top-16 transition-opacity duration-300 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24 lg:pt-28 w-full">
          <div className="max-w-6xl mx-auto">
            {/* Dashboard Content */}
            {activeView === "dashboard" && (
              <div>
                <div className="mb-4 sm:mb-6 md:mb-8">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Vendor Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600">
                    Welcome to your vendor dashboard. Manage your ice cream
                    business here.
                  </p>
                </div>

                {/* QR Setup Warning Banner */}
                {!qrSetupCompleted && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 mb-4 sm:mb-6 rounded-r-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-3">
                        <h3 className="text-xs sm:text-sm font-medium text-blue-800">
                          QR Code Setup Required
                        </h3>
                        <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-700">
                          <p>
                            Complete your GCash QR code setup to start managing products and receiving payments. 
                            Go to Settings → QR Code Setup to upload your QR code.
                          </p>
                          <button
                            onClick={() => {
                              setActiveView('settings');
                              setActiveTab('gcash');
                            }}
                            className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Complete Setup Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suspended Warning Banner */}
                {currentVendor?.status === 'suspended' && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 mb-4 sm:mb-6 rounded-r-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-3">
                        <h3 className="text-xs sm:text-sm font-medium text-yellow-800">
                          Account Suspended - Grace Period Active
                        </h3>
                        <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-yellow-700">
                          <p>
                            Your account is currently suspended. You can still complete existing orders, but cannot:
                          </p>
                          <ul className="list-disc list-inside mt-1 ml-1 sm:ml-2">
                            <li>Add or edit products/flavors</li>
                            <li>Receive new customer orders</li>
                            <li>Appear in customer search</li>
                          </ul>
                          <p className="mt-1 sm:mt-2 font-medium">
                            Please contact admin for more information.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                        <img
                          src={ordersIcon}
                          alt="Orders"
                          className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                          {dashboardLoading
                            ? "..."
                            : dashboardData.total_orders}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                        <img
                          src={paymentsIcon}
                          alt="Revenue"
                          className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                          {dashboardLoading
                            ? "..."
                            : `₱${dashboardData.total_revenue.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                        <img
                          src={inventoryIcon}
                          alt="Products"
                          className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-600">Total Flavors</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                          {dashboardLoading
                            ? "..."
                            : dashboardData.product_count}
                        </p>
                      </div>
                      </div>
                    </div>
                  </div>
                  
                {/* Other Details and Upcoming Deliveries */}
                <div className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {/* Other Details Card */}
                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">
                      Other Details
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">
                          Pending Orders:
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-orange-600">
                          {dashboardLoading
                            ? "..."
                            : dashboardData.pending_orders}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">
                          Confirm Orders:
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-green-600">
                          {dashboardLoading
                            ? "..."
                            : dashboardData.confirmed_orders}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">
                          Top Flavor:
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-blue-600 truncate ml-2">
                          {dashboardLoading ? "..." : dashboardData.top_flavor}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">
                          Sales Today:
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-green-600">
                          {dashboardLoading
                            ? "..."
                            : `₱${dashboardData.sales_today.toLocaleString()}`}
                        </span> 
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">
                          Sales this Month:
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-blue-600">
                          {dashboardLoading
                            ? "..."
                            : `₱${dashboardData.sales_this_month.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                   {/* Upcoming Deliveries Card */}
                   <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 md:mb-4 gap-2">
                       <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                         Upcoming Deliveries
                       </h3>
                       <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full w-fit">
                         {getFilteredDeliveries().length} orders
                       </span>
                     </div>
                     
                     {/* Filter Controls */}
                     <div className="mb-2 sm:mb-3 md:mb-4 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                       {/* Status Filter */}
                       <div className="flex items-center space-x-2 w-full sm:w-auto">
                         <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">Status:</label>
                         <select
                           value={deliveryFilter.status}
                           onChange={(e) => setDeliveryFilter(prev => ({ ...prev, status: e.target.value }))}
                           className="text-xs sm:text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none min-w-0"
                         >
                           <option value="all">All Status</option>
                           <option value="confirmed">Confirmed</option>
                           <option value="preparing">Preparing</option>
                           <option value="out_for_delivery">Out for Delivery</option>
                         </select>
                       </div>
                       
                       {/* Urgency Filter */}
                       <div className="flex items-center space-x-2 w-full sm:w-auto">
                         <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">Urgency:</label>
                         <select
                           value={deliveryFilter.urgency}
                           onChange={(e) => setDeliveryFilter(prev => ({ ...prev, urgency: e.target.value }))}
                           className="text-xs sm:text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none min-w-0"
                         >
                           <option value="all">All Time</option>
                           <option value="overdue">Overdue</option>
                           <option value="today">Today</option>
                           <option value="tomorrow">Tomorrow</option>
                           <option value="upcoming">This Week</option>
                         </select>
                       </div>
                       
                       {/* Clear Filters */}
                       {(deliveryFilter.status !== 'all' || deliveryFilter.urgency !== 'all') && (
                         <button
                           onClick={() => setDeliveryFilter({ status: 'all', urgency: 'all' })}
                           className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                         >
                           Clear Filters
                         </button>
                       )}
                     </div>
                     
                     {/* Active Filter Indicators */}
                     {(deliveryFilter.status !== 'all' || deliveryFilter.urgency !== 'all') && (
                       <div className="mb-3 flex flex-wrap gap-2">
                         {deliveryFilter.status !== 'all' && (
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                             Status: {deliveryFilter.status.charAt(0).toUpperCase() + deliveryFilter.status.slice(1).replace('_', ' ')}
                             <button
                               onClick={() => setDeliveryFilter(prev => ({ ...prev, status: 'all' }))}
                               className="ml-1 text-blue-600 hover:text-blue-800"
                             >
                               ×
                             </button>
                           </span>
                         )}
                         {deliveryFilter.urgency !== 'all' && (
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                             Urgency: {deliveryFilter.urgency.charAt(0).toUpperCase() + deliveryFilter.urgency.slice(1)}
                             <button
                               onClick={() => setDeliveryFilter(prev => ({ ...prev, urgency: 'all' }))}
                               className="ml-1 text-green-600 hover:text-green-800"
                             >
                               ×
                             </button>
                           </span>
                         )}
                       </div>
                     )}
                     
                     {dashboardLoading ? (
                       <div className="space-y-3">
                         {[1, 2, 3].map((i) => (
                           <div key={i} className="animate-pulse">
                             <div className="h-16 bg-gray-200 rounded-lg"></div>
                           </div>
                         ))}
                       </div>
                     ) : getFilteredDeliveries().length > 0 ? (
                       <div className="space-y-3 max-h-80 overflow-y-auto">
                         {getFilteredDeliveries().map((delivery) => {
                           const deliveryDate = new Date(delivery.delivery_datetime);
                           const now = new Date();
                           const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                           const deliveryDay = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
                           const diffTime = deliveryDay.getTime() - today.getTime();
                           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                           
                           let urgencyClass = 'text-gray-600 bg-gray-100';
                           let urgencyText = '';
                           
                           if (diffDays < 0) {
                             urgencyClass = 'text-red-700 bg-red-100 border border-red-200';
                             urgencyText = 'OVERDUE';
                           } else if (diffDays === 0) {
                             urgencyClass = 'text-orange-700 bg-orange-100 border border-orange-200';
                             urgencyText = 'TODAY';
                           } else if (diffDays === 1) {
                             urgencyClass = 'text-yellow-700 bg-yellow-100 border border-yellow-200';
                             urgencyText = 'TOMORROW';
                           } else if (diffDays <= 3) {
                             urgencyClass = 'text-blue-700 bg-blue-100 border border-blue-200';
                             urgencyText = 'UPCOMING';
                           }
                           
                           return (
                             <div key={delivery.order_id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                               <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                 <div className="flex-1 min-w-0">
                                   <div className="flex flex-wrap items-center gap-2 mb-2">
                                     <h4 className="text-sm sm:text-base font-medium text-gray-900">
                                       Order #{delivery.order_id}
                                     </h4>
                                     <div className={`inline-flex items-center px-2 py-0.5 sm:py-1 rounded-md text-xs font-semibold ${urgencyClass}`}>
                                       <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                       </svg>
                                       {urgencyText}
                                     </div>
                                   </div>
                                   
                                   <div className="space-y-1">
                                     <p className="text-xs sm:text-sm text-gray-600 truncate">
                                       <span className="font-medium">Customer:</span> {delivery.customer_name} {delivery.customer_lname}
                                     </p>
                                     <p className="text-xs sm:text-sm text-gray-600">
                                       <span className="font-medium">Delivery:</span> {formatPhilippineDate(delivery.delivery_datetime, {
                                         weekday: 'short',
                                         month: 'short',
                                         day: 'numeric',
                                         hour: '2-digit',
                                         minute: '2-digit',
                                         hour12: true
                                       })}
                                     </p>
                                     <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                       <span className="font-medium">Address:</span> {delivery.delivery_address || 'No address specified'}
                                     </p>
                                     <p className="text-xs sm:text-sm text-gray-600">
                                       <span className="font-medium">Status:</span> 
                                       <span className={`ml-1 font-medium ${
                                         delivery.status === 'confirmed' ? 'text-blue-600' :
                                         delivery.status === 'preparing' ? 'text-yellow-600' :
                                         delivery.status === 'out_for_delivery' ? 'text-purple-600' : 'text-gray-600'
                                       }`}>
                                         {delivery.status ? delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1).replace('_', ' ') : 'N/A'}
                                       </span>
                                     </p>
                                   </div>
                                 </div>
                                 
                                 <div className="text-left sm:text-right sm:ml-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                                   <p className="text-base sm:text-lg font-bold text-green-600">
                                     ₱{parseFloat(delivery.total_amount || 0).toFixed(2)}
                                   </p>
                                   <p className="text-xs text-gray-500">
                                     {delivery.payment_status === 'paid' ? '✅ Paid' : '⏳ Pending Payment'}
                                   </p>
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     ) : (
                       <div className="text-center py-8">
                         <div className="w-full h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                           <div className="text-center">
                             <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                             <span className="text-sm text-gray-500">
                               {dashboardData.upcoming_deliveries?.length === 0 
                                 ? 'No upcoming deliveries' 
                                 : 'No deliveries match your current filters'
                               }
                             </span>
                             <p className="text-xs text-gray-400 mt-1">
                               {dashboardData.upcoming_deliveries?.length === 0
                                 ? 'Approved orders with delivery dates will appear here'
                                 : 'Try adjusting your filter settings or clear all filters'
                               }
                             </p>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                </div>
              </div>
            )}

            {/* Other Views */}
            {activeView === "orders" && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                
                </h1>
              </div>
            )}

            {/* Add Product View */}
            {activeView === "add-product" && (
              <div>
                <div className="mb-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <button
                      onClick={() => setActiveView("products")}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      <span>Back to Products</span>
                    </button>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Add New Product
                  </h1>
                  <p className="text-gray-600">
                    Add a new ice cream product to your store.
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Vanilla Delight"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Flavor *
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="">Select a flavor</option>
                          <option value="vanilla">Vanilla</option>
                          <option value="chocolate">Chocolate</option>
                          <option value="strawberry">Strawberry</option>
                          <option value="mango">Mango</option>
                          <option value="pistachio">Pistachio</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your ice cream product..."
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Container Size *
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="">Select size</option>
                          <option value="small">Small (1 gallon)</option>
                          <option value="medium">Medium (2 gallons)</option>
                          <option value="large">Large (5 gallons)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (₱) *
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Image *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          <button
                            type="button"
                            className="font-medium text-blue-600 hover:text-blue-500"
                          >
                            Upload a file
                          </button>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setActiveView("products")}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeView === "inventory" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 p-3 sm:p-6">
                {/* Suspended Warning Banner */}
                {currentVendor?.status === 'suspended' && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 mb-4 sm:mb-6 rounded-r-lg max-w-7xl">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-3">
                        <h3 className="text-xs sm:text-sm font-medium text-red-800">
                          Product Management Disabled
                        </h3>
                        <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-700">
                          <p>
                            Your account is suspended. You cannot add or edit products while suspended.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Drum Sections - Desktop Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-7xl mb-4 sm:mb-6">
                  {/* Available Drums Section */}
                  <div className="bg-sky-100 border border-blue-300 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <div className="text-blue-800 font-bold text-base sm:text-lg">
                        Available Drums
                      </div>
                      {!isEditingDrums && currentVendor?.status !== 'suspended' && (
                        <button
                          onClick={handleDrumsEdit}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                            subscriptionLimits.drum_limit !== -1 && getTotalDrums() >= subscriptionLimits.drum_limit
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {subscriptionLimits.drum_limit !== -1 && getTotalDrums() >= subscriptionLimits.drum_limit
                            ? '⚠️ Limit Reached'
                            : 'Edit Inventory'
                          }
                        </button>
                      )}
                    </div>

                    {isEditingDrums ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-row gap-2 sm:gap-3 md:gap-4">
                          <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Small Drums
                            </label>
                            <input
                              type="number"
                              value={tempDrums.small}
                              onChange={(e) =>
                                handleDrumSizeChange("small", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-bold"
                              min="0"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Medium Drums
                            </label>
                            <input
                              type="number"
                              value={tempDrums.medium}
                              onChange={(e) =>
                                handleDrumSizeChange("medium", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-bold"
                              min="0"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Large Drums
                            </label>
                            <input
                              type="number"
                              value={tempDrums.large}
                              onChange={(e) =>
                                handleDrumSizeChange("large", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-bold"
                              min="0"
                            />
                          </div>
                        </div>
                        {/* Current Total Display */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">Current Total</div>
                            <div className={`text-2xl font-bold ${
                              (tempDrums.small + tempDrums.medium + tempDrums.large) > subscriptionLimits.drum_limit && subscriptionLimits.drum_limit !== -1
                                ? 'text-red-600'
                                : (tempDrums.small + tempDrums.medium + tempDrums.large) === subscriptionLimits.drum_limit && subscriptionLimits.drum_limit !== -1
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                            }`}>
                              {tempDrums.small + tempDrums.medium + tempDrums.large}
                            </div>
                            <div className="text-xs text-gray-500">
                              {subscriptionLimits.drum_limit === -1 ? (
                                <span className="text-green-600">Unlimited (Premium Plan)</span>
                              ) : (
                                <span className={`font-medium ${
                                  (tempDrums.small + tempDrums.medium + tempDrums.large) > subscriptionLimits.drum_limit
                                    ? 'text-red-600'
                                    : (tempDrums.small + tempDrums.medium + tempDrums.large) === subscriptionLimits.drum_limit
                                    ? 'text-yellow-600'
                                    : 'text-green-600'
                                }`}>
                                  /{subscriptionLimits.drum_limit} ({subscriptionLimits.subscription_plan} plan)
                                </span>
                              )}
                            </div>
                            {(tempDrums.small + tempDrums.medium + tempDrums.large) > subscriptionLimits.drum_limit && subscriptionLimits.drum_limit !== -1 && (
                              <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                ⚠️ Exceeds limit! This will be blocked.
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={handleDrumsSave}
                            className={`px-4 py-2 rounded text-sm font-medium ${
                              (tempDrums.small + tempDrums.medium + tempDrums.large) > subscriptionLimits.drum_limit && subscriptionLimits.drum_limit !== -1
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {(tempDrums.small + tempDrums.medium + tempDrums.large) > subscriptionLimits.drum_limit && subscriptionLimits.drum_limit !== -1
                              ? '⚠️ Save (Will be Blocked)'
                              : 'Save Changes'
                            }
                          </button>
                          <button
                            onClick={handleDrumsCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-row gap-2 sm:gap-3 md:gap-4">
                        <div className="flex-1 text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-md border border-blue-300">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mb-1">
                            {availableDrums.small}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800">
                            Small Drums
                          </div>
                        </div>
                        <div className="flex-1 text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-md border border-blue-300">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mb-1">
                            {availableDrums.medium}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800">
                            Medium Drums
                          </div>
                        </div>
                        <div className="flex-1 text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-md border border-blue-300">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mb-1">
                            {availableDrums.large}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800">
                            Large Drums
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Total Summary */}
                    <div className="mt-4 pt-4 border-t border-blue-300">
                      <div className="text-center bg-white rounded-lg p-3 shadow-sm border border-blue-300">
                        <div className="text-sm font-semibold text-gray-700 mb-1">
                          Total Drums
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {getTotalDrums()}
                        </div>
                        {/* Subscription Limit Display */}
                        <div className="mt-2 text-xs text-gray-600">
                          {subscriptionLimits.drum_limit === -1 ? (
                            <span className="text-green-600 font-medium">Unlimited (Premium Plan)</span>
                          ) : (
                            <span className={`font-medium ${
                              getTotalDrums() >= subscriptionLimits.drum_limit ? 'text-red-600' : 
                              getTotalDrums() >= subscriptionLimits.drum_limit * 0.8 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {getTotalDrums()}/{subscriptionLimits.drum_limit} ({subscriptionLimits.subscription_plan} plan)
                            </span>
                          )}
                        </div>
                        {/* Limit Warning */}
                        {subscriptionLimits.drum_limit !== -1 && getTotalDrums() >= subscriptionLimits.drum_limit && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            ⚠️ Drum limit reached! Upgrade your plan to add more drums.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Capacity and Prices */}
                  <div className="space-y-4 sm:space-y-6">
                  <div className="bg-sky-100 border border-blue-300 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <div className="text-blue-800 font-bold text-base sm:text-lg">
                        Drum Capacity Settings
                      </div>
                      {!isEditingCapacity && (
                        <button
                          onClick={handleCapacityEdit}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200"
                        >
                          Edit Capacity
                        </button>
                      )}
                    </div>

                    {isEditingCapacity ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-row gap-2 sm:gap-3 md:gap-4">
                          <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Small Drum Capacity (gallons)
                            </label>
                            <input
                              type="number"
                              value={tempCapacity.small}
                              onChange={(e) =>
                                handleCapacityChange("small", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-bold"
                              min="1"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Medium Drum Capacity (gallons)
                            </label>
                            <input
                              type="number"
                              value={tempCapacity.medium}
                              onChange={(e) =>
                                handleCapacityChange("medium", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-bold"
                              min="1"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Large Drum Capacity (gallons)
                            </label>
                            <input
                              type="number"
                              value={tempCapacity.large}
                              onChange={(e) =>
                                handleCapacityChange("large", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-bold"
                              min="1"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                          <button
                            onClick={handleCapacitySave}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium"
                          >
                            Save Capacity
                          </button>
                          <button
                            onClick={handleCapacityCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-row gap-2 sm:gap-3 md:gap-4">
                        <div className="flex-1 text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-md border border-blue-300">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-1">
                            {drumCapacity.small}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                            Small Drum
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            gallons per drum
                          </div>
                        </div>
                        <div className="flex-1 text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-md border border-blue-300">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-1">
                            {drumCapacity.medium}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                            Medium Drum
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            gallons per drum
                          </div>
                        </div>
                        <div className="flex-1 text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-md border border-blue-300">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-1">
                            {drumCapacity.large}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                            Large Drum
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            gallons per drum
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Drum Prices Section */}
                  <div className="bg-sky-100 border border-blue-300 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <div className="text-blue-800 font-bold text-base sm:text-lg">
                        Drum Prices (₱ per Drum)
                      </div>
                      {!isEditingPrices && (
                        <button
                          onClick={handlePricesEdit}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200"
                        >
                          Edit Prices
                        </button>
                      )}
                    </div>

                    {isEditingPrices ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-row gap-2 sm:gap-3 md:gap-4">
                          <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Small Drum Price (₱)
                            </label>
                            <input
                              type="number"
                              value={tempPrices.small}
                              onChange={(e) =>
                                handlePriceChange("small", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-bold"
                              min="0"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Medium Drum Price (₱)
                            </label>
                            <input
                              type="number"
                              value={tempPrices.medium}
                              onChange={(e) =>
                                handlePriceChange("medium", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-bold"
                              min="0"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Large Drum Price (₱)
                            </label>
                            <input
                              type="number"
                              value={tempPrices.large}
                              onChange={(e) =>
                                handlePriceChange("large", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-bold"
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                          <button
                            onClick={handlePricesSave}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium"
                          >
                            Save Prices
                          </button>
                          <button
                            onClick={handlePricesCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-row gap-2 sm:gap-3 md:gap-4">
                        <div className="flex-1 text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-md border border-blue-300">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1">
                            ₱{drumPrices.small}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                            Small Drum
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            per drum
                          </div>
                        </div>
                        <div className="flex-1 text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-md border border-blue-300">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1">
                            ₱{drumPrices.medium}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                            Medium Drum
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            per drum
                          </div>
                        </div>
                        <div className="flex-1 text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-md border border-blue-300">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1">
                            ₱{drumPrices.large}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                            Large Drum
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            per drum
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                {/* Add/Edit Flavor Section */}
                {currentVendor?.status !== 'suspended' && (
                  <div id="flavor-form" className="bg-sky-100 border border-blue-300 rounded-lg p-3 sm:p-6 mt-3 sm:mt-4">
                    <div className="text-blue-800 font-medium text-lg sm:text-xl mb-3 sm:mb-4">
                      {isEditingFlavor ? `Edit Flavor: ${editingFlavor?.flavor_name}` : "Add Flavor:"}
                    </div>

                  <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                    {/* Flavor Images */}
                    <div className="flex-shrink-0">
                      <div className="space-y-3 sm:space-y-4">
                        {/* Image Upload Area */}
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-lg flex items-center justify-center shadow-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                          <label
                            htmlFor="flavor-images"
                            className="cursor-pointer text-center"
                          >
                            <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">📷</div>
                            <div className="text-xs text-gray-600">
                              Upload Images
                            </div>
                            <input
                              id="flavor-images"
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs sm:text-sm text-gray-600">
                              Uploaded Images ({imagePreviews.length}):
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={preview}
                                    alt={`Flavor ${index + 1}`}
                                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-300"
                                  />
                                  <button
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Flavor Details */}
                    <div className="flex-1 space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-blue-800 mb-1 sm:mb-2">
                          Flavor Name
                        </label>
                        <input
                          type="text"
                          value={flavorForm.name}
                          onChange={(e) =>
                            handleFlavorFormChange("name", e.target.value)
                          }
                          placeholder="Enter flavor name (e.g., Vanilla)"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm text-sm sm:text-base text-gray-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-blue-800 mb-1 sm:mb-2">
                          Description
                        </label>
                        <textarea
                          value={flavorForm.description}
                          onChange={(e) =>
                            handleFlavorFormChange(
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Describe your ice cream flavor..."
                          rows={3}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm text-sm sm:text-base text-gray-900 font-medium resize-vertical"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <label
                          htmlFor="flavor-images"
                          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md transition-colors duration-200 cursor-pointer hover:shadow-lg text-xs sm:text-sm text-center"
                        >
                          Upload Images
                        </label>
                        <input
                          id="flavor-images"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                          <button
                            onClick={handleSaveFlavor}
                            disabled={isFlavorLimitReached || isSavingFlavor}
                            className={`font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg text-xs sm:text-sm ${
                              isFlavorLimitReached
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } ${isFlavorLimitReached || isSavingFlavor ? 'cursor-not-allowed opacity-70' : ''}`}
                          >
                            {isFlavorLimitReached
                              ? '⚠️ Limit Reached'
                              : isSavingFlavor
                                ? (isEditingFlavor ? 'Updating...' : 'Saving...')
                                : isEditingFlavor ? "Update Flavor" : "Save Flavor"
                            }
                          </button>
                          
                          {/* Flavor Limit Display */}
                          {!isEditingFlavor && (
                            <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="text-center">
                                <div className="text-xs sm:text-sm text-gray-600 mb-1">Current Flavors</div>
                                <div className={`text-lg sm:text-2xl font-bold ${
                                  savedFlavors.length >= subscriptionLimits.flavor_limit && subscriptionLimits.flavor_limit !== -1
                                    ? 'text-red-600'
                                    : savedFlavors.length >= subscriptionLimits.flavor_limit * 0.8 && subscriptionLimits.flavor_limit !== -1
                                    ? 'text-yellow-600'
                                    : 'text-blue-600'
                                }`}>
                                  {savedFlavors.length}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {subscriptionLimits.flavor_limit === -1 ? (
                                    <span className="text-green-600">Unlimited (Premium Plan)</span>
                                  ) : (
                                    <span className={`font-medium ${
                                      savedFlavors.length >= subscriptionLimits.flavor_limit
                                        ? 'text-red-600'
                                        : savedFlavors.length >= subscriptionLimits.flavor_limit * 0.8
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                    }`}>
                                      /{subscriptionLimits.flavor_limit} ({subscriptionLimits.subscription_plan} plan)
                                    </span>
                                  )}
                                </div>
                                {savedFlavors.length >= subscriptionLimits.flavor_limit && subscriptionLimits.flavor_limit !== -1 && (
                                  <div className="mt-1 sm:mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                    ⚠️ Limit reached!
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {isEditingFlavor && (
                            <button
                              onClick={cancelEditFlavor}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md transition-colors duration-200 text-xs sm:text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Saved Flavors Section */}
                <div className="bg-[#D4F6FF] border border-blue-300 rounded-lg p-3 sm:p-6 mt-3 sm:mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                    <div className="text-blue-800 font-medium text-lg sm:text-xl">
                      My Flavors
                    </div>
                    {/* Flavor Limit Display */}
                    <div className="text-xs sm:text-sm text-gray-600">
                      {subscriptionLimits.flavor_limit === -1 ? (
                        <span className="text-green-600 font-medium">Unlimited (Premium Plan)</span>
                      ) : (
                        <span className={`font-medium ${
                          savedFlavors.length >= subscriptionLimits.flavor_limit ? 'text-red-600' : 
                          savedFlavors.length >= subscriptionLimits.flavor_limit * 0.8 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {savedFlavors.length}/{subscriptionLimits.flavor_limit} ({subscriptionLimits.subscription_plan} plan)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search flavors by name or description..."
                        value={flavorSearchTerm}
                        onChange={(e) => setFlavorSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      {flavorSearchTerm && (
                        <button
                          onClick={() => setFlavorSearchTerm("")}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Flavor Limit Warning */}
                  {subscriptionLimits.flavor_limit !== -1 && savedFlavors.length >= subscriptionLimits.flavor_limit && (
                    <div className="mb-4 text-xs text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
                      ⚠️ Flavor limit reached! Upgrade your plan to add more flavors.
                    </div>
                  )}
                  
                  {flavorsLoading ? (
                    <div className="text-center py-8">
                      <div className="text-blue-600">Loading flavors...</div>
                    </div>
                  ) : savedFlavors.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-600 mb-4">No flavors added yet</div>
                      <div className="text-sm text-gray-500">
                        Add your first flavor using the form above
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const filteredFlavors = savedFlavors.filter((flavor) => {
                        if (!flavorSearchTerm) return true;
                        const searchLower = flavorSearchTerm.toLowerCase();
                        return (
                          flavor.flavor_name.toLowerCase().includes(searchLower) ||
                          (flavor.flavor_description && flavor.flavor_description.toLowerCase().includes(searchLower))
                        );
                      });

                      if (filteredFlavors.length === 0 && flavorSearchTerm) {
                        return (
                          <div className="text-center py-8">
                            <div className="text-gray-600 mb-2">No flavors found</div>
                            <div className="text-sm text-gray-500">
                              No flavors match "{flavorSearchTerm}"
                            </div>
                            <button
                              onClick={() => setFlavorSearchTerm("")}
                              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Clear search
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                          {filteredFlavors.map((flavor) => {
                        // Parse image URLs (stored as JSON array)
                        let imageUrls = [];
                        try {
                          imageUrls = JSON.parse(flavor.image_url || '[]');
                        } catch (e) {
                          // Fallback for single image (old format)
                          if (flavor.image_url) {
                            imageUrls = [flavor.image_url];
                          }
                        }
                        
                        return (
                          <div key={flavor.flavor_id} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-blue-300">
                            <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                              {imageUrls.length > 0 ? (
                                <div className="relative w-full h-full">
                                  <img
                                    src={getImageUrl(imageUrls[0], process.env.REACT_APP_API_URL || "http://localhost:3001") || `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrls[0]}`}
                                    alt={flavor.flavor_name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                                    }}
                                  />
                                  {imageUrls.length > 1 && (
                                    <button
                                      onClick={() => openImageModal(imageUrls, flavor.flavor_name)}
                                      className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full transition-all duration-200 cursor-pointer"
                                    >
                                      +{imageUrls.length - 1} more
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
                            {flavor.flavor_name}
                          </h3>
                          {flavor.flavor_description && (
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                              {flavor.flavor_description}
                            </p>
                          )}
                          <div className="text-xs text-gray-500 mt-1 sm:mt-2">
                            Added {formatPhilippineDateOnly(flavor.created_at)}
                          </div>
                          
                          {/* Store Status Badge */}
                          <div className="mt-1 sm:mt-2">
                            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                              flavor.store_status === 'published' 
                                ? 'bg-green-100 text-green-800' 
                                : flavor.store_status === 'ready'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {flavor.store_status === 'published' ? '📦 In Store' : 
                               flavor.store_status === 'ready' ? '✅ Ready' : '📝 Draft'}
                            </span>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col space-y-1.5 sm:space-y-2 mt-2 sm:mt-3">
                            <div className="flex space-x-1.5 sm:space-x-2">
                              <button
                                onClick={() => startEditFlavor(flavor)}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-colors duration-200 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => confirmDeleteFlavor(flavor)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-colors duration-200 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                            
                            {/* Store Status Buttons */}
                            {flavor.store_status === 'draft' && (
                              <button
                                onClick={() => updateFlavorStoreStatus(flavor.flavor_id, 'ready')}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-colors duration-200 font-medium"
                              >
                                Mark as Ready
                              </button>
                            )}
                            
                            {flavor.store_status === 'ready' && (
                              <button
                                onClick={() => updateFlavorStoreStatus(flavor.flavor_id, 'published')}
                                className="w-full bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-colors duration-200 font-medium"
                              >
                                📦 Upload to Store
                              </button>
                            )}
                            
                            {flavor.store_status === 'published' && (
                              <button
                                onClick={() => updateFlavorStoreStatus(flavor.flavor_id, 'ready')}
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-colors duration-200 font-medium"
                              >
                                Remove from Store
                              </button>
                            )}
                          </div>
                        </div>
                        );
                      })}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}

            {activeView === "my-store" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50">
                {/* Store Header - Mobile Responsive */}
                <div className="bg-sky-100 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 mx-2 sm:mx-4">
                  {/* Mobile Layout - Stacked */}
                  <div className="flex flex-col sm:hidden space-y-4">
                    {/* Top Section: Logo + Store Info */}
                    <div className="flex items-center space-x-4">
                      {/* Store Logo */}
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                        {profileImage ? (
                          <img 
                            src={profileImage} 
                            alt="Store Logo" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="w-10 h-10 mx-auto mb-1">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-full h-full"
                              >
                                <path
                                  d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                                  fill="#FF6B9D"
                                />
                                <path
                                  d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
                                  fill="#9B59B6"
                                />
                                <path
                                  d="M8 4L9 7L12 8L9 9L8 12L7 9L4 8L7 7L8 4Z"
                                  fill="#8B4513"
                                />
                              </svg>
                            </div>
                            <div className="text-xs font-bold text-gray-800">
                              ICE CREAM
                            </div>
                            <div className="text-xs text-gray-600">
                              WRITE YOUR
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Store Info */}
                      <div className="flex-1 min-w-0">
                        <h1
                          className="text-xl font-bold text-gray-900 mb-1 truncate"
                          style={{ fontFamily: "cursive" }}
                        >
                          {currentVendor?.store_name ||
                            "Frosty Bites Ice Cream"}
                        </h1>
                        <p className="text-sm text-gray-700">
                          ID: {currentVendor?.vendor_id || "123456"}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Section: Publish Button */}
                    <div className="w-full">
                      <button
                        onClick={() => setActiveView("inventory")}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                      >
                        Publish Flavor
                      </button>
                    </div>
                  </div>

                  {/* Desktop Layout - Side by Side */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Store Logo */}
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                        {profileImage ? (
                          <img 
                            src={profileImage} 
                            alt="Store Logo" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-1">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-full h-full"
                              >
                                <path
                                  d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                                  fill="#FF6B9D"
                                />
                                <path
                                  d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
                                  fill="#9B59B6"
                                />
                                <path
                                  d="M8 4L9 7L12 8L9 9L8 12L7 9L4 8L7 7L8 4Z"
                                  fill="#8B4513"
                                />
                              </svg>
          </div>
                            <div className="text-xs font-bold text-gray-800">
                              ICE CREAM
                            </div>
                            <div className="text-xs text-gray-600">
                              WRITE YOUR
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Store Info */}
                      <div>
                        <h1
                          className="text-3xl font-bold text-gray-900 mb-1"
                          style={{ fontFamily: "cursive" }}
                        >
                          {currentVendor?.store_name ||
                            "Frosty Bites Ice Cream"}
                        </h1>
                        <p className="text-lg text-gray-700">
                          ID: {currentVendor?.vendor_id || "123456"}
                        </p>
                      </div>
                    </div>

                    {/* Publish Flavor Button */}
                    <button
                      onClick={() => setActiveView("inventory")}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl text-base"
                    >
                      Publish Flavor
                    </button>
                  </div>
                </div>

                {/* Published Flavors Section - Mobile Responsive */}
                {publishedFlavorsLoading ? (
                  <div className="flex justify-center items-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="px-2 sm:px-4">
                    {publishedFlavors.length === 0 ? (
                      <div className="text-center py-12 sm:py-16">
                        <div className="bg-blue-200 rounded-2xl p-6 sm:p-12 max-w-md mx-auto">
                          <div className="text-4xl sm:text-6xl mb-4">🍦</div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                            No Flavors Published Yet
                          </h3>
                          <p className="text-sm sm:text-base text-gray-700 mb-6">
                            Start by publishing your first ice cream flavor to
                            showcase to customers!
                          </p>
                          <button
                            onClick={() => setActiveView("inventory")}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 sm:px-8 py-3 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                          >
                            Publish Your First Flavor
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 max-w-7xl mx-auto">
                        {publishedFlavors.map((flavor) => {
                          // Parse image URLs (stored as JSON array)
                          let imageUrls = [];
                          try {
                            imageUrls = JSON.parse(flavor.image_url || '[]');
                          } catch (e) {
                            if (flavor.image_url) {
                              imageUrls = [flavor.image_url];
                            }
                          }
                          
                          return (
                            <div
                              key={flavor.flavor_id}
                              className="bg-sky-100 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-4 lg:p-6 hover:shadow-xl transition-shadow duration-300"
                            >
                              {/* Flavor Image */}
                              <div className="mb-2 sm:mb-4">
                                {imageUrls.length > 0 ? (
                                  <div className="relative">
                                    <img
                                      src={getImageUrl(imageUrls[0], process.env.REACT_APP_API_URL || "http://localhost:3001") || `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrls[0]}`}
                                      alt={flavor.flavor_name}
                                      className="w-full h-24 sm:h-40 lg:h-48 object-cover rounded-md sm:rounded-lg lg:rounded-xl"
                                      onError={(e) => {
                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                                      }}
                                    />
                                    {imageUrls.length > 1 && (
                                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full">
                                        +{imageUrls.length - 1} more
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-full h-24 sm:h-40 lg:h-48 bg-white rounded-md sm:rounded-lg lg:rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">🍦</div>
                                      <div className="text-xs sm:text-sm text-gray-600">
                                        No Image
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Flavor Info */}
                              <div className="space-y-1 sm:space-y-3">
                                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 text-center line-clamp-1">
                                  {flavor.flavor_name}
                                </h3>

                                <p className="text-gray-700 text-center text-xs sm:text-sm line-clamp-2">
                                  {flavor.flavor_description}
                                </p>

                                {/* Available Drum Sizes and Pricing */}
                                <div className="space-y-1 sm:space-y-2">
                                  <div className="text-center">
                                    <span className="text-xs sm:text-sm font-semibold text-gray-700">
                                      Available in all sizes
                                    </span>
                                  </div>
                                  
                                  {/* All Available Drum Sizes - Mobile Optimized */}
                                  <div className="text-xs text-gray-600 space-y-0.5 sm:space-y-1">
                                    <div className="flex justify-between">
                                      <span>Small ({drumCapacity.small} gal):</span>
                                      <span className="font-medium">₱{drumPrices.small}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Medium ({drumCapacity.medium} gal):</span>
                                      <span className="font-medium">₱{drumPrices.medium}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Large ({drumCapacity.large} gal):</span>
                                      <span className="font-medium">₱{drumPrices.large}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-1 sm:pt-2">
                                  <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    📦 Published
                                  </span>
                                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                                    {flavor.sold_count || 0} sold
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Transaction History View */}
            {activeView === "transactions" && (
              <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6">
                <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-sky-100 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Transaction History</h1>
                  <p className="text-sm sm:text-base text-gray-600">Track your financial transactions and earnings</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
              <div className="bg-sky-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">₱{parseFloat(transactionStats.total_earnings || 0).toFixed(2)}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm sm:text-lg lg:text-2xl font-bold text-blue-600">₱</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-sky-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{transactionStats.total_transactions || 0}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-sky-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Payments</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{transactionStats.pending_count || 0}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-sky-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">GCash Transactions</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{transactionStats.gcash_transactions || 0}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-sky-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Filters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Start Date</label>
                  <input
                    type="date"
                    value={transactionFilters.start_date}
                    onChange={(e) => setTransactionFilters({...transactionFilters, start_date: e.target.value})}
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">End Date</label>
                  <input
                    type="date"
                    value={transactionFilters.end_date}
                    onChange={(e) => setTransactionFilters({...transactionFilters, end_date: e.target.value})}
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Payment Method</label>
                  <select
                    value={transactionFilters.payment_method}
                    onChange={(e) => setTransactionFilters({...transactionFilters, payment_method: e.target.value})}
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                  >
                    <option value="all">All Methods</option>
                    <option value="gcash_qr">GCash QR</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
                  <select
                    value={transactionFilters.status}
                    onChange={(e) => setTransactionFilters({...transactionFilters, status: e.target.value})}
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={fetchVendorTransactions}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => setTransactionFilters({start_date: '', end_date: '', payment_method: 'all', status: 'all'})}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>  

            {/* Transactions List */}
            <div className="bg-sky-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <button
                  onClick={fetchVendorTransactions}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Refresh
                </button>
              </div>
              
              {transactionsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions
                    .filter(transaction => {
                      // Apply date filters
                      if (transactionFilters.start_date) {
                        const transactionDate = new Date(transaction.order_date);
                        const startDate = new Date(transactionFilters.start_date);
                        if (transactionDate < startDate) return false;
                      }
                      
                      if (transactionFilters.end_date) {
                        const transactionDate = new Date(transaction.order_date);
                        const endDate = new Date(transactionFilters.end_date);
                        endDate.setHours(23, 59, 59, 999); // Include the entire end date
                        if (transactionDate > endDate) return false;
                      }
                      
                      // Apply payment method filter
                      if (transactionFilters.payment_method !== 'all') {
                        if (transaction.transaction_type !== transactionFilters.payment_method) return false;
                      }
                      
                      // Apply status filter
                      if (transactionFilters.status !== 'all') {
                        if (transaction.transaction_status !== transactionFilters.status) return false;
                      }
                      
                      return true;
                    })
                    .map((transaction) => (
                    <div key={transaction.order_id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="flex-shrink-0">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${
                                transaction.transaction_status === 'completed' ? 'bg-blue-100' : 'bg-blue-100'
                              }`}>
                                <span className={`text-sm sm:text-base lg:text-xl font-bold ${
                                  transaction.transaction_status === 'completed' ? 'text-blue-600' : 'text-blue-600'
                                }`}>₱</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Order #{transaction.order_id}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                                  transaction.transaction_status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {transaction.transaction_status}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {transaction.customer_fname} {transaction.customer_lname}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {formatPhilippineDateOnly(transaction.order_date)} • {transaction.transaction_type}
                              </p>
                              {transaction.customer_notes && (
                                <p className="text-xs sm:text-sm text-blue-600 mt-1 truncate">
                                  📝 {transaction.customer_notes.substring(0, 50)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-2">
                          <p className="text-base sm:text-lg font-bold text-gray-900">₱{parseFloat(transaction.total_amount || 0).toFixed(2)}</p>
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowTransactionModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
                </div>
              </div>
            )}

            {/* Transaction Details Modal */}
            {showTransactionModal && selectedTransaction && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-y-auto my-4">
                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-3 sm:p-4 border-b">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Transaction Details - Order #{selectedTransaction.order_id}
                    </h3>
                    <button
                      onClick={() => setShowTransactionModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Modal Content */}
                  <div className="p-3 sm:p-4">
                    {/* Transaction Information */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Transaction Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Order ID:</span>
                          <span className="ml-2 text-gray-900">#{selectedTransaction.order_id}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Customer:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedTransaction.customer_fname} {selectedTransaction.customer_lname}
                          </span>
                        </div>
                        {selectedTransaction.payment_status === 'partial' && selectedTransaction.payment_amount ? (
                          <>
                            <div>
                              <span className="font-medium text-gray-700">Total Amount:</span>
                              <span className="ml-2 text-gray-900">₱{parseFloat(selectedTransaction.total_amount || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Payment Method:</span>
                              <span className="ml-2 text-gray-900">{selectedTransaction.transaction_type}</span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="font-medium text-gray-700">Amount Paid (50%):</span>
                              <span className="ml-2 text-green-600 font-bold">₱{parseFloat(selectedTransaction.payment_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="font-medium text-gray-700">Remaining Balance:</span>
                              <span className="ml-2 text-orange-600">₱{parseFloat(selectedTransaction.remaining_balance || (selectedTransaction.total_amount - selectedTransaction.payment_amount)).toFixed(2)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="font-medium text-gray-700">Amount:</span>
                              <span className="ml-2 text-gray-900 font-semibold">
                                ₱{parseFloat(selectedTransaction.total_amount || 0).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Payment Method:</span>
                              <span className="ml-2 text-gray-900">{selectedTransaction.transaction_type}</span>
                            </div>
                          </>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            selectedTransaction.transaction_status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedTransaction.transaction_status}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <span className="ml-2 text-gray-900">
                            {formatPhilippineDate(selectedTransaction.order_date, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Contact Information */}
                    {selectedTransaction.customer_contact && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">Customer Contact</h4>
                        <p className="text-sm text-blue-800">
                          📞 {selectedTransaction.customer_contact}
                        </p>
                      </div>
                    )}

                    {/* Customer Notes */}
                    {selectedTransaction.customer_notes && (
                      <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-yellow-900 mb-2">Customer Notes</h4>
                        <p className="text-sm text-yellow-800 bg-white p-3 rounded border">
                          {selectedTransaction.customer_notes}
                        </p>
                      </div>
                    )}

                    {/* Payment Proof Screenshot */}
                    {selectedTransaction.payment_confirmation_image && (
                      <div className="bg-green-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-green-900 mb-3">Payment Confirmation Screenshot</h4>
                        <div className="text-center">
                          <img 
                            src={selectedTransaction.payment_confirmation_image} 
                            alt="Payment Proof" 
                            className="w-full max-w-md mx-auto border border-gray-200 rounded-lg shadow-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Order Status Information */}
                    <div className="bg-purple-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-purple-900 mb-2">Order Status</h4>
                      <div className="text-sm text-purple-800">
                        <p><span className="font-medium">Current Status:</span> {selectedTransaction.order_status}</p>
                        <p><span className="font-medium">Payment Status:</span> {selectedTransaction.payment_status}</p>
                      </div>
                    </div>

                    {/* No Payment Proof Message */}
                    {!selectedTransaction.payment_confirmation_image && (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-gray-400 text-4xl mb-2">📱</div>
                        <p className="text-gray-600 text-sm">No payment proof available for this transaction.</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Modal Footer */}
                  <div className="flex justify-end p-3 sm:p-4 border-t">
                    <button
                      onClick={() => setShowTransactionModal(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeView === "addCustomerOrders" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-2 sm:p-4 lg:p-6">
                <div className="max-w-6xl mx-auto">
                  {/* Header */}
                  <div className="bg-sky-100 rounded-2xl p-2 sm:p-4 lg:p-6 mb-2 sm:mb-4 lg:mb-6 shadow-lg">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <img 
                          src={addCustomerIcon} 
                          alt="Walk-in Orders" 
                          className="w-5 h-5 sm:w-7 sm:h-7"
                        />
                      </div>
                      <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                          Walk-in Customer Orders
                        </h1>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Order Limit Display */}
                  <div className="bg-sky-100 rounded-2xl p-2 sm:p-3 lg:p-4 mb-2 sm:mb-4 lg:mb-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Monthly Orders</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Current month's order count</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${
                          (() => {
                            const currentMonth = new Date().getMonth();
                            const currentYear = new Date().getFullYear();
                            const currentMonthOrders = vendorOrders.filter(order => {
                              const orderDate = new Date(order.created_at);
                              return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
                            });
                            const currentCount = currentMonthOrders.length;
                            
                            if (subscriptionLimits.order_limit === -1) return 'text-green-600';
                            if (currentCount >= subscriptionLimits.order_limit) return 'text-red-600';
                            if (currentCount >= subscriptionLimits.order_limit * 0.8) return 'text-yellow-600';
                            return 'text-blue-600';
                          })()
                        }`}>
                          {(() => {
                            const currentMonth = new Date().getMonth();
                            const currentYear = new Date().getFullYear();
                            const currentMonthOrders = vendorOrders.filter(order => {
                              const orderDate = new Date(order.created_at);
                              return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
                            });
                            return currentMonthOrders.length;
                          })()}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {subscriptionLimits.order_limit === -1 ? (
                            <span className="text-green-600">Unlimited (Premium Plan)</span>
                          ) : (
                            <span className={`font-medium ${
                              (() => {
                                const currentMonth = new Date().getMonth();
                                const currentYear = new Date().getFullYear();
                                const currentMonthOrders = vendorOrders.filter(order => {
                                  const orderDate = new Date(order.created_at);
                                  return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
                                });
                                const currentCount = currentMonthOrders.length;
                                
                                if (currentCount >= subscriptionLimits.order_limit) return 'text-red-600';
                                if (currentCount >= subscriptionLimits.order_limit * 0.8) return 'text-yellow-600';
                                return 'text-green-600';
                              })()
                            }`}>
                              /{subscriptionLimits.order_limit} ({subscriptionLimits.subscription_plan} plan)
                            </span>
                          )}
                        </div>
                        {(() => {
                          const currentMonth = new Date().getMonth();
                          const currentYear = new Date().getFullYear();
                          const currentMonthOrders = vendorOrders.filter(order => {
                            const orderDate = new Date(order.created_at);
                            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
                          });
                          const currentCount = currentMonthOrders.length;
                          
                          return subscriptionLimits.order_limit !== -1 && currentCount >= subscriptionLimits.order_limit;
                        })() && (
                          <div className="mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            ⚠️ Monthly limit reached!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Success Message */}
                  {showWalkInSuccess && (
                    <div className="bg-sky-100 text-blue-800 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 rounded-lg mb-2 sm:mb-4 lg:mb-6 flex items-center shadow-md">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-sm sm:text-base">Order created successfully!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-4 lg:gap-6">
                    {/* Left Side - Order Form */}
                    <div className="bg-sky-100 rounded-2xl p-2 sm:p-4 lg:p-6 shadow-lg">
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4 lg:mb-6 flex items-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Items
                      </h2>

                      {/* Customer Information Section */}
                      <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-white rounded-lg">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
                          Customer Information
                        </h3>
                        
                        {/* Delivery Address - Inside Customer Info */}
                        <div className="mb-2 sm:mb-3 lg:mb-4 p-1.5 sm:p-2 lg:p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-xs font-semibold text-gray-900 mb-1.5 sm:mb-2 lg:mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Delivery Address *
                          </h4>
                          <div className="space-y-1.5 sm:space-y-2">
                            <div>
                              <input
                                type="text"
                                value={customerAddress.street}
                                onChange={(e) => setCustomerAddress({...customerAddress, street: e.target.value})}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                                placeholder="Street Address *"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                              <input
                                type="text"
                                value={customerAddress.barangay}
                                onChange={(e) => setCustomerAddress({...customerAddress, barangay: e.target.value})}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                                placeholder="Barangay *"
                              />
                              <input
                                type="text"
                                value={customerAddress.city}
                                onChange={(e) => setCustomerAddress({...customerAddress, city: e.target.value})}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                                placeholder="City *"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                              <input
                                type="text"
                                value={customerAddress.province}
                                onChange={(e) => setCustomerAddress({...customerAddress, province: e.target.value})}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                                placeholder="Province (optional)"
                              />
                              <input
                                type="text"
                                value={customerAddress.postalCode}
                                onChange={(e) => setCustomerAddress({...customerAddress, postalCode: e.target.value})}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                                placeholder="Postal Code (optional)"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Customer Name */}
                        <div className="mb-1.5 sm:mb-2 lg:mb-3">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                            placeholder="Enter customer name"
                            required
                          />
                        </div>

                        {/* Customer Contact */}
                        <div className="mb-1.5 sm:mb-2 lg:mb-3">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Contact No. *
                          </label>
                          <input
                            type="tel"
                            value={customerContact}
                            onChange={(e) => setCustomerContact(e.target.value)}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                            placeholder="09123456789"
                            required
                          />
                        </div>

                        {/* Customer Email */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Email (Optional)
                          </label>
                          <input
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                            placeholder="customer@email.com"
                          />
                        </div>
                      </div>

                      {/* Delivery Date and Time - Moved from cart section */}
                      <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 bg-white rounded-lg border-2 border-blue-200">
                        <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 flex items-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-5 lg:h-5 mr-1 sm:mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Schedule to Deliver *
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 lg:gap-3 xl:gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={walkInDeliveryDate}
                              onChange={(e) => setWalkInDeliveryDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 xl:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm lg:text-base bg-white"
                              required
                              placeholder="mm/dd/yyyy"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Time <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="time"
                              value={walkInDeliveryTime}
                              onChange={(e) => setWalkInDeliveryTime(e.target.value)}
                              className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 xl:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm lg:text-base bg-white"
                              required
                              placeholder="--:-- --"
                            />
                          </div>
                        </div>
                        {(!walkInDeliveryDate || !walkInDeliveryTime) && (
                          <p className="text-red-500 text-xs sm:text-sm mt-1.5 sm:mt-2 lg:mt-3 flex items-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Please select both date and time to see availability
                          </p>
                        )}
                        
                        {/* Date-specific availability display */}
                        {walkInDeliveryDate && walkInDateAvailability && (
                          <div className="mt-2 sm:mt-2.5 lg:mt-3 p-2 sm:p-2.5 lg:p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1.5 sm:mb-2">
                              📅 Availability for {formatPhilippineDateOnly(walkInDeliveryDate)}:
                            </p>
                            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 lg:gap-2">
                              {['small', 'medium', 'large'].map((size) => {
                                const count = walkInDateAvailability[size] || 0;
                                return (
                                  <div key={size} className="text-center p-1 sm:p-1.5 lg:p-2 bg-white rounded">
                                    <p className="text-xs text-gray-600 capitalize">{size}</p>
                                    <p className={`text-xs sm:text-sm font-semibold ${count > 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                      {count} {count !== 1 ? 'drums' : 'drum'}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {walkInDeliveryDate && walkInAvailabilityLoading && (
                          <div className="mt-2 sm:mt-2.5 lg:mt-3 p-2 sm:p-2.5 lg:p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs sm:text-sm text-gray-600 text-center">
                              Loading availability...
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Flavor Selection */}
                      <div className="mb-2 sm:mb-3 lg:mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Select Flavor *
                        </label>
                        <select
                          value={selectedFlavor}
                          onChange={(e) => setSelectedFlavor(e.target.value)}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                        >
                          <option value="">Choose a flavor...</option>
                          {flavorsLoading ? (
                            <option disabled>Loading flavors...</option>
                          ) : savedFlavors.length === 0 ? (
                            <option disabled>No flavors available</option>
                          ) : (
                            savedFlavors.map((flavor) => (
                              <option key={flavor.flavor_id} value={flavor.flavor_id}>
                                {flavor.flavor_name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Size Selection */}
                      <div className="mb-2 sm:mb-3 lg:mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Select Size *
                          {!walkInDeliveryDate && (
                            <span className="text-xs text-gray-500 ml-1 sm:ml-2">(Select delivery date first to see availability)</span>
                          )}
                        </label>
                        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 lg:gap-2">
                          {['small', 'medium', 'large'].map((size) => {
                            const selectedFlavorData = savedFlavors.find(
                              f => f.flavor_id === parseInt(selectedFlavor)
                            );
                            const priceKey = `${size}_price`;
                            const price = selectedFlavorData?.[priceKey] || 0;
                            const hasPrice = price > 0;
                            
                            // Check availability for this size
                            const available = walkInDeliveryDate ? getWalkInAvailableDrums(size) : null;
                            const isOutOfStock = available !== null && available === 0;
                            const isDisabled = !hasPrice || !selectedFlavor || isOutOfStock;

                            return (
                              <button
                                key={size}
                                onClick={() => hasPrice && !isOutOfStock && setSelectedSize(size)}
                                disabled={isDisabled}
                                className={`px-1 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 rounded-lg border-2 transition-all font-medium ${
                                  selectedSize === size
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : isOutOfStock
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                                    : hasPrice && selectedFlavor
                                    ? 'border-gray-300 hover:border-blue-400 text-gray-700'
                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                                title={isOutOfStock ? `No ${size} drums available for selected date` : available !== null ? `${available} ${size} drum(s) available` : ''}
                              >
                                <div className="text-xs capitalize">{size}</div>
                                {selectedFlavor && (
                                  <div className="text-xs mt-0.5 sm:mt-0.5 lg:mt-1">
                                    {hasPrice ? `₱${price}` : 'N/A'}
                                  </div>
                                )}
                                {walkInDeliveryDate && available !== null && (
                                  <div className={`text-xs mt-0.5 ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                                    {isOutOfStock ? 'Out' : `${available} avail.`}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quantity Selection */}
                      <div className="mb-2 sm:mb-3 lg:mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Quantity *
                          {selectedSize && walkInDeliveryDate && (
                            <span className="text-xs text-gray-500 ml-1 sm:ml-2">
                              (Max: {getWalkInAvailableDrums(selectedSize)} available)
                            </span>
                          )}
                        </label>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={() => setWalkInQuantity(Math.max(1, walkInQuantity - 1))}
                            className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center font-bold text-gray-700 text-xs sm:text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={selectedSize && walkInDeliveryDate ? getWalkInAvailableDrums(selectedSize) : undefined}
                            value={walkInQuantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              const maxAvailable = selectedSize && walkInDeliveryDate ? getWalkInAvailableDrums(selectedSize) : Infinity;
                              setWalkInQuantity(Math.max(1, Math.min(newQty, maxAvailable)));
                            }}
                            className="w-12 sm:w-14 lg:w-16 px-1 sm:px-2 py-1.5 sm:py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                          />
                          <button
                            onClick={() => {
                              const maxAvailable = selectedSize && walkInDeliveryDate ? getWalkInAvailableDrums(selectedSize) : Infinity;
                              setWalkInQuantity(Math.min(walkInQuantity + 1, maxAvailable));
                            }}
                            disabled={selectedSize && walkInDeliveryDate && walkInQuantity >= getWalkInAvailableDrums(selectedSize)}
                            className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center font-bold text-gray-700 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        {selectedSize && walkInDeliveryDate && (
                          <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                            {getWalkInAvailableDrums(selectedSize)} {selectedSize} drum(s) available for {formatPhilippineDateOnly(walkInDeliveryDate)}
                          </p>
                        )}
                      </div>

                      {/* Add Item Button */}
                      <button
                        onClick={addToWalkInCart}
                        disabled={!selectedFlavor || !selectedSize}
                        className="w-full py-1.5 sm:py-2 lg:py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1 sm:space-x-2 shadow-md hover:shadow-lg text-xs sm:text-sm"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add Item</span>
                      </button>
                    </div>

                    {/* Right Side - Order Items */}
                    <div id="walk-in-order-items" className="bg-sky-100 rounded-2xl p-2 sm:p-4 lg:p-6 shadow-lg">
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4 xl:mb-6 flex items-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-1 sm:mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Order Items ({walkInCart.length} {walkInCart.length === 1 ? 'item' : 'items'})
                      </h2>

                      {walkInCart.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 lg:py-12 text-gray-400">
                          <svg className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="text-xs sm:text-sm lg:text-base">No items added</p>
                          <p className="text-xs mt-1">Add items to build the order</p>
                        </div>
                      ) : (
                        <>
                          {/* Order Items List */}
                          <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3 lg:mb-4 xl:mb-6 max-h-48 sm:max-h-60 lg:max-h-80 xl:max-h-96 overflow-y-auto">
                            {walkInCart.map((item) => (
                              <div key={item.id} className="bg-white p-1.5 sm:p-2 lg:p-3 xl:p-4 rounded-lg flex justify-between items-center">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base truncate">{item.flavor_name}</h3>
                                  <div className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                                    <span className="capitalize">{item.size}</span> • Qty: {item.quantity} • ₱{item.price} each
                                  </div>
                                </div>
                                <div className="text-right ml-1 sm:ml-2 lg:ml-4 flex-shrink-0">
                                  <div className="font-bold text-blue-600 text-xs sm:text-sm lg:text-base">₱{item.subtotal.toFixed(2)}</div>
                                  <button
                                    onClick={() => removeFromWalkInCart(item.id)}
                                    className="text-red-500 hover:text-red-700 text-xs mt-0.5 sm:mt-1 font-medium"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Payment Method */}
                          <div className="mb-2 sm:mb-3 lg:mb-4 xl:mb-5 pb-2 sm:pb-3 lg:pb-4 xl:pb-6 border-b border-gray-200">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2 lg:mb-3">
                              Payment Method
                            </h3>
                            
                            {/* Payment Method Selection */}
                            <div className="mb-2 sm:mb-3 lg:mb-4">
                              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:gap-3">
                                <button
                                  type="button"
                                  onClick={() => setWalkInPaymentMethod('cash')}
                                  className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 xl:py-3 rounded-lg border-2 transition-all ${
                                    walkInPaymentMethod === 'cash'
                                      ? 'border-green-500 bg-green-50 text-green-700'
                                      : 'border-gray-300 hover:border-green-300 text-gray-700'
                                  }`}
                                >
                                  <div className="text-xs sm:text-sm font-medium">Cash</div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setWalkInPaymentMethod('gcash')}
                                  className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 xl:py-3 rounded-lg border-2 transition-all ${
                                    walkInPaymentMethod === 'gcash'
                                      ? 'border-green-500 bg-green-50 text-green-700'
                                      : 'border-gray-300 hover:border-green-300 text-gray-700'
                                  }`}
                                >
                                  <div className="text-xs sm:text-sm font-medium">GCash</div>
                                </button>
                              </div>
                            </div>

                            {/* Payment Option */}
                            <div className="bg-blue-50 p-1.5 sm:p-2 lg:p-3 xl:p-4 rounded-lg">
                              <label className="block text-xs font-medium text-gray-700 mb-1 sm:mb-2">
                                Payment Option:
                              </label>
                              <div className="space-y-1 sm:space-y-1.5 lg:space-y-2">
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="radio"
                                    name="paymentOption"
                                    value="full"
                                    checked={walkInPaymentOption === 'full'}
                                    onChange={(e) => setWalkInPaymentOption(e.target.value)}
                                    className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-900">Full Payment</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="radio"
                                    name="paymentOption"
                                    value="partial"
                                    checked={walkInPaymentOption === 'partial'}
                                    onChange={(e) => setWalkInPaymentOption(e.target.value)}
                                    className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-900">50% Down Payment</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="bg-white p-1.5 sm:p-2 lg:p-3 xl:p-4 rounded-lg mb-2 sm:mb-3 lg:mb-4 xl:mb-6">
                            <div className="flex justify-between items-center text-xs sm:text-sm lg:text-base xl:text-lg font-bold text-gray-900">
                              <span>Total Amount:</span>
                              <span className="text-base sm:text-lg lg:text-xl xl:text-2xl text-blue-600">₱{getWalkInCartTotal().toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Complete Order Button */}
                          <button
                            onClick={submitWalkInOrder}
                            disabled={walkInCart.length === 0 || !customerName.trim() || !customerContact.trim() || !walkInDeliveryDate || !walkInDeliveryTime || (!customerAddress.street || !customerAddress.barangay || !customerAddress.city)}
                            className={`w-full py-2 sm:py-2.5 lg:py-3 xl:py-3.5 lg:py-4 font-bold rounded-lg transition-colors flex items-center justify-center space-x-1 sm:space-x-2 shadow-lg text-xs sm:text-sm lg:text-base ${
                              walkInCart.length === 0 || !customerName.trim() || !customerContact.trim() || !walkInDeliveryDate || !walkInDeliveryTime || (!customerAddress.street || !customerAddress.barangay || !customerAddress.city)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-xl'
                            }`}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-5 lg:w-5 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Complete Order</span>
                          </button>
                          {(walkInCart.length === 0 || !customerName.trim() || !customerContact.trim() || !walkInDeliveryDate || !walkInDeliveryTime || (!customerAddress.street || !customerAddress.barangay || !customerAddress.city)) && (
                            <p className="text-xs text-gray-500 mt-1.5 sm:mt-2 text-center">
                              {walkInCart.length === 0 && "Add items to order • "}
                              {!customerName.trim() && "Enter customer name • "}
                              {!customerContact.trim() && "Enter contact number • "}
                              {(!customerAddress.street || !customerAddress.barangay || !customerAddress.city) && "Complete delivery address • "}
                              {(!walkInDeliveryDate || !walkInDeliveryTime) && "Select delivery date and time"}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === "orders" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50">
                <div className="bg-sky-100 rounded-2xl p-2 sm:p-4 lg:p-6 xl:p-8 mx-2 sm:mx-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                      <img 
                        src={ordersIcon} 
                        alt="Orders" 
                        className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
                      />
                      <div>
                        <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                          Order Management
                        </h1>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                          Review and manage customer orders
                        </p>  
                      </div>
                    </div>
                    
                  </div>

                  {/* Undo Notification */}
                  {recentStatusChange && (
                    <div className="mb-3 sm:mb-4 lg:mb-6 bg-sky-100 rounded-lg p-2 sm:p-3 lg:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                        <div className="flex-1">
                          <p className="text-blue-800 font-medium text-xs sm:text-sm lg:text-base">
                            Order #{recentStatusChange.orderId} status changed to "{recentStatusChange.newStatus}"
                          </p>
                          <p className="text-blue-700 text-xs sm:text-sm">
                            You have 30 seconds to undo this action if it was accidental.
                          </p>
                        </div>
                        <button
                          onClick={undoStatusChange}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          ↶ Undo
                        </button>
                      </div>
                    </div>
                  )}

                     {/* Order Filters - Mobile Responsive */}
                  <div className="mb-4 sm:mb-6 lg:mb-8">
                     {/* Filter Buttons - Horizontal Scroll on Mobile, Wrap on Desktop */}
                     <div className="mb-2 sm:mb-3 lg:mb-4">
                       {/* Mobile Layout - Horizontal Scroll */}
                       <div 
                         className="flex overflow-x-auto gap-1 sm:gap-1.5 pb-2 sm:hidden hide-scrollbar" 
                         style={{ 
                           scrollbarWidth: 'none', 
                           msOverflowStyle: 'none'
                         }}
                       >
                         {[
                           { value: 'all', label: 'All Orders', count: vendorOrders.length },
                           { value: 'pending', label: 'Pending', count: vendorOrders.filter(o => o.status === 'pending').length },
                           { value: 'paid', label: 'Ready to Prepare', count: vendorOrders.filter(o => o.status === 'confirmed' && (o.payment_status === 'paid' || o.payment_status === 'partial')).length },
                           { value: 'preparing', label: 'Preparing', count: vendorOrders.filter(o => o.status === 'preparing').length },
                           { value: 'out_for_delivery', label: 'Out for Delivery', count: vendorOrders.filter(o => o.status === 'out_for_delivery').length },
                           { value: 'delivered', label: 'Delivered', count: vendorOrders.filter(o => o.status === 'delivered').length },
                           { value: 'drum_return', label: 'Container Returns', count: vendorOrders.filter(o => o.drum_status === 'not returned' || o.drum_status === 'return_requested').length },
                           { value: 'cancelled', label: 'Cancelled', count: vendorOrders.filter(o => o.status === 'cancelled').length }
                         ].map((filter) => (
                           <button
                             key={filter.value}
                             onClick={() => {
                               setOrderFilter(filter.value);
                               handleRefreshOrders(); // Auto-refresh when filter changes
                             }}
                             className={`flex-shrink-0 px-2 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                               orderFilter === filter.value
                                 ? 'bg-blue-600 text-white shadow-sm'
                                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                             }`}
                           >
                             <span className="hidden xs:inline">{filter.label}</span>
                             <span className="xs:hidden">{filter.label.split(' ')[0]}</span>
                             {filter.count > 0 && (
                               <span className={`ml-1 px-1 py-0.5 rounded-full text-xs ${
                                 orderFilter === filter.value
                                   ? 'bg-blue-500 text-white'
                                   : 'bg-gray-200 text-gray-600'
                               }`}>
                                 {filter.count}
                               </span>
                             )}
                           </button>
                         ))}
                       </div>
                       
                       {/* Desktop Layout - Wrap */}
                       <div className="hidden sm:flex flex-wrap gap-1">
                      {[
                                                  { value: 'all', label: 'All Orders', count: vendorOrders.length },
                          { value: 'pending', label: 'Pending Payment', count: vendorOrders.filter(o => o.status === 'pending').length },
                        { value: 'paid', label: 'Ready to Prepare', count: vendorOrders.filter(o => o.status === 'confirmed' && (o.payment_status === 'paid' || o.payment_status === 'partial')).length },
                        { value: 'preparing', label: 'Preparing', count: vendorOrders.filter(o => o.status === 'preparing').length },
                        { value: 'out_for_delivery', label: 'Out for Delivery', count: vendorOrders.filter(o => o.status === 'out_for_delivery').length },
                        { value: 'delivered', label: 'Delivered', count: vendorOrders.filter(o => o.status === 'delivered').length },
                        { value: 'drum_return', label: 'Container Returns', count: vendorOrders.filter(o => o.drum_status === 'not returned' || o.drum_status === 'return_requested').length },
                        { value: 'cancelled', label: 'Cancelled', count: vendorOrders.filter(o => o.status === 'cancelled').length }
                      ].map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => {
                            setOrderFilter(filter.value);
                            handleRefreshOrders(); // Auto-refresh when filter changes
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            orderFilter === filter.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {filter.label} {filter.count > 0 && `(${filter.count})`}
                        </button>
                      ))}
                       </div>
                    </div>

                    {/* Date Filter - Mobile Responsive */}
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 space-y-2 sm:space-y-0">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-700">Filter by Delivery Date</h4>
                        <label className="flex items-center space-x-1.5 sm:space-x-2">
                          <input
                            type="checkbox"
                            checked={dateFilter.enabled}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, enabled: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 sm:w-4 sm:h-4"
                          />
                          <span className="text-xs text-gray-600">Show orders scheduled for specific date</span>
                        </label>
                      </div>
                      
                      {dateFilter.enabled && (
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Select Delivery Date
                            </label>
                            <input
                              type="date"
                              value={dateFilter.selectedDate}
                              onChange={(e) => setDateFilter(prev => ({ ...prev, selectedDate: e.target.value }))}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => setDateFilter({ selectedDate: '', enabled: false })}
                                className="w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              Clear
                            </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Container Returns Bulk Action - Mobile Responsive */}
                    {orderFilter === 'drum_return' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3 lg:p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 sm:mb-3 space-y-2 sm:space-y-3 lg:space-y-0">
                          <div>
                            <h4 className="text-orange-800 font-medium mb-1 text-xs sm:text-sm lg:text-base">📦 Container Returns Management</h4>
                            <p className="text-orange-700 text-xs sm:text-sm">
                              Select specific containers or mark all as returned
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
                            {selectedReturnOrders.length > 0 && (
                              <span className="text-xs sm:text-sm font-medium text-orange-700 bg-orange-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-center">
                                {selectedReturnOrders.length} selected
                              </span>
                            )}
                            <button 
                              onClick={() => handleSelectAllReturns()}
                              className="bg-blue-500 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                            >
                              <span>{selectedReturnOrders.length === vendorOrders.filter(o => o.drum_status === 'not returned' || o.drum_status === 'return_requested').length ? '☑️' : '☐'}</span>
                              <span className="hidden sm:inline">Select All</span>
                              <span className="sm:hidden">All</span>
                            </button>
                            <button 
                              onClick={() => handleMarkSelectedReturned()}
                              disabled={drumReturnLoading === 'selected' || selectedReturnOrders.length === 0}
                              className="bg-green-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                            >
                              {drumReturnLoading === 'selected' ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span className="hidden sm:inline">Processing...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <span>✅</span>
                                  <span className="hidden sm:inline">Mark Selected</span>
                                  <span className="sm:hidden">Selected</span>
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleBulkMarkReturned()}
                              disabled={drumReturnLoading === 'bulk'}
                              className="bg-green-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                            >
                              {drumReturnLoading === 'bulk' ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span className="hidden sm:inline">Processing...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <span>✅</span>
                                  <span className="hidden sm:inline">Mark All</span>
                                  <span className="sm:hidden">All</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Orders List */}
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {(() => {
                      // First apply status filter
                      let statusFilteredOrders = orderFilter === 'all' 
                        ? vendorOrders 
                        : orderFilter === 'paid'
                        ? vendorOrders.filter(order => order.status === 'confirmed' && (order.payment_status === 'paid' || order.payment_status === 'partial'))
                        : orderFilter === 'drum_return'
                        ? vendorOrders.filter(order => order.drum_status === 'not returned' || order.drum_status === 'return_requested')
                        : vendorOrders.filter(order => order.status === orderFilter);

                      // Then apply date filter if enabled
                      const filteredOrders = dateFilter.enabled && dateFilter.selectedDate
                        ? statusFilteredOrders.filter(order => {
                            if (!order.delivery_datetime) return false;
                            
                            const deliveryDate = new Date(order.delivery_datetime);
                            const selectedDate = new Date(dateFilter.selectedDate);
                            
                        
                            
                            // Compare only the date part (year, month, day) ignoring time
                            const deliveryDateOnly = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
                            const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                            
                            const isMatch = deliveryDateOnly.getTime() === selectedDateOnly.getTime();
                            console.log('🔍 Date Match Result:', isMatch);
                            
                            return isMatch;
                          })
                        : statusFilteredOrders;

                      // console.log('🔍 Debug - vendorOrders.length:', vendorOrders.length);
                      // console.log('🔍 Debug - filteredOrders.length:', filteredOrders.length);
                      // console.log('🔍 Debug - ordersLoading:', ordersLoading);
                      // console.log('🔍 Debug - orderFilter:', orderFilter);
                      // console.log('🔍 Debug - dateFilter:', dateFilter);
                      // console.log('🔍 Debug - statusFilteredOrders.length:', statusFilteredOrders.length);
                      // console.log('🔍 Debug - All orders with delivery dates:', vendorOrders.map(o => ({
                      //   orderId: o.order_id,
                      //   status: o.status,
                      //   delivery_datetime: o.delivery_datetime,
                      //   delivery_date_formatted: o.delivery_datetime ? new Date(o.delivery_datetime).toLocaleDateString() : 'No date'
                      // })));
                      
                      return ordersLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading orders...</p>
                        </div>
                      ) : vendorOrders.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                          <p className="text-gray-600">Customer orders will appear here when they place them.</p>
                        </div>
                      ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No {orderFilter === 'all' ? 'orders' : orderFilter} orders
                            {dateFilter.enabled && dateFilter.selectedDate && ' scheduled for selected date'}
                          </h3>
                          <p className="text-gray-600">
                            {orderFilter === 'all' 
                              ? "Customer orders will appear here when they place them." 
                              : `No orders matching "${orderFilter.replace('_', ' ')}" filter found.`
                            }
                            {dateFilter.enabled && dateFilter.selectedDate && 
                              <span className="block mt-1 text-sm">
                                No orders scheduled for delivery on {formatPhilippineDateOnly(dateFilter.selectedDate, {
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric'
                                })}. Try selecting a different date or clearing the date filter.
                              </span>
                            }
                          </p>
                        </div>
                      ) : (
                        filteredOrders.map((order) => (
                        <div key={order.order_id} id={`order-${order.order_id}`} className="bg-gray-50 rounded-lg border border-gray-200">
                          {/* Condensed Order Summary - Mobile Responsive */}
                          <div className="p-2 sm:p-3 lg:p-4">
                            {/* Mobile Layout - Stacked */}
                            <div className="flex flex-col sm:hidden space-y-2 sm:space-y-3">
                              {/* Top Row: Order Info */}
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-semibold text-gray-900 truncate">
                                    Order #{order.order_id}
                                  </h3>
                                  <p className="text-xs text-gray-600 truncate">
                                    {order.customer_fname} {order.customer_lname}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {order.created_at ? formatPhilippineDateOnly(order.created_at) : 'Recent'}
                                  </p>
                                </div>
                                <div className="text-right ml-2">
                                  {order.payment_status === 'partial' && order.payment_amount ? (
                                    <div>
                                      <p className="text-xs text-gray-500">Total: ₱{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                                      <p className="text-sm font-bold text-green-600">Paid: ₱{parseFloat(order.payment_amount || 0).toFixed(2)}</p>
                                      <p className="text-xs text-orange-600">Remaining: ₱{parseFloat(order.remaining_balance || (order.total_amount - order.payment_amount)).toFixed(2)}</p>
                                    </div>
                                  ) : (
                                    <p className="text-sm font-bold text-green-600">₱{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                                  )}
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ') : 'N/A'}
                                  </span>
                                  {order.payment_status === 'partial' && (
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 bg-orange-100 text-orange-800">
                                      Partial
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Delivery Date */}
                              <div>
                                {order.delivery_datetime ? (() => {
                                  const deliveryDate = new Date(order.delivery_datetime);
                                  const now = new Date();
                                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                  const deliveryDay = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
                                  const diffTime = deliveryDay.getTime() - today.getTime();
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                  
                                  let urgencyClass = 'text-gray-600 bg-gray-100';
                                  let urgencyText = '';
                                  
                                  if (diffDays < 0) {
                                    urgencyClass = 'text-red-700 bg-red-100 border border-red-200';
                                    urgencyText = 'OVERDUE';
                                  } else if (diffDays === 0) {
                                    urgencyClass = 'text-orange-700 bg-orange-100 border border-orange-200';
                                    urgencyText = 'TODAY';
                                  } else if (diffDays === 1) {
                                    urgencyClass = 'text-yellow-700 bg-yellow-100 border border-yellow-200';
                                    urgencyText = 'TOMORROW';
                                  } else if (diffDays <= 3) {
                                    urgencyClass = 'text-blue-700 bg-blue-100 border border-blue-200';
                                    urgencyText = 'UPCOMING';
                                  }
                                  
                                  return (
                                    <div className="flex items-center space-x-2">
                                      <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${urgencyClass}`}>
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {urgencyText}
                                      </div>
                                      <p className="text-xs font-medium text-gray-900">
                                        {formatPhilippineDate(order.delivery_datetime, {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        })}
                                      </p>
                                    </div>
                                  );
                                })() : (
                                  <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    NOT SCHEDULED
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Button */}
                              <div className="w-full">
                                <button
                                  onClick={() => handleToggleOrderDetails(order.order_id)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                  {expandedOrderId === order.order_id ? 'Hide Details' : 'View Details'}
                                </button>
                              </div>
                            </div>

                            {/* Desktop Layout - Side by Side */}
                            <div className="hidden sm:flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      Order #{order.order_id}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      {order.customer_fname} {order.customer_lname} • {order.created_at ? formatPhilippineDateOnly(order.created_at) : 'Recent'}
                                    </p>
                                    {/* Enhanced Delivery Date Display */}
                                    {order.delivery_datetime ? (() => {
                                      const deliveryDate = new Date(order.delivery_datetime);
                                      const now = new Date();
                                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                      const deliveryDay = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
                                      const diffTime = deliveryDay.getTime() - today.getTime();
                                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                      
                                      let urgencyClass = 'text-gray-600 bg-gray-100';
                                      let urgencyText = '';
                                      
                                      if (diffDays < 0) {
                                        urgencyClass = 'text-red-700 bg-red-100 border border-red-200';
                                        urgencyText = 'OVERDUE';
                                      } else if (diffDays === 0) {
                                        urgencyClass = 'text-orange-700 bg-orange-100 border border-orange-200';
                                        urgencyText = 'TODAY';
                                      } else if (diffDays === 1) {
                                        urgencyClass = 'text-yellow-700 bg-yellow-100 border border-yellow-200';
                                        urgencyText = 'TOMORROW';
                                      } else if (diffDays <= 3) {
                                        urgencyClass = 'text-blue-700 bg-blue-100 border border-blue-200';
                                        urgencyText = 'UPCOMING';
                                      }
                                      
                                      return (
                                        <div className="mt-2">
                                          <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${urgencyClass}`}>
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {urgencyText}
                                          </div>
                                          <p className="text-sm font-medium text-gray-900 mt-1">
                                            {formatPhilippineDate(order.delivery_datetime, {
                                              weekday: 'short',
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              hour12: true
                                            })}
                                          </p>
                                        </div>
                                      );
                                    })() : (
                                      <div className="mt-2">
                                        <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200">
                                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          NOT SCHEDULED
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    {order.payment_status === 'partial' && order.payment_amount ? (
                                      <div>
                                        <p className="text-xs text-gray-500">Total: ₱{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                                        <p className="text-lg font-bold text-green-600">Paid: ₱{parseFloat(order.payment_amount || 0).toFixed(2)}</p>
                                        <p className="text-xs text-orange-600">Remaining: ₱{parseFloat(order.remaining_balance || (order.total_amount - order.payment_amount)).toFixed(2)}</p>
                                        <p className="text-xs text-orange-600 font-medium mt-1">
                                          Partial (50% Paid)
                                        </p>
                                      </div>
                                    ) : (
                                      <>
                                        <p className="text-lg font-bold text-green-600">₱{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">
                                          Payment: {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'N/A'}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 ml-4">
                                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ') : 'N/A'}
                                </span>
                                <button
                                  onClick={() => handleToggleOrderDetails(order.order_id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                  {expandedOrderId === order.order_id ? 'Hide Details' : 'View Details'}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Order Details */}
                          {expandedOrderId === order.order_id && (
                            <div className="border-t border-gray-200 p-2 sm:p-3 lg:p-4 xl:p-6 bg-white">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6">
                            {/* Customer Information */}
                            <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                              <h4 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Customer Information</h4>
                              <div className="bg-white rounded-lg p-2 sm:p-3 lg:p-4 space-y-1.5 sm:space-y-2">
                                {(() => {
                                  const fullAddress = order.delivery_address || '';
                                  const parts = fullAddress.split(', ');
                                  
                                  // Extract customer info if present in delivery address (for walk-in orders)
                                  let customerName = '';
                                  let customerContact = '';
                                  let customerEmail = '';
                                  
                                  parts.forEach((part) => {
                                    if (part.startsWith('Customer: ')) {
                                      customerName = part.replace('Customer: ', '');
                                    } else if (part.startsWith('Contact: ')) {
                                      customerContact = part.replace('Contact: ', '');
                                    } else if (part.startsWith('Email: ')) {
                                      customerEmail = part.replace('Email: ', '');
                                    }
                                  });
                                  
                                  // Check if this is a walk-in order (has customer info in delivery address)
                                  const isWalkInOrder = customerName && customerContact;
                                  
                                  // If walk-in order, use parsed data; otherwise use order fields
                                  const displayName = isWalkInOrder ? customerName : `${order.customer_fname} ${order.customer_lname || ''}`;
                                  const displayContact = isWalkInOrder ? customerContact : (order.customer_contact || 'N/A');
                                  const displayEmail = isWalkInOrder ? (customerEmail || 'N/A') : (order.customer_email || 'N/A');
                                  
                                  return (
                                    <>
                                      <p className="text-xs sm:text-sm"><strong>Name:</strong> <span className="break-words">{displayName}</span></p>
                                      <p className="text-xs sm:text-sm"><strong>Contact:</strong> <span className="break-all">{displayContact}</span></p>
                                      <p className="text-xs sm:text-sm"><strong>Email:</strong> <span className="break-all">{displayEmail}</span></p>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            {/* Order Details */}
                            <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                              <h4 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Order Details</h4>
                              <div className="bg-white rounded-lg p-2 sm:p-3 lg:p-4 space-y-1.5 sm:space-y-2">
                                {order.payment_status === 'partial' && order.payment_amount ? (
                                  <>
                                    <p className="text-xs sm:text-sm"><strong>Total Order Amount:</strong> <span className="font-medium">₱{parseFloat(order.total_amount || 0).toFixed(2)}</span></p>
                                    <p className="text-xs sm:text-sm border-t pt-2"><strong>Amount Paid (50%):</strong> <span className="text-green-600 font-bold">₱{parseFloat(order.payment_amount || 0).toFixed(2)}</span></p>
                                    <p className="text-xs sm:text-sm text-gray-600"><strong>Remaining Balance:</strong> <span>₱{parseFloat(order.remaining_balance || (order.total_amount - order.payment_amount)).toFixed(2)}</span></p>
                                    <p className="text-xs sm:text-sm"><strong>Payment Status:</strong> 
                                      <span className="ml-1 font-medium text-orange-600">
                                        Partial (50% Paid)
                                      </span>
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs sm:text-sm"><strong>Total Amount:</strong> <span className="text-green-600 font-bold">₱{parseFloat(order.total_amount || 0).toFixed(2)}</span></p>
                                    <p className="text-xs sm:text-sm"><strong>Payment Status:</strong> 
                                      <span className={`ml-1 font-medium ${
                                        order.payment_status === 'unpaid' ? 'text-yellow-600' :
                                        order.payment_status === 'paid' ? 'text-green-600' :
                                        order.payment_status === 'partial' ? 'text-orange-600' : 'text-gray-600'
                                      }`}>
                                        {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'N/A'}
                                      </span>
                                    </p>
                                  </>
                                )}
                                <div className="text-xs sm:text-sm">
                                  <strong>Delivery Date:</strong>
                                  {order.delivery_datetime ? (() => {
                                    const deliveryDate = new Date(order.delivery_datetime);
                                    const now = new Date();
                                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                    const deliveryDay = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
                                    const diffTime = deliveryDay.getTime() - today.getTime();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    
                                    let urgencyClass = 'text-gray-600 bg-gray-100';
                                    let urgencyText = '';
                                    
                                    if (diffDays < 0) {
                                      urgencyClass = 'text-red-700 bg-red-100 border border-red-200';
                                      urgencyText = 'OVERDUE';
                                    } else if (diffDays === 0) {
                                      urgencyClass = 'text-orange-700 bg-orange-100 border border-orange-200';
                                      urgencyText = 'TODAY';
                                    } else if (diffDays === 1) {
                                      urgencyClass = 'text-yellow-700 bg-yellow-100 border border-yellow-200';
                                      urgencyText = 'TOMORROW';
                                    } else if (diffDays <= 3) {
                                      urgencyClass = 'text-blue-700 bg-blue-100 border border-blue-200';
                                      urgencyText = 'UPCOMING';
                                    }
                                    
                                    return (
                                      <div className="mt-2">
                                        <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold ${urgencyClass}`}>
                                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {urgencyText}
                                        </div>
                                        <p className="text-gray-900 font-medium mt-2 text-xs sm:text-sm">
                                          {formatPhilippineDate(order.delivery_datetime, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                          })}
                                        </p>
                                      </div>
                                    );
                                  })() : (
                                    <div className="mt-2">
                                      <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold text-gray-600 bg-gray-100 border border-gray-200">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        NOT SCHEDULED
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Order Items Details */}
                          {order.order_items_details && (
                            <div className="space-y-1.5 sm:space-y-2 lg:space-y-3 mb-3 sm:mb-4 lg:mb-6">
                              <h4 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Order Items</h4>
                              <div className="bg-pink-50 rounded-lg p-2 sm:p-3 lg:p-4 border border-pink-200">
                                <p className="text-xs sm:text-sm text-gray-800 font-medium break-words">{order.order_items_details}</p>
                              </div>
                            </div>
                          )}

                          {/* Delivery Information */}
                          <div className="mb-3 sm:mb-4 lg:mb-6">
                            <h4 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-1.5 sm:mb-2 lg:mb-3">Delivery Information</h4>
                            <div className="bg-blue-50 rounded-lg p-2 sm:p-3 lg:p-4 border border-blue-200">
                              {(() => {
                                const fullAddress = order.delivery_address || '';
                                const parts = fullAddress.split(', ');
                                
                                // Filter out customer info parts, keep only actual address
                                const addressParts = parts.filter(part => 
                                  !part.startsWith('Customer: ') && 
                                  !part.startsWith('Contact: ') && 
                                  !part.startsWith('Email: ')
                                );
                                
                                const deliveryAddress = addressParts.join(', ') || 'No address specified';
                                
                                return (
                                  <p className="text-xs sm:text-sm break-words"><strong>Address:</strong> {deliveryAddress}</p>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {order.status === 'pending' && (
                            <div className="flex space-x-2 sm:space-x-4 mb-3 sm:mb-4 lg:mb-6">
                              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 lg:p-4">
                                <p className="text-blue-800 font-medium text-xs sm:text-sm lg:text-base">Order Auto-Confirmed</p>
                                <p className="text-blue-700 text-xs sm:text-sm mt-1">
                                  This order was automatically confirmed because drums were available for the selected date. Waiting for payment to start preparation.
                                </p>
                              </div>
                            </div>
                          )}

                          {order.status === 'confirmed' && order.payment_status === 'unpaid' && (() => {
                            const walkInCheck = isWalkInOrder(order);
                            
                            return (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 lg:p-4 mb-3 sm:mb-4 lg:mb-6">
                                <p className="text-green-800 font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm lg:text-base">Order Confirmed!</p>
                                <p className="text-green-700 text-xs sm:text-sm mb-2 sm:mb-3">
                                  {walkInCheck 
                                    ? 'Walk-in order - Waiting for payment. Mark as paid to start preparation.'
                                    : 'Order automatically confirmed. Waiting for customer payment to start preparation.'
                                  }
                                </p>
                                {walkInCheck && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
                                        const response = await axios.put(`${apiBase}/api/orders/${order.order_id}/payment-status`, {
                                          payment_status: 'paid'
                                        });
                                        
                                        if (response.data.success) {
                                          updateStatus("success", "Payment marked as paid! You can now start preparing.");
                                          fetchVendorOrders(); // Refresh orders
                                        } else {
                                          updateStatus("error", response.data.error || "Failed to update payment status");
                                        }
                                      } catch (error) {
                                        console.error("Error updating payment status:", error);
                                        updateStatus("error", "Failed to update payment status. Please try again.");
                                      }
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm lg:text-base w-full sm:w-auto"
                                  >
                                     Mark as Paid
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {order.status === 'confirmed' && (order.payment_status === 'paid' || order.payment_status === 'partial') && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 lg:p-4 mb-3 sm:mb-4 lg:mb-6">
                              <p className="text-blue-800 font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm lg:text-base">
                                {order.payment_status === 'partial' ? 'Partial Payment Received!' : 'Payment Received!'}
                              </p>
                              <p className="text-blue-700 text-xs sm:text-sm mb-2 sm:mb-3">
                                {order.payment_status === 'partial' && order.payment_amount
                                  ? `Customer has paid 50% (₱${parseFloat(order.payment_amount).toFixed(2)}) of the total amount. Remaining balance of ₱${parseFloat(order.remaining_balance || (order.total_amount - order.payment_amount)).toFixed(2)} will be collected on delivery. You can now start preparing the ice cream.`
                                  : 'Customer has paid. You can now start preparing the ice cream.'}
                              </p>
                              {order.payment_status === 'partial' && order.payment_amount && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-1.5 sm:p-2 lg:p-3 mb-2 sm:mb-3">
                                  <p className="text-orange-800 text-xs sm:text-sm font-medium break-words">
                                    Amount Paid: ₱{parseFloat(order.payment_amount).toFixed(2)} | 
                                    Remaining: ₱{parseFloat(order.remaining_balance || (order.total_amount - order.payment_amount)).toFixed(2)}
                                  </p>
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                                <button
                                  onClick={() => handlePrepareOrder(order)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 sm:py-2 lg:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm lg:text-base w-full sm:w-auto whitespace-nowrap"
                                >
                                  <span className="sm:hidden">🍦 Start Preparing</span>
                                  <span className="hidden sm:inline">🍦 Start Preparing Ice Cream</span>
                                </button>
                                {order.payment_confirmation_image && (
                                  <button
                                    onClick={() => handleViewPaymentProof(order)}
                                    className="bg-green-600 hover:bg-green-700 text-white py-1.5 sm:py-2 lg:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm lg:text-base w-full sm:w-auto"
                                  >
                                    📱 View Payment Proof
                                  </button>
                                )}
                                {isWalkInOrder(order) && (
                                  <button
                                    onClick={() => handleCancelWalkInOrderClick(order)}
                                    className="bg-red-600 hover:bg-red-700 text-white py-1.5 sm:py-2 lg:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm lg:text-base w-full sm:w-auto"
                                  >
                                    ❌ Cancel Order
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {order.status === 'preparing' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 lg:p-4 mb-3 sm:mb-4 lg:mb-6">
                              <p className="text-blue-800 font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm lg:text-base">🍦 Preparing Ice Cream</p>
                              <p className="text-blue-700 text-xs sm:text-sm mb-2 sm:mb-3">
                                Ice cream is being prepared. Mark as ready for delivery when finished.
                              </p>
                              <button
                                onClick={() => handleReadyOrder(order)}
                                className="bg-purple-600 hover:bg-purple-700 text-white py-1.5 sm:py-2 lg:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm lg:text-base w-full sm:w-auto"
                              >
                                🚚 Ready for Delivery
                              </button>
                            </div>
                          )}

                          {order.status === 'out_for_delivery' && (() => {
                            const walkInCheck = isWalkInOrder(order);
                            const remainingBalance = parseFloat(order?.remaining_balance ?? 0) || 0;
                            const isCODPaymentPending = hasPendingRemainingBalance(order, 'cod');
                            const isGCashPaymentPending = hasPendingRemainingBalance(order, 'gcash');
                            const isDeliveryActionDisabled = isCODPaymentPending || isGCashPaymentPending;
                            const deliveryDisableTitle = isCODPaymentPending
                              ? `Cannot mark as delivered. COD payment of ₱${remainingBalance.toFixed(2)} must be confirmed first.`
                              : isGCashPaymentPending
                                ? `Cannot mark as delivered. GCash payment proof of ₱${remainingBalance.toFixed(2)} is required before completing delivery.`
                                : 'Mark order as delivered';
                            
                            return (
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-3 lg:p-4 mb-3 sm:mb-4 lg:mb-6">
                                <p className="text-purple-800 font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm lg:text-base">
                                  🚚 Out for Delivery
                                  {walkInCheck && (
                                    <span className="ml-1 sm:ml-2 text-xs font-normal text-purple-600 bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                                      Walk-in Order
                                    </span>
                                  )}
                                </p>
                                <p className="text-purple-700 text-xs sm:text-sm mb-2 sm:mb-3">
                                  {walkInCheck 
                                    ? 'Walk-in order - Being delivered to customer. Mark as delivered when completed.'
                                    : 'Order is on the way to customer. Mark as delivered when completed.'}
                                </p>
                                
                                {/* Show remaining balance info if partial payment */}
                                {order.payment_status === 'partial' && order.remaining_balance > 0 && (
                                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-1.5 sm:p-2 lg:p-3 mb-2 sm:mb-3">
                                    <p className="text-orange-800 font-medium mb-1 text-xs sm:text-sm">Remaining Balance: ₱{parseFloat(order.remaining_balance).toFixed(2)}</p>
                                    {walkInCheck && (
                                      <p className="text-orange-700 text-xs mb-1.5 sm:mb-2 italic">
                                        Walk-in order: Collect remaining balance upon delivery
                                      </p>
                                    )}
                                    {order.remaining_payment_method === 'cod' && (
                                      <>
                                        <p className="text-orange-700 text-xs mb-1.5 sm:mb-2">Customer selected: Cash on Delivery</p>
                                        <button
                                          onClick={() => handleConfirmCODPaymentClick(order.order_id, order.remaining_balance)}
                                          className="bg-orange-600 hover:bg-orange-700 text-white py-1.5 sm:py-2 lg:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm w-full sm:w-auto"
                                        >
                                          💰 Mark Remaining Balance as Paid (COD)
                                        </button>
                                      </>
                                    )}
                                    {order.remaining_payment_method === 'gcash' && (
                                      <p className="text-orange-700 text-xs">
                                        {hasPendingRemainingBalance(order, 'gcash')
                                          ? 'Customer will pay via GCash. Request payment proof before marking as delivered.'
                                          : 'Customer will pay via GCash.'}
                                      </p>
                                    )}
                                    {!order.remaining_payment_method && (
                                      <p className="text-orange-700 text-xs">
                                        {walkInCheck 
                                          ? 'Payment method not specified. Confirm with customer upon delivery.'
                                          : 'Customer hasn\'t selected payment method yet'}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Show proof if remaining balance already paid via GCash */}
                                {order.payment_status === 'paid' &&
                                  order.payment_confirmation_image &&
                                  order.payment_amount &&
                                  parseFloat(order.payment_amount) > 0 &&
                                  parseFloat(order.payment_amount) < parseFloat(order.total_amount || 0) &&
                                  order.remaining_payment_method === 'gcash' && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-1.5 sm:p-2 lg:p-3 mb-2 sm:mb-3">
                                      <p className="text-green-800 font-medium mb-1 text-xs sm:text-sm">
                                        Remaining balance paid via GCash
                                      </p>
                                      <p className="text-green-700 text-xs sm:text-sm mb-1.5 sm:mb-2">
                                        Customer submitted proof of the remaining payment. Tap below to review the screenshot before completing delivery.
                                      </p>
                                      <button
                                        onClick={() => handleViewPaymentProof(order)}
                                        className="bg-green-600 hover:bg-green-700 text-white py-1.5 sm:py-2 lg:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm w-full sm:w-auto"
                                      >
                                        📱 View Remaining Balance Proof
                                      </button>
                                    </div>
                                  )}
                                
                                <button
                                  onClick={() => handleDeliveredOrder(order)}
                                  disabled={isDeliveryActionDisabled}
                                  className={`py-1.5 sm:py-2 lg:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm lg:text-base w-full sm:w-auto ${
                                    isDeliveryActionDisabled
                                      ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                                      : 'bg-green-600 hover:bg-green-700 text-white'
                                  }`}
                                  title={deliveryDisableTitle}
                                >
                                  ✅ Mark as Delivered
                                </button>
                              </div>
                            );
                          })()}

                          {order.status === 'delivered' && (
                            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 lg:p-4">
                                <p className="text-green-800 font-medium mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">🎉 Order Completed!</p>
                                <p className="text-green-700 text-xs sm:text-sm">
                                  This order has been successfully delivered to the customer.
                                </p>
                              </div>

                              {/* Container Return Section */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 lg:p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    {orderFilter === 'drum_return' && (order.drum_status === 'not returned' || order.drum_status === 'return_requested') && (
                                      <div className="flex items-center flex-shrink-0 mt-0.5 sm:mt-0">
                                        <input
                                          type="checkbox"
                                          checked={selectedReturnOrders.includes(order.order_id)}
                                          onChange={() => handleToggleReturnSelection(order.order_id)}
                                          className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-blue-800 font-medium mb-0.5 sm:mb-1 text-xs sm:text-sm lg:text-base">📦 Container Return Status</h3>
                                      <p className="text-blue-700 text-xs sm:text-sm break-words">
                                        {(order.drum_status === 'in_use' || order.drum_status === 'in use' || !order.drum_status) && 'Container is currently in use by customer'}
                                        {(order.drum_status === 'not returned' || order.drum_status === 'return_requested') && 'Customer has requested container return - waiting for pickup'}
                                        {order.drum_status === 'returned' && 'Container has been successfully returned'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 flex-shrink-0">
                                    {(order.drum_status === 'not returned' || order.drum_status === 'return_requested') && (
                                      <button 
                                        onClick={() => handleDrumReturnPickup(order.order_id)}
                                        disabled={drumReturnLoading === order.order_id}
                                        className="bg-orange-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
                                      >
                                        {drumReturnLoading === order.order_id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                                            <span>Updating...</span>
                                          </>
                                        ) : (
                                          <>
                                            <span>📦</span>
                                            <span>Mark as Picked Up</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                    {order.drum_status === 'returned' && (
                                      <span className="inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full bg-green-100 text-green-800 justify-center">
                                        ✅ Container Returned
                                      </span>
                                    )}
                                    {(order.drum_status === 'in_use' || order.drum_status === 'in use' || !order.drum_status) && (
                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                                        <span className="inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full bg-blue-100 text-blue-800 justify-center">
                                          📦 In Use
                                        </span>
                                        <button 
                                          onClick={() => handleDrumReturnPickup(order.order_id)}
                                          disabled={drumReturnLoading === order.order_id}
                                          className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 sm:space-x-1 text-xs sm:text-sm"
                                        >
                                          {drumReturnLoading === order.order_id ? (
                                            <>
                                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                              <span>Updating...</span>
                                            </>
                                          ) : (
                                            <>
                                              <span>✅</span>
                                              <span>Mark as Returned</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {order.return_requested_at && (
                                  <p className="text-blue-600 text-xs mt-2 sm:mt-0">
                                    Return requested on: {formatPhilippineDate(order.return_requested_at)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {order.status === 'cancelled' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 lg:p-4">
                              <p className="text-red-800 font-medium text-xs sm:text-sm lg:text-base">Order Declined</p>
                              <p className="text-red-700 text-xs sm:text-sm">This order has been cancelled.</p>
                            </div>
                          )}
                            </div>
                          )}
                        </div>
                        ))
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeView === "payments" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50">
                <div className="bg-sky-100 rounded-2xl p-8 mx-4 shadow-lg">
                  <div className="flex items-center space-x-4 mb-8">
                    <img 
                      src={paymentsIcon} 
                      alt="Payments" 
                      className="w-5 h-5 sm:w-7 sm:h-7 lg:w-10 lg:h-10"
                    />
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                        Delivery & Drum Pricing
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600">
                        Manage your drum prices and delivery zones
                      </p>
                    </div>
                  </div>

                  {/* Drum Pricing Section */}
                  <div className="mb-8 sm:mb-10 lg:mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
                          Drum Pricing
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Set prices for different drum sizes
                        </p>
                      </div>
                      {!isEditingPrices && (
                        <button
                          onClick={handlePricesEdit}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                          Edit Prices
                        </button>
                      )}
                    </div>

                    {isEditingPrices ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Small Drum Price (₱)
                            </label>
                            <input
                              type="number"
                              value={tempPrices.small}
                              onChange={(e) =>
                                handlePriceChange("small", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Medium Drum Price (₱)
                            </label>
                            <input
                              type="number"
                              value={tempPrices.medium}
                              onChange={(e) =>
                                handlePriceChange("medium", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Large Drum Price (₱)
                            </label>
                            <input
                              type="number"
                              value={tempPrices.large}
                              onChange={(e) =>
                                handlePriceChange("large", e.target.value)
                              }
                              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                          <button
                            onClick={handlePricesSave}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium shadow-md hover:shadow-lg"
                          >
                            Save Prices
                          </button>
                          <button
                            onClick={handlePricesCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div className="text-center bg-blue-50 rounded-lg p-3 sm:p-4 shadow-md border-2 border-blue-300">
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 mb-1">
                            ₱{drumPrices.small}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                            Small Drum
                          </div>
                          <div className="text-xs text-gray-500">
                            {drumCapacity.small} gallons
                          </div>
                        </div>
                        <div className="text-center bg-blue-50 rounded-lg p-3 sm:p-4 shadow-md border-2 border-blue-300">
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 mb-1">
                            ₱{drumPrices.medium}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                            Medium Drum
                          </div>
                          <div className="text-xs text-gray-500">
                            {drumCapacity.medium} gallons
                          </div>
                        </div>
                        <div className="text-center bg-blue-50 rounded-lg p-3 sm:p-4 shadow-md border-2 border-blue-300">
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 mb-1">
                            ₱{drumPrices.large}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                            Large Drum
                          </div>
                          <div className="text-xs text-gray-500">
                            {drumCapacity.large} gallons
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Pricing Section */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
                          Delivery Zones & Pricing
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Set delivery prices for different cities and provinces
                        </p>
                      </div>
                      {!isEditingDelivery && (
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={handleAddZoneClick}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                          >
                            Add Zone
                          </button>
                          <button
                            onClick={handleDeliveryEdit}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                          >
                            Edit Zones
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Add New Zone Form */}
                    {showAddZoneForm && (
                      <div id="add-zone-form" className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Delivery Zone</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Region
                            </label>
                            <RegionDropdown
                              value={newDeliveryZone.region}
                              onChange={(selectedOption) => handleNewDeliveryZoneDropdownChange('region', selectedOption)}
                              placeholder="Select Region"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Province
                            </label>
                            <ProvinceDropdown
                              value={newDeliveryZone.province}
                              onChange={(selectedOption) => handleNewDeliveryZoneDropdownChange('province', selectedOption)}
                              placeholder="Select Province"
                              className="w-full"
                              disabled={!newDeliveryZone.region}
                              region={newDeliveryZone.region}
                            />
                            {!newDeliveryZone.region && (
                              <p className="text-xs text-gray-500 mt-1">Select region first</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City/Municipality
                            </label>
                            <CityDropdown
                              value={newDeliveryZone.city}
                              onChange={(selectedOption) => handleNewDeliveryZoneDropdownChange('city', selectedOption)}
                              placeholder="Select City"
                              className="w-full"
                              disabled={!newDeliveryZone.province}
                              province={newDeliveryZone.province}
                            />
                            {!newDeliveryZone.province && (
                              <p className="text-xs text-gray-500 mt-1">Select province first</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Delivery Price (₱)
                            </label>
                            <input
                              type="number"
                              value={newDeliveryZone.delivery_price}
                              onChange={(e) => setNewDeliveryZone({...newDeliveryZone, delivery_price: parseFloat(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-3 mt-4">
                          <button
                            onClick={handleAddDeliveryZone}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg"
                          >
                            Add Zone
                          </button>
                          <button
                            onClick={() => {
                              setShowAddZoneForm(false);
                              setNewDeliveryZone({ city: '', province: '', region: '', delivery_price: 0 });
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delivery Zones List */}
                    {isEditingDelivery ? (
                      <div id="edit-zones-form" className="space-y-3 sm:space-y-4">
                        {tempDeliveryZones.map((zone, index) => (
                          <div key={zone.delivery_pricing_id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                  Region
                                </label>
                                <RegionDropdown
                                  value={zone.region || ''}
                                  onChange={(selectedOption) => handleEditDeliveryZoneDropdownChange(index, 'region', selectedOption)}
                                  placeholder="Select Region"
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                  Province
                                </label>
                                <ProvinceDropdown
                                  value={zone.province || ''}
                                  onChange={(selectedOption) => handleEditDeliveryZoneDropdownChange(index, 'province', selectedOption)}
                                  placeholder="Select Province"
                                  className="w-full"
                                  disabled={!zone.region}
                                  region={zone.region}
                                />
                                {!zone.region && (
                                  <p className="text-xs text-gray-500 mt-1">Select region first</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                  City/Municipality
                                </label>
                                <CityDropdown
                                  value={zone.city || ''}
                                  onChange={(selectedOption) => handleEditDeliveryZoneDropdownChange(index, 'city', selectedOption)}
                                  placeholder="Select City"
                                  className="w-full"
                                  disabled={!zone.province}
                                  province={zone.province}
                                />
                                {!zone.province && (
                                  <p className="text-xs text-gray-500 mt-1">Select province first</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                  Delivery Price (₱)
                                </label>
                                <input
                                  type="number"
                                  value={zone.delivery_price}
                                  onChange={(e) => handleDeliveryZoneChange(index, 'delivery_price', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                          <button
                            onClick={handleDeliverySave}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium shadow-md hover:shadow-lg"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleDeliveryCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {deliveryZones.length > 0 ? (
                          deliveryZones.map((zone) => (
                            <div key={zone.delivery_pricing_id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div>
                                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                                        {zone.city}, {zone.province}
                                      </h3>
                                      <p className="text-xs sm:text-sm text-gray-600">
                                        Delivery Price: ₱{parseFloat(zone.delivery_price).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveDeliveryZone(zone.delivery_pricing_id)}
                                  className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 sm:py-8 text-gray-500">
                            <p className="text-sm sm:text-base">No delivery zones configured yet.</p>
                            <p className="text-xs sm:text-sm">Add your first delivery zone to get started.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeView === "notifications" && (
              <div className="min-h-screen">
                <div className="bg-white rounded-2xl p-8 mx-4 shadow-lg">
                  <div className="flex items-center justify-between mb-8 gap-4">
                     <div className="flex items-center space-x-2 flex-1 min-w-0">
                       <img 
                         src={bellNotificationIcon} 
                         alt="Notifications" 
                         className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0"
                       />
                       <div className="min-w-0 hidden sm:block">
                         <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                           Notifications
                         </h1>
                       </div>
                     </div>
                    
                    {/* Mark All as Read Button */}
                    {notifications.length > 0 && notifications.some(n => !n.is_read) && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded transition-colors flex items-center justify-center space-x-1.5 whitespace-nowrap flex-shrink-0"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs sm:text-sm">Mark All as Read</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    {notificationsLoading ? (
                      <div className="flex flex-col sm:flex-row justify-center items-center py-4 space-y-2 sm:space-y-0">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-600"></div>
                        <span className="ml-0 sm:ml-2 text-xs text-gray-600">Loading...</span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-4 px-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <img src={bellNotificationIcon} alt="No notifications" className="w-4 h-4 sm:w-5 sm:h-5 opacity-50" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">No notifications yet</h3>
                        <p className="text-xs text-gray-600">You'll see order updates here</p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const isReviewNotification = notification.notification_type === 'review_received';
                        console.log('📬 Processing notification:', notification.title, 'Type:', notification.notification_type, 'Is Review:', isReviewNotification);
                        
                        const handleNotificationClick = async () => {
                          console.log('🔔 Notification clicked:', notification);
                          
                          // Mark as read
                          await markNotificationAsRead(notification.id);
                          
                          // If there's a related order, open it
                          if (notification.related_order_id) {
                            console.log('📦 Looking for order:', notification.related_order_id);
                            
                            // Fetch fresh orders first
                            const orders = await fetchVendorOrders();
                            
                            // Find the specific order
                            const order = orders.find(o => o.order_id === notification.related_order_id);
                            
                            if (order) {
                              console.log('✅ Found order, navigating to it:', order.order_id);
                              
                              // Expand the order first (before view change)
                              setExpandedOrderId(order.order_id);
                              
                              // Then navigate to orders view (Order Management page)
                              setActiveView('orders');
                              
                              // Wait for view transition and scroll to the order
                              // Use multiple attempts to ensure the element is in the DOM
                              let attempts = 0;
                              const maxAttempts = 10;
                              
                              const scrollToOrder = () => {
                                const orderElement = document.getElementById(`order-${order.order_id}`);
                                if (orderElement) {
                                  console.log('✅ Order element found, scrolling to it');
                                  orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  // Add a highlight effect
                                  orderElement.style.transition = 'all 0.3s ease';
                                  orderElement.style.backgroundColor = '#dbeafe';
                                  setTimeout(() => {
                                    orderElement.style.backgroundColor = '';
                                  }, 2000);
                                } else {
                                  attempts++;
                                  if (attempts < maxAttempts) {
                                    console.log(`⏳ Attempt ${attempts}: Order element not found yet, retrying...`);
                                    setTimeout(scrollToOrder, 200);
                                  } else {
                                    console.warn('❌ Order element not found after max attempts');
                                  }
                                }
                              };
                              
                              // Start scrolling after initial delay
                              setTimeout(scrollToOrder, 300);
                            } else {
                              console.warn('❌ Order not found in orders list:', notification.related_order_id);
                              // Still navigate to Order Management page to show all orders
                              setActiveView('orders');
                            }
                          }
                        };
                        
                        return (
                          <div 
                            key={notification.id} 
                            className={`group border-l-4 p-2 rounded-r-sm cursor-pointer transition-all duration-200 hover:bg-blue-100 hover:shadow-md touch-manipulation ${
                              notification.is_read 
                                ? 'bg-gray-50 border-gray-300 hover:border-blue-300'
                                : 'bg-blue-50 border-blue-500'
                            }`}
                            onClick={handleNotificationClick}
                            title="Click to view order details"
                          >
                            <div className="flex items-start space-x-1.5">
                              <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                                notification.is_read 
                                  ? 'bg-gray-400'
                                  : 'bg-blue-500'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-xs text-gray-900 break-words leading-tight">
                                  {notification.title}
                                </h3>
                                <p className="text-xs text-gray-600 mt-0.5 break-words leading-tight">{notification.message}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-xs text-gray-500">
                                    {(() => {
                                      try {
                                        const date = new Date(notification.created_at);
                                        // If the date is invalid, return a fallback
                                        if (isNaN(date.getTime())) {
                                          return 'Invalid date';
                                        }
                                        return date.toLocaleString('en-PH', {
                                          timeZone: 'Asia/Manila',
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        });
                                      } catch (error) {
                                        console.error('Date formatting error:', error);
                                        return new Date(notification.created_at).toLocaleString();
                                      }
                                    })()}
                                  </p>
                                  <div className="flex gap-1">
                                    {notification.related_order_id && (
                                      <span className="inline-block px-1 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
                                        #{notification.related_order_id}
                                      </span>
                                    )}
                                    {isReviewNotification && (
                                      <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                        ⭐
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 ml-2">
                                {!notification.is_read && (
                                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                                )}
                                <svg 
                                  className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeView === "subscription" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50">
                <div className="bg-sky-100 rounded-lg p-2 sm:p-3 mx-1 shadow-lg">
                  <VendorSubscription />
                </div>
              </div>
            )}

            {activeView === "feedback" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50">
                <div className="bg-sky-100 rounded-lg p-3 sm:p-4 lg:p-6 mx-1 shadow-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                    <img 
                      src={feedbackIcon} 
                      alt="Feedback" 
                      className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8"
                    />
                    <div>
                      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                        Customer Feedback
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600">
                        Customer reviews and ratings
                      </p>
                    </div>
                  </div>
                  
                  {feedbackLoading ? (
                    <div className="flex flex-col sm:flex-row justify-center items-center py-6 sm:py-8 space-y-2 sm:space-y-0">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-0 sm:ml-3 text-sm sm:text-base text-gray-600">Loading feedback...</span>
                    </div>
                  ) : customerFeedback.reviews.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <img src={feedbackIcon} alt="No feedback" className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
                      </div>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                      <p className="text-sm sm:text-base text-gray-600">Customer reviews will appear here</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary Card */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="text-3xl sm:text-4xl font-bold text-blue-600">
                              {customerFeedback.summary.average_rating}
                            </div>
                            <div>
                              <div className="flex text-yellow-400 text-lg sm:text-xl">
                                {renderStars(customerFeedback.summary.average_rating)}
                              </div>
                              <p className="text-sm sm:text-base text-gray-600">
                                {customerFeedback.summary.total_reviews} review{customerFeedback.summary.total_reviews !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reviews Grid */}
                      <div className="space-y-3 sm:space-y-4">
                        {customerFeedback.reviews.map((review) => {
                          const initials = getInitials(review.customer_fname, review.customer_lname);
                          const avatarColor = getAvatarColor(initials);
                          
                          return (
                            <div key={review.review_id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-start space-x-3 sm:space-x-4">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${avatarColor.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                                  <span className={`${avatarColor.text} font-semibold text-sm sm:text-base`}>{initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                                      {review.customer_fname} {review.customer_lname}
                                    </h3>
                                    <div className="flex items-center space-x-1 sm:space-x-2">
                                      <span className="text-yellow-400 text-sm sm:text-base">{renderStars(review.rating)}</span>
                                      <span className="text-sm sm:text-base text-gray-600">{review.rating}.0</span>
                                    </div>
                                  </div>
                                  {review.comment && (
                                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-2 sm:mb-3">
                                      "{review.comment}"
                                    </p>
                                  )}
                                  <p className="text-xs sm:text-sm text-gray-500">
                                    {formatTimeAgo(review.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeView === "analytics" && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  Analytics
                </h1>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Carousel Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl max-h-[90vh] w-full mx-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedFlavorName} - Image {currentImageIndex + 1} of {selectedFlavorImages.length}
              </h3>
              <button
                onClick={closeImageModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors duration-200"
              >
                ×
              </button>
            </div>
            
            {/* Carousel Container */}
            <div className="relative">
              {/* Main Image */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img
                  src={getImageUrl(selectedFlavorImages[currentImageIndex], process.env.REACT_APP_API_URL || "http://localhost:3001") || `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${selectedFlavorImages[currentImageIndex]}`}
                  alt={`${selectedFlavorName} preview ${currentImageIndex + 1}`}
                  className="w-full h-96 object-contain mx-auto"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                  }}
                />
                
                {/* Navigation Arrows */}
                {selectedFlavorImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {selectedFlavorImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {selectedFlavorImages.map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        index === currentImageIndex 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={getImageUrl(imageUrl, process.env.REACT_APP_API_URL || "http://localhost:3001") || `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrl}`}
                        alt={`${selectedFlavorName} preview option ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Use arrow keys or click thumbnails to navigate
              </div>
              <button
                onClick={closeImageModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drum Setup Validation Modal */}
      {showDrumSetupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-100 mb-3 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1.5 sm:mb-2">
                Setup Required
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5 lg:mb-6">
                Please set up your drum inventory and prices before uploading flavors. Go to the "Inventory" tab to configure your drums first.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowDrumSetupModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDrumSetupModal(false);
                    setActiveView("inventory");
                    // Auto scroll to top to show inventory section
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-xs sm:text-sm"
                >
                  Go to Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 max-w-lg w-full mx-2 sm:mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-full bg-red-100 mb-3 sm:mb-4">
                <svg className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Delete Flavor - Warning!
              </h3>
              
              {/* Flavor Name */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                <p className="text-sm sm:text-base font-semibold text-gray-800">
                  "{flavorToDelete?.flavor_name}"
                </p>
              </div>
              
              {/* Warning Message */}
              <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-3 sm:mb-4 text-left">
                <div className="flex items-start">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-red-800 mb-1">
                      Are you sure you want to delete this flavor?
                    </h4>
                    <p className="text-xs sm:text-sm text-red-700">
                      This action will remove the flavor along with its product sizes and images.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Additional Info */}
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-5 lg:mb-6">
                This action <span className="font-bold text-red-600">cannot be undone</span>. Please confirm you want to permanently delete this flavor.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={cancelDeleteFlavor}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 sm:py-2.5 lg:py-3 px-3 sm:px-4 rounded-lg transition-colors duration-200 border border-gray-300 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteFlavor}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 sm:py-2.5 lg:py-3 px-3 sm:px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-xs sm:text-sm"
                >
                  Yes, Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Decline Reason Modal */}
      {showDeclineReasonModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 max-w-lg w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-100 mb-3 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1.5 sm:mb-2">
                Decline Order #{selectedOrder.order_id}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Please provide a reason for declining this order:
              </p>
              
              <div className="text-left text-xs text-gray-500 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <p className="font-medium mb-1.5 sm:mb-2">Common reasons:</p>
                <ul className="space-y-0.5 sm:space-y-1">
                  <li>• No available containers/drums</li>
                  <li>• Delivery date fully booked</li>
                  <li>• Ingredient shortage</li>
                  <li>• Store closed on requested date</li>
                  <li>• Other (please specify)</li>
                </ul>
              </div>
              
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Enter your reason for declining this order..."
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-xs sm:text-sm"
                rows={4}
                required
              />
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-5 lg:mt-6">
                <button
                  onClick={() => {
                    setShowDeclineReasonModal(false);
                    setSelectedOrder(null);
                    setDeclineReason('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineReasonSubmit}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  Submit Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prepare Order Confirmation Modal */}
      {showPrepareModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 mb-3 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1.5 sm:mb-2">
                Start Preparing Order #{selectedOrder.order_id}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5 lg:mb-6">
                This will notify the customer that their ice cream is being prepared. Are you ready to start?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowPrepareModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPrepareOrder}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  Start Preparing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ready for Delivery Confirmation Modal */}
      {showReadyModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-100 mb-3 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
                Ready for Delivery - Order #{selectedOrder.order_id}
              </h3>
              <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-left bg-gray-50 p-2 sm:p-3 rounded-lg">
                <p className="mb-1 sm:mb-1.5"><strong>Customer:</strong> {selectedOrder.customer_fname} {selectedOrder.customer_lname}</p>
                <p className="break-words"><strong>Address:</strong> {selectedOrder.delivery_address}</p>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5 lg:mb-6">
                This will notify the customer that their order is on the way.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowReadyModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReadyOrder}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  Ready for Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COD Payment Confirmation Modal */}
      {showCODPaymentModal && codPaymentData.orderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 max-w-md w-full mx-2 sm:mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-full bg-orange-100 mb-3 sm:mb-4">
                <svg className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Confirm COD Payment Collection
              </h3>
              <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-left bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="mb-1.5 sm:mb-2">
                  <strong>Amount:</strong> <span className="font-bold text-orange-600 text-base sm:text-lg">₱{codPaymentData.amount ? parseFloat(codPaymentData.amount).toFixed(2) : '0.00'}</span>
                </p>
                <p className="text-gray-700">
                  This will mark the order as fully paid.
                </p>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5 lg:mb-6">
                Please confirm that you have collected the cash payment from the customer.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowCODPaymentModal(false);
                    setCodPaymentData({ orderId: null, amount: null });
                  }}
                  disabled={isConfirmingCODPayment}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCODPayment}
                  disabled={isConfirmingCODPayment}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs sm:text-sm"
                >
                  {isConfirmingCODPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"></div>
                      Confirming...
                    </>
                  ) : (
                    'OK'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Delivered Confirmation Modal */}
      {showDeliveredModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 mb-3 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
                Mark as Delivered - Order #{selectedOrder.order_id}
              </h3>
              <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-left bg-gray-50 p-2 sm:p-3 rounded-lg">
                <p className="mb-1 sm:mb-1.5"><strong>Customer:</strong> {selectedOrder.customer_fname} {selectedOrder.customer_lname}</p>
                <p><strong>Amount:</strong> ₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
                {hasPendingRemainingBalance(selectedOrder, 'cod') && (
                  <div className="mt-2 p-1.5 sm:p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 text-xs font-medium">
                      ⚠️ COD Payment Pending: ₱{parseFloat(selectedOrder.remaining_balance).toFixed(2)}
                    </p>
                    <p className="text-red-700 text-xs mt-1">
                      Please confirm COD payment collection before marking as delivered.
                    </p>
                  </div>
                )}
                {hasPendingRemainingBalance(selectedOrder, 'gcash') && (
                  <div className="mt-2 p-1.5 sm:p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-xs font-medium">
                      ⚠️ GCash Payment Proof Pending: ₱{parseFloat(selectedOrder.remaining_balance).toFixed(2)}
                    </p>
                    <p className="text-yellow-700 text-xs mt-1">
                      Request and review the customer&apos;s GCash payment proof before marking this order as delivered.
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5 lg:mb-6">
                {hasPendingRemainingBalance(selectedOrder, 'cod')
                  ? '⚠️ Cannot mark as delivered. COD payment must be confirmed first.'
                  : hasPendingRemainingBalance(selectedOrder, 'gcash')
                    ? '⚠️ Cannot mark as delivered. Awaiting GCash payment proof.'
                    : 'Confirm that the order has been successfully delivered to the customer.'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowDeliveredModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeliveredOrder}
                  disabled={hasPendingRemainingBalance(selectedOrder, 'cod') || hasPendingRemainingBalance(selectedOrder, 'gcash')}
                  className={`flex-1 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm ${
                    hasPendingRemainingBalance(selectedOrder, 'cod') || hasPendingRemainingBalance(selectedOrder, 'gcash')
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  Mark as Delivered
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full mb-3 sm:mb-4 ${
                confirmModalData.type === 'danger' ? 'bg-red-100' : 
                confirmModalData.type === 'info' ? 'bg-blue-100' : 
                'bg-yellow-100'
              }`}>
                {confirmModalData.type === 'danger' ? (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : confirmModalData.type === 'info' ? (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1.5 sm:mb-2">
                {confirmModalData.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5 lg:mb-6">
                {confirmModalData.message}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  {confirmModalData.cancelText}
                </button>
                <button
                  onClick={() => {
                    if (confirmModalData.onConfirm) {
                      confirmModalData.onConfirm();
                    }
                  }}
                  className={`flex-1 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm ${
                    confirmModalData.type === 'danger' 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : confirmModalData.type === 'info'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                >
                  {confirmModalData.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {showPaymentProofModal && selectedOrderForPaymentProof && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
          onClick={handleClosePaymentProofModal}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-2 sm:my-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-2 sm:p-3 lg:p-4 border-b">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Payment Proof</h3>
              <button
                onClick={() => setShowPaymentProofModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-2 sm:p-3 lg:p-4">
              {/* Order Information */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4 mb-3 sm:mb-4">
                <h4 className="font-medium text-gray-900 mb-1.5 sm:mb-2 text-xs sm:text-sm lg:text-base">Order Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <p><span className="font-medium">Order ID:</span> #{selectedOrderForPaymentProof.order_id}</p>
                  <p><span className="font-medium">Customer:</span> {selectedOrderForPaymentProof.customer_fname} {selectedOrderForPaymentProof.customer_lname}</p>
                  {selectedOrderForPaymentProof.payment_status === 'partial' && selectedOrderForPaymentProof.payment_amount ? (
                    <>
                      <p><span className="font-medium">Total Amount:</span> ₱{parseFloat(selectedOrderForPaymentProof.total_amount || 0).toFixed(2)}</p>
                      <p><span className="font-medium">Payment Method:</span> {selectedOrderForPaymentProof.qr_payment_method || 'GCash QR'}</p>
                      <p className="sm:col-span-2"><span className="font-medium">Amount Paid (50%):</span> <span className="text-green-600 font-bold">₱{parseFloat(selectedOrderForPaymentProof.payment_amount || 0).toFixed(2)}</span></p>
                      <p className="sm:col-span-2"><span className="font-medium">Remaining Balance:</span> <span className="text-orange-600">₱{parseFloat(selectedOrderForPaymentProof.remaining_balance || (selectedOrderForPaymentProof.total_amount - selectedOrderForPaymentProof.payment_amount)).toFixed(2)}</span></p>
                    </>
                  ) : (
                    <>
                      <p><span className="font-medium">Amount:</span> ₱{parseFloat(selectedOrderForPaymentProof.total_amount || 0).toFixed(2)}</p>
                      <p><span className="font-medium">Payment Method:</span> {selectedOrderForPaymentProof.qr_payment_method || 'GCash QR'}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Screenshot */}
              {selectedOrderForPaymentProof.payment_confirmation_image && (
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">Payment Confirmation Screenshot</h4>
                  <img 
                    src={selectedOrderForPaymentProof.payment_confirmation_image} 
                    alt="Payment Proof" 
                    className="w-full max-w-md mx-auto border border-gray-200 rounded-lg shadow-sm"
                  />
                </div>
              )}

              {/* Customer Notes */}
              {selectedOrderForPaymentProof.payment_notes && (
                <div className="mt-3 sm:mt-4 bg-blue-50 rounded-lg p-2 sm:p-3 lg:p-4">
                  <h4 className="font-medium text-blue-900 mb-1.5 sm:mb-2 text-xs sm:text-sm lg:text-base">Customer Notes</h4>
                  <p className="text-xs sm:text-sm text-blue-800">{selectedOrderForPaymentProof.payment_notes}</p>
                </div>
              )}

              {/* No Payment Proof Message */}
              {!selectedOrderForPaymentProof.payment_confirmation_image && (
                <div className="text-center py-6 sm:py-8">
                  <div className="text-gray-400 text-3xl sm:text-4xl mb-3 sm:mb-4">📱</div>
                  <p className="text-xs sm:text-sm text-gray-600">No payment proof available for this order.</p>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end p-2 sm:p-3 lg:p-4 border-t">
              <button
                onClick={() => setShowPaymentProofModal(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-xs sm:text-sm lg:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Walk-in Order Modal */}
      {showCancelWalkInModal && orderToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 lg:p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-3 sm:p-4 lg:p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Cancel Walk-in Order</h2>
                <button 
                  onClick={() => {
                    setShowCancelWalkInModal(false);
                    setOrderToCancel(null);
                    setCancelReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Warning Icon and Message */}
              <div className="text-center mb-3 sm:mb-4">
                <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-100 mb-2 sm:mb-3">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Cancel Order #{orderToCancel.order_id}?
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                  Are you sure you want to cancel this walk-in order?
                </p>
                <p className="text-xs text-gray-500 mb-3 sm:mb-4">
                  This action will release reserved drums and cannot be undone.
                </p>
              </div>

              {/* Cancel Reason Input */}
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Customer requested cancellation, Order mistake, etc."
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs sm:text-sm resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be recorded for record-keeping purposes.
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                <p className="text-xs font-medium text-gray-700 mb-1">Order Summary:</p>
                <p className="text-xs sm:text-sm text-gray-900">Total: ₱{parseFloat(orderToCancel.total_amount || 0).toFixed(2)}</p>
                {orderToCancel.payment_status === 'partial' && orderToCancel.payment_amount && (
                  <p className="text-xs text-gray-600 mt-1">
                    Paid: ₱{parseFloat(orderToCancel.payment_amount).toFixed(2)} | 
                    Remaining: ₱{parseFloat(orderToCancel.remaining_balance || (orderToCancel.total_amount - orderToCancel.payment_amount)).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowCancelWalkInModal(false);
                    setOrderToCancel(null);
                    setCancelReason('');
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors text-xs sm:text-sm lg:text-base"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelWalkInOrder}
                  className="flex-1 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-xs sm:text-sm lg:text-base"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userRole="vendor"
      />

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => {
          setShowLocationPicker(false);
          setSelectedAddressForLocation(null);
        }}
        addressId={selectedAddressForLocation?.address_id}
        currentCoordinates={selectedAddressForLocation}
        onLocationSaved={handleLocationSaved}
      />
    </>
  );
};

export default Vendor;
