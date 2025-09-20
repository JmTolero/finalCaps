import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AddressForm from "../../components/shared/AddressForm";
import logoImage from "../../assets/images/LOGO.png";
import axios from "axios";

// Vendor Dashboard Icons
import dashboardIcon from "../../assets/images/vendordashboardicon/vendorDashboardicon.png";
import inventoryIcon from "../../assets/images/vendordashboardicon/inventoryProductVendorIcon.png";
import ordersIcon from "../../assets/images/vendordashboardicon/vendorOrderIcon.png";
import addCustomerIcon from "../../assets/images/vendordashboardicon/addcustomericon.png";
import paymentsIcon from "../../assets/images/vendordashboardicon/paymentsvendoricon.png";
import profileIcon from "../../assets/images/vendordashboardicon/profileVendorIcon.png";
import storeIcon from "../../assets/images/vendordashboardicon/shop.png";
import bellNotificationIcon from "../../assets/images/bellNotification.png";
import feedbackIcon from "../../assets/images/feedback.png";

export const Vendor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    // Check if user exists in sessionStorage to avoid unnecessary loading screen on refresh
    const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    return !userRaw; // Only show loading if no user in sessionStorage
  });
  const [isUserChanging, setIsUserChanging] = useState(false);
  
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
    product_count: 0,
    upcoming_deliveries: [],
  });
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // My Store data state
  const [publishedFlavors, setPublishedFlavors] = useState([]);
  const [publishedFlavorsLoading, setPublishedFlavorsLoading] = useState(false);    

  // Drum management state
  const [drumReturnLoading, setDrumReturnLoading] = useState(null);
  const [availableDrums, setAvailableDrums] = useState({
    small: 0,
    medium: 0,
    large: 0,
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
    small: 500, // ₱500 per small drum
    medium: 800, // ₱800 per medium drum
    large: 1200, // ₱1200 per large drum
  });
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [tempPrices, setTempPrices] = useState({
    small: 500,
    medium: 800,
    large: 1200,
  });

  // Delivery pricing state
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [tempDeliveryZones, setTempDeliveryZones] = useState([]);
  const [newDeliveryZone, setNewDeliveryZone] = useState({
    city: '',
    province: '',
    delivery_price: 0
  });
  const [showAddZoneForm, setShowAddZoneForm] = useState(false);

  // Orders state
  const [vendorOrders, setVendorOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [recentStatusChange, setRecentStatusChange] = useState(null); // For undo functionality

  // Flavor form state
  const [flavorForm, setFlavorForm] = useState({
    name: "",
    description: "",
  });
  const [flavorImages, setFlavorImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Saved flavors state
  const [savedFlavors, setSavedFlavors] = useState([]);
  const [flavorsLoading, setFlavorsLoading] = useState(false);
  
  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedFlavorImages, setSelectedFlavorImages] = useState([]);
  const [selectedFlavorName, setSelectedFlavorName] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Flavor editing state
  const [editingFlavor, setEditingFlavor] = useState(null);
  const [isEditingFlavor, setIsEditingFlavor] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [flavorToDelete, setFlavorToDelete] = useState(null);
  
  // Profile dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
          const imageUrl = `${apiBase}/uploads/vendor-documents/${response.data.vendor.profile_image_url}`;
          setProfileImage(imageUrl);
          setProfileImagePreview(imageUrl);
        }
        
        console.log("Current vendor:", response.data.vendor);
        
        // Fetch addresses for this vendor user
        fetchAddresses(response.data.vendor.user_id);
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
  }, [fetchAddresses, navigate, currentVendor]);

  const fetchPublishedFlavors = async () => {
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
  };

  const handleDrumsEdit = () => {
    setIsEditingDrums(true);
    setTempDrums({ ...availableDrums });
  };

  const handleDrumsSave = async () => {
    if (!currentVendor?.vendor_id) return;
    
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
      updateStatus("error", "Failed to update drum inventory. Please try again.");
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
  const fetchDeliveryPricing = async () => {
    if (!currentVendor?.vendor_id) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/vendor/delivery/${currentVendor.vendor_id}/pricing`);
      
      if (response.data.success) {
        setDeliveryZones(response.data.delivery_zones || []);
      }
    } catch (error) {
      console.error("Error fetching delivery pricing:", error);
      // Set empty array on error
      setDeliveryZones([]);
    }
  };

  const handleDeliveryEdit = () => {
    setIsEditingDelivery(true);
    setTempDeliveryZones([...deliveryZones]);
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

  const handleDeliveryZoneChange = (index, field, value) => {
    const updatedZones = [...tempDeliveryZones];
    updatedZones[index] = {
      ...updatedZones[index],
      [field]: value
    };
    setTempDeliveryZones(updatedZones);
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
        setNewDeliveryZone({ city: '', province: '', delivery_price: 0 });
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
   const fetchVendorOrders = async () => {
     if (!currentVendor?.vendor_id) {
       console.log('❌ Cannot fetch vendor orders: no vendor_id', currentVendor);
       return;
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
         setVendorOrders(response.data.orders);
       } else {
         console.log('❌ API returned unsuccessful response:', response.data);
         setVendorOrders([]);
       }
     } catch (error) {
       console.error("❌ Error fetching vendor orders:", error);
       setVendorOrders([]);
     } finally {
       setOrdersLoading(false);
     }
   };

   // Update order status (approve/decline)
   const updateOrderStatus = async (orderId, newStatus, previousStatus = null) => {
     try {
       console.log('🔄 Updating order status:', orderId, 'to', newStatus);
       
       // Store previous status for undo functionality (if not provided, get from current orders)
       if (!previousStatus) {
         const currentOrder = vendorOrders.find(o => o.order_id === orderId);
         previousStatus = currentOrder?.status;
       }
       
       const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
       const response = await axios.put(`${apiBase}/api/orders/${orderId}/status`, {
         status: newStatus
       });
       
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
    if (!window.confirm('Mark this container as picked up? This will update the status to "returned".')) {
      return;
    }

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

  const fetchSavedFlavors = async () => {
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
  };

  // Fetch drum pricing and availability from database
  const fetchDrumData = async () => { 
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
  };

  const openImageModal = (imageUrls, flavorName) => {
    setSelectedFlavorImages(imageUrls);
    setSelectedFlavorName(flavorName);
    setCurrentImageIndex(0);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedFlavorImages([]);
    setSelectedFlavorName("");
    setCurrentImageIndex(0);
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
      url: `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${img}`,
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
      updateStatus("error", "Failed to delete flavor. Please try again.");
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
      updateStatus("error", "Failed to update flavor status. Please try again.");
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === selectedFlavorImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? selectedFlavorImages.length - 1 : prev - 1
    );
  };

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
  }, [imageModalOpen, selectedFlavorImages.length]);

  const handleSaveFlavor = async () => {
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

    try {
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
  }, [activeView, currentVendor?.vendor_id, isInitialLoading]);

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
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, isUserChanging]);

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
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, isUserChanging]);

  // Fetch drum data when vendor is loaded
  useEffect(() => {
    if (currentVendor?.vendor_id && !isInitialLoading) {
      fetchDrumData();
      fetchDeliveryPricing();
    }
  }, [currentVendor?.vendor_id, isInitialLoading]);

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
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, isUserChanging]);

  // Auto-refresh vendor orders every 10 seconds when on orders view to see payment updates
  useEffect(() => {
    let interval;
    
    if (activeView === "orders" && currentVendor?.vendor_id && !isInitialLoading && !isUserChanging) {
      // Set up auto-refresh every 10 seconds for payment status updates
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing vendor orders for payment updates...');
        fetchVendorOrders();
      }, 10000); // 10 seconds for fast payment detection
    }
    
    // Cleanup interval on component unmount or view change
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeView, currentVendor?.vendor_id, isInitialLoading, isUserChanging]);

  // Fetch vendor dashboard data
  const fetchDashboardData = async (vendorId) => {
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
      // Set default values on error
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
  };

  const handleAddressChange = (addressData) => {
    setNewAddress(addressData);
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

  const setPrimaryAddress = async (addressId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      if (!currentVendor?.user_id) {
        updateStatus("error", "Vendor information not loaded.");
        return;
      }

      // Set as primary address for the user
      await axios.put(
        `${apiBase}/api/addresses/user/${currentVendor.user_id}/primary-address/${addressId}`
      );
      
      updateStatus("success", "Primary address set successfully!");
      fetchAddresses();
    } catch (error) {
      console.error("Error setting primary address:", error);
      updateStatus(
        "error",
        error.response?.data?.error || "Failed to set primary address"
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
    window.dispatchEvent(new Event("userChanged"));
    navigate("/login");
  };

  const handleSettingsClick = () => {
    setActiveView("settings");
    setIsProfileDropdownOpen(false);
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
    
    // Auto-hide success messages after 3 seconds
    if (type === "success") {
      setTimeout(() => {
        setShowStatus(false);
        // Clear the status message after animation
        setTimeout(() => {
          setStatus({ type: null, message: "" });
        }, 300); // Match the transition duration
      }, 3000);
    }
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
        if (newProfileImage) {
          const imageUrl = `${apiBase}/uploads/vendor-documents/${
            response.data.profile_image_url || newProfileImage.name
          }`;
          setProfileImage(imageUrl);
          setProfileImagePreview(imageUrl);
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
    } catch (error) {
      console.error("Error updating profile:", error);
      updateStatus("error", "Failed to update profile. Please try again.");
    }
  };

  const settingsTabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "addresses", label: "Store Addresses", icon: "📍" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "feedback", label: "Feedback", icon: "💬" },
  ];

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: dashboardIcon },
    { id: "inventory", label: "Product Management", icon: inventoryIcon },
    { id: "my-store", label: "My Store", icon: storeIcon },
    { id: "orders", label: "Orders", icon: ordersIcon },
    {
      id: "addCustomerOrders",
      label: "Add Customer Orders",
      icon: addCustomerIcon,
    },
    { id: "payments", label: "Payments", icon: paymentsIcon },
  ];

  // Settings View with Sidebar Layout
  if (activeView === "settings") {
    return (
      <>
        {/* Custom Navbar */}
        <header className="w-full bg-sky-100 flex items-center justify-between px-8 py-4 fixed top-0 left-0 z-20 overflow-visible">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-blue-200 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700"
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
                className="ChillNet-Logo h-10 rounded-full object-cover"
              />
            </Link>
          </div>
          
          {/* Profile Dropdown in Navbar */}
          <div className="relative flex items-center space-x-2" ref={profileDropdownRef}>
            {/* Notification and Feedback Icons */}
            <button
              onClick={() => setActiveView("notifications")}
              className="p-2 rounded-full hover:bg-blue-200 transition-colors relative"
            >
              <img 
                src={bellNotificationIcon} 
                alt="Notifications" 
                className="w-6 h-6"
              />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            
            <button
              onClick={() => setActiveView("feedback")}
              className="p-2 rounded-full hover:bg-blue-200 transition-colors"
            >
              <img 
                src={feedbackIcon} 
                alt="Feedback" 
                className="w-6 h-6"
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[100]">
                <div className="py-1">
                  {/* User Info */}
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">
                      {currentVendor?.fname || "Vendor"}
                    </div>
                    <div className="text-gray-500">{currentVendor?.email}</div>
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
              isSidebarOpen ? "w-64" : "w-20"
            } bg-[#BBDEF8] h-screen fixed left-0 top-16 z-10 transition-all duration-300 overflow-y-auto`}
          >
            <div className="p-4 pt-8">
               {/* Menu items */}
               <ul className="flex flex-col space-y-3">
                 {sidebarItems.map((item) => (
                   <li key={item.id}>
                     <button
                       onClick={() => setActiveView(item.id)}
                      className={`w-full flex ${
                        isSidebarOpen
                          ? "items-center gap-3 px-4 py-3"
                          : "items-center justify-center p-3"
                      } rounded-lg transition-colors ${
                         activeView === item.id
                          ? "bg-blue-200 text-blue-800 font-semibold"
                          : "text-gray-700 hover:bg-blue-300 hover:text-gray-900"
                       }`}
                     >
                       <img 
                         src={item.icon} 
                         alt={item.label} 
                         className="w-8 h-8 flex-shrink-0 object-contain" 
                       />
                       {isSidebarOpen && (
                         <span className="font-medium text-sm">{item.label}</span>
                       )}
                     </button>
                   </li>
                 ))}
               </ul>
               
               {/* Separate Profile Button */}
               <div className="mt-4">
                 <button
                   onClick={() => {
                    console.log(
                      "Profile button clicked in settings - navigating to profile tab"
                    );
                    setActiveTab("profile");
                  }}
                  className={`w-full flex ${
                    isSidebarOpen
                      ? "items-center gap-3"
                      : "items-center justify-center"
                  } p-3 ${
                    isSidebarOpen ? "text-left" : "text-center"
                  } transition-colors hover:bg-blue-300 ${
                    activeTab === "profile"
                      ? "bg-blue-200 text-blue-800 font-semibold"
                      : "text-gray-700 hover:text-gray-900"
                   }`}
                 >
                   <img 
                     src={profileIcon} 
                     alt="Profile" 
                     className="w-8 h-8 flex-shrink-0 object-contain" 
                   />
                  {isSidebarOpen && (
                    <span className="font-medium">Profile</span>
                  )}
                 </button>
               </div>
             </div>
           </div>

          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
            <div className="p-8 pt-28">
              <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Vendor Settings
                      </h1>
                      <p className="text-gray-600 mt-2">
                        Manage your store information and preferences
                      </p>
                    {currentVendor && (
                      <div className="mt-2">
                        <p className="text-sm text-blue-600">
                            Store: {currentVendor.store_name} | Owner:{" "}
                            {currentVendor.fname}
                        </p>
                        <p className="text-xs text-gray-500">
                            Contact:{" "}
                            {currentVendor.contact_no || "Not provided"} |
                            Email: {currentVendor.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            User ID: {currentVendor.user_id} | Vendor ID:{" "}
                            {currentVendor.vendor_id} | Status:{" "}
                            {currentVendor.status}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {status.type && showStatus && (
                  <div
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

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Settings Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <nav className="space-y-2">
                      {settingsTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            activeTab === tab.id
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span className="mr-3">{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    {/* Profile Tab */}
                      {activeTab === "profile" && (
                      <div>
                          <h2 className="text-2xl font-semibold mb-6">
                            Store Information
                          </h2>
                        <div className="space-y-6">
                          {/* Profile Image Upload Section */}
                          <div className="bg-gray-50 rounded-lg p-6">
                              <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Profile Picture
                              </h3>
                            <div className="flex items-center space-x-6">
                              {/* Current/Preview Image */}
                              <div className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                  {profileImagePreview ? (
                                    <img 
                                      src={profileImagePreview} 
                                      alt="Profile preview" 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                      <svg
                                        className="w-12 h-12 text-gray-400"
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
                              </div>
                              
                              {/* Upload Button */}
                              <div className="flex-1">
                                <label className="block">
                                    <span className="sr-only">
                                      Choose profile photo
                                    </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfileImageChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                  />
                                </label>
                                <p className="mt-2 text-sm text-gray-500">
                                  JPG, PNG or GIF. Max size 20MB.
                                </p>
                                {newProfileImage && (
                                  <p className="mt-1 text-sm text-green-600">
                                      ✓ New image selected:{" "}
                                      {newProfileImage.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Your store name"
                              />
                            </div>
                          </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="09123456789"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button 
                              onClick={handleSaveProfile}
                              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">
                              Store Addresses
                            </h2>
                          <button
                            onClick={() => {
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
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            + Add Store Address
                          </button>
                        </div>

                        {/* Address List */}
                        <div className="space-y-4 mb-6">
                          {addresses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <div className="text-4xl mb-4">🏪</div>
                                <p className="text-lg">
                                  No store addresses added yet
                                </p>
                                <p className="text-sm">
                                  Add your store address to help customers find
                                  you
                                </p>
                            </div>
                          ) : (
                            addresses.map((address, index) => (
                                <div
                                  key={index}
                                  className="border border-gray-200 rounded-lg p-4"
                                >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-semibold text-lg">
                                          {address.address_type} Address
                                        </h3>
                                      {address.is_default === 1 && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                          ⭐ Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 mt-1">
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
                                      <p className="text-sm text-gray-500 mt-1">
                                        Landmark: {address.landmark}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => editAddress(address)}
                                      className="text-blue-600 hover:text-blue-800 mr-2"
                                    >
                                      Edit
                                    </button>
                                    <button
                                        onClick={() =>
                                          setPrimaryAddress(address.address_id)
                                        }
                                      className="text-green-600 hover:text-green-800 mr-2"
                                    >
                                      Set Primary
                                    </button>
                                    <button
                                        onClick={() =>
                                          deleteAddress(address.address_id)
                                        }
                                      className="text-red-600 hover:text-red-800"
                                    >
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
                          <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">
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
                            <div className="flex justify-end space-x-4 mt-6">
                              <button
                                onClick={() => {
                                  setShowAddressForm(false);
                                  setEditingAddress(null);
                                }}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveAddress}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                      {activeTab === "documents" && (
                      <div>
                          <h2 className="text-2xl font-semibold mb-6">
                            Documents
                          </h2>
                      </div>
                    )}

                    {/* Notifications Tab */}
                      {activeTab === "notifications" && (
                      <div>
                          <h2 className="text-2xl font-semibold mb-6">
                            Notifications
                          </h2>
                          <div className="space-y-4">
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">New Order Received</h3>
                                  <p className="text-sm text-gray-600">You have a new order for Mango Flavor - Large size</p>
                                  <p className="text-xs text-gray-500">2 minutes ago</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">Order Delivered</h3>
                                  <p className="text-sm text-gray-600">Order #12345 has been successfully delivered</p>
                                  <p className="text-xs text-gray-500">1 hour ago</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">Low Stock Alert</h3>
                                  <p className="text-sm text-gray-600">Vanilla Flavor is running low on stock</p>
                                  <p className="text-xs text-gray-500">3 hours ago</p>
                                </div>
                              </div>
                            </div>
                          </div>
                      </div>
                    )}

                    {/* Feedback Tab */}
                    {activeTab === "feedback" && (
                      <div>
                        <h2 className="text-2xl font-semibold mb-6">
                          Customer Feedback
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">JD</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">John Doe</h3>
                                <div className="flex items-center space-x-1">
                                  <span className="text-yellow-400">★★★★★</span>
                                  <span className="text-sm text-gray-600">5.0</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-2">
                              "Amazing ice cream! The Mango Flavor is absolutely delicious. Will definitely order again!"
                            </p>
                            <p className="text-xs text-gray-500">2 days ago</p>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-semibold">SM</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">Sarah Miller</h3>
                                <div className="flex items-center space-x-1">
                                  <span className="text-yellow-400">★★★★☆</span>
                                  <span className="text-sm text-gray-600">4.0</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-2">
                              "Great quality ice cream, but delivery was a bit late. Overall satisfied with the product."
                            </p>
                            <p className="text-xs text-gray-500">1 week ago</p>
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
      <header className="w-full bg-sky-100 flex items-center justify-between px-8 py-4 fixed top-0 left-0 z-20 overflow-visible">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-blue-200 transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-700"
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
              className="ChillNet-Logo h-10 rounded-full object-cover"
            />
          </Link>
        </div>
        
        {/* Profile Dropdown in Navbar */}
        <div className="relative flex items-center space-x-2" ref={profileDropdownRef}>
          {/* Notification and Feedback Icons */}
          <button
            onClick={() => setActiveView("notifications")}
            className="p-2 rounded-full hover:bg-blue-200 transition-colors relative"
          >
            <img 
              src={bellNotificationIcon} 
              alt="Notifications" 
              className="w-6 h-6"
            />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          
          <button
            onClick={() => setActiveView("feedback")}
            className="p-2 rounded-full hover:bg-blue-200 transition-colors"
          >
            <img 
              src={feedbackIcon} 
              alt="Feedback" 
              className="w-6 h-6"
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
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[100]">
              <div className="py-1">
                {/* User Info */}
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <div className="font-medium">
                    {currentVendor?.fname || "Vendor"}
                  </div>
                  <div className="text-gray-500">{currentVendor?.email}</div>
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
            isSidebarOpen ? "w-64" : "w-20"
          } bg-[#BBDEF8] h-screen fixed left-0 top-16 z-10 transition-all duration-300 overflow-y-auto`}
        >
          <div className="p-4 pt-8">
             {/* Menu items */}
             <ul className="flex flex-col space-y-3">
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
                     }}
                    className={`w-full flex ${
                      isSidebarOpen
                        ? "items-center gap-3 px-4 py-3"
                        : "items-center justify-center p-3"
                    } rounded-lg transition-colors ${
                       activeView === item.id
                        ? "bg-blue-200 text-blue-800 font-semibold"
                        : "text-gray-700 hover:bg-blue-300 hover:text-gray-900"
                     }`}
                   >
                     <img 
                       src={item.icon} 
                       alt={item.label} 
                       className="w-8 h-8 flex-shrink-0 object-contain" 
                     />
                    {isSidebarOpen && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                   </button>
                 </li>
               ))}
             </ul>
             
             {/* Separate Profile Button */}
             <div className="mt-4">
               <button
                 onClick={() => {
                  console.log(
                    "Profile button clicked - navigating to settings"
                  );
                  setActiveView("settings");
                  setActiveTab("profile");
                }}
                className={`w-full flex ${
                  isSidebarOpen
                    ? "items-center gap-3"
                    : "items-center justify-center"
                } p-3 ${
                  isSidebarOpen ? "text-left" : "text-center"
                } transition-colors hover:bg-blue-300 ${
                  activeView === "settings" && activeTab === "profile"
                    ? "bg-blue-200 text-blue-800 font-semibold"
                    : "text-gray-700 hover:text-gray-900"
                 }`}
               >
                 <img 
                   src={profileIcon} 
                   alt="Profile" 
                   className="w-8 h-8 flex-shrink-0 object-contain" 
                 />
                 {isSidebarOpen && <span className="font-medium">Profile</span>}
               </button>
             </div>
           </div>
         </div>

        {/* Main Content */}
        <div className={`flex-1 p-8 pt-28 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="max-w-6xl mx-auto">
            {/* Dashboard Content */}
            {activeView === "dashboard" && (
              <div>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Vendor Dashboard
                  </h1>
                  <p className="text-gray-600">
                    Welcome to your vendor dashboard. Manage your ice cream
                    business here.
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <img
                          src={ordersIcon}
                          alt="Orders"
                          className="w-5 h-5"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardLoading
                            ? "..."
                            : dashboardData.total_orders}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <img
                          src={paymentsIcon}
                          alt="Revenue"
                          className="w-5 h-5"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardLoading
                            ? "..."
                            : `₱${dashboardData.total_revenue.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <img
                          src={inventoryIcon}
                          alt="Products"
                          className="w-5 h-5"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Products</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardLoading
                            ? "..."
                            : dashboardData.product_count}
                        </p>
                      </div>
                      </div>
                    </div>
                  </div>
                  
                {/* Other Details and Upcoming Deliveries */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Other Details Card */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Other Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Pending Orders:
                        </span>
                        <span className="text-sm font-semibold text-orange-600">
                          {dashboardLoading
                            ? "..."
                            : dashboardData.pending_orders}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Confirm Orders:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {dashboardLoading
                            ? "..."
                            : dashboardData.confirmed_orders}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Top Flavor:
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {dashboardLoading ? "..." : dashboardData.top_flavor}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Sales Today:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {dashboardLoading
                            ? "..."
                            : `₱${dashboardData.sales_today.toLocaleString()}`}
                        </span> 
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Sales this Month:
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {dashboardLoading
                            ? "..."
                            : `₱${dashboardData.sales_this_month.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                   {/* Upcoming Deliveries Card */}
                   <div className="bg-white p-6 rounded-lg shadow-sm">
                     <h3 className="text-lg font-semibold text-gray-900 mb-4">
                       Upcoming Deliveries
                     </h3>
                     <div className="space-y-3">
                       <div className="text-center py-8">
                         <div className="w-full h-16 bg-blue-50 rounded-lg flex items-center justify-center">
                           <span className="text-sm text-gray-500">
                             No upcoming deliveries
                           </span>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            )}

            {/* Other Views */}
            {activeView === "orders" && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  Orders
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
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl">
                  {/* Available Drums with Gallon Capacity Section */}
                  <div className="bg-sky-100 border border-blue-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-blue-800 font-bold text-lg">
                        Available Drums
                      </div>
                      {!isEditingDrums && (
                        <button
                          onClick={handleDrumsEdit}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Edit Inventory
                        </button>
                      )}
                    </div>

                    {isEditingDrums ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Small Drums
                            </label>
                            <input
                              type="number"
                              value={tempDrums.small}
                              onChange={(e) =>
                                handleDrumSizeChange("small", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Medium Drums
                            </label>
                            <input
                              type="number"
                              value={tempDrums.medium}
                              onChange={(e) =>
                                handleDrumSizeChange("medium", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Large Drums
                            </label>
                            <input
                              type="number"
                              value={tempDrums.large}
                              onChange={(e) =>
                                handleDrumSizeChange("large", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleDrumsSave}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Save Changes
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            {availableDrums.small}
                          </div>
                          <div className="text-sm font-semibold text-gray-800">
                            Small Drums
                          </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            {availableDrums.medium}
                          </div>
                          <div className="text-sm font-semibold text-gray-800">
                            Medium Drums
                          </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            {availableDrums.large}
                          </div>
                          <div className="text-sm font-semibold text-gray-800">
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
                      </div>
                    </div>
                  </div>

                  {/* Drum Capacity Settings Section */}
                  <div className="bg-sky-100 border border-blue-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-blue-800 font-bold text-lg">
                        Drum Capacity Settings (Gallons per Drum)
                      </div>
                      {!isEditingCapacity && (
                        <button
                          onClick={handleCapacityEdit}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Edit Capacity
                        </button>
                      )}
                    </div>

                    {isEditingCapacity ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Small Drum Capacity (gallons)
                            </label>
                            <input
                              type="number"
                              value={tempCapacity.small}
                              onChange={(e) =>
                                handleCapacityChange("small", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Medium Drum Capacity (gallons)
                            </label>
                            <input
                              type="number"
                              value={tempCapacity.medium}
                              onChange={(e) =>
                                handleCapacityChange("medium", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Large Drum Capacity (gallons)
                            </label>
                            <input
                              type="number"
                              value={tempCapacity.large}
                              onChange={(e) =>
                                handleCapacityChange("large", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                              min="1"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleCapacitySave}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Save Capacity
                          </button>
                          <button
                            onClick={handleCapacityCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {drumCapacity.small}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            Small Drum
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            gallons per drum
                          </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {drumCapacity.medium}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            Medium Drum
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            gallons per drum
                          </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {drumCapacity.large}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            Large Drum
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            gallons per drum
                          </div>
                        </div>
              </div>
            )}

                    {/* Drum Prices Section */}
                    <div className="mt-6 pt-6 border-t-2 border-blue-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-blue-800 font-bold text-lg">
                          Drum Prices (₱ per Drum)
                        </div>
                        {!isEditingPrices && (
                          <button
                            onClick={handlePricesEdit}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Edit Prices
                          </button>
                        )}
                      </div>

                      {isEditingPrices ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Small Drum Price (₱)
                              </label>
                              <input
                                type="number"
                                value={tempPrices.small}
                                onChange={(e) =>
                                  handlePriceChange("small", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Medium Drum Price (₱)
                              </label>
                              <input
                                type="number"
                                value={tempPrices.medium}
                                onChange={(e) =>
                                  handlePriceChange("medium", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Large Drum Price (₱)
                              </label>
                              <input
                                type="number"
                                value={tempPrices.large}
                                onChange={(e) =>
                                  handlePriceChange("large", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                                min="0"
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={handlePricesSave}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium"
                            >
                              Save Prices
                            </button>
                            <button
                              onClick={handlePricesCancel}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                            <div className="text-2xl font-bold text-green-600 mb-1">
                              ₱{drumPrices.small}
                            </div>
                            <div className="text-sm font-semibold text-gray-800 mb-1">
                              Small Drum
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                              per drum
                            </div>
                          </div>
                          <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                            <div className="text-2xl font-bold text-green-600 mb-1">
                              ₱{drumPrices.medium}
                            </div>
                            <div className="text-sm font-semibold text-gray-800 mb-1">
                              Medium Drum
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                              per drum
                            </div>
                          </div>
                          <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                            <div className="text-2xl font-bold text-green-600 mb-1">
                              ₱{drumPrices.large}
                            </div>
                            <div className="text-sm font-semibold text-gray-800 mb-1">
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
                <div id="flavor-form" className="bg-sky-100 border border-blue-300 rounded-lg p-6 mt-4">
                  <div className="text-blue-800 font-medium text-xl mb-4">
                    {isEditingFlavor ? `Edit Flavor: ${editingFlavor?.flavor_name}` : "Add Flavor:"}
                  </div>

                  <div className="flex items-start space-x-6">
                    {/* Flavor Images */}
                    <div className="flex-shrink-0">
                      <div className="space-y-4">
                        {/* Image Upload Area */}
                        <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center shadow-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                          <label
                            htmlFor="flavor-images"
                            className="cursor-pointer text-center"
                          >
                            <div className="text-4xl mb-2">📷</div>
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
                            <div className="text-sm text-gray-600">
                              Uploaded Images ({imagePreviews.length}):
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={preview}
                                    alt={`Flavor ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                                  />
                                  <button
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
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
                    <div className="flex-1 space-y-4">
              <div>
                        <label className="block text-sm font-semibold text-blue-800 mb-2">
                          Flavor Name
                        </label>
                        <input
                          type="text"
                          value={flavorForm.name}
                          onChange={(e) =>
                            handleFlavorFormChange("name", e.target.value)
                          }
                          placeholder="Enter flavor name (e.g., Vanilla)"
                          className="w-full px-4 py-3 bg-white border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm text-gray-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-blue-800 mb-2">
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
                          className="w-full px-4 py-3 bg-white border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm text-gray-900 font-medium resize-vertical"
                        />
                      </div>


                      <div className="flex items-center space-x-3">
                        <label
                          htmlFor="flavor-images"
                          className="bg-orange-300 hover:bg-orange-400 text-gray-900 font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-200 cursor-pointer"
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
                        <div className="flex space-x-3">
                          <button
                            onClick={handleSaveFlavor}
                            className="bg-orange-300 hover:bg-orange-400 text-gray-900 font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
                          >
                            {isEditingFlavor ? "Update Flavor" : "Save Flavor"}
                          </button>
                          {isEditingFlavor && (
                            <button
                              onClick={cancelEditFlavor}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Saved Flavors Section */}
                <div className="bg-[#D4F6FF] border border-blue-300 rounded-lg p-6 mt-4">
                  <div className="text-blue-800 font-medium text-xl mb-4">
                    My Flavors
                  </div>
                  
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedFlavors.map((flavor) => {
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
                          <div key={flavor.flavor_id} className="bg-white rounded-lg p-4 shadow-sm border border-blue-300">
                            <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                              {imageUrls.length > 0 ? (
                                <div className="relative w-full h-full">
                                  <img
                                    src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrls[0]}`}
                                    alt={flavor.flavor_name}
                                    className="w-full h-full object-cover"
                                  />
                                  {imageUrls.length > 1 && (
                                    <button
                                      onClick={() => openImageModal(imageUrls, flavor.flavor_name)}
                                      className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white text-xs px-2 py-1 rounded-full transition-all duration-200 cursor-pointer"
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
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {flavor.flavor_name}
                          </h3>
                          {flavor.flavor_description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {flavor.flavor_description}
                            </p>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Added {new Date(flavor.created_at).toLocaleDateString()}
                          </div>
                          
                          {/* Store Status Badge */}
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
                          <div className="flex flex-col space-y-2 mt-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditFlavor(flavor)}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded transition-colors duration-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => confirmDeleteFlavor(flavor)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded transition-colors duration-200"
                              >
                                Delete
                              </button>
                            </div>
                            
                            {/* Store Status Buttons */}
                            {flavor.store_status === 'draft' && (
                              <button
                                onClick={() => updateFlavorStoreStatus(flavor.flavor_id, 'ready')}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-2 rounded transition-colors duration-200"
                              >
                                Mark as Ready
                              </button>
                            )}
                            
                            {flavor.store_status === 'ready' && (
                              <button
                                onClick={() => updateFlavorStoreStatus(flavor.flavor_id, 'published')}
                                className="w-full bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded transition-colors duration-200"
                              >
                                📦 Upload to Store
                              </button>
                            )}
                            
                            {flavor.store_status === 'published' && (
                              <button
                                onClick={() => updateFlavorStoreStatus(flavor.flavor_id, 'ready')}
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded transition-colors duration-200"
                              >
                                Remove from Store
                              </button>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeView === "my-store" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50">
                {/* Store Header */}
                <div className="bg-sky-100 rounded-2xl p-8 mb-8 mx-4">
                  <div className="flex items-center justify-between">
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
                      className="bg-orange-300 hover:bg-orange-400 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-colors duration-200 shadow-lg"
                    >
                      Publish Flavor
                    </button>
                  </div>
                </div>

                {/* Published Flavors Section */}
                {publishedFlavorsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="px-4">
                    {publishedFlavors.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="bg-blue-200 rounded-2xl p-12 max-w-md mx-auto">
                          <div className="text-6xl mb-4">🍦</div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            No Flavors Published Yet
                          </h3>
                          <p className="text-gray-700 mb-6">
                            Start by publishing your first ice cream flavor to
                            showcase to customers!
                          </p>
                          <button
                            onClick={() => setActiveView("inventory")}
                            className="bg-orange-300 hover:bg-orange-400 text-gray-900 font-semibold px-8 py-3 rounded-xl transition-colors duration-200 shadow-lg"
                          >
                            Publish Your First Flavor
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                              className="bg-sky-100 rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300"
                            >
                              {/* Flavor Image */}
                              <div className="mb-4">
                                {imageUrls.length > 0 ? (
                                  <div className="relative">
                                    <img
                                      src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrls[0]}`}
                                      alt={flavor.flavor_name}
                                      className="w-full h-48 object-cover rounded-xl"
                                    />
                                    {imageUrls.length > 1 && (
                                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                        +{imageUrls.length - 1} more
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-full h-48 bg-white rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-4xl mb-2">🍦</div>
                                      <div className="text-sm text-gray-600">
                                        No Image
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Flavor Info */}
                              <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-900 text-center">
                                  {flavor.flavor_name}
                                </h3>

                                <p className="text-gray-700 text-center text-sm line-clamp-2">
                                  {flavor.flavor_description}
                                </p>

                                {/* Available Drum Sizes and Pricing */}
                                <div className="space-y-2">
                                  <div className="text-center">
                                    <span className="text-sm font-semibold text-gray-700">
                                      Available in all sizes
                                    </span>
                                  </div>
                                  
                                  {/* All Available Drum Sizes */}
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <div>Small ({drumCapacity.small} gal): ₱{drumPrices.small}</div>
                                    <div>Medium ({drumCapacity.medium} gal): ₱{drumPrices.medium}</div>
                                    <div>Large ({drumCapacity.large} gal): ₱{drumPrices.large}</div>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    📦 Published
                                  </span>
                                  <span className="text-sm text-gray-600 font-medium">
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

            {activeView === "addCustomerOrders" && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  Add Customer Orders
                </h1>
              </div>
            )}

            {activeView === "orders" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50">
                <div className="bg-white rounded-2xl p-8 mx-4 shadow-lg">
                  <div className="flex items-center space-x-4 mb-6">
                    <img 
                      src={ordersIcon} 
                      alt="Orders" 
                      className="w-10 h-10"
                    />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Order Management
                      </h1>
                      <p className="text-gray-600">
                        Review and manage customer orders
                      </p>
                    </div>
                  </div>

                  {/* Undo Notification */}
                  {recentStatusChange && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-yellow-800 font-medium">
                            Order #{recentStatusChange.orderId} status changed to "{recentStatusChange.newStatus}"
                          </p>
                          <p className="text-yellow-700 text-sm">
                            You have 30 seconds to undo this action if it was accidental.
                          </p>
                        </div>
                        <button
                          onClick={undoStatusChange}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          ↶ Undo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Order Filters */}
                  <div className="mb-8">
                    <div className="flex flex-wrap gap-1">
                      {[
                        { value: 'all', label: 'All Orders', count: vendorOrders.length },
                        { value: 'pending', label: 'Pending Approval', count: vendorOrders.filter(o => o.status === 'pending').length },
                        { value: 'confirmed', label: 'Awaiting Payment', count: vendorOrders.filter(o => o.status === 'confirmed' && o.payment_status === 'unpaid').length },
                        { value: 'paid', label: 'Ready to Prepare', count: vendorOrders.filter(o => o.status === 'confirmed' && o.payment_status === 'paid').length },
                        { value: 'preparing', label: 'Preparing', count: vendorOrders.filter(o => o.status === 'preparing').length },
                        { value: 'out_for_delivery', label: 'Out for Delivery', count: vendorOrders.filter(o => o.status === 'out_for_delivery').length },
                        { value: 'delivered', label: 'Delivered', count: vendorOrders.filter(o => o.status === 'delivered').length },
                        { value: 'drum_return', label: 'Container Returns', count: vendorOrders.filter(o => o.drum_status === 'not returned' || o.drum_status === 'return_requested').length },
                        { value: 'cancelled', label: 'Cancelled', count: vendorOrders.filter(o => o.status === 'cancelled').length }
                      ].map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setOrderFilter(filter.value)}
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

                  {/* Orders List */}
                  <div className="space-y-4">
                    {(() => {
                      const filteredOrders = orderFilter === 'all' 
                        ? vendorOrders 
                        : orderFilter === 'confirmed'
                        ? vendorOrders.filter(order => order.status === 'confirmed' && order.payment_status === 'unpaid')
                        : orderFilter === 'paid'
                        ? vendorOrders.filter(order => order.status === 'confirmed' && order.payment_status === 'paid')
                        : orderFilter === 'drum_return'
                        ? vendorOrders.filter(order => order.drum_status === 'not returned' || order.drum_status === 'return_requested')
                        : vendorOrders.filter(order => order.status === orderFilter);

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
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No {orderFilter === 'all' ? 'orders' : orderFilter} orders</h3>
                          <p className="text-gray-600">
                            {orderFilter === 'all' 
                              ? "Customer orders will appear here when they place them." 
                              : `No orders matching "${orderFilter.replace('_', ' ')}" filter found.`
                            }
                          </p>
                        </div>
                      ) : (
                        filteredOrders.map((order) => (
                        <div key={order.order_id} className="bg-gray-50 rounded-lg border border-gray-200">
                          {/* Condensed Order Summary */}
                          <div className="p-4">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      Order #{order.order_id}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      {order.customer_fname} {order.customer_lname} • {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      🕒 Delivery: {order.delivery_datetime ? 
                                        new Date(order.delivery_datetime).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        }) : 'Not scheduled'
                                      }
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">₱{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">
                                      Payment: {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'N/A'}
                                    </p>
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
                                  onClick={() => setExpandedOrderId(expandedOrderId === order.order_id ? null : order.order_id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                  {expandedOrderId === order.order_id ? 'Hide Details' : 'View Details'}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Order Details */}
                          {expandedOrderId === order.order_id && (
                            <div className="border-t border-gray-200 p-6 bg-white">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Customer Information */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900">Customer Information</h4>
                              <div className="bg-white rounded-lg p-4 space-y-2">
                                <p className="text-sm"><strong>Name:</strong> {order.customer_fname} {order.customer_lname || ''}</p>
                                <p className="text-sm"><strong>Contact:</strong> {order.customer_contact || 'N/A'}</p>
                                <p className="text-sm"><strong>Email:</strong> {order.customer_email || 'N/A'}</p>
                              </div>
                            </div>

                            {/* Order Details */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900">Order Details</h4>
                              <div className="bg-white rounded-lg p-4 space-y-2">
                                <p className="text-sm"><strong>Total Amount:</strong> <span className="text-green-600 font-bold">₱{parseFloat(order.total_amount || 0).toFixed(2)}</span></p>
                                <p className="text-sm"><strong>Payment Status:</strong> 
                                  <span className={`ml-1 font-medium ${
                                    order.payment_status === 'unpaid' ? 'text-yellow-600' :
                                    order.payment_status === 'paid' ? 'text-green-600' :
                                    order.payment_status === 'partial' ? 'text-orange-600' : 'text-gray-600'
                                  }`}>
                                    {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'N/A'}
                                  </span>
                                </p>
                                <p className="text-sm"><strong>Delivery Date:</strong> {order.delivery_datetime ? new Date(order.delivery_datetime).toLocaleString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                }) : 'Not scheduled'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Delivery Information */}
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">Delivery Information</h4>
                            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                              <div>
                                <span className="text-sm font-medium text-gray-700">📍 Delivery Address:</span>
                                <p className="text-gray-900 mt-1">{order.delivery_address || 'No address specified'}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-700">🕒 Scheduled Delivery:</span>
                                <p className="text-gray-900 mt-1 font-medium">
                                  {order.delivery_datetime ? 
                                    new Date(order.delivery_datetime).toLocaleString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    }) : 'No delivery time scheduled'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {order.status === 'pending' && (
                            <div className="flex space-x-4">
                              <button
                                onClick={() => {
                                  if (window.confirm(`Approve Order #${order.order_id}?\n\nCustomer: ${order.customer_fname} ${order.customer_lname}\nAmount: ₱${parseFloat(order.total_amount).toFixed(2)}\n\nThis will allow the customer to proceed with payment.`)) {
                                    updateOrderStatus(order.order_id, 'confirmed');
                                  }
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                              >
                                ✅ Approve Order
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Decline Order #${order.order_id}?\n\nCustomer: ${order.customer_fname} ${order.customer_lname}\nAmount: ₱${parseFloat(order.total_amount).toFixed(2)}\n\nThis action cannot be easily undone. The customer will be notified.`)) {
                                    updateOrderStatus(order.order_id, 'cancelled');
                                  }
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                              >
                                ❌ Decline Order
                              </button>
                            </div>
                          )}

                          {order.status === 'confirmed' && order.payment_status === 'unpaid' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <p className="text-green-800 font-medium mb-2">Order Approved!</p>
                              <p className="text-green-700 text-sm">
                                This order has been approved. Waiting for customer payment to start preparation.
                              </p>
                            </div>
                          )}

                          {order.status === 'confirmed' && order.payment_status === 'paid' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <p className="text-blue-800 font-medium mb-2">Payment Received!</p>
                              <p className="text-blue-700 text-sm mb-3">
                                Customer has paid. You can now start preparing the ice cream.
                              </p>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Start preparing ice cream for Order #${order.order_id}?\n\nThis will notify the customer that their order is being prepared.`)) {
                                    updateOrderStatus(order.order_id, 'preparing');
                                  }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                              >
                                🍦 Start Preparing Ice Cream
                              </button>
                            </div>
                          )}

                          {order.status === 'preparing' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <p className="text-blue-800 font-medium mb-2">🍦 Preparing Ice Cream</p>
                              <p className="text-blue-700 text-sm mb-3">
                                Ice cream is being prepared. Mark as ready for delivery when finished.
                              </p>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Mark Order #${order.order_id} as ready for delivery?\n\nCustomer: ${order.customer_fname} ${order.customer_lname}\nAddress: ${order.delivery_address}\n\nThis will notify the customer that their order is on the way.`)) {
                                    updateOrderStatus(order.order_id, 'out_for_delivery');
                                  }
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                              >
                                🚚 Ready for Delivery
                              </button>
                            </div>
                          )}

                          {order.status === 'out_for_delivery' && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                              <p className="text-purple-800 font-medium mb-2">🚚 Out for Delivery</p>
                              <p className="text-purple-700 text-sm mb-3">
                                Order is on the way to customer. Mark as delivered when completed.
                              </p>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Mark Order #${order.order_id} as delivered?\n\nCustomer: ${order.customer_fname} ${order.customer_lname}\nAmount: ₱${parseFloat(order.total_amount).toFixed(2)}\n\nConfirm that the order has been successfully delivered to the customer.`)) {
                                    updateOrderStatus(order.order_id, 'delivered');
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                              >
                                ✅ Mark as Delivered
                              </button>
                            </div>
                          )}

                          {order.status === 'delivered' && (
                            <div className="space-y-4">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800 font-medium mb-2">🎉 Order Completed!</p>
                                <p className="text-green-700 text-sm">
                                  This order has been successfully delivered to the customer.
                                </p>
                              </div>

                              {/* Container Return Section */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h3 className="text-blue-800 font-medium mb-1">📦 Container Return Status</h3>
                                    <p className="text-blue-700 text-sm">
                                      {order.drum_status === 'in use' && 'Container is currently in use by customer'}
                                      {order.drum_status === 'not returned' && 'Customer has requested container return - waiting for pickup'}
                                      {order.drum_status === 'returned' && 'Container has been successfully returned'}
                                      {!order.drum_status && 'Container status unknown'}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {order.drum_status === 'not returned' && (
                                      <button 
                                        onClick={() => handleDrumReturnPickup(order.order_id)}
                                        disabled={drumReturnLoading === order.order_id}
                                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                      >
                                        {drumReturnLoading === order.order_id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                                        ✅ Container Returned
                                      </span>
                                    )}
                                    {order.drum_status === 'in use' && (
                                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                                        📦 In Use
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {order.return_requested_at && (
                                  <p className="text-blue-600 text-xs">
                                    Return requested on: {new Date(order.return_requested_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {order.status === 'cancelled' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-red-800 font-medium">Order Declined</p>
                              <p className="text-red-700 text-sm">This order has been cancelled.</p>
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
                <div className="bg-white rounded-2xl p-8 mx-4 shadow-lg">
                  <div className="flex items-center space-x-4 mb-8">
                    <img 
                      src={paymentsIcon} 
                      alt="Payments" 
                      className="w-10 h-10"
                    />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Payments & Pricing
                      </h1>
                      <p className="text-gray-600">
                        Manage your drum prices and delivery zones
                      </p>
                    </div>
                  </div>

                  {/* Drum Pricing Section */}
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                          Drum Pricing
                        </h2>
                        <p className="text-sm text-gray-600">
                          Set prices for different drum sizes
                        </p>
                      </div>
                      {!isEditingPrices && (
                        <button
                          onClick={handlePricesEdit}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Edit Prices
                        </button>
                      )}
                    </div>

                    {isEditingPrices ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Small Drum Price (₱)
                            </label>
                            <input
                              type="number"
                              value={tempPrices.small}
                              onChange={(e) =>
                                handlePriceChange("small", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Medium Drum Price (₱)
                            </label>
                            <input
                              type="number"
                              value={tempPrices.medium}
                              onChange={(e) =>
                                handlePriceChange("medium", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Large Drum Price (₱)
                            </label>
                            <input
                              type="number"
                              value={tempPrices.large}
                              onChange={(e) =>
                                handlePriceChange("large", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={handlePricesSave}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Save Prices
                          </button>
                          <button
                            onClick={handlePricesCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            ₱{drumPrices.small}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            Small Drum
                          </div>
                          <div className="text-xs text-gray-500">
                            {drumCapacity.small} gallons
                          </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            ₱{drumPrices.medium}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            Medium Drum
                          </div>
                          <div className="text-xs text-gray-500">
                            {drumCapacity.medium} gallons
                          </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-blue-300">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            ₱{drumPrices.large}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 mb-1">
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
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                          Delivery Zones & Pricing
                        </h2>
                        <p className="text-sm text-gray-600">
                          Set delivery prices for different cities and provinces
                        </p>
                      </div>
                      {!isEditingDelivery && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowAddZoneForm(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Add Zone
                          </button>
                          <button
                            onClick={handleDeliveryEdit}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Edit Zones
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Add New Zone Form */}
                    {showAddZoneForm && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Delivery Zone</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City
                            </label>
                            <input
                              type="text"
                              value={newDeliveryZone.city}
                              onChange={(e) => setNewDeliveryZone({...newDeliveryZone, city: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., Makati City"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Province
                            </label>
                            <input
                              type="text"
                              value={newDeliveryZone.province}
                              onChange={(e) => setNewDeliveryZone({...newDeliveryZone, province: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., Metro Manila"
                            />
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
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Add Zone
                          </button>
                          <button
                            onClick={() => {
                              setShowAddZoneForm(false);
                              setNewDeliveryZone({ city: '', province: '', delivery_price: 0 });
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delivery Zones List */}
                    {isEditingDelivery ? (
                      <div className="space-y-4">
                        {tempDeliveryZones.map((zone, index) => (
                          <div key={zone.delivery_pricing_id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  City
                                </label>
                                <input
                                  type="text"
                                  value={zone.city}
                                  onChange={(e) => handleDeliveryZoneChange(index, 'city', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Province
                                </label>
                                <input
                                  type="text"
                                  value={zone.province}
                                  onChange={(e) => handleDeliveryZoneChange(index, 'province', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Delivery Price (₱)
                                </label>
                                <input
                                  type="number"
                                  value={zone.delivery_price}
                                  onChange={(e) => handleDeliveryZoneChange(index, 'delivery_price', parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex space-x-3">
                          <button
                            onClick={handleDeliverySave}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleDeliveryCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {deliveryZones.length > 0 ? (
                          deliveryZones.map((zone) => (
                            <div key={zone.delivery_pricing_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-4">
                                    <div>
                                      <h3 className="font-semibold text-gray-800">
                                        {zone.city}, {zone.province}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        Delivery Price: ₱{parseFloat(zone.delivery_price).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveDeliveryZone(zone.delivery_pricing_id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>No delivery zones configured yet.</p>
                            <p className="text-sm">Add your first delivery zone to get started.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeView === "notifications" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50">
                <div className="bg-white rounded-2xl p-8 mx-4 shadow-lg">
                  <div className="flex items-center space-x-4 mb-8">
                    <img 
                      src={bellNotificationIcon} 
                      alt="Notifications" 
                      className="w-10 h-10"
                    />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Notifications
                      </h1>
                      <p className="text-gray-600">
                        Stay updated with your store activities and customer interactions
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">New Order Received</h3>
                          <p className="text-sm text-gray-600">You have a new order for Mango Flavor - Large size</p>
                          <p className="text-xs text-gray-500">2 minutes ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Order Delivered</h3>
                          <p className="text-sm text-gray-600">Order #12345 has been successfully delivered</p>
                          <p className="text-xs text-gray-500">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Low Stock Alert</h3>
                          <p className="text-sm text-gray-600">Vanilla Flavor is running low on stock</p>
                          <p className="text-xs text-gray-500">3 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === "feedback" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50">
                <div className="bg-white rounded-2xl p-8 mx-4 shadow-lg">
                  <div className="flex items-center space-x-4 mb-8">
                    <img 
                      src={feedbackIcon} 
                      alt="Feedback" 
                      className="w-10 h-10"
                    />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Customer Feedback
                      </h1>
                      <p className="text-gray-600">
                        View and manage customer reviews and feedback
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">JD</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">John Doe</h3>
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">★★★★★</span>
                            <span className="text-sm text-gray-600">5.0</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">
                        "Amazing ice cream! The Mango Flavor is absolutely delicious. Will definitely order again!"
                      </p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">SM</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Sarah Miller</h3>
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">★★★★☆</span>
                            <span className="text-sm text-gray-600">4.0</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">
                        "Great quality ice cream, but delivery was a bit late. Overall satisfied with the product."
                      </p>
                      <p className="text-xs text-gray-500">1 week ago</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold">MJ</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Mike Johnson</h3>
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">★★★★★</span>
                            <span className="text-sm text-gray-600">5.0</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">
                        "Best ice cream in town! The variety of flavors is impressive. Highly recommended!"
                      </p>
                      <p className="text-xs text-gray-500">2 weeks ago</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-semibold">AL</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Anna Lee</h3>
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">★★★☆☆</span>
                            <span className="text-sm text-gray-600">3.0</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">
                        "Good ice cream but could be creamier. The packaging was excellent though."
                      </p>
                      <p className="text-xs text-gray-500">3 weeks ago</p>
                    </div>
                  </div>
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
                  src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${selectedFlavorImages[currentImageIndex]}`}
                  alt={`${selectedFlavorName} - Image ${currentImageIndex + 1}`}
                  className="w-full h-96 object-contain mx-auto"
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
                        src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrl}`}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Flavor
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete "{flavorToDelete?.flavor_name}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteFlavor}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteFlavor}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Vendor;
