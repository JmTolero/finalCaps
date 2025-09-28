import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import axios from 'axios';

// Cart context for managing cart state across the application
const CartContext = createContext();

// Cart action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
  SET_LOADING: 'SET_LOADING',
  SYNC_CART: 'SYNC_CART',
  SET_SYNCING: 'SET_SYNCING'
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM:
      const existingItem = state.items.find(
        item => item.flavor_id === action.payload.flavor_id && 
                item.size === action.payload.size
      );
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.flavor_id === action.payload.flavor_id && item.size === action.payload.size
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      } else {
        return {
          ...state,
          items: [...state.items, action.payload]
        };
      }
      
    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => 
          !(item.flavor_id === action.payload.flavor_id && item.size === action.payload.size)
        )
      };
      
    case CART_ACTIONS.UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item =>
          item.flavor_id === action.payload.flavor_id && item.size === action.payload.size
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };
      
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: []
      };
      
    case CART_ACTIONS.LOAD_CART:
      return {
        ...state,
        items: action.payload || []
      };
      
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case CART_ACTIONS.SYNC_CART:
      return {
        ...state,
        items: action.payload || [],
        refreshKey: state.refreshKey + 1 // Increment refresh key to force re-render
      };
      
    case CART_ACTIONS.SET_SYNCING:
      return {
        ...state,
        syncing: action.payload
      };
      
    default:
      return state;
  }
};

// Initial cart state
const initialState = {
  items: [],
  loading: false,
  syncing: false,
  refreshKey: 0 // Add refresh key to force re-renders
};

