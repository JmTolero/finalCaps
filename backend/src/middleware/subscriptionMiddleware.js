const pool = require('../db/config');
const {
    hasSubscriptionExpired,
    downgradeVendorToFree,
    FREE_PLAN_LIMITS
} = require('../services/subscriptionMaintenance');

const buildSubscriptionContext = async (vendor_id) => {
    const [vendors] = await pool.query(`
        SELECT 
            vendor_id,
            subscription_plan,
            subscription_start_date,
            subscription_end_date,
            flavor_limit,
            drum_limit,
            order_limit
        FROM vendors 
        WHERE vendor_id = ?
    `, [vendor_id]);

    if (vendors.length === 0) {
        return null;
    }

    const vendor = vendors[0];
    const expired = hasSubscriptionExpired(vendor.subscription_end_date);

    if (expired && vendor.subscription_plan !== 'free') {
        try {
            await downgradeVendorToFree(vendor.vendor_id);
            vendor.subscription_plan = 'free';
            vendor.flavor_limit = FREE_PLAN_LIMITS.flavors;
            vendor.drum_limit = FREE_PLAN_LIMITS.drums;
            vendor.order_limit = FREE_PLAN_LIMITS.orders;
            vendor.subscription_start_date = new Date();
        } catch (error) {
            console.error('Error downgrading expired vendor subscription:', error);
        }
    }

    return {
        vendor,
        expired
    };
};

// Check if vendor can add more flavors
const checkFlavorLimit = async (req, res, next) => {
    try {
        const vendor_id = req.user?.vendor_id || req.params.vendor_id || req.body.vendor_id;
        
        if (!vendor_id) {
            return res.status(400).json({
                success: false,
                error: 'Vendor ID is required'
            });
        }

        // Get vendor subscription info
        const context = await buildSubscriptionContext(vendor_id);

        if (!context) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        const flavor_limit = context.vendor.flavor_limit;

        // If unlimited (-1), allow
        if (flavor_limit === -1) {
            return next();
        }

        // Get current flavor count
        const [flavorCount] = await pool.query(
            'SELECT COUNT(*) as count FROM flavors WHERE vendor_id = ?',
            [vendor_id]
        );

        const currentCount = flavorCount[0].count;

        if (currentCount >= flavor_limit) {
            return res.status(403).json({
                success: false,
                error: 'Flavor limit reached',
                message: `You have reached your flavor limit of ${flavor_limit}. Please upgrade your subscription to add more flavors.`,
                current_count: currentCount,
                limit: flavor_limit,
                upgrade_required: true
            });
        }

        // Add usage info to request for logging
        req.subscription_info = {
            current_flavors: currentCount,
            flavor_limit: flavor_limit,
            remaining: flavor_limit - currentCount,
            status: context.expired ? 'expired' : 'active'
        };

        next();

    } catch (error) {
        console.error('Error checking flavor limit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check flavor limit'
        });
    }
};

// Check if vendor can add more drums
const checkDrumLimit = async (req, res, next) => {
    try {
        const vendor_id = req.user?.vendor_id || req.params.vendor_id || req.body.vendor_id;
        
        if (!vendor_id) {
            return res.status(400).json({
                success: false,
                error: 'Vendor ID is required'
            });
        }

        // Get vendor subscription info
        const context = await buildSubscriptionContext(vendor_id);

        if (!context) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        const drum_limit = context.vendor.drum_limit;

        // If unlimited (-1), allow
        if (drum_limit === -1) {
            return next();
        }

        // Get the new drum count from the request body
        const { small, medium, large } = req.body;
        const newTotal = (small || 0) + (medium || 0) + (large || 0);

        // Check if the new total exceeds the limit
        if (newTotal > drum_limit) {
            return res.status(403).json({
                success: false,
                error: 'Drum limit exceeded',
                message: `You are trying to set ${newTotal} drums, but your limit is ${drum_limit}. Please upgrade your subscription to add more drums.`,
                new_count: newTotal,
                limit: drum_limit,
                upgrade_required: true
            });
        }

        // Add usage info to request for logging
        req.subscription_info = {
            new_drums: newTotal,
            drum_limit: drum_limit,
            remaining: drum_limit - newTotal,
            status: context.expired ? 'expired' : 'active'
        };

        next();

    } catch (error) {
        console.error('Error checking drum limit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check drum limit'
        });
    }
};

