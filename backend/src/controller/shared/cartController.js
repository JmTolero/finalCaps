const pool = require('../../db/config');

// Get user's cart items
const getUserCart = async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log('🛒 Getting cart for user:', userId);
        
        // Get cart items with flavor details
        const [cartItems] = await pool.query(`
            SELECT 
                ci.cart_item_id,
                ci.user_id,
                ci.flavor_id,
                ci.size,
                ci.quantity,
                ci.price,
                ci.created_at,
                ci.updated_at,
                f.flavor_name,
                f.flavor_description,
                v.store_name as vendor_name,
                v.vendor_id
            FROM cart_items ci
            JOIN flavors f ON ci.flavor_id = f.flavor_id
            JOIN vendors v ON f.vendor_id = v.vendor_id
            WHERE ci.user_id = ?
            ORDER BY ci.updated_at DESC
        `, [userId]);
        
        console.log(`🛒 Found ${cartItems.length} cart items for user ${userId}`);
        
        res.json({
            success: true,
            cartItems: cartItems,
            totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        });
        
    } catch (error) {
        console.error('Error getting user cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get cart items'
        });
    }
};

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const { flavor_id, size, quantity, price } = req.body;
        
        console.log('🛒 Adding to cart:', { userId, flavor_id, size, quantity, price });
        
        // Validate required fields
        if (!flavor_id || !size || !quantity || !price) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: flavor_id, size, quantity, price'
            });
        }
        
        // Check if item already exists in cart
        const [existingItem] = await pool.query(
            'SELECT * FROM cart_items WHERE user_id = ? AND flavor_id = ? AND size = ?',
            [userId, flavor_id, size]
        );
        
        if (existingItem.length > 0) {
            // Update quantity if item exists
            const newQuantity = existingItem[0].quantity + quantity;
            await pool.query(
                'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE cart_item_id = ?',
                [newQuantity, existingItem[0].cart_item_id]
            );
            
            console.log('🛒 Updated existing cart item quantity to:', newQuantity);
        } else {
            // Insert new item
            await pool.query(
                'INSERT INTO cart_items (user_id, flavor_id, size, quantity, price) VALUES (?, ?, ?, ?, ?)',
                [userId, flavor_id, size, quantity, price]
            );
            
            console.log('🛒 Added new item to cart');
        }
        
        // Get updated cart
        const [cartItems] = await pool.query(`
            SELECT 
                ci.cart_item_id,
                ci.user_id,
                ci.flavor_id,
                ci.size,
                ci.quantity,
                ci.price,
                f.flavor_name,
                v.store_name as vendor_name,
                v.vendor_id
            FROM cart_items ci
            JOIN flavors f ON ci.flavor_id = f.flavor_id
            JOIN vendors v ON f.vendor_id = v.vendor_id
            WHERE ci.user_id = ?
            ORDER BY ci.updated_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            message: 'Item added to cart successfully',
            cartItems: cartItems,
            totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        });
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add item to cart'
        });
    }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
    try {
        const { userId, cartItemId } = req.params;
        const { quantity } = req.body;
        
        console.log('🛒 Updating cart item:', { userId, cartItemId, quantity });
        
        if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            await pool.query(
                'DELETE FROM cart_items WHERE cart_item_id = ? AND user_id = ?',
                [cartItemId, userId]
            );
            console.log('🛒 Removed cart item');
        } else {
            // Update quantity
            await pool.query(
                'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE cart_item_id = ? AND user_id = ?',
                [quantity, cartItemId, userId]
            );
            console.log('🛒 Updated cart item quantity to:', quantity);
        }
        
        // Get updated cart
        const [cartItems] = await pool.query(`
            SELECT 
                ci.cart_item_id,
                ci.user_id,
                ci.flavor_id,
                ci.size,
                ci.quantity,
                ci.price,
                f.flavor_name,
                v.store_name as vendor_name,
                v.vendor_id
            FROM cart_items ci
            JOIN flavors f ON ci.flavor_id = f.flavor_id
            JOIN vendors v ON f.vendor_id = v.vendor_id
            WHERE ci.user_id = ?
            ORDER BY ci.updated_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            message: 'Cart item updated successfully',
            cartItems: cartItems,
            totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        });
        
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update cart item'
        });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const { userId, cartItemId } = req.params;
        
        console.log('🛒 Removing cart item:', { userId, cartItemId });
        
        await pool.query(
            'DELETE FROM cart_items WHERE cart_item_id = ? AND user_id = ?',
            [cartItemId, userId]
        );
        
        console.log('🛒 Removed cart item');
        
        // Get updated cart
        const [cartItems] = await pool.query(`
            SELECT 
                ci.cart_item_id,
                ci.user_id,
                ci.flavor_id,
                ci.size,
                ci.quantity,
                ci.price,
                f.flavor_name,
                v.store_name as vendor_name,
                v.vendor_id
            FROM cart_items ci
            JOIN flavors f ON ci.flavor_id = f.flavor_id
            JOIN vendors v ON f.vendor_id = v.vendor_id
            WHERE ci.user_id = ?
            ORDER BY ci.updated_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            message: 'Item removed from cart successfully',
            cartItems: cartItems,
            totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        });
        
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove item from cart'
        });
    }
};

// Clear entire cart
const clearCart = async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log('🛒 Clearing cart for user:', userId);
        
        await pool.query(
            'DELETE FROM cart_items WHERE user_id = ?',
            [userId]
        );
        
        console.log('🛒 Cart cleared successfully');
        
        res.json({
            success: true,
            message: 'Cart cleared successfully',
            cartItems: [],
            totalItems: 0,
            totalPrice: 0
        });
        
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear cart'
        });
    }
};

// Sync cart from localStorage to database
const syncCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const { cartItems } = req.body;
        
        console.log('🛒 Syncing cart for user:', userId, 'with', cartItems?.length || 0, 'items');
        
        if (!Array.isArray(cartItems)) {
            return res.status(400).json({
                success: false,
                error: 'cartItems must be an array'
            });
        }
        
        // Clear existing cart
        await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        
        // Insert new items
        if (cartItems.length > 0) {
            const values = cartItems.map(item => [
                userId,
                item.flavor_id,
                item.size,
                item.quantity,
                item.price
            ]);
            
            await pool.query(
                'INSERT INTO cart_items (user_id, flavor_id, size, quantity, price) VALUES ?',
                [values]
            );
        }
        
        console.log('🛒 Cart synced successfully');
        
        // Get updated cart
        const [updatedCartItems] = await pool.query(`
            SELECT 
                ci.cart_item_id,
                ci.user_id,
                ci.flavor_id,
                ci.size,
                ci.quantity,
                ci.price,
                f.flavor_name,
                v.store_name as vendor_name
            FROM cart_items ci
            JOIN flavors f ON ci.flavor_id = f.flavor_id
            JOIN vendors v ON f.vendor_id = v.vendor_id
            WHERE ci.user_id = ?
            ORDER BY ci.updated_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            message: 'Cart synced successfully',
            cartItems: updatedCartItems,
            totalItems: updatedCartItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: updatedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        });
        
    } catch (error) {
        console.error('Error syncing cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync cart'
        });
    }
};

module.exports = {
    getUserCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    syncCart
};
