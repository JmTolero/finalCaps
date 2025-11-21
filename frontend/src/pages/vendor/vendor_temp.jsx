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
import storeIcon from "../../assets/images/vendordashboardicon/inventoryProductVendorIcon.png"; // Using inventory icon as store icon

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
    const userRaw =
      typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
    return !userRaw; // Only show loading if no user in sessionStorage
  });

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
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeLoading, setStoreLoading] = useState(false);

  // Drum management state
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

  // Drum flavors state
  const [drumFlavors, setDrumFlavors] = useState({
    small: "",
    medium: "",
    large: "",
  });
  const [isEditingFlavors, setIsEditingFlavors] = useState(false);
  const [tempFlavors, setTempFlavors] = useState({
    small: "",
    medium: "",
    large: "",
  });
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

  // Flavor form state
  const [flavorForm, setFlavorForm] = useState({
    name: "",
    description: "",
    drumSize: "small",
    drumsUsed: "",
  });
  const [flavorImages, setFlavorImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

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
          `${apiBase}/api/user/${userIdToUse}/addresses`
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
      const userRaw = sessionStorage.getItem("user");
      if (!userRaw) {
        throw new Error("No user session found");
      }
      const user = JSON.parse(userRaw);

      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      console.log(
        "Fetching vendor data from:",
        `${apiBase}/api/vendor/current`,
        "for user:",
        user.id
      );
      const response = await axios.get(`${apiBase}/api/vendor/current`, {
        headers: {
          "x-user-id": user.id,
        },
      });

      if (response.data.success && response.data.vendor) {
        console.log("Vendor data received:", response.data.vendor);
        setCurrentVendor(response.data.vendor);
        setVendorData({
          fname: response.data.vendor.fname || "",
          email: response.data.vendor.email || "",
          store_name: response.data.vendor.store_name || "",
          contact_no: response.data.vendor.contact_no || "",
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
        console.error("API returned unsuccessful response:", response.data);
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

  const fetchStoreProducts = useCallback(async () => {
    try {
      setStoreLoading(true);

      if (!currentVendor?.vendor_id) {
        console.log("No vendor ID available yet");
        return;
      }

      // TODO: Implement real API call to fetch vendor products
      // For now, set empty array to show no products
      setStoreProducts([]);
    } catch (error) {
      console.error("Error fetching store products:", error);
      setStoreProducts([]);
    } finally {
      setStoreLoading(false);
    }
  }, [currentVendor?.vendor_id]);

  const handleDrumsEdit = () => {
    setIsEditingDrums(true);
    setTempDrums({ ...availableDrums });
  };

  const handleDrumsSave = () => {
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
  };

  const handleDrumsCancel = () => {
    setTempDrums({ ...availableDrums });
    setIsEditingDrums(false);
  };

  const handleCapacityEdit = () => {
    setIsEditingCapacity(true);
    setTempCapacity({ ...drumCapacity });
  };

  const handleCapacitySave = () => {
    setDrumCapacity({ ...tempCapacity });
    setIsEditingCapacity(false);
    updateStatus(
      "success",
      `Drum capacity updated: Small ${tempCapacity.small} gal, Medium ${tempCapacity.medium} gal, Large ${tempCapacity.large} gal`
    );
  };

  const handleCapacityCancel = () => {
    setTempCapacity({ ...drumCapacity });
    setIsEditingCapacity(false);
  };

  const handleFlavorsEdit = () => {
    setIsEditingFlavors(true);
    setTempFlavors({ ...drumFlavors });
  };

  const handleFlavorsSave = () => {
    setDrumFlavors({ ...tempFlavors });
    setIsEditingFlavors(false);
    updateStatus(
      "success",
      `Drum flavors updated: Small ${tempFlavors.small || "None"}, Medium ${
        tempFlavors.medium || "None"
      }, Large ${tempFlavors.large || "None"}`
    );
  };

  const handleFlavorsCancel = () => {
    setTempFlavors({ ...drumFlavors });
    setIsEditingFlavors(false);
  };

  const handleFlavorChange = (size, value) => {
    setTempFlavors((prev) => ({
      ...prev,
      [size]: value,
    }));
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

  const handlePricesSave = () => {
    setDrumPrices({ ...tempPrices });
    setIsEditingPrices(false);
    updateStatus(
      "success",
      `Drum prices updated: Small ₱${tempPrices.small}, Medium ₱${tempPrices.medium}, Large ₱${tempPrices.large}`
    );
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

  const handleSaveFlavor = () => {
    if (!flavorForm.name.trim()) {
      updateStatus("error", "Please enter a flavor name");
      return;
    }

    if (flavorImages.length === 0) {
      updateStatus("error", "Please upload at least one image");
      return;
    }

    // Here you would typically save to backend
    updateStatus(
      "success",
      `Flavor "${flavorForm.name}" saved with ${flavorImages.length} image(s)!`
    );

    // Reset form
    setFlavorForm({
      name: "",
      description: "",
      drumSize: "small",
      drumsUsed: "",
    });
    setFlavorImages([]);
    setImagePreviews([]);
  };

  // Fetch vendor data when component mounts or when settings view is active
  useEffect(() => {
    const userRaw =
      typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
    if (userRaw) {
      const user = JSON.parse(userRaw);
      // Only fetch vendor data if user is actually a vendor
      if (
        user.role === "vendor" &&
        (!currentVendor || activeView === "settings")
      ) {
        fetchCurrentVendor();
      }
    }
  }, [activeView, fetchCurrentVendor, currentVendor]);

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
    if (
      activeView === "dashboard" &&
      currentVendor?.vendor_id &&
      !isInitialLoading
    ) {
      fetchDashboardData(currentVendor.vendor_id);
    }
  }, [activeView, currentVendor?.vendor_id, isInitialLoading]);

  // Fetch store products when my-store view is active and vendor is loaded
  useEffect(() => {
    if (
      activeView === "my-store" &&
      currentVendor?.vendor_id &&
      !isInitialLoading
    ) {
      fetchStoreProducts();
    }
  }, [
    activeView,
    currentVendor?.vendor_id,
    fetchStoreProducts,
    isInitialLoading,
  ]);

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
          `${apiBase}/api/address/${editingAddress.address_id}`,
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
          `${apiBase}/api/user/${currentVendor.user_id}/address`,
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
      await axios.delete(`${apiBase}/api/address/${addressId}`);
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
        formData.append("proof_image", newProfileImage);
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
          setNewProfileImage(null);
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
        <header className="w-full bg-sky-100 flex items-center justify-between px-8 py-4 fixed top-0 left-0 z-20 shadow-md">
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
          <div className="relative" ref={profileDropdownRef}>
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
              <div className="absolute right-0 mt-2 w-80 sm:w-72 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
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
                        <span className="font-medium text-sm">
                          {item.label}
                        </span>
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
          <div
            className={`flex-1 transition-all duration-300 ${
              isSidebarOpen ? "ml-64" : "ml-20"
            }`}
          >
            <div className="p-8 pt-28">
              <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Vendor Settings
                      </h1>
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
      <header className="w-full bg-sky-100 flex items-center justify-between px-8 py-4 fixed top-0 left-0 z-20 shadow-md">
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
        <div className="relative" ref={profileDropdownRef}>
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
            <div className="absolute right-0 mt-2 w-80 sm:w-72 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
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
        <div
          className={`flex-1 p-8 pt-28 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
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
                      {dashboardLoading ? (
                        <div className="text-center py-8">
                          <div className="w-full h-16 bg-blue-50 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-500">
                              Loading...
                            </span>
                          </div>
                        </div>
                      ) : dashboardData.upcoming_deliveries.length > 0 ? (
                        dashboardData.upcoming_deliveries.map((delivery) => (
                          <div
                            key={delivery.order_id}
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {delivery.customer_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {delivery.delivery_address}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    delivery.delivery_datetime
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    delivery.delivery_datetime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-green-600">
                                  ₱{delivery.total_amount}
                                </p>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    delivery.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : delivery.status === "confirmed"
                                      ? "bg-blue-100 text-blue-800"
                                      : delivery.status === "preparing"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {delivery.status
                                    .replace("_", " ")
                                    .toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-full h-16 bg-blue-50 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-500">
                              No upcoming deliveries
                            </span>
                          </div>
                        </div>
                      )}
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
                  <div className="bg-sky-100 border border-sky-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sky-800 font-bold text-lg">
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
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            {availableDrums.small}
                          </div>
                          <div className="text-sm font-semibold text-gray-800">
                            Small Drums
                          </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            {availableDrums.medium}
                          </div>
                          <div className="text-sm font-semibold text-gray-800">
                            Medium Drums
                          </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
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
                  <div className="bg-sky-100 border border-sky-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sky-800 font-bold text-lg">
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
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
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
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
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
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
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
                  </div>

                  {/* Drum Flavors Section */}
                  <div className="bg-sky-100 border border-sky-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sky-800 font-bold text-lg">
                        Drum Flavors
                      </div>
                      {!isEditingFlavors && (
                        <button
                          onClick={handleFlavorsEdit}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Edit Flavors
                        </button>
                      )}
                    </div>

                    {isEditingFlavors ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Small Drum Flavor
                            </label>
                            <select
                              value={tempFlavors.small}
                              onChange={(e) =>
                                handleFlavorChange("small", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select flavor</option>
                              <option value="vanilla">Vanilla</option>
                              <option value="chocolate">Chocolate</option>
                              <option value="strawberry">Strawberry</option>
                              <option value="mint">Mint</option>
                              <option value="cookies-cream">
                                Cookies & Cream
                              </option>
                              <option value="rocky-road">Rocky Road</option>
                              <option value="pistachio">Pistachio</option>
                              <option value="caramel">Caramel</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Medium Drum Flavor
                            </label>
                            <select
                              value={tempFlavors.medium}
                              onChange={(e) =>
                                handleFlavorChange("medium", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select flavor</option>
                              <option value="vanilla">Vanilla</option>
                              <option value="chocolate">Chocolate</option>
                              <option value="strawberry">Strawberry</option>
                              <option value="mint">Mint</option>
                              <option value="cookies-cream">
                                Cookies & Cream
                              </option>
                              <option value="rocky-road">Rocky Road</option>
                              <option value="pistachio">Pistachio</option>
                              <option value="caramel">Caramel</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Large Drum Flavor
                            </label>
                            <select
                              value={tempFlavors.large}
                              onChange={(e) =>
                                handleFlavorChange("large", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select flavor</option>
                              <option value="vanilla">Vanilla</option>
                              <option value="chocolate">Chocolate</option>
                              <option value="strawberry">Strawberry</option>
                              <option value="mint">Mint</option>
                              <option value="cookies-cream">
                                Cookies & Cream
                              </option>
                              <option value="rocky-road">Rocky Road</option>
                              <option value="pistachio">Pistachio</option>
                              <option value="caramel">Caramel</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleFlavorsCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleFlavorsSave}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                          >
                            Save Flavors
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
                          <div className="text-lg font-bold text-orange-600 mb-1">
                            {drumFlavors.small || "None"}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            Small Drum
                          </div>
                          <div className="text-xs text-orange-600 font-medium">
                            flavor
                          </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
                          <div className="text-lg font-bold text-orange-600 mb-1">
                            {drumFlavors.medium || "None"}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            Medium Drum
                          </div>
                          <div className="text-xs text-orange-600 font-medium">
                            flavor
                          </div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
                          <div className="text-lg font-bold text-orange-600 mb-1">
                            {drumFlavors.large || "None"}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            Large Drum
                          </div>
                          <div className="text-xs text-orange-600 font-medium">
                            flavor
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

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
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
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
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
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
                        <div className="text-center bg-white rounded-lg p-4 shadow-md border border-sky-300">
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
            )}

            {activeView === "my-store" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50">
                {/* Store Header */}
                <div className="bg-blue-200 rounded-2xl p-8 mb-8 mx-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        My Store
                      </h1>
                      <p className="text-gray-600">
                        Manage your ice cream products and inventory
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setActiveView("inventory")}
                        className="bg-orange-300 hover:bg-orange-400 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-colors duration-200 shadow-lg"
                      >
                        Add Product
                      </button>
                    </div>
                  </div>
                </div>

                {/* Store Content */}
                <div className="px-4 pb-8">
                  {storeLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : storeProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {storeProducts.map((product, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                        >
                          <div className="h-48 bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center">
                            <div className="text-6xl">🍦</div>
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {product.name}
                            </h3>
                            <p className="text-gray-600 mb-4">
                              {product.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-green-600">
                                ₱{product.price}
                              </span>
                              <span className="text-sm text-gray-500">
                                {product.stock} in stock
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="bg-blue-200 rounded-2xl p-12 max-w-md mx-auto">
                        <div className="text-6xl mb-4">🍦</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          No Products Yet
                        </h3>
                        <p className="text-gray-700 mb-6">
                          Start by adding your first ice cream product to your
                          store!
                        </p>
                        <button
                          onClick={() => setActiveView("inventory")}
                          className="bg-orange-300 hover:bg-orange-400 text-gray-900 font-semibold px-8 py-3 rounded-xl transition-colors duration-200 shadow-lg"
                        >
                          Add Product
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeView === "addCustomerOrders" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">
                      Add Customer Order
                    </h1>

                    <div className="space-y-6">
                      {/* Customer Information */}
                      <div className="bg-blue-50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                          Customer Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Customer Name *
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter customer name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter phone number"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="bg-orange-50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                          Order Details
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Flavor *
                            </label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                              <option value="">Select a flavor</option>
                              <option value="vanilla">Vanilla</option>
                              <option value="chocolate">Chocolate</option>
                              <option value="strawberry">Strawberry</option>
                              <option value="mint">Mint</option>
                              <option value="cookies-cream">
                                Cookies & Cream
                              </option>
                              <option value="rocky-road">Rocky Road</option>
                              <option value="pistachio">Pistachio</option>
                              <option value="caramel">Caramel</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Drum Size *
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Select drum size</option>
                                <option value="small">Small (3 gallons)</option>
                                <option value="medium">
                                  Medium (5 gallons)
                                </option>
                                <option value="large">Large (8 gallons)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity *
                              </label>
                              <input
                                type="number"
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter quantity"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Special Instructions
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Any special instructions for this order..."
                            ></textarea>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Information */}
                      <div className="bg-green-50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                          Delivery Information
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Delivery Address *
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter complete delivery address"
                            ></textarea>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Date *
                              </label>
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Time *
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Select time</option>
                                <option value="09:00">9:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="11:00">11:00 AM</option>
                                <option value="12:00">12:00 PM</option>
                                <option value="13:00">1:00 PM</option>
                                <option value="14:00">2:00 PM</option>
                                <option value="15:00">3:00 PM</option>
                                <option value="16:00">4:00 PM</option>
                                <option value="17:00">5:00 PM</option>
                                <option value="18:00">6:00 PM</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                          Order Summary
                        </h2>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold">₱0.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Fee:</span>
                            <span className="font-semibold">₱50.00</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total:</span>
                              <span>₱50.00</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-4">
                        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                          Cancel
                        </button>
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                          Create Order
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === "payments" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 p-6">
                <div className="max-w-6xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Payments & Transactions
                  </h1>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Payment Summary Cards */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">
                            Total Earnings
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            ₱12,450
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">💰</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">This Month</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ₱3,200
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📈</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Pending</p>
                          <p className="text-2xl font-bold text-orange-600">
                            ₱850
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">⏳</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="mt-8 bg-white rounded-xl shadow-lg">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Recent Transactions
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {[
                          {
                            id: "TXN001",
                            customer: "John Doe",
                            amount: "₱450",
                            status: "Completed",
                            date: "2024-01-15",
                          },
                          {
                            id: "TXN002",
                            customer: "Jane Smith",
                            amount: "₱320",
                            status: "Pending",
                            date: "2024-01-14",
                          },
                          {
                            id: "TXN003",
                            customer: "Mike Johnson",
                            amount: "₱680",
                            status: "Completed",
                            date: "2024-01-13",
                          },
                        ].map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-blue-600">
                                  {transaction.id.slice(-2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {transaction.customer}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {transaction.date}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {transaction.amount}
                              </p>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  transaction.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {transaction.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === "analytics" && (
              <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 p-6">
                <div className="max-w-6xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Analytics & Reports
                  </h1>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Sales Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Sales Overview
                      </h2>
                      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">
                          Chart will be implemented here
                        </p>
                      </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Top Products
                      </h2>
                      <div className="space-y-3">
                        {[
                          { name: "Vanilla", sales: 45, revenue: "₱2,250" },
                          { name: "Chocolate", sales: 38, revenue: "₱1,900" },
                          { name: "Strawberry", sales: 32, revenue: "₱1,600" },
                        ].map((product, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-blue-600">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {product.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {product.sales} sales
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-green-600">
                              {product.revenue}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Customer Analytics */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Customer Analytics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">156</p>
                        <p className="text-gray-600">Total Customers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">89%</p>
                        <p className="text-gray-600">Retention Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-orange-600">
                          4.8
                        </p>
                        <p className="text-gray-600">Average Rating</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}  
          </div>
        </div>
      </div>
    </>
  );
};

export default Vendor;