// Check if vendor can process more orders this month
const checkOrderLimit = async (req, res, next) => {
    try {
        const vendor_id = req.user?.vendor_id || req.params.vendor_id || req.body.vendor_id;
        
        if (!vendor_id) {
            return res.status(400).json({
                success: false,
                error: 'Vendor ID is required'
            });
        }

        // Get vendor subscription info
        const context = await buildSubscriptionContext(vendor_id);

        if (!context) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        const order_limit = context.vendor.order_limit;

        // If unlimited (-1), allow
        if (order_limit === -1) {
            return next();
        }

        // Get current month's order count
        const [orderCount] = await pool.query(`
            SELECT COUNT(*) as count FROM orders 
            WHERE vendor_id = ? 
            AND MONTH(created_at) = MONTH(CURDATE()) 
            AND YEAR(created_at) = YEAR(CURDATE())
        `, [vendor_id]);

        const currentCount = orderCount[0].count;

        if (currentCount >= order_limit) {
            return res.status(403).json({
                success: false,
                error: 'Monthly order limit reached',
                message: `You have reached your monthly order limit of ${order_limit}. Please upgrade your subscription to process more orders.`,
                current_count: currentCount,
                limit: order_limit,
                upgrade_required: true
            });
        }

        // Add usage info to request for logging
        req.subscription_info = {
            current_orders: currentCount,
            order_limit: order_limit,
            remaining: order_limit - currentCount,
            status: context.expired ? 'expired' : 'active'
        };

        next();

    } catch (error) {
        console.error('Error checking order limit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check order limit'
        });
    }
};

// Get vendor subscription status
const getVendorSubscriptionStatus = async (req, res, next) => {
    try {
        const vendor_id = req.user?.vendor_id || req.params.vendor_id || req.body.vendor_id;
        
        if (!vendor_id) {
            return res.status(400).json({
                success: false,
                error: 'Vendor ID is required'
            });
        }

        // Get vendor subscription info
        const context = await buildSubscriptionContext(vendor_id);

        if (!context) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        const vendor = context.vendor;

        // Get current usage
        const [flavorCount] = await pool.query(
            'SELECT COUNT(*) as count FROM flavors WHERE vendor_id = ?',
            [vendor_id]
        );

        // Get vendor's drum stock from vendor_drum_pricing table
        const [drumCount] = await pool.query(`
            SELECT 
                COALESCE(SUM(stock), 0) as count 
            FROM vendor_drum_pricing 
            WHERE vendor_id = ?
        `, [vendor_id]);

        const [orderCount] = await pool.query(`
            SELECT COUNT(*) as count FROM orders 
            WHERE vendor_id = ? 
            AND MONTH(created_at) = MONTH(CURDATE()) 
            AND YEAR(created_at) = YEAR(CURDATE())
        `, [vendor_id]);

        req.subscription_status = {
            plan: vendor.subscription_plan,
            limits: {
                flavors: vendor.flavor_limit,
                drums: vendor.drum_limit,
                orders: vendor.order_limit
            },
            usage: {
                flavors: flavorCount[0].count,
                drums: drumCount[0].count,
                orders_this_month: orderCount[0].count
            },
            status: context.expired ? 'expired' : 'active',
            subscription_dates: {
                start: vendor.subscription_start_date,
                end: vendor.subscription_end_date
            }
        };

        next();

    } catch (error) {
        console.error('Error getting subscription status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get subscription status'
        });
    }
};

module.exports = {
    checkFlavorLimit,
    checkDrumLimit,
    checkOrderLimit,
    getVendorSubscriptionStatus
};
