const express = require('express');
const router = express.Router();
const {
    getUserCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    syncCart
} = require('../../controller/shared/cartController');

// Get user's cart items
router.get('/user/:userId', getUserCart);

// Add item to cart
router.post('/user/:userId/add', addToCart);

// Update cart item quantity
router.put('/user/:userId/item/:cartItemId', updateCartItem);

// Remove item from cart
router.delete('/user/:userId/item/:cartItemId', removeFromCart);

// Clear entire cart
router.delete('/user/:userId/clear', clearCart);

// Sync cart from localStorage to database
router.post('/user/:userId/sync', syncCart);

module.exports = router;