// Helper function to get current user
const getCurrentUser = () => {
  try {
    const userRaw = sessionStorage.getItem('user');
    return userRaw ? JSON.parse(userRaw) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function to get API base URL
const getApiBase = () => {
  return process.env.REACT_APP_API_URL || "http://localhost:3001";
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const hasLoadedCart = useRef(false);
  const isLoadingCart = useRef(false);

  // Load cart from database on mount
  const loadCartFromDatabase = async () => {
    const user = getCurrentUser();
    if (!user || !user.id) {
      console.log('🛒 CartContext: No user logged in, skipping database cart load');
      return;
    }

    // Prevent multiple simultaneous loads
    if (isLoadingCart.current) {
      console.log('🛒 CartContext: Already loading cart, skipping duplicate request');
      return;
    }

    try {
      console.log('🛒 CartContext: Loading cart from database for user:', user.id);
      isLoadingCart.current = true;
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      const apiBase = getApiBase();
      const response = await axios.get(`${apiBase}/api/cart/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const cartItems = response.data.cartItems.map(item => ({
          flavor_id: item.flavor_id,
          size: item.size,
          quantity: item.quantity,
          price: parseFloat(item.price),
          flavor_name: item.flavor_name,
          vendor_name: item.vendor_name,
          vendor_id: item.vendor_id,
          cart_item_id: item.cart_item_id
        }));
        
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartItems });
        hasLoadedCart.current = true;
        console.log('🛒 CartContext: Cart loaded from database with', cartItems.length, 'items');
        
        // Also save to localStorage as backup
        localStorage.setItem('chillnet_cart', JSON.stringify(cartItems));
      }
    } catch (error) {
      console.error('🛒 CartContext: Error loading cart from database:', error);
      
      // Fallback to localStorage if database fails
      console.log('🛒 CartContext: Falling back to localStorage...');
      const savedCart = localStorage.getItem('chillnet_cart');
      if (savedCart && savedCart !== 'null' && savedCart !== 'undefined') {
        try {
          const cartData = JSON.parse(savedCart);
          if (Array.isArray(cartData)) {
            dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
            console.log('🛒 CartContext: Cart loaded from localStorage backup with', cartData.length, 'items');
          }
        } catch (parseError) {
          console.error('🛒 CartContext: Error parsing localStorage cart:', parseError);
          localStorage.removeItem('chillnet_cart');
        }
      }
    } finally {
      isLoadingCart.current = false;
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Load cart from database on mount and when user session changes
  useEffect(() => {
    // Add a small delay to ensure user session is fully loaded
    const timer = setTimeout(() => {
      loadCartFromDatabase();
    }, 100);

    // Listen for user session changes
    const handleUserChange = () => {
      console.log('🛒 CartContext: User session changed, reloading cart...');
      hasLoadedCart.current = false; // Reset loaded flag for new user
      // Add a small delay to ensure session is fully updated
      setTimeout(() => {
        loadCartFromDatabase();
      }, 50);
    };

    // Listen for custom user change events
    window.addEventListener('userChanged', handleUserChange);

    // Listen for page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const user = getCurrentUser();
        if (user && user.id && state.items.length === 0 && !state.loading && !state.syncing) {
          console.log('🛒 CartContext: Page became visible - reloading cart...');
          loadCartFromDatabase();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for window focus (when user comes back to the tab)
    const handleFocus = () => {
      const user = getCurrentUser();
      if (user && user.id && state.items.length === 0 && !state.loading && !state.syncing) {
        console.log('🛒 CartContext: Window focused - reloading cart...');
        loadCartFromDatabase();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('userChanged', handleUserChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Empty dependency array - only run on mount

  // Separate effect for periodic cart check (only when cart is empty and not loaded yet)
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !user.id || state.items.length > 0 || state.loading || state.syncing || hasLoadedCart.current || isLoadingCart.current) {
      return; // Don't run if user not logged in, cart has items, already loaded, or already loading/syncing
    }

    // Only run periodic check if cart is empty and not loaded yet
    const interval = setInterval(() => {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id && state.items.length === 0 && !state.loading && !state.syncing && !hasLoadedCart.current && !isLoadingCart.current) {
        console.log('🛒 CartContext: Periodic check - reloading cart...');
        loadCartFromDatabase();
      }
    }, 15000); // Check every 15 seconds

    return () => {
      clearInterval(interval);
    };
  }, [state.items.length, state.loading, state.syncing]); // Only re-run when these specific values change

  // Save cart to localStorage whenever items change
  useEffect(() => {
    console.log('🛒 CartContext: Saving cart to localStorage:', state.items);
    try {
      const cartData = JSON.stringify(state.items);
      localStorage.setItem('chillnet_cart', cartData);
      console.log('🛒 CartContext: Cart saved successfully with', state.items.length, 'items');
    } catch (error) {
      console.error('🛒 CartContext: Error saving cart to localStorage:', error);
      // Handle quota exceeded or other storage errors
      if (error.name === 'QuotaExceededError') {
        console.warn('🛒 CartContext: localStorage quota exceeded, cart may not persist');
      }
    }
  }, [state.items]);

  // Cart actions
  const addToCart = async (item) => {
    const user = getCurrentUser();
    if (!user || !user.id) {
      console.log('🛒 CartContext: No user logged in, adding to local cart only');
      dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
      return;
    }

    try {
      console.log('🛒 CartContext: Adding item to database cart:', item);
      dispatch({ type: CART_ACTIONS.SET_SYNCING, payload: true });
      
      const apiBase = getApiBase();
      const response = await axios.post(`${apiBase}/api/cart/user/${user.id}/add`, item, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const cartItems = response.data.cartItems.map(dbItem => ({
          flavor_id: dbItem.flavor_id,
          size: dbItem.size,
          quantity: dbItem.quantity,
          price: parseFloat(dbItem.price),
          flavor_name: dbItem.flavor_name,
          vendor_name: dbItem.vendor_name,
          vendor_id: dbItem.vendor_id,
          cart_item_id: dbItem.cart_item_id
        }));
        
        dispatch({ type: CART_ACTIONS.SYNC_CART, payload: cartItems });
        console.log('🛒 CartContext: Item added to database cart successfully');
      }
    } catch (error) {
      console.error('🛒 CartContext: Error adding to database cart:', error);
      // Fallback to local state update
      dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
    } finally {
      dispatch({ type: CART_ACTIONS.SET_SYNCING, payload: false });
    }
  };

  const removeFromCart = async (flavorId, size) => {
    const user = getCurrentUser();
    if (!user || !user.id) {
      console.log('🛒 CartContext: No user logged in, removing from local cart only');
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { flavor_id: flavorId, size } });
      return;
    }

    // Find the cart item to get cart_item_id
    const cartItem = state.items.find(item => 
      item.flavor_id === flavorId && item.size === size
    );

    if (!cartItem || !cartItem.cart_item_id) {
      console.log('🛒 CartContext: Cart item not found or no database ID, removing from local cart only');
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { flavor_id: flavorId, size } });
      return;
    }

    try {
      console.log('🛒 CartContext: Removing item from database cart:', cartItem.cart_item_id);
      dispatch({ type: CART_ACTIONS.SET_SYNCING, payload: true });
      
      const apiBase = getApiBase();
      const response = await axios.delete(`${apiBase}/api/cart/user/${user.id}/item/${cartItem.cart_item_id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const cartItems = response.data.cartItems.map(dbItem => ({
          flavor_id: dbItem.flavor_id,
          size: dbItem.size,
          quantity: dbItem.quantity,
          price: parseFloat(dbItem.price),
          flavor_name: dbItem.flavor_name,
          vendor_name: dbItem.vendor_name,
          vendor_id: dbItem.vendor_id,
          cart_item_id: dbItem.cart_item_id
        }));
        
        dispatch({ type: CART_ACTIONS.SYNC_CART, payload: cartItems });
        console.log('🛒 CartContext: Item removed from database cart successfully');
      }
    } catch (error) {
      console.error('🛒 CartContext: Error removing from database cart:', error);
      // Fallback to local state update
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { flavor_id: flavorId, size } });
    } finally {
      dispatch({ type: CART_ACTIONS.SET_SYNCING, payload: false });
    }
  };

  const updateQuantity = async (flavorId, size, quantity) => {
    const user = getCurrentUser();
    if (!user || !user.id) {
      console.log('🛒 CartContext: No user logged in, updating local cart only');
      dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { flavor_id: flavorId, size, quantity } });
      return;
    }

    // Find the cart item to get cart_item_id
    const cartItem = state.items.find(item => 
      item.flavor_id === flavorId && item.size === size
    );

    if (!cartItem || !cartItem.cart_item_id) {
      console.log('🛒 CartContext: Cart item not found or no database ID, updating local cart only');
      dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { flavor_id: flavorId, size, quantity } });
      return;
    }

    try {
      console.log('🛒 CartContext: Updating quantity in database cart:', { cartItemId: cartItem.cart_item_id, quantity });
      dispatch({ type: CART_ACTIONS.SET_SYNCING, payload: true });
      
      const apiBase = getApiBase();
      const response = await axios.put(`${apiBase}/api/cart/user/${user.id}/item/${cartItem.cart_item_id}`, 
        { quantity }, 
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const cartItems = response.data.cartItems.map(dbItem => ({
          flavor_id: dbItem.flavor_id,
          size: dbItem.size,
          quantity: dbItem.quantity,
          price: parseFloat(dbItem.price),
          flavor_name: dbItem.flavor_name,
          vendor_name: dbItem.vendor_name,
          vendor_id: dbItem.vendor_id,
          cart_item_id: dbItem.cart_item_id
        }));
        
        dispatch({ type: CART_ACTIONS.SYNC_CART, payload: cartItems });
        console.log('🛒 CartContext: Quantity updated in database cart successfully');
      }
    } catch (error) {
      console.error('🛒 CartContext: Error updating quantity in database cart:', error);
      // Fallback to local state update
      dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { flavor_id: flavorId, size, quantity } });
    } finally {
      dispatch({ type: CART_ACTIONS.SET_SYNCING, payload: false });
    }
  };

  const clearCart = async () => {
    console.log('🛒 CartContext: clearCart called - clearing cart');
    
    const user = getCurrentUser();
    if (!user || !user.id) {
      console.log('🛒 CartContext: No user logged in, clearing local cart only');
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
      return;
    }

    try {
      console.log('🛒 CartContext: Clearing database cart for user:', user.id);
      dispatch({ type: CART_ACTIONS.SET_SYNCING, payload: true });
      
      const apiBase = getApiBase();
      const response = await axios.delete(`${apiBase}/api/cart/user/${user.id}/clear`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
        console.log('🛒 CartContext: Database cart cleared successfully');
      }
    } catch (error) {
      console.error('🛒 CartContext: Error clearing database cart:', error);
      // Fallback to local state update
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
    } finally {
      dispatch({ type: CART_ACTIONS.SET_SYNCING, payload: false });
    }
  };

  // Sync local cart to database
  const syncCartToDatabase = async () => {
    const user = getCurrentUser();
    if (!user || !user.id) {
      console.log('🛒 CartContext: No user logged in, cannot sync to database');
      return;
    }

    try {
      console.log('🛒 CartContext: Syncing local cart to database:', state.items);
      dispatch({ type: CART_ACTIONS.SET_SYNCING, payload: true });
      
      const apiBase = getApiBase();
      const response = await axios.post(`${apiBase}/api/cart/user/${user.id}/sync`, 
        { cartItems: state.items }, 
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const cartItems = response.data.cartItems.map(dbItem => ({
          flavor_id: dbItem.flavor_id,
          size: dbItem.size,
          quantity: dbItem.quantity,
          price: parseFloat(dbItem.price),
          flavor_name: dbItem.flavor_name,
          vendor_name: dbItem.vendor_name,
          vendor_id: dbItem.vendor_id,
          cart_item_id: dbItem.cart_item_id
        }));
        
        dispatch({ type: CART_ACTIONS.SYNC_CART, payload: cartItems });
        console.log('🛒 CartContext: Cart synced to database successfully');
      }
    } catch (error) {
      console.error('🛒 CartContext: Error syncing cart to database:', error);
    } finally {
      dispatch({ type: CART_ACTIONS.SET_SYNCING, payload: false });
    }
  };


  const setLoading = (loading) => {
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: loading });
  };

  // Computed values
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value = {
    ...state,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setLoading,
    syncCartToDatabase,
    loadCartFromDatabase
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;

