import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart context for managing cart state across the application
const CartContext = createContext();

// Cart action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
  SET_LOADING: 'SET_LOADING'
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
      
    default:
      return state;
  }
};

// Initial cart state
const initialState = {
  items: [],
  loading: false
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    console.log('🛒 CartContext: Loading cart from localStorage...');
    const savedCart = localStorage.getItem('chillnet_cart');
    console.log('🛒 CartContext: Saved cart data:', savedCart);
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        console.log('🛒 CartContext: Parsed cart data:', cartData);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    } else {
      console.log('🛒 CartContext: No saved cart found');
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    console.log('🛒 CartContext: Saving cart to localStorage:', state.items);
    localStorage.setItem('chillnet_cart', JSON.stringify(state.items));
  }, [state.items]);

  // Cart actions
  const addToCart = (item) => {
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
  };

  const removeFromCart = (flavorId, size) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { flavor_id: flavorId, size } });
  };

  const updateQuantity = (flavorId, size, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { flavor_id: flavorId, size, quantity } });
  };

  const clearCart = () => {
    console.log('🛒 CartContext: clearCart called - clearing cart');
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
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
    setLoading
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

